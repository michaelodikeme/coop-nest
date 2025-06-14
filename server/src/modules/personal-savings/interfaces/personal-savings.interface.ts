import { Decimal } from '@prisma/client/runtime/library';
import { 
  PersonalSavingsStatus, 
  TransactionType, 
  TransactionStatus, 
  TransactionModule, 
  NotificationType,
  RequestStatus 
} from '@prisma/client';

export interface IPersonalSavingsInput {
  erpId: string;
  planTypeId: string; // Required reference to PersonalSavingsPlan
  planName?: string;
  targetAmount?: number;
}

export interface IPersonalSavingsQueryParams {
  page?: number;
  limit?: number;
  erpId?: string;
  status?: PersonalSavingsStatus;
  sort?: 'asc' | 'desc';
  includePending?: boolean;
}

export interface IPersonalSavingsStatementParams {
  erpId: string;
  planId?: string;
  startDate?: string;
  endDate?: string;
}

export interface IPersonalSavingsTransactionQueryParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  type?: TransactionType;
  planId?: string;
}

export interface IWithdrawalRequest {
  amount: number;
  reason: string;
}

export interface IDepositRequest {
  amount: number;
  description?: string;
}

export interface IPersonalSavingsSummaryResponse {
  id: string;
  planName?: string;
  currentBalance: Decimal;
  targetAmount?: Decimal;
  status: PersonalSavingsStatus;
  createdAt: Date;
  updatedAt: Date;
  lastTransaction?: {
    amount: Decimal;
    type: TransactionType;
    date: Date;
  };
}

export interface IProcessedPersonalSavings {
  id: string;
  erpId: string;
  planName?: string;
  targetAmount?: Decimal;
  currentBalance: Decimal;
  status: PersonalSavingsStatus;
  biodata: {
    name: string;
    department: string;
  };
  transactions: Array<{
    id: string;
    amount: Decimal;
    transactionType: TransactionType;
    status: TransactionStatus;
    description: string | null;
    createdAt: Date;
  }>;
  pendingWithdrawals?: Array<{
    id: string;
    amount: Decimal;
    status: RequestStatus;
    createdAt: Date;
  }>;
}

export interface IPersonalSavingsResponse {
  id: string;
  erpId: string;
  planTypeId: string;
  planType?: {
    id: string;
    name: string;
    description?: string;
  };
  planName?: string;
  targetAmount?: Decimal;
  currentBalance: Decimal;
  status: PersonalSavingsStatus;
  createdAt: Date;
  updatedAt: Date;
  member: {
    id: string;
    name: string;
    department: string;
  };
  transactions?: Array<{
    id: string;
    amount: Decimal;
    transactionType: TransactionType;
    status: TransactionStatus;
    description: string | null;
    createdAt: Date;
  }>;
}

// Balance history for charts/reports
export interface IBalanceHistoryItem {
  date: string;
  balance: number;
}

export interface IPersonalSavingsBalanceHistory {
  history: IBalanceHistoryItem[];
  planName?: string;
  currentBalance: number;
  memberName: string;
  memberErpId: string;
}