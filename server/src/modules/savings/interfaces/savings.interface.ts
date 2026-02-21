import { Decimal } from '@prisma/client/runtime/library';
import { AccountStatus, TransactionType, TransactionStatus, TransactionModule, NotificationType } from '@prisma/client';

export interface IMonthlySavingsInput {
  erpId: string;
  monthlyTarget: number;
  month: number;
  year: number;
  description?: string;
}

export interface ISavingsQueryParams {
  page?: number;
  limit?: number;
  year?: number;
  month?: number;
  erpId?: string;
  department?: string;
  status?: AccountStatus;
  sort?: 'asc' | 'desc';
}

export interface ISavingsStatementParams {
  erpId: string;
  year?: number;
  month?: number;
}

export interface ITransactionQueryParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  type?: TransactionType;
  biodataId?: string;
}

export interface IWithdrawalRequest {
  amount: number;
  reason: string;
}

export interface ISavingsSummaryResponse {
    id: string;
    balance: Decimal;
    monthlyTarget: Decimal;
    totalGrossAmount: Decimal;
    totalSavingsAmount: Decimal;
    lastDeposit?: Date;
    lastTransaction?: {
        amount: Decimal;
        type: TransactionType;
        date: Date;
    };
    shares?: {
        monthlyAmount: Decimal;
        totalSharesAmount: Decimal;
    };
    accountStatus: AccountStatus;
}

export interface IProcessedSavings {
  id: string;
  erpId: string;
  monthlyAmount: Decimal;
  totalAmount: Decimal;
  month: number;
  year: number;
  description: string | null;
  status: AccountStatus;
  biodata: {
    name: string;
    department: string;
  };
  shares: Array<{
    id: string;
    monthlyAmount: Decimal;
    totalAmount: Decimal;
  }>;
  transactions: Array<{
    id: string;
    amount: Decimal;
    transactionType: TransactionType;
    status: TransactionStatus;
    description: string | null;
    createdAt: Date;
  }>;
}

export interface ISavingsResponse {
  id: string;
  erpId: string;
  balance: Decimal;
  monthlyTarget: Decimal;
  totalAmount: Decimal;
  month: number;
  year: number;
  isProcessed: boolean;
  description: string | null;
  status: AccountStatus;
  member: {
    id: string;
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
    balanceAfter: Decimal;
  }>;
}

export interface ISavingsStatement {
  memberInfo: {
    id: string;
    erpId: string;
    staffNo: string;
    memberName: string;
    department: string;
    phoneNumber: string;
    accountInfo: {
      accountNo: string;
      accountName: string;
      bankName: string;
      bvn: string;
    }[];
    savings: {
      id: string;
      balance: Decimal;
      monthlyTarget: Decimal;
      lastDeposit: Date | null;
      status: AccountStatus;
    };
    totalSavings?: number;
    totalShares?: number;
    transactions?: Array<{
      date: Date;
      transactionType: TransactionType;
      baseType: TransactionType;
      amount: number;
      description: string | null;
    }>;
  };
}

export interface IPaginatedSavingsResponse {
  data: Array<{
    id: string;
    erpId: string;
    balance: Decimal;
    monthlyTarget: Decimal;
    lastDeposit: Date | null;
    month: number;
    year: number;
    status: AccountStatus;
    description: string | null;
    isProcessed: boolean;
    member: {
      name: string;
      department: string;
    };
    shares: Array<{
      id: string;
      monthlyAmount: Decimal;
      totalAmount: Decimal;
    }>;
    transactions?: Array<{
      id: string;
      amount: Decimal;
      transactionType: TransactionType;
      status: TransactionStatus;
      description: string | null;
      createdAt: Date;
    }>;
  }>;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface IPaginatedTransactionResponse {
  data: Array<{
    id: string;
    amount: Decimal;
    balanceAfter: Decimal;
    transactionType: TransactionType;
    module: TransactionModule;
    status: TransactionStatus;
    description: string | null;
    createdAt: Date;
  }>;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ISavingsStats {
    totalSavings: Decimal;
    totalShares: Decimal;
    grossContributions: Decimal;
    monthlyAverageSavings: Decimal;
    contributionMonths: number;
    depositCount: number;
    withdrawalCount: number;
    monthlyBreakdown: Array<{
        month: number;
        amount: Decimal;
        savings: Decimal;
        shares: Decimal;
        hasContribution: boolean;
    }>;
    latestContribution: {
        amount: Decimal;
        savingsAmount: Decimal;
        sharesAmount: Decimal;
        month: number;
        year: number;
        date: Date | null;
    } | null;
}

export interface IAdminOverview {
    totalSavings: Decimal;
    totalShares: Decimal;
    totalMembers: number;
    averageSavingsPerMember: Decimal;
}

export interface ITransactionHistoryParams {
  savingsId: string;
  biodataId: string;// user's biodata ID
  page?: number;
  limit?: number;
  startDate?: Date;
  endDate?: Date;
  transactionType?: TransactionType;
  type?: TransactionType;
}

export interface ISavingsUploadRow {
    erpId: string;
    grossAmount: Decimal;
    savingsAmount: Decimal;
    shareAmount: Decimal;
    month: number;
    year: number;
    description?: string;
}

export interface ISavingsUploadResult {
  totalSheets: number;
  totalSuccessful: number;
  totalFailed: number;
  sheetResults: ISavingsUploadSheetResult[];
}

export interface ISavingsUploadSheetResult {
  sheetName: string;
  successful: number;
  failed: number;
  errors: string[];
}

export interface ISavingsConfiguration {
  shareAmount: Decimal;
  minimumSavingsAmount: Decimal;
  lastUpdated: Date;
  updatedById: string;
  updatedByName?: string;
}

export interface IConfigurationUpdateInput {
  shareAmount?: number;
  minimumSavingsAmount?: number;
}
