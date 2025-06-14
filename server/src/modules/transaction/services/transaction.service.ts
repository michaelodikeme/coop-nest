import { PrismaClient, TransactionType, TransactionStatus, TransactionModule, Prisma } from '@prisma/client';
import { CreateTransactionDto } from '../dtos/create-transaction.dto';
import { TransactionProcessorFactory } from './factories/transaction-processor.factory';
import { TransactionError, TransactionErrorCodes } from '../errors/transaction.error';
import logger from '../../../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { Transaction } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { determineBaseType } from '../utils/transaction.utils';
import { TransactionValidatorUtils } from '../utils/transaction-validator.utils';

/**
* Core service for transaction operations
* 
* The TransactionService handles core CRUD operations for transactions:
* - Creating single and batch transactions
* - Updating transaction status
* - Reversing transactions
* 
* It delegates processing logic to type-specific processors through the TransactionProcessorFactory
* and uses prisma transactions to ensure atomicity of operations.
* 
* @example
* // Create a new savings deposit transaction
* const transaction = await transactionService.createTransaction({
*   transactionType: TransactionType.SAVINGS_DEPOSIT,
*   module: TransactionModule.SAVINGS,
*   amount: 5000,
*   initiatedBy: userId,
*   relatedEntityId: savingsId,
*   relatedEntityType: 'SAVINGS',
*   description: 'Monthly savings deposit'
* });
*/
export class TransactionService {
  /**
  * The Prisma client instance used for database operations
  */
  private prisma: PrismaClient;
  
  /**
  * Create a new TransactionService instance
  */
  constructor() {
    this.prisma = new PrismaClient();
  }
  
  /**
  * Create a new transaction
  * 
  * This method creates a transaction record in the database and optionally processes it
  * using the appropriate processor based on the transaction type.
  * 
  * @param data Transaction data
  * @param autoComplete Whether to automatically mark as completed and process the transaction
  * @returns Created transaction record
  * @throws TransactionError if validation or processing fails
  * 
  * @example
  * // Create a pending transaction
  * const pendingTx = await service.createTransaction({
  *   transactionType: TransactionType.SAVINGS_DEPOSIT,
  *   module: TransactionModule.SAVINGS,
  *   amount: 5000,
  *   initiatedBy: userId,
  *   relatedEntityId: savingsId,
  *   relatedEntityType: 'SAVINGS',
  * });
  * 
  * // Create and auto-complete a transaction
  * const completedTx = await service.createTransaction({
  *   transactionType: TransactionType.SAVINGS_DEPOSIT,
  *   module: TransactionModule.SAVINGS,
  *   amount: 5000,
  *   initiatedBy: userId,
  *   relatedEntityId: savingsId,
  *   relatedEntityType: 'SAVINGS',
  * }, true);
  */
  async createTransaction(
    data: CreateTransactionDto, 
    autoComplete = false
  ): Promise<Transaction> {
    try {
      // Use centralized validation
      const validation = await TransactionValidatorUtils.validateTransaction(data);
      if (!validation.isValid) {
        throw TransactionError.validationError(
          'Transaction validation failed', 
          { general: validation.errors || ['Validation failed'] }
        );
      }
      
      // Get the appropriate processor for this transaction type
      const processor = TransactionProcessorFactory.getProcessor(data.transactionType);
      
      // Additional processor-specific validation if needed
      const isValid = await processor.validateTransaction(data);
      if (!isValid) {
        throw TransactionError.validationError('Processor-specific validation failed');
      }
      
      // Set default status based on autoComplete
      const status = autoComplete 
      ? TransactionStatus.COMPLETED 
      : TransactionStatus.PENDING;
      
      // Process in transaction to ensure atomicity
      return await this.prisma.$transaction(async (tx) => {
        // Create the transaction record
        const transaction = await tx.transaction.create({
          data: {
            id: uuidv4(),
            transactionType: data.transactionType,
            baseType: determineBaseType(data.transactionType as TransactionType),
            module: data.module,
            amount: new Decimal(data.amount || 0),
            balanceAfter: new Decimal(0), // Will be updated by processor
            description: data.description,
            metadata: (data.metadata || {}) as Prisma.InputJsonValue,
            requestId: data.requestId,
            parentTxnId: data.parentTxnId || null,
            loanId: data.relatedEntityType === 'LOAN' ? data.relatedEntityId : undefined,
            savingsId: data.relatedEntityType === 'SAVINGS' ? data.relatedEntityId : undefined,
            sharesId: data.relatedEntityType === 'SHARES' ? data.relatedEntityId : undefined,
            initiatedBy: data.initiatedBy,
            status: status,
            completedAt: status === TransactionStatus.COMPLETED ? new Date() : null,
          },
        });
        
        // Process the transaction if it's auto-completed
        if (autoComplete) {
          await processor.processTransaction(transaction, tx);
        }
        
        return transaction;
      });
    } catch (error) {
      this.handleError(
        error, 
        'Failed to create transaction', 
        TransactionErrorCodes.PROCESSING_ERROR
      );
    }
  }
  
  /**
  * Update a transaction's status
  * 
  * This method updates the status of a transaction and triggers appropriate processing
  * based on the new status. For example, moving to COMPLETED will process the transaction.
  * 
  * Status transitions are validated against allowed transitions:
  * - PENDING → PROCESSING, COMPLETED, FAILED, CANCELLED
  * - PROCESSING → COMPLETED, FAILED
  * - COMPLETED → REVERSED
  * - FAILED → REVERSED
  * - REVERSED → (no transitions allowed)
  * - CANCELLED → (no transitions allowed)
  * 
  * @param id Transaction ID
  * @param status New status
  * @param approvedBy User who approved the transaction (required for completion)
  * @returns Updated transaction
  * @throws TransactionError if transaction not found or status transition is invalid
  * 
  * @example
  * // Complete a pending transaction
  * const completedTx = await service.updateTransactionStatus(
  *   transactionId,
  *   TransactionStatus.COMPLETED,
  *   approverUserId
  * );
  */
  async updateTransactionStatus(
    id: string,
    status: TransactionStatus,
    approvedBy?: string,
    notes?: string
  ): Promise<Transaction> {
    try {
      // Find existing transaction
      const transaction = await this.prisma.transaction.findUnique({
        where: { id }
      });
      
      if (!transaction) {
        throw TransactionError.notFound(id);
      }
      
      // Validate status transition
      await TransactionValidatorUtils.validateStatusTransition(
        transaction.status, 
        status
      );
      
      if (status === 'COMPLETED') {
        // Get the processor to validate and process completion
        const processor = TransactionProcessorFactory.getProcessor(transaction.transactionType);
        
        return await this.prisma.$transaction(async (tx) => {
          // Update the transaction status
          const updatedTransaction = await tx.transaction.update({
            where: { id },
            data: {
              status,
              completedAt: new Date(),
              approver: approvedBy ? { connect: { id: approvedBy } } : undefined,
              metadata: {
                ...(transaction.metadata as any || {}),
                statusHistory: [
                  ...((transaction.metadata as any)?.statusHistory || []),
                  {
                    from: transaction.status,
                    to: status,
                    date: new Date(),
                    by: approvedBy,
                    notes: notes || 'Status updated'
                  }
                ]
              }
            }
          });
          
          // Process the completion (might update balances, etc.)
          await processor.processTransaction(updatedTransaction, tx);
          
          // Notify the processor about the status change
          await processor.onTransactionStatusChange(updatedTransaction, transaction.status);
          
          return updatedTransaction;
        });
      } else {
        // For other status updates, just update the record
        return await this.prisma.transaction.update({
          where: { id },
          data: {
            status,
            completedAt: status === (TransactionStatus.COMPLETED as TransactionStatus) ? new Date() : undefined,
            approver: approvedBy ? {
              connect: { id: approvedBy }
            } : undefined,
            metadata: {
              ...(transaction.metadata as any || {}),
              statusHistory: [
                ...((transaction.metadata as any)?.statusHistory || []),
                {
                  from: transaction.status,
                  to: status,
                  date: new Date(),
                  by: approvedBy,
                  notes: notes || 'Status updated'
                }
              ]
            }
          }
        });
      }
    } catch (error) {
      this.handleError(
        error,
        `Failed to update transaction status for ${id}`,
        TransactionErrorCodes.PROCESSING_ERROR
      );
    }
  }
  
  /**
  * Reverse a transaction
  * 
  * This method creates a reversal transaction and marks the original transaction
  * as reversed. The reversal is processed to undo the effects of the original
  * transaction (e.g., restoring funds for a withdrawal).
  * 
  * Only COMPLETED transactions can be reversed.
  * 
  * @param id Transaction ID to reverse
  * @param reason Reason for reversal
  * @param initiatedBy User who initiated the reversal
  * @returns Reversal transaction record
  * @throws TransactionError if transaction not found, already reversed, or not completed
  * 
  * @example
  * // Reverse a transaction
  * const reversalTx = await service.reverseTransaction(
  *   transactionId,
  *   'Customer request - entered incorrect amount',
  *   userId
  * );
  */
  async reverseTransaction(
    id: string,
    reason: string,
    initiatedBy: string
  ): Promise<Transaction> {
    try {
      const transaction = await this.prisma.transaction.findUnique({
        where: { id }
      });
      
      if (!transaction) {
        throw new TransactionError(
          'Transaction not found',
          TransactionErrorCodes.TRANSACTION_NOT_FOUND,
          404
        );
      }
      
      // Check if transaction can be reversed
      if (transaction.status === TransactionStatus.REVERSED) {
        throw new TransactionError(
          'Transaction is already reversed',
          TransactionErrorCodes.TRANSACTION_ALREADY_REVERSED,
          400
        );
      }
      
      if (transaction.status !== TransactionStatus.COMPLETED) {
        throw new TransactionError(
          'Only completed transactions can be reversed',
          TransactionErrorCodes.INVALID_STATUS,
          400
        );
      }
      
      // Get the processor to handle the reversal
      const processor = TransactionProcessorFactory.getProcessor(transaction.transactionType);
      
      // Process in a transaction to ensure atomicity
      return await this.prisma.$transaction(async (tx) => {
        // 1. Create reversal transaction
        const reversalTransaction = await tx.transaction.create({
          data: {
            id: uuidv4(),
            transactionType: TransactionType.REVERSAL,
            baseType: transaction.baseType === TransactionType.CREDIT ? 
            TransactionType.DEBIT : TransactionType.CREDIT, // Opposite of the original
            module: transaction.module,
            amount: transaction.amount,
            balanceAfter: new Decimal(0), // Will be calculated by processor
            status: TransactionStatus.COMPLETED,
            description: `Reversal: ${reason}`,
            metadata: {
              reversalReason: reason,
              originalTransaction: {
                id: transaction.id,
                type: transaction.transactionType,
                amount: transaction.amount.toString()
              }
            },
            initiatedBy: initiatedBy,
            approvedBy: initiatedBy,  // Auto-approve reversals
            completedAt: new Date(),
            parentTxnId: transaction.id,
            ...(transaction.requestId ? { requestId: transaction.requestId } : {}),
            loanId: transaction.loanId,
            savingsId: transaction.savingsId,
            sharesId: transaction.sharesId
          }
        });
        
        // 2. Mark original transaction as reversed
        await tx.transaction.update({
          where: { id },
          data: {
            status: TransactionStatus.REVERSED
          }
        });
        
        // 3. Process the reversal (update balances, etc.)
        if (processor.processReversal) {
          await processor.processReversal(reversalTransaction, tx);
        }
        
        return reversalTransaction;
      });
    } catch (error) {
      this.handleError(
        error, 
        `Failed to reverse transaction ${id}`, 
        TransactionErrorCodes.PROCESSING_ERROR
      );
    }
  }
  
  /**
  * Create multiple transactions in a batch
  * 
  * This method creates multiple transactions either as a single atomic unit
  * (all succeed or all fail) or independently (some may succeed while others fail).
  * 
  * @param transactions List of transactions to create
  * @param processAsUnit Whether to process all or none if any fails
  * @returns Array of created transactions
  * @throws TransactionError if batch processing fails
  * 
  * @example
  * // Process transactions as a unit (all or nothing)
  * const transactions = await service.createBatchTransactions(
  *   [
  *     { transactionType: TransactionType.SAVINGS_DEPOSIT, ... },
  *     { transactionType: TransactionType.SHARES_PURCHASE, ... }
  *   ],
  *   true // processAsUnit
  * );
  */
  async createBatchTransactions(
    transactions: CreateTransactionDto[],
    processAsUnit = false
  ): Promise<Transaction[]> {
    try {
      if (processAsUnit) {
        // Process all in a single transaction
        return await this.processBatchAsUnit(transactions);
      } else {
        // Process each transaction independently
        return await this.processBatchIndependently(transactions);
      }
    } catch (error) {
      this.handleError(
        error, 
        'Failed to process batch transactions', 
        TransactionErrorCodes.PROCESSING_ERROR
      );
    }
  }
  
  /**
  * Process batch transactions as a single unit (all succeed or all fail)
  */
  private async processBatchAsUnit(transactions: CreateTransactionDto[]): Promise<Transaction[]> {
    // Pre-validate all transactions
    for (const txData of transactions) {
      const processor = TransactionProcessorFactory.getProcessor(txData.transactionType);
      const isValid = await processor.validateTransaction(txData);
      if (!isValid) {
        throw new TransactionError(
          `Validation failed for transaction in batch: ${txData.description || 'No description'}`,
          TransactionErrorCodes.VALIDATION_ERROR,
          400
        );
      }
    }
    
    // Process all in a single transaction
    return await this.prisma.$transaction(async (tx) => {
      const createdTransactions: Transaction[] = [];
      
      for (const txData of transactions) {
        const status = txData.autoComplete 
        ? TransactionStatus.COMPLETED 
        : TransactionStatus.PENDING;
        
        // Create the transaction
        const transaction = await tx.transaction.create({
          data: {
            id: uuidv4(),
            transactionType: txData.transactionType,
            baseType: determineBaseType(txData.transactionType as TransactionType),
            module: txData.module,
            amount: new Decimal(txData.amount || 0),
            balanceAfter: new Decimal(0), // Will be updated by processor
            description: txData.description,
            metadata: (txData.metadata || {}) as Prisma.InputJsonValue,
            ...(txData.requestId ? { requestId: txData.requestId } : {}),
            ...(txData.parentTxnId ? { parentTxnId: txData.parentTxnId } : {}),
            ...(txData.relatedEntityType === 'LOAN' ? { loanId: txData.relatedEntityId } : {}),
            ...(txData.relatedEntityType === 'SAVINGS' ? { savingsId: txData.relatedEntityId } : {}),
            ...(txData.relatedEntityType === 'SHARES' ? { sharesId: txData.relatedEntityId } : {}),
            initiatedBy: txData.initiatedBy,
            status: status,
            completedAt: status === TransactionStatus.COMPLETED ? new Date() : null,
          },
        });
        
        createdTransactions.push(transaction);
        
        // Process if auto-complete
        if (txData.autoComplete) {
          const processor = TransactionProcessorFactory.getProcessor(txData.transactionType);
          await processor.processTransaction(transaction, tx);
        }
      }
      
      return createdTransactions;
    });
  }
  
  /**
  * Process batch transactions independently (some may fail)
  */
  private async processBatchIndependently(transactions: CreateTransactionDto[]): Promise<Transaction[]> {
    const results: Transaction[] = [];
    const errors: Error[] = [];
    
    // Process each transaction
    for (const txData of transactions) {
      try {
        const transaction = await this.createTransaction(txData, txData.autoComplete);
        results.push(transaction);
      } catch (error) {
        errors.push(error as Error);
        logger.error(`Error processing batch item: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    // If all failed, throw an error
    if (results.length === 0 && errors.length > 0) {
      throw new TransactionError(
        'All batch transactions failed',
        TransactionErrorCodes.PROCESSING_ERROR,
        500
      );
    }
    
    return results;
  }
  
  /**
  * Create a transaction record with the provided transaction client
  * 
  * This method is used to create a transaction within an existing transaction context,
  * allowing for more complex processing scenarios where the transaction needs to be
  * created as part of another transaction.
  * 
  * @param tx Transaction client from prisma.$transaction
  * @param data Transaction data
  * @returns Created transaction record
  * @throws TransactionError if creation fails
  * 
  * @example
  * // Within a transaction
  * await prisma.$transaction(async (tx) => {
  *   const transaction = await transactionService.createTransactionWithTx(tx, {
  *     transactionType: TransactionType.LOAN_DISBURSEMENT,
  *     module: TransactionModule.LOANS,
  *     amount: 10000,
  *     initiatedBy: userId,
  *     relatedEntityId: loanId,
  *     relatedEntityType: 'LOAN',
  *     description: 'Loan disbursement'
  *   });
  * });
  */
  async createTransactionWithTx(
    tx: any, 
    data: CreateTransactionDto
  ): Promise<Transaction> {
    try {
      // Create the transaction record with the provided transaction client
      const transaction = await tx.transaction.create({
        data: {
          id: uuidv4(),
          transactionType: data.transactionType,
          baseType: determineBaseType(data.transactionType),
          module: data.module,
          amount: new Decimal(data.amount || 0),
          balanceAfter: new Decimal(data.balanceAfter || 0),
          description: data.description,
          metadata: data.metadata || {},
          
          // Handle relationships with connect pattern
          ...(data.requestId ? { 
            request: { connect: { id: data.requestId } } 
          } : {}),
          
          ...(data.parentTxnId ? { 
            parentTransaction: { connect: { id: data.parentTxnId } } 
          } : {}),
          
          // Connect related entities using proper relationship fields
          ...(data.relatedEntityType === 'LOAN' && data.relatedEntityId ? { 
            loan: { connect: { id: data.relatedEntityId } } 
          } : {}),
          
          ...(data.relatedEntityType === 'SAVINGS' && data.relatedEntityId ? { 
            savings: { connect: { id: data.relatedEntityId } } 
          } : {}),
          
          ...(data.relatedEntityType === 'SHARES' && data.relatedEntityId ? { 
            shares: { connect: { id: data.relatedEntityId } } 
          } : {}),
          
          // Connect initiator
          initiator: {
            connect: { id: data.initiatedBy }
          },
          
          status: data.autoComplete ? TransactionStatus.COMPLETED : TransactionStatus.PENDING,
          completedAt: data.autoComplete ? new Date() : null,
        },
      });
      
      return transaction;
    } catch (error) {
      this.handleError(
        error, 
        'Failed to create transaction with transaction client', 
        TransactionErrorCodes.PROCESSING_ERROR
      );
    }
  }
  
  // Add this private method to standardize error handling
  
  /**
  * Handle errors consistently across service methods
  * @param error Error to handle
  * @param message Default message if error isn't already a TransactionError
  * @param errorCode Error code to use if creating new TransactionError
  * @returns Never returns - always throws an error
  */
  private handleError(
    error: any, 
    message: string, 
    errorCode: TransactionErrorCodes = TransactionErrorCodes.PROCESSING_ERROR
  ): never {
    logger.error(message, error);
    
    if (error instanceof TransactionError) {
      throw error;
    }
    
    throw new TransactionError(
      message,
      errorCode,
      500,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}
