import { TransactionModule, TransactionType } from '@prisma/client';
import { TransactionProcessor } from '../../interfaces/transaction-processor.interface';
import { SavingsTransactionProcessor } from '../processors/savings-transaction.processor';
import { LoanTransactionProcessor } from '../processors/loan-transaction.processor';
import { SharesTransactionProcessor } from '../processors/shares-transaction.processor';
import { RequestTransactionProcessor } from '../processors/request-transaction.processor';
import { AdminTransactionProcessor } from '../processors/admin-transaction.processor';
import logger from '../../../../utils/logger';

/**
 * Factory for creating transaction processors
 * Determines the correct processor to use based on transaction type or module
 */
export class TransactionProcessorFactory {
  /**
   * Get the appropriate transaction processor for a given transaction type or module
   */
  public static getProcessor(type: TransactionType | TransactionModule): TransactionProcessor {
    // First check for transaction type-specific processors
    const processorByType = this.getProcessorByType(type as TransactionType);
    if (processorByType) {
      return processorByType;
    }
    
    // Then fall back to module-based processors
    const processorByModule = this.getProcessorByModule(type as TransactionModule);
    if (processorByModule) {
      return processorByModule;
    }
    
    // If we can't find a processor, log an error and use the admin processor as a fallback
    logger.error(`No processor found for transaction type/module: ${type}`);
    return new AdminTransactionProcessor();
  }
  
  /**
   * Get processor by transaction type
   */
  private static getProcessorByType(type: TransactionType): TransactionProcessor | null {
    switch (type) {
      // Savings-related transactions
      case TransactionType.SAVINGS_DEPOSIT:
      case TransactionType.SAVINGS_WITHDRAWAL:
      case TransactionType.SAVINGS_INTEREST:
        return new SavingsTransactionProcessor();
      
      // Shares-related transactions
      case TransactionType.SHARES_PURCHASE:
      case TransactionType.SHARES_LIQUIDATION:
      case TransactionType.SHARES_DIVIDEND:
        return new SharesTransactionProcessor();
      
      // Loan-related transactions
      case TransactionType.LOAN_DISBURSEMENT:
      case TransactionType.LOAN_REPAYMENT:
      case TransactionType.LOAN_INTEREST:
      case TransactionType.LOAN_PENALTY:
        return new LoanTransactionProcessor();
      
      // Admin-related transactions
      case TransactionType.FEE:
      case TransactionType.ADJUSTMENT:
        return new AdminTransactionProcessor();
      
      // Special cases
      case TransactionType.REVERSAL:
        return new AdminTransactionProcessor(); // Default handler for reversals
        
      default:
        return null;
    }
  }
  
  /**
   * Get processor by module
   */
  private static getProcessorByModule(module: TransactionModule): TransactionProcessor | null {
    switch (module) {
      case TransactionModule.SAVINGS:
        return new SavingsTransactionProcessor();
      
      case TransactionModule.SHARES:
        return new SharesTransactionProcessor();
      
      case TransactionModule.LOAN:
        return new LoanTransactionProcessor();
      
      case TransactionModule.SYSTEM:
      case TransactionModule.ADMIN:
        return new AdminTransactionProcessor();
      
      default:
        return null;
    }
  }
}