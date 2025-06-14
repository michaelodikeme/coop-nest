// Define interface types
export enum PersonalSavingsStatus {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  SUSPENDED = 'SUSPENDED',
  PENDING = 'PENDING',
}

export enum RequestStatus {
  PENDING = 'PENDING',
  IN_REVIEW = 'IN_REVIEW',
  REVIEWED = 'REVIEWED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED"
}

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  TRANSFER = 'TRANSFER',
  PERSONAL_SAVINGS_DEPOSIT = 'PERSONAL_SAVINGS_DEPOSIT',
  PERSONAL_SAVINGS_WITHDRAWAL = 'PERSONAL_SAVINGS_WITHDRAWAL'
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface ApprovalStep {
  level: number;
  status: ApprovalStatus;
  approverRole: string;
  approvedAt: string | null;
}

export interface PersonalSavingsResponse {
  [x: string]: string | any;
  id?: string;
  requestId?: string; // For pending creation requests
  type?: 'PENDING_CREATION'; // To identify pending requests
  erpId: string;
  planTypeId: string;
  planType?: {
    name: string;
    description: string | null;
  };
  planName?: string;
  targetAmount?: number;
  currentBalance?: number;
  status: PersonalSavingsStatus | RequestStatus;
  createdAt: string;
  updatedAt: string;
  currentApprovalLevel?: number;
  member: {
    id: string;
    name: string;
    department: string;
  };
  transactions?: Transaction[];
  
  // New field for pending withdrawals
  pendingWithdrawal?: {
    requestId: string;
    status: RequestStatus;
    requestedAt: string;
    amount: number;
    currentApprovalLevel: number;
    approvalSteps: ApprovalStep[];
  };
  
  // New field for approval steps
  approvalSteps?: ApprovalStep[];
}

export interface PersonalSavingsPlanType {
  id: string;
  name: string;
  description: string | null;
}

export interface Transaction {
  transactionType: TransactionType;
  id: string;
  type: string;
  amount: number;
  balance: number;
  description?: string;
  status: string;
  createdAt: string;
}

export interface BalanceHistory {
  history: boolean;
  daily: {
    date: string;
    balance: number;
  }[];
  monthly: {
    month: string;
    balance: number;
    date: string;  // keep date for sorting
  }[];
}

export interface MemberSummary {
  totalSaved: number;
  totalWithdrawals: number;
  currentBalance: number;
  plansCount: number;
  activePlans: PersonalSavingsResponse[];
  pendingRequests: PersonalSavingsResponse[]; // New field for pending creation requests
}

export interface AdminDashboard {
  totalPlans: number;
  activePlansCount: number;
  pendingCreationRequests: number;
  pendingWithdrawalRequests: number;
  // recentTransactions: number;
  totalSavingsAmount: number;
  totalWithdrawalAmount: number
  closedCount: number; // New field
  recentTransactions: Transaction[];
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    pendingCreationCount: number; // New field
    activeCount: number; // New field
    closedCount: number; // New field
  };
}
