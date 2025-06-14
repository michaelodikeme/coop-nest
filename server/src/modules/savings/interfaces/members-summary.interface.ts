import { Decimal } from '@prisma/client/runtime/library';
import { AccountStatus } from '@prisma/client';

export interface MemberSavingsSummaryItem {
  id: string;                  // Member ID
  erpId: string;               // ERP ID
  memberName: string;          // Member's name
  department: string;          // Department
  totalSavingsAmount: Decimal; // Total savings amount
  totalSharesAmount: Decimal;  // Total shares amount
  totalGrossAmount: Decimal;   // Total gross amount (savings + shares)
  lastDeposit: Date | null;    // Last deposit date
  status: AccountStatus;       // Account status
}

export interface MemberSavingsSummaryParams {
  page?: number;
  limit?: number;
  search?: string;
  department?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: AccountStatus;
}

export interface MemberSavingsSummaryResponse {
  data: MemberSavingsSummaryItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}