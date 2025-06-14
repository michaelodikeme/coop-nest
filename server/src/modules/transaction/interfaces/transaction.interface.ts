import { 
  Transaction, 
  TransactionModule, 
  TransactionStatus, 
  TransactionType 
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Data transfer object for creating a new transaction
 */
export interface CreateTransactionDto {
  /**
   * Type of transaction (e.g. SAVINGS_DEPOSIT, LOAN_REPAYMENT)
   */
  transactionType: string;
  
  /**
   * Base type (CREDIT or DEBIT)
   */
  baseType?: string;
  
  /**
   * Module the transaction belongs to
   */
  module: string;
  
  /**
   * Transaction amount
   */
  amount: Decimal | number | string;
  
  /**
   * Transaction description
   */
  description?: string;
  
  /**
   * Additional transaction metadata
   */
  metadata?: Record<string, any>;
  
  /**
   * Related entity type (e.g. BIODATA, LOAN)
   */
  relatedEntityType?: string;
  
  /**
   * ID of the related entity
   */
  relatedEntityId?: string;
  
  /**
   * ID of the user who initiated the transaction
   */
  initiatedBy?: string;
  
  /**
   * ID of the related request
   */
  requestId?: string;
  
  /**
   * ID of the parent transaction (for reversals)
   */
  parentTxnId?: string;
  
  /**
   * ID of related loan
   */
  loanId?: string;
  
  /**
   * ID of related savings
   */
  savingsId?: string;
  
  /**
   * ID of related shares
   */
  sharesId?: string;
  
  /**
   * Whether to automatically complete the transaction
   */
  autoComplete?: boolean;
}

/**
 * Filter options for searching transactions
 */
export interface TransactionFilterDto {
  approvedBy: any;
  minAmount: any;
  maxAmount: any;
  /**
   * Transaction module
   */
  module?: string;
  
  /**
   * Transaction type
   */
  transactionType?: string;
  
  /**
   * Base type (CREDIT/DEBIT)
   */
  baseType?: string;
  
  /**
   * Transaction status
   */
  status?: TransactionStatus;
  
  /**
   * User who initiated the transaction
   */
  initiatedBy?: string;
  
  /**
   * Type of related entity
   */
  relatedEntityType?: string;
  
  /**
   * ID of related entity
   */
  relatedEntityId?: string;
  
  /**
   * ID of related loan
   */
  loanId?: string;
  
  /**
   * ID of related savings
   */
  savingsId?: string;
  
  /**
   * ID of related shares
   */
  sharesId?: string;
  
  /**
   * ID of related request
   */
  requestId?: string;
  
  /**
   * Start date for filtering (ISO string)
   */
  startDate?: string;
  
  /**
   * End date for filtering (ISO string)
   */
  endDate?: string;
  
  /**
   * Page number for pagination
   */
  page?: number;
  
  /**
   * Records per page for pagination
   */
  limit?: number;
}

/**
 * Paginated response for transaction queries
 */
export interface PaginatedResponse<T> {
  /**
   * Transaction data
   */
  data: T[];
  
  /**
   * Total number of records
   */
  total: number;
  
  /**
   * Current page number
   */
  page: number;
  
  /**
   * Records per page
   */
  limit: number;
  
  /**
   * Total number of pages
   */
  totalPages: number;
}

/**
 * Summary statistics for transactions
 */
export interface TransactionSummary {
  /**
   * Total number of transactions
   */
  totalTransactions: number;
  
  /**
   * Number of pending transactions
   */
  pendingTransactions: number;
  
  /**
   * Number of processing transactions
   */
  processingTransactions: number;
  
  /**
   * Number of completed transactions
   */
  completedTransactions: number;
  
  /**
   * Number of failed transactions
   */
  failedTransactions: number;
  
  /**
   * Number of reversed transactions
   */
  reversedTransactions: number;
  
  /**
   * Total of credit transactions
   */
  creditTotal: number;
  
  /**
   * Total of debit transactions
   */
  debitTotal: number;
  
  /**
   * Net balance (credits - debits)
   */
  netBalance: number;
  
  /**
   * Summary by module
   */
  moduleSummary: Record<string, {
    totalTransactions: number;
    creditAmount: number;
    debitAmount: number;
    netAmount: number;
  }>;
  
  /**
   * Summary by transaction type
   */
  typeSummary: Record<string, {
    totalTransactions: number;
    totalAmount: number;
  }>;
}

/**
 * Extended transaction with related entity details
 */
export interface TransactionWithDetails extends Transaction {
  /**
   * Information about the user who initiated the transaction
   */
  initiator?: {
    id: string;
    username: string;
    fullName?: string;
  };
  
  /**
   * Information about the user who approved the transaction
   */
  approver?: {
    id: string;
    username: string;
    fullName?: string;
  };
  
  /**
   * Related entity details
   */
  relatedEntity?: any;
  
  /**
   * Parent transaction (if this is a child transaction)
   */
  parentTransaction?: Transaction;
  
  /**
   * Child transactions (for parent transactions)
   */
  childTransactions?: Transaction[];
  
  /**
   * Related request
   */
  request?: any;
  
  /**
   * Related loan
   */
  loan?: any;
  
  /**
   * Related savings
   */
  savings?: any;
  
  /**
   * Related shares
   */
  shares?: any;
}

/**
 * Transaction report filters
 */
export interface TransactionReportFilters extends TransactionFilterDto {
  /**
   * How to group the transactions
   */
  groupBy?: 'day' | 'week' | 'month' | 'module' | 'type';
  
  /**
   * Whether to include detailed information
   */
  includeDetails?: boolean;
  
  /**
   * Format to export the report in
   */
  exportFormat?: 'csv' | 'pdf' | 'excel';
}

/**
 * Transaction batch creation
 */
export interface BatchTransactionDto {
  /**
   * Array of transactions to create
   */
  transactions: CreateTransactionDto[];
  
  /**
   * Whether to process as a single unit (all succeed or all fail)
   */
  processAsUnit?: boolean;
}

/**
 * Transaction processor interface
 * Implemented by specific processors for different transaction types
 */
export interface TransactionProcessor {
  /**
   * Validate a transaction before processing
   */
  validateTransaction(data: CreateTransactionDto): Promise<boolean>;
  
  /**
   * Process a transaction
   */
  processTransaction(transaction: Transaction, tx?: any): Promise<void>;
  
  /**
   * Handle changes in transaction status
   */
  onTransactionStatusChange(transaction: Transaction, previousStatus: TransactionStatus): Promise<void>;
  
  /**
   * Process a reversal transaction
   */
  processReversal?(transaction: Transaction, tx?: any): Promise<void>;
}