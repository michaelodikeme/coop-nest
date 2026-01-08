import { PrismaClient, TransactionType, TransactionStatus, TransactionModule } from '@prisma/client';
import { CreateTransactionDto } from '../dtos/create-transaction.dto';
import { TransactionError, TransactionErrorCodes } from '../errors/transaction.error';
import { Decimal } from '@prisma/client/runtime/library';
import logger from '../../../utils/logger';
import { prisma } from '../../../utils/prisma';

/**
 * Service for validating transaction data
 */
export class TransactionValidatorUtils {
  
  /**
   * Validate transaction data based on its type
   * @param data Transaction data to validate
   * @returns Validation result object { isValid: boolean, errors?: string[] }
   */
  static async validateTransaction(data: CreateTransactionDto): Promise<{ isValid: boolean; errors?: string[] }> {
    const errors: string[] = [];
    
    // 1. Basic validations
    if (!data.transactionType) {
      errors.push('Transaction type is required');
    }
    
    if (!data.module) {
      errors.push('Transaction module is required');
    }
    
    if (!data.initiatedBy) {
      errors.push('Initiator ID is required');
    }
    
    // 2. Amount validation for most transaction types
    if (this.requiresAmount(data.transactionType) && (data.amount === undefined || data.amount === null)) {
      errors.push(`Amount is required for ${data.transactionType} transactions`);
    }
    
    if (data.amount !== undefined && data.amount !== null) {
      // Amount should be positive for deposits and negative for withdrawals
      if (this.shouldBePositive(data.transactionType) && Number(data.amount) <= 0) {
        errors.push(`Amount must be positive for ${data.transactionType} transactions`);
      }
    }
    
    // 3. Entity validation based on transaction type
    if (this.requiresRelatedEntity(data.transactionType)) {
      if (!data.relatedEntityId || !data.relatedEntityType) {
        errors.push(`Related entity is required for ${data.transactionType} transactions`);
      } else {
        // Check if related entity exists
        const entityExists = await this.validateEntityExists(
          data.relatedEntityType,
          data.relatedEntityId
        );
        
        if (!entityExists) {
          errors.push(`Related ${data.relatedEntityType} with ID ${data.relatedEntityId} not found`);
        }
      }
    }
    
    // 4. Type-specific validations
    switch(data.transactionType) {
      case TransactionType.REVERSAL:
        if (!data.parentTxnId) {
          errors.push('Parent transaction ID is required for reversal transactions');
        } else {
          // Validate parent transaction exists
          const parentTxn = await prisma.transaction.findUnique({
            where: { id: data.parentTxnId }
          });
          if (!parentTxn) {
            errors.push(`Parent transaction ${data.parentTxnId} not found`);
          } else if (parentTxn.status !== TransactionStatus.COMPLETED) {
            errors.push('Only completed transactions can be reversed');
          }
        }
        break;
        
      case TransactionType.SAVINGS_WITHDRAWAL:
        await this.validateSufficientFunds(data, errors);
        break;
        
      case TransactionType.LOAN_DISBURSEMENT:
        if (data.relatedEntityType === 'LOAN' && data.relatedEntityId) {
          const loan = await prisma.loan.findUnique({
            where: { id: data.relatedEntityId }
          });
          if (loan && loan.status !== 'APPROVED') {
            errors.push(`Loan must be in APPROVED status for disbursement, current status: ${loan.status}`);
          }
        }
        break;
        
      case TransactionType.SHARES_LIQUIDATION:
        if (data.relatedEntityType === 'SHARES' && data.relatedEntityId) {
          const shares = await prisma.shares.findUnique({
            where: { id: data.relatedEntityId }
          });
          if (shares) {
            const amount = Math.abs(Number(data.amount) || 0);
            const shareValue = shares.valuePerUnit.times(shares.unitsHeld).toNumber();
            if (shareValue < amount) {
              errors.push(`Insufficient shares: Current value ${shareValue} is less than liquidation amount ${amount}`);
            }
          }
        }
        break;
    }
    
    // Add to validateTransaction
    if (data.transactionType && data.module) {
      const validModuleAlignment = this.validateTypeAndModuleAlignment(
        data.transactionType, 
        data.module
      );
      
      if (!validModuleAlignment) {
        errors.push(`Transaction type ${data.transactionType} is not valid for module ${data.module}`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }
  
  /**
   * Check if a transaction type requires an amount
   */
  private static requiresAmount(type?: TransactionType): boolean {
    if (!type) return false;
    
    const noAmountTypes = [
      // Basic system operations that might not need explicit amounts
      TransactionType.REVERSAL // Amount comes from parent transaction
    ] as TransactionType[];
    
    return !noAmountTypes.includes(type);
  }
  
  /**
   * Check if a transaction type requires a positive amount
   */
  private static shouldBePositive(type?: TransactionType): boolean {
    if (!type) return false;
    
    const positiveAmountTypes = [
      TransactionType.SAVINGS_DEPOSIT,
      TransactionType.SHARES_PURCHASE,
      TransactionType.LOAN_DISBURSEMENT,
      TransactionType.SAVINGS_INTEREST,
      TransactionType.SHARES_DIVIDEND,
      TransactionType.LOAN_REPAYMENT
    ] as TransactionType[];
    
    return positiveAmountTypes.includes(type);
  }
  
  /**
   * Check if a transaction type requires a related entity
   */
  private static requiresRelatedEntity(type?: TransactionType): boolean {
    if (!type) return false;
    
    const noEntityTypes = [
      // System-level transactions
      TransactionType.FEE, // General system fees
      TransactionType.ADJUSTMENT // General system adjustments
    ] as TransactionType[];
    
    return !noEntityTypes.includes(type);
  }
  
  /**
   * Validate that the related entity exists
   * @param entityType Type of entity (SAVINGS, LOAN, etc)
   * @param entityId Entity ID
   * @returns Boolean indicating if entity exists
   */
  private static async validateEntityExists(
    entityType: string,
    entityId: string
  ): Promise<boolean> {
    try {
      switch (entityType) {
        case 'SAVINGS':
          const savings = await prisma.savings.findUnique({
            where: { id: entityId }
          });
          return !!savings;
          
        case 'LOAN':
          const loan = await prisma.loan.findUnique({
            where: { id: entityId }
          });
          return !!loan;
          
        case 'SHARES':
          const shares = await prisma.shares.findUnique({
            where: { id: entityId }
          });
          return !!shares;
          
        case 'BIODATA':
          const biodata = await prisma.biodata.findUnique({
            where: { id: entityId }
          });
          return !!biodata;
          
        default:
          logger.warn(`Unknown entity type: ${entityType}`);
          return false;
      }
    } catch (error) {
      logger.error(`Error validating entity exists: ${error}`);
      return false;
    }
  }
  
  /**
   * Validate sufficient funds for withdrawal transactions
   */
  private static async validateSufficientFunds(
    data: CreateTransactionDto,
    errors: string[]
  ): Promise<void> {
    if (data.transactionType !== TransactionType.SAVINGS_WITHDRAWAL) return;
    
    try {
      if (data.relatedEntityType === 'SAVINGS' && data.relatedEntityId) {
        const savings = await prisma.savings.findUnique({
          where: { id: data.relatedEntityId }
        });
        
        if (savings) {
          const amount = Math.abs(Number(data.amount) || 0);
          
          if (savings.balance.lessThan(amount)) {
            errors.push(`Insufficient funds: Available balance ${savings.balance} is less than withdrawal amount ${amount}`);
          }
        }
      }
    } catch (error) {
      logger.error('Error validating sufficient funds:', error);
      errors.push('Error checking available funds');
    }
  }
  
  /**
   * Validate status transition
   * @param currentStatus Current transaction status
   * @param newStatus Proposed new status
   * @returns Boolean indicating if transition is valid
   */
  static validateStatusTransition(
    currentStatus: TransactionStatus,
    newStatus: TransactionStatus
  ): boolean {
    const validTransitions: Record<TransactionStatus, TransactionStatus[]> = {
      [TransactionStatus.PENDING]: [
        TransactionStatus.PROCESSING,
        TransactionStatus.COMPLETED,
        TransactionStatus.FAILED,
        TransactionStatus.CANCELLED
      ],
      [TransactionStatus.PROCESSING]: [
        TransactionStatus.COMPLETED,
        TransactionStatus.FAILED
      ],
      [TransactionStatus.COMPLETED]: [
        TransactionStatus.REVERSED
      ],
      [TransactionStatus.FAILED]: [
        TransactionStatus.REVERSED
      ],
      [TransactionStatus.REVERSED]: [],
      [TransactionStatus.CANCELLED]: []
    };
    
    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }
  
  // Add this method to validate transaction type and module alignment
  private static validateTypeAndModuleAlignment(
    type: TransactionType,
    module: TransactionModule
  ): boolean {
    // Map transaction types to their appropriate modules
    const moduleMap: Record<TransactionType, TransactionModule[]> = {
      [TransactionType.SAVINGS_DEPOSIT]: [TransactionModule.SAVINGS],
      [TransactionType.SAVINGS_WITHDRAWAL]: [TransactionModule.SAVINGS],
      [TransactionType.SAVINGS_INTEREST]: [TransactionModule.SAVINGS],
      [TransactionType.SHARES_PURCHASE]: [TransactionModule.SHARES],
      [TransactionType.SHARES_LIQUIDATION]: [TransactionModule.SHARES],
      [TransactionType.SHARES_DIVIDEND]: [TransactionModule.SHARES],
      [TransactionType.LOAN_DISBURSEMENT]: [TransactionModule.LOAN],
      [TransactionType.LOAN_REPAYMENT]: [TransactionModule.LOAN],
      [TransactionType.LOAN_INTEREST]: [TransactionModule.LOAN],
      [TransactionType.LOAN_PENALTY]: [TransactionModule.LOAN],
      [TransactionType.FEE]: [TransactionModule.SYSTEM, TransactionModule.ADMIN],
      [TransactionType.REVERSAL]: [TransactionModule.SYSTEM, TransactionModule.ADMIN],
      [TransactionType.ADJUSTMENT]: [TransactionModule.SYSTEM, TransactionModule.ADMIN],
      [TransactionType.CREDIT]: [TransactionModule.SAVINGS, TransactionModule.SHARES, TransactionModule.LOAN],
      [TransactionType.DEBIT]: [TransactionModule.SAVINGS, TransactionModule.SHARES, TransactionModule.LOAN],
      [TransactionType.PERSONAL_SAVINGS_WITHDRAWAL]: [TransactionModule.SAVINGS],
      [TransactionType.PERSONAL_SAVINGS_DEPOSIT]: [TransactionModule.SAVINGS],
    };
    
    return moduleMap[type]?.includes(module) || false;
  }
}