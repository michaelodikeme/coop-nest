import { PrismaClient, Transaction, TransactionStatus, TransactionType, TransactionModule } from '@prisma/client';
import { TransactionProcessor } from '../../interfaces/transaction-processor.interface';
import { CreateTransactionDto } from '../../dtos/create-transaction.dto';
import { TransactionError, TransactionErrorCodes } from '../../errors/transaction.error';
import { Decimal } from '@prisma/client/runtime/library';
import logger from '../../../../utils/logger';
import { prisma } from '../../../../utils/prisma';

/**
 * Processor for shares-related transactions
 */
export class SharesTransactionProcessor implements TransactionProcessor {

  
  constructor() {

  }
  
  /**
   * Validate a shares transaction before processing
   */
  async validateTransaction(data: CreateTransactionDto): Promise<boolean> {
    try {
      // Validate based on transaction type
      switch (data.transactionType) {
        case TransactionType.SHARES_PURCHASE:
          return this.validateSharesPurchase(data);
        case TransactionType.SHARES_LIQUIDATION:
          return this.validateSharesLiquidation(data);
        default:
          // Other transaction types may not need special validation
          return true;
      }
    } catch (error) {
      logger.error('Shares transaction validation error', error);
      return false;
    }
  }
  
  /**
   * Process a shares transaction
   */
  async processTransaction(transaction: Transaction): Promise<void> {
    try {
      // Skip if not completed
      if (transaction.status !== TransactionStatus.COMPLETED) {
        return;
      }
      
      switch (transaction.transactionType) {
        case TransactionType.SHARES_PURCHASE:
          await this.processSharesPurchase(transaction);
          break;
        case TransactionType.SHARES_LIQUIDATION:
          await this.processSharesLiquidation(transaction);
          break;
        case TransactionType.SHARES_DIVIDEND:
          await this.processSharesDividend(transaction);
          break;
        case TransactionType.REVERSAL:
          await this.processReversal(transaction);
          break;
      }
    } catch (error) {
      logger.error(`Error processing shares transaction ${transaction.id}:`, error);
      throw new TransactionError(
        'Failed to process shares transaction',
        TransactionErrorCodes.PROCESSING_ERROR,
        500,
        error as Error
      );
    }
  }
  
  /**
   * Handle changes in transaction status
   */
  async onTransactionStatusChange(transaction: Transaction, previousStatus: TransactionStatus): Promise<void> {
    try {
      // Only handle transitions to COMPLETED status
      if (previousStatus !== TransactionStatus.COMPLETED && 
          transaction.status === TransactionStatus.COMPLETED) {
        
        // Process the transaction now that it's completed
        await this.processTransaction(transaction);
        
        // Create notification for the user if we have a sharesId
        if (transaction.sharesId) {
          await this.createNotification(transaction);
        }
      }
    } catch (error) {
      logger.error(`Error handling status change for shares transaction ${transaction.id}:`, error);
      // Don't rethrow here as this is a notification step and shouldn't block the main transaction
    }
  }
  
  /**
   * Validate a shares purchase transaction
   */
  private async validateSharesPurchase(data: CreateTransactionDto): Promise<boolean> {
    // Deposits always need an amount
    if (!data.amount) {
      logger.error('Missing amount for shares purchase transaction');
      return false;
    }
    
    // Amount must be positive
    const amount = new Decimal(data.amount.toString());
    if (amount.lessThanOrEqualTo(0)) {
      logger.error('Purchase amount must be greater than 0');
      return false;
    }
    
    // Check if we have a valid shares record or member ID
    if (data.relatedEntityId && data.relatedEntityType === 'SHARES') {
      const shares = await prisma.shares.findUnique({
        where: { id: data.relatedEntityId }
      });
      
      if (!shares) {
        logger.error(`Shares record not found: ${data.relatedEntityId}`);
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Validate a shares liquidation transaction
   */
  private async validateSharesLiquidation(data: CreateTransactionDto): Promise<boolean> {
    // Must have amount
    if (!data.amount) {
      logger.error('Missing amount for shares liquidation transaction');
      return false;
    }
    
    // Amount must be positive (we'll convert to negative for liquidation)
    const amount = new Decimal(data.amount.toString());
    if (amount.lessThanOrEqualTo(0)) {
      logger.error('Liquidation amount must be greater than 0');
      return false;
    }
    
    // Must have a shares record
    if (!data.relatedEntityId || data.relatedEntityType !== 'SHARES') {
      logger.error('Missing sharesId for shares liquidation transaction');
      return false;
    }
    
    // Check if enough shares are available
    const shares = await prisma.shares.findUnique({
      where: { id: data.relatedEntityId }
    });
    
    if (!shares) {
      logger.error(`Shares record not found: ${data.relatedEntityId}`);
      return false;
    }
    
    // Check if liquidation amount exceeds available shares value
    if (shares.totalValue.lessThan(amount)) {
      logger.error(`Insufficient shares value for liquidation: ${shares.totalValue.toString()} < ${amount.toString()}`);
      return false;
    }
    
    return true;
  }
  
  /**
   * Process a shares purchase transaction
   */
  private async processSharesPurchase(transaction: Transaction): Promise<void> {
    if (!transaction.amount || !transaction.sharesId) {
      return;
    }
    
    // Find the existing shares record
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
    
    // Get the current value per unit
    const valuePerUnit = await this.getShareValuePerUnit();
    
    // Calculate units to add
    const unitsToAdd = Math.floor(transaction.amount.toNumber() / valuePerUnit.toNumber());
    const newUnitsHeld = shares.unitsHeld + unitsToAdd;
    const newTotalValue = new Decimal(newUnitsHeld * valuePerUnit.toNumber());
    
    // Update the shares record
    await prisma.shares.update({
      where: { id: shares.id },
      data: {
        unitsHeld: newUnitsHeld,
        totalValue: newTotalValue,
        lastPurchase: new Date(),
        totalSharesAmount: shares.totalSharesAmount.plus(transaction.amount)
      }
    });
    
    // Update the transaction's balanceAfter field
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        balanceAfter: newTotalValue
      }
    });
  }
  
  /**
   * Process a shares liquidation transaction
   */
  private async processSharesLiquidation(transaction: Transaction): Promise<void> {
    if (!transaction.amount || !transaction.sharesId) {
      return;
    }
    
    // Get the shares record
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
    
    // Ensure amount is positive for calculations (schema stores liquidations as negative amounts)
    const liquidationAmount = transaction.amount.abs();
    
    // Check if there are sufficient shares
    if (shares.totalValue.lessThan(liquidationAmount)) {
      throw new TransactionError(
        'Insufficient shares value for liquidation',
        TransactionErrorCodes.INSUFFICIENT_FUNDS,
        400
      );
    }
    
    // Get the current value per unit
    const valuePerUnit = await this.getShareValuePerUnit();
    
    // Calculate units to remove
    const unitsToRemove = Math.ceil(liquidationAmount.toNumber() / valuePerUnit.toNumber());
    const newUnitsHeld = shares.unitsHeld - unitsToRemove;
    const newTotalValue = new Decimal(newUnitsHeld * valuePerUnit.toNumber());
    
    // Update the shares balance
    await prisma.shares.update({
      where: { id: shares.id },
      data: {
        unitsHeld: newUnitsHeld,
        totalValue: newTotalValue,
        totalSharesAmount: shares.totalSharesAmount.minus(liquidationAmount)
      }
    });
    
    // Update the transaction's balanceAfter field
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        balanceAfter: newTotalValue
      }
    });
  }
  
  /**
   * Process a shares dividend transaction
   */
  private async processSharesDividend(transaction: Transaction): Promise<void> {
    if (!transaction.amount || !transaction.sharesId) {
      return;
    }
    
    // Find the shares record
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
    
    // Dividends don't change units held, but they increase the value per unit
    // Here, we're crediting the dividend to the member's shares account
    const newTotalValue = shares.totalValue.plus(transaction.amount);
    
    // Update the shares balance
    await prisma.shares.update({
      where: { id: shares.id },
      data: {
        totalValue: newTotalValue
      }
    });
    
    // Update the transaction's balanceAfter field
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        balanceAfter: newTotalValue
      }
    });
  }
  
  /**
   * Process a reversal transaction for shares
   */
  async processReversal(transaction: Transaction): Promise<void> {
    // Get the original transaction this is reversing
    if (!transaction.parentTxnId) {
      return;
    }
    
    const originalTx = await prisma.transaction.findUnique({
      where: { id: transaction.parentTxnId }
    });
    
    if (!originalTx || !originalTx.sharesId || !originalTx.amount) {
      return;
    }
    
    // Find the shares record
    const shares = await prisma.shares.findUnique({
      where: { id: originalTx.sharesId }
    });
    
    if (!shares) {
      return;
    }
    
    // Get the current value per unit
    const valuePerUnit = await this.getShareValuePerUnit();
    
    // Handle different reversal types
    switch (originalTx.transactionType) {
      case TransactionType.SHARES_PURCHASE:
        // Calculate units to remove
        const unitsToRemove = Math.floor(originalTx.amount.toNumber() / valuePerUnit.toNumber());
        const newUnitsHeld = Math.max(0, shares.unitsHeld - unitsToRemove);
        const newTotalValue = new Decimal(newUnitsHeld * valuePerUnit.toNumber());
        
        // Update shares record
        await prisma.shares.update({
          where: { id: shares.id },
          data: {
            unitsHeld: newUnitsHeld,
            totalValue: newTotalValue,
            totalSharesAmount: shares.totalSharesAmount.minus(originalTx.amount)
          }
        });
        
        // Update transaction balanceAfter
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            balanceAfter: newTotalValue
          }
        });
        break;
        
      case TransactionType.SHARES_LIQUIDATION:
        // For liquidation reversal, add shares back
        const unitsToAdd = Math.ceil(originalTx.amount.abs().toNumber() / valuePerUnit.toNumber());
        const newUnitsAfterReversal = shares.unitsHeld + unitsToAdd;
        const newTotalValueAfterReversal = new Decimal(newUnitsAfterReversal * valuePerUnit.toNumber());
        
        // Update shares record
        await prisma.shares.update({
          where: { id: shares.id },
          data: {
            unitsHeld: newUnitsAfterReversal,
            totalValue: newTotalValueAfterReversal,
            totalSharesAmount: shares.totalSharesAmount.plus(originalTx.amount.abs())
          }
        });
        
        // Update transaction balanceAfter
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            balanceAfter: newTotalValueAfterReversal
          }
        });
        break;
        
      case TransactionType.SHARES_DIVIDEND:
        // Reverse dividend by reducing total value
        const newTotalAfterDividendReversal = shares.totalValue.minus(originalTx.amount);
        
        // Update shares record
        await prisma.shares.update({
          where: { id: shares.id },
          data: {
            totalValue: newTotalAfterDividendReversal
          }
        });
        
        // Update transaction balanceAfter
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            balanceAfter: newTotalAfterDividendReversal
          }
        });
        break;
    }
  }
  
  /**
   * Create a notification for the transaction
   */
  private async createNotification(transaction: Transaction): Promise<void> {
    try {
      if (!transaction.sharesId) return;
      
      // Get the shares record to find the member
      const shares = await prisma.shares.findUnique({
        where: { id: transaction.sharesId },
        include: {
          member: true
        }
      });
      
      if (!shares || !shares.member) return;

      // Get the member's user account
      const user = await prisma.user.findFirst({
        where: { biodataId: shares.memberId }
      });
      
      if (!user) return;
      
      let title: string;
      let message: string;
      
      // Create appropriate message based on transaction type
      switch (transaction.transactionType) {
        case TransactionType.SHARES_PURCHASE:
          title = 'Shares Purchased';
          message = `You have purchased shares worth ${transaction.amount.toString()}. New shares value: ${shares.totalValue.toString()}`;
          break;
        case TransactionType.SHARES_LIQUIDATION:
          title = 'Shares Liquidated';
          message = `You have liquidated shares worth ${transaction.amount.abs().toString()}. New shares value: ${shares.totalValue.toString()}`;
          break;
        case TransactionType.SHARES_DIVIDEND:
          title = 'Dividend Payment';
          message = `A dividend of ${transaction.amount.toString()} has been credited to your shares account. New shares value: ${shares.totalValue.toString()}`;
          break;
        case TransactionType.REVERSAL:
          title = 'Transaction Reversed';
          message = `A shares transaction of ${transaction.amount.abs().toString()} has been reversed. New shares value: ${shares.totalValue.toString()}`;
          break;
        default:
          title = 'Shares Transaction';
          message = `A transaction of ${transaction.amount.toString()} has been processed on your shares account. New shares value: ${shares.totalValue.toString()}`;
      }
      
      // Create notification in the database
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'TRANSACTION',
          title,
          message,
          transactionId: transaction.id,
          metadata: {
            transactionType: transaction.transactionType,
            amount: transaction.amount.toString(),
            sharesValue: shares.totalValue.toString(),
            unitsHeld: shares.unitsHeld
          },
          priority: 'NORMAL'
        }
      });
      
    } catch (error) {
      // Don't let notification errors break the transaction
      logger.error(`Error creating notification for transaction ${transaction.id}:`, error);
    }
  }
  
  /**
   * Get the current value per share unit from system settings
   */
  private async getShareValuePerUnit(): Promise<Decimal> {
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
}