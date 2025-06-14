import { PrismaClient, Transaction, TransactionStatus, TransactionType, TransactionModule } from '@prisma/client';
import { TransactionProcessor } from '../../interfaces/transaction-processor.interface';
import { CreateTransactionDto } from '../../dtos/create-transaction.dto';
import { TransactionError, TransactionErrorCodes } from '../../errors/transaction.error';
import { Decimal } from '@prisma/client/runtime/library';
import logger from '../../../../utils/logger';

/**
 * Processor for savings-related transactions
 */
export class SavingsTransactionProcessor implements TransactionProcessor {
  private prisma: PrismaClient;
  
  constructor() {
    this.prisma = new PrismaClient();
  }
  
  /**
   * Validate a savings transaction before processing
   */
  async validateTransaction(data: CreateTransactionDto): Promise<boolean> {
    try {
      // Validate based on transaction type
      switch (data.transactionType) {
        case TransactionType.SAVINGS_DEPOSIT:
          return this.validateSavingsDeposit(data);
        case TransactionType.SAVINGS_WITHDRAWAL:
          return this.validateSavingsWithdrawal(data);
        default:
          // For other transaction types that aren't specific to savings
          return true;
      }
    } catch (error) {
      logger.error('Savings transaction validation error', error);
      return false;
    }
  }
  
  /**
   * Process a savings transaction
   */
  async processTransaction(transaction: Transaction, tx: any): Promise<void> {
    try {
      // Skip if not completed
      if (transaction.status !== TransactionStatus.COMPLETED) {
        return;
      }
      
      switch (transaction.transactionType) {
        case TransactionType.SAVINGS_DEPOSIT:
          await this.processSavingsDeposit(transaction);
          break;
        case TransactionType.SAVINGS_WITHDRAWAL:
          await this.processSavingsWithdrawal(transaction);
          break;
        case TransactionType.REVERSAL:
          await this.processReversal(transaction);
          break;
      }
    } catch (error) {
      logger.error(`Error processing savings transaction ${transaction.id}:`, error);
      throw new TransactionError(
        'Failed to process savings transaction',
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
          await this.processTransaction(transaction, null);
          
          // Create notification for member
        if (transaction.savingsId) {
          await this.createNotification(transaction);
        }
      }
    } catch (error) {
      logger.error(`Error handling status change for transaction ${transaction.id}:`, error);
      // Don't rethrow here as this is a notification step and shouldn't block the main transaction
    }
  }
  
  /**
   * Validate a savings deposit transaction
   */
  private async validateSavingsDeposit(data: CreateTransactionDto): Promise<boolean> {
    // Must have amount
    if (!data.amount) {
      logger.error('Missing amount for savings deposit transaction');
      return false;
    }
    
    // Amount must be positive
    const amount = new Decimal(data.amount.toString());
    if (amount.lessThanOrEqualTo(0)) {
      logger.error('Deposit amount must be greater than 0');
      return false;
    }
    
    // If savingsId is provided, check that it exists
    if (data.relatedEntityId && data.relatedEntityType === 'SAVINGS') {
      const savings = await this.prisma.savings.findUnique({
        where: { id: data.relatedEntityId }
      });
      
      if (!savings) {
        logger.error(`Savings record not found: ${data.relatedEntityId}`);
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Validate a savings withdrawal transaction
   */
  private async validateSavingsWithdrawal(data: CreateTransactionDto): Promise<boolean> {
    // Must have amount
    if (!data.amount) {
      logger.error('Missing amount for savings withdrawal transaction');
      return false;
    }
    
    // Amount must be positive (we'll convert to negative later)
    const amount = new Decimal(data.amount.toString());
    if (amount.lessThanOrEqualTo(0)) {
      logger.error('Withdrawal amount must be greater than 0');
      return false;
    }
    
    // Must have savingsId or memberId
    if (!data.relatedEntityId) {
      logger.error('Missing relatedEntityId for savings withdrawal transaction');
      return false;
    }
    
    // Check if there are sufficient funds
    if (data.relatedEntityType === 'SAVINGS') {
      const savings = await this.prisma.savings.findUnique({
        where: { id: data.relatedEntityId }
      });
      
      if (!savings) {
        logger.error(`Savings record not found: ${data.relatedEntityId}`);
        return false;
      }
      
      // If savings balance is less than withdrawal amount, reject
      if (savings.balance.lessThan(amount)) {
        logger.error(`Insufficient balance for withdrawal: ${savings.balance.toString()} < ${amount.toString()}`);
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Process a savings deposit transaction
   */
  private async processSavingsDeposit(transaction: Transaction): Promise<void> {
    if (!transaction.amount) {
      return;
    }
    
    // If no savings ID is provided, we need to find or create a savings record
    if (!transaction.savingsId) {
      // This is likely a more complex scenario like a new member's first deposit
      // or a deposit without a specific savings record
      logger.warn(`Processing deposit without savings ID: ${transaction.id}`);
      return;
    }
    
    // Find the savings record
    const savings = await this.prisma.savings.findUnique({
      where: { id: transaction.savingsId }
    });
    
    if (!savings) {
      throw new TransactionError(
        `Savings record not found: ${transaction.savingsId}`,
        TransactionErrorCodes.ENTITY_NOT_FOUND,
        404
      );
    }
    
    // Update the savings balance
    await this.prisma.savings.update({
      where: { id: savings.id },
      data: {
        balance: savings.balance.plus(transaction.amount),
        lastDeposit: new Date(),
        totalSavingsAmount: savings.totalSavingsAmount.plus(transaction.amount)
      }
    });
    
    // Update the transaction's balanceAfter field
    await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        balanceAfter: savings.balance.plus(transaction.amount)
      }
    });
  }
  
  /**
   * Process a savings withdrawal transaction
   */
  private async processSavingsWithdrawal(transaction: Transaction): Promise<void> {
    if (!transaction.amount || !transaction.savingsId) {
      return;
    }
    
    // Ensure amount is positive for calculations (schema stores withdrawals as negative amounts)
    const withdrawalAmount = transaction.amount.abs();
    
    // Find the savings record
    const savings = await this.prisma.savings.findUnique({
      where: { id: transaction.savingsId }
    });
    
    if (!savings) {
      throw new TransactionError(
        `Savings record not found: ${transaction.savingsId}`,
        TransactionErrorCodes.ENTITY_NOT_FOUND,
        404
      );
    }
    
    // Check if there are sufficient funds
    if (savings.balance.lessThan(withdrawalAmount)) {
      throw new TransactionError(
        'Insufficient savings balance for withdrawal',
        TransactionErrorCodes.INSUFFICIENT_FUNDS,
        400
      );
    }
    
    // Update the savings balance
    const newBalance = savings.balance.minus(withdrawalAmount);
    await this.prisma.savings.update({
      where: { id: savings.id },
      data: {
        balance: newBalance,
        totalSavingsAmount: savings.totalSavingsAmount.minus(withdrawalAmount)
      }
    });
    
    // Update the transaction's balanceAfter field
    await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        balanceAfter: newBalance
      }
    });
  }
  
  /**
   * Process a reversal transaction for savings
   */
  async processReversal(transaction: Transaction): Promise<void> {
    // Get the original transaction this is reversing
    if (!transaction.parentTxnId) {
      return;
    }
    
    const originalTx = await this.prisma.transaction.findUnique({
      where: { id: transaction.parentTxnId }
    });
    
    if (!originalTx || !originalTx.savingsId) {
      return;
    }
    
    // Find the savings record
    const savings = await this.prisma.savings.findUnique({
      where: { id: originalTx.savingsId }
    });
    
    if (!savings || !originalTx.amount) {
      return;
    }
    
    // If this is a deposit reversal, we need to reduce savings
    if (originalTx.transactionType === TransactionType.SAVINGS_DEPOSIT) {
      const newBalance = savings.balance.minus(originalTx.amount);
      
      await this.prisma.savings.update({
        where: { id: savings.id },
        data: {
          balance: newBalance,
          totalSavingsAmount: savings.totalSavingsAmount.minus(originalTx.amount)
        }
      });
      
      // Update the transaction's balanceAfter field
      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          balanceAfter: newBalance
        }
      });
    }
    
    // If this is a withdrawal reversal, we need to add back to savings
    else if (originalTx.transactionType === TransactionType.SAVINGS_WITHDRAWAL) {
      const amountToRestore = originalTx.amount.abs(); // Get positive value
      const newBalance = savings.balance.plus(amountToRestore);
      
      await this.prisma.savings.update({
        where: { id: savings.id },
        data: {
          balance: newBalance,
          totalSavingsAmount: savings.totalSavingsAmount.plus(amountToRestore)
        }
      });
      
      // Update the transaction's balanceAfter field
      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          balanceAfter: newBalance
        }
      });
    }
  }
  
  /**
   * Create a notification for the transaction
   */
  private async createNotification(transaction: Transaction): Promise<void> {
    try {
      if (!transaction.savingsId) return;
      
      // Get the savings record to find the member
      const savings = await this.prisma.savings.findUnique({
        where: { id: transaction.savingsId },
        include: {
          member: true
        }
      });
      
      if (!savings || !savings.member) return;

      // Get the member's user account
      const user = await this.prisma.user.findFirst({
        where: { biodataId: savings.memberId }
      });
      
      if (!user) return;
      
      let title: string;
      let message: string;
      
      // Create appropriate message based on transaction type
      switch (transaction.transactionType) {
        case TransactionType.SAVINGS_DEPOSIT:
          title = 'Savings Deposit';
          message = `Your savings account has been credited with ${transaction.amount.toString()}. New balance: ${savings.balance.toString()}`;
          break;
        case TransactionType.SAVINGS_WITHDRAWAL:
          title = 'Savings Withdrawal';
          message = `${transaction.amount.abs().toString()} has been withdrawn from your savings account. New balance: ${savings.balance.toString()}`;
          break;
        case TransactionType.SAVINGS_INTEREST:
          title = 'Interest Credit';
          message = `Interest of ${transaction.amount.toString()} has been credited to your savings account. New balance: ${savings.balance.toString()}`;
          break;
        case TransactionType.REVERSAL:
          title = 'Transaction Reversed';
          message = `A transaction of ${transaction.amount.abs().toString()} has been reversed on your savings account. New balance: ${savings.balance.toString()}`;
          break;
        default:
          title = 'Savings Transaction';
          message = `A transaction of ${transaction.amount.toString()} has been processed on your savings account. New balance: ${savings.balance.toString()}`;
      }
      
      // Create notification in the database
      await this.prisma.notification.create({
        data: {
          userId: user.id,
          type: 'TRANSACTION',
          title,
          message,
          transactionId: transaction.id,
          metadata: {
            transactionType: transaction.transactionType,
            amount: transaction.amount.toString(),
            balance: savings.balance.toString()
          },
          priority: 'NORMAL'
        }
      });
      
    } catch (error) {
      // Don't let notification errors break the transaction
      logger.error(`Error creating notification for transaction ${transaction.id}:`, error);
    }
  }
}