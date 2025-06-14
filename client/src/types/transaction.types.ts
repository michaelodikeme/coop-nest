export interface Transaction {
  id: string;
  amount: number;
  balanceAfter: number;
  baseType: TransactionType;
  transactionType: TransactionType;
  module: TransactionModule;
  status: TransactionStatus;
  description?: string;
  createdAt: string;
}

export interface TransactionSummaryProps {
  transaction?: Transaction;
  isLoading?: boolean;
}

export type TransactionType = 
  | 'SAVINGS_DEPOSIT' 
  | 'SAVINGS_WITHDRAWAL' 
  | 'LOAN_DISBURSEMENT' 
  | 'LOAN_REPAYMENT'
  | 'SHARES_PURCHASE' 
  | 'SHARES_REDEMPTION'
  | 'ADJUSTMENT'
  | 'FEE'
  | 'REVERSAL'
  | 'SAVINGS_INTEREST'
  | 'LOAN_INTEREST'
  | 'CREDIT'
  | 'DEBIT'
  | 'PERSONAL_SAVINGS_DEPOSIT'
  | 'PERSONAL_SAVINGS_WITHDRAWAL';

export type TransactionStatus = 
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REVERSED';

export type TransactionModule = 
  | 'SAVINGS'
  | 'LOAN'
  | 'SHARES'
  | 'ADMIN'
  | 'SYSTEM';

export type EntityType = 'SAVINGS' | 'LOAN' | 'SHARES' | 'BIODATA';

export interface TransactionRecord {
  id: string;
  transactionType: TransactionType;
  baseType: 'CREDIT' | 'DEBIT';
  module: TransactionModule;
  amount: string | number;
  balanceAfter: string | number;
  status: TransactionStatus;
  description?: string;
  metadata?: Record<string, any>;
  relatedEntityId?: string;
  relatedEntityType?: string;
  reference?: string;
  initiatedBy: string;
  approvedBy?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  
  // Denormalized fields for UI display
  memberName?: string;
  date?: string;
  type?: string;
}

export interface TransactionSummary {
  totalTransactions: number;
  pendingTransactions: number;
  processingTransactions: number;
  completedTransactions: number;
  failedTransactions: number;
  reversedTransactions: number;
  creditTotal: number;
  debitTotal: number;
  netBalance: number;
  moduleSummary: Record<string, {
    totalTransactions: number;
    creditAmount: number;
    debitAmount: number;
    netAmount: number;
  }>;
  typeSummary: Record<string, {
    totalTransactions: number;
    totalAmount: number;
  }>;
}

export interface TransactionQueryParams {
  module?: TransactionModule;
  transactionType?: TransactionType;
  status?: TransactionStatus;
  startDate?: string;
  endDate?: string;
  relatedEntityId?: string;
  relatedEntityType?: EntityType;
  initiatedBy?: string;
  approvedBy?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  pagination: any;
  data: T[];
  meta: {
    limit: number | undefined;
    page: number | undefined;
    total: number;
    totalCount: number;
    currentPage: number;
    totalPages: number;
    pageSize: number;
  };
}

export interface CreateTransactionPayload {
  transactionType: TransactionType;
  module: TransactionModule;
  amount: number;
  description?: string;
  relatedEntityId?: string;
  relatedEntityType?: EntityType;
  metadata?: Record<string, any>;
  autoComplete?: boolean;
}

export interface BatchTransactionPayload {
  transactions: CreateTransactionPayload[];
  processAsUnit: boolean;
}

export interface TransactionDetailView extends TransactionRecord {
  initiator?: {
    id: string;
    username: string;
    fullName?: string;
  };
  approver?: {
    id: string;
    username: string;
    fullName?: string;
  };
  relatedEntity?: any;
  parentTransaction?: TransactionRecord;
  childTransactions?: TransactionRecord[];
}

