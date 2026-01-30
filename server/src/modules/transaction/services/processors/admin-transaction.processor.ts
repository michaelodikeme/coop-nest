import { 
  PrismaClient, 
  Transaction, 
  TransactionStatus, 
  TransactionType, 
  TransactionModule 
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { TransactionProcessor } from '../../interfaces/transaction-processor.interface';
import { CreateTransactionDto } from '../../dtos/create-transaction.dto';
import { TransactionError, TransactionErrorCodes } from '../../errors/transaction.error';
import logger from '../../../../utils/logger';
import { prisma } from '../../../../utils/prisma';

/**
 * Processor for admin-related transactions
 * Handles transactions like adjustments, fee collections, and interest accruals
 */
export class AdminTransactionProcessor implements TransactionProcessor {


  constructor() {
  }

  /**
   * Validate admin transactions
   * @param data Transaction data to validate
   * @returns True if valid, false otherwise
   */
  async validateTransaction(data: CreateTransactionDto): Promise<boolean> {
    try {
      // Check if transaction type is valid for this processor
      const validTypes: TransactionType[] = [
        TransactionType.ADJUSTMENT,
        TransactionType.FEE,
        TransactionType.REVERSAL
      ];
      
      if (!validTypes.includes(data.transactionType as TransactionType)) {
        logger.warn(`AdminTransactionProcessor: Invalid transaction type ${data.transactionType}`);
        return false;
      }
      
      // For adjustments, ensure there's an amount and related entity
      if (data.transactionType === TransactionType.ADJUSTMENT) {
        if (!data.amount || !data.relatedEntityId || !data.relatedEntityType) {
          logger.warn('AdminTransactionProcessor: Adjustment requires amount and related entity');
          return false;
        }
        
        // Check if related entity exists
        if (data.relatedEntityType === 'BIODATA') {
          const biodata = await prisma.biodata.findUnique({
            where: { id: data.relatedEntityId }
          });
          
          if (!biodata) {
            logger.warn(`AdminTransactionProcessor: Biodata ${data.relatedEntityId} not found`);
            return false;
          }
        }
      }
      
      // For fee collections, validate fee details
      if (data.transactionType === TransactionType.FEE) {
        if (!data.amount || Number(data.amount) <= 0) {
          logger.warn('AdminTransactionProcessor: Fee collection requires positive amount');
          return false;
        }
        
        if (!data.metadata || !data.metadata.feeType) {
          logger.warn('AdminTransactionProcessor: Fee collection requires fee type in metadata');
          return false;
        }
      }
      
      // For interest accruals, validate interest details
      if (data.transactionType === TransactionType.SAVINGS_INTEREST || 
          data.transactionType === TransactionType.LOAN_INTEREST) {
        if (!data.amount || Number(data.amount) <= 0) {
          logger.warn('AdminTransactionProcessor: Interest accrual requires positive amount');
          return false;
        }
        
        if (!data.metadata || !data.metadata.interestRate || !data.metadata.calculationPeriod) {
          logger.warn('AdminTransactionProcessor: Interest accrual requires rate and period in metadata');
          return false;
        }
      }
      
      // For reversals, parent transaction is required
      if (data.transactionType === TransactionType.REVERSAL) {
        if (!data.parentTxnId) {
          logger.warn('AdminTransactionProcessor: Reversal requires parent transaction ID');
          return false;
        }
      }
      
      return true;
    } catch (error) {
      logger.error('AdminTransactionProcessor validation error:', error);
      return false;
    }
  }

  /**
   * Process admin transactions
   * @param transaction Transaction to process
   * @param tx Optional transaction client for atomic operations
   */
  async processTransaction(transaction: Transaction, tx?: any): Promise<void> {
    try {
      logger.info(`Processing admin transaction: ${transaction.id}, type: ${transaction.transactionType}`);
      
      switch (transaction.transactionType) {
        case TransactionType.ADJUSTMENT:
          await this.processAdjustment(transaction);
          break;
          
        case TransactionType.FEE:
          await this.processFeeCollection(transaction);
          break;
          
        case TransactionType.REVERSAL:
          await this.processReversal(transaction);
          break;
          
        case TransactionType.SAVINGS_INTEREST:
        case TransactionType.LOAN_INTEREST:
          await this.processInterestAccrual(transaction);
          break;
          
        default:
          logger.warn(`Unhandled admin transaction type: ${transaction.transactionType}`);
      }
      
      // Create notification for the related entity
      if (transaction.status === TransactionStatus.COMPLETED && 
         (transaction.savingsId || transaction.loanId || transaction.sharesId)) {
        await this.createNotification(transaction);
      }
    } catch (error) {
      logger.error(`Error processing admin transaction ${transaction.id}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new TransactionError(
        `Failed to process admin transaction: ${errorMessage}`,
        TransactionErrorCodes.PROCESSING_ERROR,
        500,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Handle changes in transaction status
   * @param transaction Updated transaction
   * @param previousStatus Previous status before update
   */
  async onTransactionStatusChange(transaction: Transaction, previousStatus: TransactionStatus): Promise<void> {
    try {
      logger.info(`Admin transaction ${transaction.id} status changed from ${previousStatus} to ${transaction.status}`);
      
      // If transaction was just completed, process relevant actions
      if (previousStatus !== TransactionStatus.COMPLETED && 
          transaction.status === TransactionStatus.COMPLETED) {
        
        // Create notification for related entity
        if (transaction.savingsId || transaction.loanId || transaction.sharesId) {
          await this.createNotification(transaction);
        }
        
        // Additional processing based on transaction type
        switch (transaction.transactionType) {
          case TransactionType.ADJUSTMENT:
            await this.processCompletedAdjustment(transaction);
            break;
            
          case TransactionType.FEE:
            await this.processCompletedFeeCollection(transaction);
            break;
            
          case TransactionType.SAVINGS_INTEREST:
          case TransactionType.LOAN_INTEREST:
            await this.processCompletedInterestAccrual(transaction);
            break;
        }
      }
    } catch (error) {
      logger.error(`Error handling admin transaction status change ${transaction.id}:`, error);
    }
  }

  /**
   * Process an adjustment transaction
   * @param transaction Adjustment transaction
   * @param prisma Prisma client instance
   */
  private async processAdjustment(transaction: Transaction): Promise<void> {
    // Implementation depends on what's being adjusted
    const metadata = transaction.metadata as any || {};
    
    if (transaction.savingsId && metadata?.adjustmentType === 'SAVINGS') {
      logger.info(`Processing savings adjustment for ${transaction.savingsId}`);
      
      // Get current savings record
      const savings = await prisma.savings.findUnique({
        where: { id: transaction.savingsId }
      });
      
      if (!savings) {
        throw new TransactionError(
          `Savings record not found: ${transaction.savingsId}`,
          TransactionErrorCodes.ENTITY_NOT_FOUND,
          404
        );
      }
      
      // Calculate new balance
      const newBalance = savings.balance.plus(transaction.amount);
      
      // Update savings balance
      await prisma.savings.update({
        where: { id: transaction.savingsId },
        data: {
          balance: newBalance,
          totalSavingsAmount: savings.totalSavingsAmount.plus(transaction.amount)
        }
      });
      
      // Update transaction balanceAfter
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          balanceAfter: newBalance
        }
      });
    } else if (transaction.sharesId && metadata?.adjustmentType === 'SHARES') {
      logger.info(`Processing shares adjustment for ${transaction.sharesId}`);
      
      // Get current shares record
      const shares = await prisma.shares.findUnique({
        where: { id: transaction.sharesId }
      });
      
      if (!shares) {
        throw new TransactionError(
          `Shares record not found: ${transaction.sharesId}`,
          TransactionErrorCodes.ENTITY_NOT_FOUND,
          404
        );
      }
      
      // Handle shares adjustment
      await this.adjustShares(shares, transaction);
    } else if (transaction.loanId && metadata?.adjustmentType === 'LOAN') {
      logger.info(`Processing loan adjustment for ${transaction.loanId}`);
      
      // Get current loan record
      const loan = await prisma.loan.findUnique({
        where: { id: transaction.loanId }
      });
      
      if (!loan) {
        throw new TransactionError(
          `Loan record not found: ${transaction.loanId}`,
          TransactionErrorCodes.ENTITY_NOT_FOUND,
          404
        );
      }
      
      // Handle loan adjustment
      await this.adjustLoan(loan, transaction, prisma);
    }
  }

  /**
   * Adjust shares balance
   */
  private async adjustShares(shares: any, transaction: any): Promise<void> {
    // Get the current value per unit
    const valuePerUnit = await this.getShareValuePerUnit();
    
    // Calculate units to add or remove
    const unitsChange = Math.floor(Math.abs(transaction.amount.toNumber()) / valuePerUnit.toNumber());
    
    // Add or remove units based on adjustment direction
    const newUnitsHeld = transaction.amount.isPositive() ? 
      shares.unitsHeld + unitsChange : 
      Math.max(0, shares.unitsHeld - unitsChange);
      
    const newTotalValue = newUnitsHeld * valuePerUnit.toNumber();
    
    // Update shares record
    await prisma.shares.update({
      where: { id: shares.id },
      data: {
        unitsHeld: newUnitsHeld,
        totalValue: newTotalValue,
        lastPurchase: transaction.amount.isPositive() ? new Date() : shares.lastPurchase,
        totalSharesAmount: transaction.amount.isPositive() ? 
          shares.totalSharesAmount.plus(transaction.amount) : 
          shares.totalSharesAmount.minus(transaction.amount.abs())
      }
    });
    
    // Update transaction's balanceAfter field
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        balanceAfter: newTotalValue
      }
    });
  }

  /**
   * Adjust loan balance
   */
  private async adjustLoan(loan: any, transaction: any, prisma: any): Promise<void> {
    // For loan adjustments, we need to handle payment amounts
    // Calculate new paid and remaining balance
    const newPaidAmount = loan.paidAmount.plus(transaction.amount);
    const newRemainingBalance = Math.max(0, loan.totalAmount.minus(newPaidAmount).toNumber());
    const isFullyRepaid = newPaidAmount.greaterThanOrEqualTo(loan.totalAmount);
    
    // Update loan record
    await prisma.loan.update({
      where: { id: loan.id },
      data: {
        paidAmount: newPaidAmount,
        remainingBalance: newRemainingBalance,
        lastPaymentDate: new Date(),
        status: isFullyRepaid ? 'COMPLETED' : loan.status,
        completedAt: isFullyRepaid ? new Date() : loan.completedAt
      }
    });
    
    // Create loan status history entry
    if (isFullyRepaid && loan.status !== 'COMPLETED') {
      await prisma.loanStatusHistory.create({
        data: {
          loanId: loan.id,
          fromStatus: loan.status,
          toStatus: 'COMPLETED',
          changedBy: transaction.initiatedBy,
          reason: `Loan adjustment completed payment: ${transaction.amount.toString()}`
        }
      });
    }
    
    // Update transaction's balanceAfter field
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        balanceAfter: newRemainingBalance
      }
    });
  }

  /**
   * Process a fee collection transaction
   * @param transaction Fee collection transaction
   * @param prisma Prisma client instance
   */
  private async processFeeCollection(transaction: Transaction): Promise<void> {
    // Process fee collection
    const metadata = transaction.metadata as any || {};
    logger.info(`Processing fee collection: ${metadata.feeType}`);
    
    // Depending on what entity this fee affects, we may need to update balances
    if (transaction.savingsId) {
      const savings = await prisma.savings.findUnique({
        where: { id: transaction.savingsId }
      });
      
      if (savings) {
        // For fees, we debit the account (amount should be negative)
        const newBalance = savings.balance.minus(Math.abs(transaction.amount.toNumber()));
        
        // Update savings record
        await prisma.savings.update({
          where: { id: transaction.savingsId },
          data: {
            balance: newBalance
          }
        });
        
        // Update transaction balanceAfter
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            balanceAfter: newBalance
          }
        });
      }
    }
  }

  /**
   * Process an interest accrual transaction
   * @param transaction Interest accrual transaction
   * @param prisma Prisma client instance
   */
  private async processInterestAccrual(transaction: Transaction): Promise<void> {
    // Process interest accrual
    const metadata = transaction.metadata as any || {};
    logger.info(`Processing interest accrual at rate ${metadata.interestRate}%`);
    
    // For savings interest
    if (transaction.savingsId) {
      const savings = await prisma.savings.findUnique({
        where: { id: transaction.savingsId }
      });
      
      if (savings) {
        // For interest credits, we increase the balance
        const newBalance = savings.balance.plus(transaction.amount);
        
        // Update savings record
        await prisma.savings.update({
          where: { id: transaction.savingsId },
          data: {
            balance: newBalance
          }
        });
        
        // Update transaction balanceAfter
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            balanceAfter: newBalance
          }
        });
      }
    }
    // For loan interest (typically adds to the loan amount)
    else if (transaction.loanId) {
      // Handle loan interest accrual if needed
    }
  }

  /**
   * Process a reversal transaction
   * @param transaction Reversal transaction
   * @param prisma Prisma client instance
   */
  public async processReversal(transaction: Transaction): Promise<void> {
    // Process reversal
    if (!transaction.parentTxnId) {
      logger.warn('Cannot process reversal: missing parent transaction ID');
      return;
    }
    
    const originalTx = await prisma.transaction.findUnique({
      where: { id: transaction.parentTxnId }
    });
    
    if (!originalTx) {
      logger.warn(`Cannot process reversal: original transaction ${transaction.parentTxnId} not found`);
      return;
    }
    
    logger.info(`Processing reversal of transaction ${transaction.parentTxnId} (${originalTx.transactionType})`);
    
    // Get the appropriate processor for the original transaction type
    const processorFactory = await import('../factories/transaction-processor.factory');
    const processor = processorFactory.TransactionProcessorFactory.getProcessor(originalTx.transactionType);
    
    // Let the specific processor handle the reversal
    if (processor && processor.processReversal) {
      await processor.processReversal(transaction, prisma);
    } else {
      logger.warn(`No reversal processor available for transaction type ${originalTx.transactionType}`);
    }
  }

  /**
   * Additional processing for completed adjustments
   * @param transaction Completed adjustment transaction
   */
  private async processCompletedAdjustment(transaction: Transaction): Promise<void> {
    // Perform any additional actions needed after an adjustment is completed
    logger.info(`Processing completed adjustment: ${transaction.id}`);
  }

  /**
   * Additional processing for completed fee collections
   * @param transaction Completed fee collection transaction
   */
  private async processCompletedFeeCollection(transaction: Transaction): Promise<void> {
    // Perform any additional actions needed after a fee collection is completed
    logger.info(`Processing completed fee collection: ${transaction.id}`);
  }

  /**
   * Additional processing for completed interest accruals
   * @param transaction Completed interest accrual transaction
   */
  private async processCompletedInterestAccrual(transaction: Transaction): Promise<void> {
    // Perform any additional actions needed after an interest accrual is completed
    logger.info(`Processing completed interest accrual: ${transaction.id}`);
  }

  /**
   * Get the current value per share unit from system settings
   */
  private async getShareValuePerUnit(): Promise<any> {
    try {
      const setting = await prisma.systemSettings.findUnique({
        where: { key: 'SHARE_VALUE_PER_UNIT' }
      });
      
      if (setting) {
        return new Decimal(setting.value);
      }
      
      // Default value if not found
      return new Decimal(100);
    } catch (error) {
      logger.error('Error getting share value per unit:', error);
      return new Decimal(100);
    }
  }

  /**
   * Create a notification for a transaction
   * @param transaction Transaction to create notification for
   * @param prisma Prisma client instance
   */
  private async createNotification(transaction: Transaction): Promise<void> {
    try {
      let userId: string | undefined;
      let message = '';
      
      // Try to find the associated user based on the related entity
      if (transaction.savingsId) {
        const savings = await prisma.savings.findUnique({
          where: { id: transaction.savingsId },
          include: { member: { include: { users: true } } }
        });
        
        if (savings?.member?.users && savings?.member?.users?.length > 0) {
          userId = savings.member.users[0].id;
        }
        
        message = this.getSavingsNotificationMessage(transaction);
      } else if (transaction.sharesId) {
        const shares = await prisma.shares.findUnique({
          where: { id: transaction.sharesId },
          include: { member: { include: { users: true } } }
        });
        
        if (shares?.member?.users && shares?.member?.users?.length > 0) {
          userId = shares.member.users[0].id;
        }
        
        message = this.getSharesNotificationMessage(transaction);
      } else if (transaction.loanId) {
        const loan = await prisma.loan.findUnique({
          where: { id: transaction.loanId },
          include: { member: { include: { users: true } } }
        });
        
        if (loan?.member?.users && loan?.member?.users?.length > 0) {
          userId = loan.member.users[0].id;
        }
        
        message = this.getLoanNotificationMessage(transaction);
      }
      
      // Create the notification if we found a user
      if (userId) {
        await prisma.notification.create({
          data: {
            userId,
            type: 'TRANSACTION',
            title: this.getNotificationTitle(transaction),
            message,
            metadata: {
              transactionId: transaction.id,
              transactionType: transaction.transactionType,
              amount: transaction.amount.toString()
            },
            priority: 'NORMAL'
          }
        });
        
        logger.info(`Created notification for user ${userId} regarding transaction ${transaction.id}`);
      }
    } catch (error) {
      logger.error(`Error creating notification for transaction ${transaction.id}:`, error);
    }
  }

  /**
   * Get notification title based on transaction type
   */
  private getNotificationTitle(transaction: Transaction): string {
    switch (transaction.transactionType) {
      case TransactionType.ADJUSTMENT:
        return 'Account Adjustment';
      case TransactionType.FEE:
        return 'Fee Collection';
      case TransactionType.SAVINGS_INTEREST:
        return 'Savings Interest';
      case TransactionType.LOAN_INTEREST:
        return 'Loan Interest Charge';
      case TransactionType.REVERSAL:
        return 'Transaction Reversal';
      default:
        return 'Transaction Notification';
    }
  }

  /**
   * Get savings notification message based on transaction details
   */
  private getSavingsNotificationMessage(transaction: Transaction): string {
    switch (transaction.transactionType) {
      case TransactionType.ADJUSTMENT:
        return `A savings adjustment of ₦${Math.abs(transaction.amount.toNumber()).toFixed(2)} has been processed on your account. ${transaction.description || ''}`;
      case TransactionType.FEE:
        return `A fee of ₦${Math.abs(transaction.amount.toNumber()).toFixed(2)} has been charged to your savings account. ${transaction.description || ''}`;
      case TransactionType.SAVINGS_INTEREST:
        return `Interest of ₦${transaction.amount.toFixed(2)} has been credited to your savings account.`;
      case TransactionType.REVERSAL:
        return `A transaction reversal of ₦${Math.abs(transaction.amount.toNumber()).toFixed(2)} has been processed on your savings account. ${transaction.description || ''}`;
      default:
        return `A ${transaction.transactionType.toLowerCase().replace(/_/g, ' ')} transaction has been processed on your savings account.`;
    }
  }

  /**
   * Get shares notification message based on transaction details
   */
  private getSharesNotificationMessage(transaction: Transaction): string {
    switch (transaction.transactionType) {
      case TransactionType.ADJUSTMENT:
        return `A shares adjustment of ₦${Math.abs(transaction.amount.toNumber()).toFixed(2)} has been processed. ${transaction.description || ''}`;
      case TransactionType.FEE:
        return `A fee of ₦${Math.abs(transaction.amount.toNumber()).toFixed(2)} has been charged to your shares account. ${transaction.description || ''}`;
      case TransactionType.REVERSAL:
        return `A transaction reversal of ₦${Math.abs(transaction.amount.toNumber()).toFixed(2)} has been processed on your shares account. ${transaction.description || ''}`;
      default:
        return `A ${transaction.transactionType.toLowerCase().replace(/_/g, ' ')} transaction has been processed on your shares account.`;
    }
  }

  /**
   * Get loan notification message based on transaction details
   */
  private getLoanNotificationMessage(transaction: Transaction): string {
    switch (transaction.transactionType) {
      case TransactionType.ADJUSTMENT:
        return `A loan adjustment of ₦${Math.abs(transaction.amount.toNumber()).toFixed(2)} has been processed. ${transaction.description || ''}`;
      case TransactionType.LOAN_INTEREST:
        return `Interest of ₦${Math.abs(transaction.amount.toNumber()).toFixed(2)} has been applied to your loan.`;
      case TransactionType.REVERSAL:
        return `A transaction reversal of ₦${Math.abs(transaction.amount.toNumber()).toFixed(2)} has been processed on your loan. ${transaction.description || ''}`;
      default:
        return `A ${transaction.transactionType.toLowerCase().replace(/_/g, ' ')} transaction has been processed on your loan account.`;
    }
  }
}