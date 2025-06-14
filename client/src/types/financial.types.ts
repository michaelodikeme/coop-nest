// Types for financial data aligned with backend interfaces
import { Transaction } from './transaction.types';

export interface AccountInfo {
  id: string;
  biodataId: string;
  bankId: string;
  bankAccountNumber: string;
  bvn: string;
  accountHolderName: string;
  isVerified: boolean;
  bank: Bank;
}

export interface Bank {
  id: string;
  name: string;
  code: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SavingsRecord {
  data: any[];
  amount(amount: any): unknown;
  sharesAmount(sharesAmount: any): unknown;
  isActive: boolean;
  accountId: boolean;
  id: string;
  erpId: string;
  balance: number;
  monthlyTarget: number;
  totalGrossAmount: number;
  totalSavingsAmount: number;
  month: number;
  year: number;
  isProcessed: boolean;
  description?: string;
  createdAt: string;
  status: string;
  lastDeposit?: string;
  shares?: [
    {
      id: string;
      monthlyAmount: number;
      totalAmount: number;
      totalSharesAmount: number;
    }
  ];
  member?: {
    id: string;
    name: string;
    department: string;
  };
  // Update the transaction array type to use the Transaction interface
  transactions?: Transaction[];
}

export interface SavingsSummary {
  data: any;
  id: string;
  balance: number;
  monthlyTarget: number;
  totalGrossAmount: number;
  totalSavingsAmount: number;
  lastDeposit?: string;
  totalSavings: number;
  totalShares: number;
  contributionCount?: number;
  monthlyContribution: number;
  lastTransaction?: {
    amount: number;
    type: string;
    date: string;
  };
  shares?: {
    monthlyAmount: number;
    totalSharesAmount: number;
  };
  accountStatus: string;
  activeAccountsCount?: number;
}

export interface SavingsStats {
  totalSavings: number;
  totalShares: number;
  grossContributions: number;
  monthlyAverageSavings: number;
  contributionMonths: number;
  depositCount: number;
  withdrawalCount: number;
  monthlyBreakdown: Array<{
    month: number;
    amount: number;
    savings: number;
    shares: number;
    hasContribution: boolean;
  }>;
  latestContribution?: {
    amount: number;
    savingsAmount: number;
    sharesAmount: number;
    month: number;
    year: number;
    date: string;
  };
}

export interface PaginatedResponse<T> {
  slice(arg0: number, limit: number): any;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PARTIAL = 'PARTIAL',
  LATE = 'LATE',
  OVERDUE = 'OVERDUE',
  WAIVED = 'WAIVED'
}

export enum TransactionTypeEnum {
  SAVINGS_DEPOSIT = 'SAVINGS_DEPOSIT',
  SAVINGS_WITHDRAWAL = 'SAVINGS_WITHDRAWAL',
  SHARES_DEPOSIT = 'SHARES_DEPOSIT',
  SHARES_WITHDRAWAL = 'SHARES_WITHDRAWAL',
  LOAN_DISBURSEMENT = 'LOAN_DISBURSEMENT',
  LOAN_PAYMENT = 'LOAN_PAYMENT',
  SHARES_PURCHASE = "SHARES_PURCHASE",
  PERSONAL_SAVINGS_DEPOSIT = "PERSONAL_SAVINGS_DEPOSIT",
  PERSONAL_SAVINGS_WITHDRAWAL = "PERSONAL_SAVINGS_WITHDRAWAL",
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum TransactionModule {
  SAVINGS = 'SAVINGS',
  LOAN = 'LOAN',
  SHARES = 'SHARES',
  ADMIN = 'ADMIN',
  SYSTEM = 'SYSTEM'
}

export enum WithdrawalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum SavingsStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  CLOSED = 'CLOSED'
}

// Savings related interfaces
export interface Savings {
  id: string;
  biodataId: string;
  erpId: string;
  grossAmount: number;
  monthlyAmount: number;
  totalAmount: number;
  grossTotal: number;
  month: number;
  year: number;
  shares?: Share[];
  transactions?: SavingsTransaction[];
  isProcessed: boolean;
  status: SavingsStatus;
  description?: string;
  createdAt: string;
}

export interface SavingsTransaction {
  id: string;
  date: string;
  type: 'CREDIT' | 'DEBIT' | TransactionTypeEnum | string; // Make it more flexible
  amount: number;
  description: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  reference: string;
}

// export interface SavingsSummary {
//   totalSavings: number;
//   totalShares: number;
//   monthlyContribution: number;
//   lastTransaction?: SavingsTransaction;
// }

export interface SavingsStats {
  monthlySavings: Array<{ month: number; amount: number }>;
  totalSavings: number;
  averageSavings: number;
}

export interface WithdrawalRequest {
  id: string;
  biodataId: string;
  amount: number;
  status: WithdrawalStatus;
  requestedAt: string;
  reason: string;
  processedAt?: string;
  transactionId?: string;
  details: {
    amount: number;
    reason: string;
  };
  adminNotes?: string;
}

// Shares related interfaces
export interface Share {
  id: string;
  biodataId: string;
  erpId: string;
  monthlyAmount: number;
  totalAmount: number;
  month: number;
  year: number;
  savingsId: string;
  createdAt: string;
}

export interface ShareTransaction {
  id: string;
  date: string;
  type: 'BUY' | 'SELL' | 'TRANSFER';
  numberOfShares: number;
  value: number;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
}

export interface SharesSummary {
  totalValue: number;
  numberOfShares: number;
  valuePerShare: number;
  monthlyValues: Array<{ month: string; value: number }>;
}

export interface ShareStats {
  monthlyShares: Array<{ month: number; amount: number }>;
  totalShares: number;
  averageShares: number;
}

// Add this interface to your financial.types.ts file

export interface MemberSavingsSummary {
  id: string;
  erpId: string;
  memberName: string;
  department: string;
  totalSavingsAmount: number;
  totalSharesAmount: number;
  totalGrossAmount: number;
  lastDeposit: string | null;
  status: string;
}