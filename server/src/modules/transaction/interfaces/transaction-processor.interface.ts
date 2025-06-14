import { Transaction, TransactionStatus } from '@prisma/client';
import { CreateTransactionDto } from '../dtos/create-transaction.dto';

/**
 * Transaction processor interface
 * 
 * This interface defines the contract for transaction processors, which handle
 * type-specific business logic for different transaction types.
 * 
 * Each transaction type (e.g., savings deposit, loan repayment) has its own processor
 * that implements this interface to provide customized validation and processing logic.
 */
export interface TransactionProcessor {
  /**
   * Validate a transaction before processing
   * 
   * This method performs processor-specific validation beyond the
   * basic validation done by the transaction service. For example,
   * checking if a savings account has sufficient funds for a withdrawal.
   * 
   * @param data Transaction data to validate
   * @returns Boolean indicating if the transaction is valid
   */
  validateTransaction(data: CreateTransactionDto): Promise<boolean>;
  
  /**
   * Process a transaction
   * 
   * This method performs the actual processing logic for a transaction,
   * such as updating balances, creating related records, etc.
   * 
   * @param transaction Transaction to process
   * @param tx Optional transaction client for atomic operations
   * @returns Promise that resolves when processing is complete
   */
  processTransaction(transaction: Transaction, tx?: any): Promise<void>;
  
  /**
   * Handle changes in transaction status
   * 
   * This method is called when a transaction's status changes,
   * allowing the processor to perform additional actions based
   * on the new status, such as sending notifications or updating
   * related records.
   * 
   * @param transaction Transaction with updated status
   * @param previousStatus Previous status before update
   * @returns Promise that resolves when status change handling is complete
   */
  onTransactionStatusChange(transaction: Transaction, previousStatus: TransactionStatus): Promise<void>;
  
  /**
   * Process a reversal transaction
   * 
   * This optional method handles reversals of transactions, such as
   * updating balances to undo the effects of the original transaction.
   * 
   * @param transaction Reversal transaction
   * @param tx Optional transaction client for atomic operations
   * @returns Promise that resolves when reversal processing is complete
   */
  processReversal?(transaction: Transaction, tx?: any): Promise<void>;
}