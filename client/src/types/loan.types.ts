import { PaymentStatus } from './financial.types';
import { RequestStatus } from '@/types/request.types';

export interface EnhancedLoanSummary {
  totalOutstanding: string;
  totalDisbursed: string;
  totalRepaid: string;
  activeLoansCount: number;
  completedLoansCount: number;
  defaultedLoansCount: number;
  averageLoanAmount: string;
  disbursementMonths: number;
  repaymentMonths: number;
  defaultRate: number;
  monthlyBreakdown?: Array<{
    month: number;
    disbursedAmount: string;
    repaidAmount: string;
    loansCount: number;
    hasActivity: boolean;
  }>;
  latestActivity?: {
    disbursedAmount: string;
    repaidAmount: string;
    loansCount: number;
    month: number;
    year: number;
    date: string;
  };
  trends?: any;
}

export interface LoanRecord {
  id: string;
  memberId: string;
  erpId: string;
  loanTypeId: string;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  remainingBalance: number;
  tenure: number;
  purpose: string;
  status: string;
  paidAmount: number;
  disbursedAt?: string;
  lastPaymentDate?: string;
  createdAt: string;
  updatedAt: string;
  loanType?: {
    id: string;
    name: string;
    interestRate: number;
    minDuration: number;
    maxDuration: number;
    maxLoanAmount: number;
    savingsMultiplier: number;
    isActive: boolean;
    requiresApproval: boolean;
    description?: string;
  };
  member?: {
    id: string;
    erpId: string;
    firstName: string;
    lastName: string;
    fullName: string;
    department?: string;
    emailAddress?: string;
    phoneNumber?: string;
  };
  paymentSchedules?: Array<{
    id: string;
    dueDate: string;
    expectedAmount: number;
    principalAmount: number;
    interestAmount: number;
    remainingBalance: number;
    paidAmount: number;
    status: string;
  }>;
  nextPaymentDate?: string;
  isLate?: boolean;
  daysLate?: number;
}

export interface LoanType {
  id: string;
  name: string;
  interestRate: number;
  minDuration: number;
  maxDuration: number;
  maxLoanAmount: number;
  savingsMultiplier: number;
  isActive: boolean;
  requiresApproval: boolean;
  description?: string;
}


export interface Loan {
  member: any;
  data: any
  id: string;
  memberId: string;
  erpId: string;
  loanTypeId: string;
  principalAmount: string | number;
  interestAmount: string | number;
  totalAmount: string | number;
  paidAmount: string | number;
  remainingBalance: string | number;
  tenure: number;
  status: string;
  disbursedAt: string | null;
  completedAt: string | null;
  lastPaymentDate: string | null;
  nextPaymentDue: string | null;
  purpose: string;
  createdAt: string;
  updatedAt: string;
  savingsSnapshot: {
    monthlyTarget: number;
    totalGrossAmount: number;
    totalSavingsAmount: number;
  };
  loanType: {
    id: string;
    name: string;
    description: string;
    interestRate: string;
    minDuration: number;
    maxDuration: number;
    maxLoanAmount: string;
    savingsMultiplier: string;
    isActive: boolean;
    requiresApproval: boolean;
  };
  paymentSchedules: Array<{
    id: string;
    loanId: string;
    dueDate: string;
    expectedAmount: string;
    principalAmount: string;
    interestAmount: string;
    paidAmount: string;
    remainingBalance: string;
    status: string;
    actualPaymentDate: string | null;
  }>;
  statusHistory: Array<{
    fromStatus: string;
    toStatus: string;
    changedBy: string;
    reason: string | null;
    changeDate: string;
  }>;
}

export interface LoanSummary {
  totalOutstanding: number;
  totalDisbursed: number;
  newLoansCount: number;
  pendingLoans: number;
  repaymentsCount: number;
  overdueLoans: number;
}

export interface LoanPaymentSchedule {
  id: string;
  loanId: string;
  erpId: string;
  scheduledDate: string;
  actualPaymentDate?: string;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  remainingBalance: number;
  isPaid: boolean;
  isLate: boolean;
  daysLate: number;
  status: PaymentStatus;
  repaymentId?: string;
}

export interface LoanRepayment {
  id: string;
  loanId: string;
  erpId: string;
  amount: number;
  repaymentDate: string;
  uploadedDate: string;
  repaymentMonth: number;
  repaymentYear: number;
  uploadedBy: string;
  description?: string;
  isReconciled: boolean;
}

export enum LoanStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  DISBURSED = 'DISBURSED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  DEFAULTED = 'DEFAULTED',
  RESTRUCTURED = 'RESTRUCTURED',
  WRITTEN_OFF = 'WRITTEN_OFF',
  IN_REVIEW = "IN_REVIEW",
  REVIEWED = "REVIEWED"
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SKIPPED = 'SKIPPED'
}

export interface LoanApprovalStep {
  level: number;
  status: ApprovalStatus;
  approverRole: string;
  approverId?: string;
  approvedAt?: string | null;
  notes?: string;
}

export interface LoanQueryParams {
  page?: number;
  limit?: number;
  status?: string | string[];
  loanTypeId?: string;
  erpId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  biodataId?: string;
  minAmount?: number;
  maxAmount?: number;
}

// Define the expected response structure
export interface LoanApiResponse {
  success: boolean;
  status: string;
  message: string;
  data: LoanDetails;
  code: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    totalCount: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface LoanDetails {
  id: string;
  memberId: string;
  erpId: string;
  loanTypeId: string;
  principalAmount: string | number;
  interestAmount: string | number;
  totalAmount: string | number;
  paidAmount: string | number;
  remainingBalance: string | number;
  tenure: number;
  status: LoanStatus;
  disbursedAt: string | null;
  completedAt: string | null;
  lastPaymentDate: string | null;
  nextPaymentDue: string | null;
  purpose: string;
  createdAt: string;
  updatedAt: string;

  // Backend sends savingsSnapshot as a nested object
  savingsSnapshot: {
    totalSavingsAmount: number | string;
    totalGrossAmount: number | string;
    monthlyTarget: number | string;
  };

  loanType: {
    id: string;
    name: string;
    description: string;
    interestRate: string;
    minDuration: number;
    maxDuration: number;
    maxLoanAmount: string;
    savingsMultiplier: string;
    isActive: boolean;
    requiresApproval: boolean;
  };

  member?: {
    id: string;
    erpId: string;
    firstName: string;
    lastName: string;
    fullName: string;
    department?: string;
    emailAddress?: string;
    phoneNumber?: string;
  };

  paymentSchedules: Array<{
    id: string;
    loanId: string;
    dueDate: string;
    expectedAmount: string | number;
    principalAmount: string | number;
    interestAmount: string | number;
    paidAmount: string | number;
    remainingBalance: string | number;
    status: PaymentStatus;
    actualPaymentDate: string | null;
  }>;

  repayments?: Array<{
    id: string;
    loanId: string;
    amount: string | number;
    repaymentDate: string;
    repaymentMonth: number;
    repaymentYear: number;
    uploadedBy: string;
    uploadedDate: string;
    isReconciled: boolean;
    scheduleId?: string | null;
  }>;

  statusHistory: Array<{
    fromStatus: LoanStatus;
    toStatus: LoanStatus;
    changedBy: string;
    reason: string | null;
    changeDate: string;
  }>;
}

export interface LoanEligibility {
  isEligible: boolean;
  maxAmount: number;
  reason?: string;
}

export interface LoanApplication {
  biodataId: string;
  erpId: string;
  loanTypeId: string;
  loanAmount: number;
  loanTenure: number;
  loanPurpose: string;
}


export interface LoanCalculation {
  loanTypeId?: string;
  loanAmount?: number;
  amount?: number;
  tenure: number;
  monthlyPayment?: number;
  totalInterest: number;
  totalRepayment: number;
  interestRate?: number;
  isSoftLoan?: boolean;
  schedule: Array<{
    paymentNumber: number;
    paymentDate: string;
    principalAmount: number;
    interestAmount: number;
    totalPayment: number;
    remainingBalance: number;
  }>;
}

export interface LoanRequest {
  id: string;
  type: string;
  status: RequestStatus;
  content?: {
    loanId?: string;
    amount?: string;
    purpose?: string;
    tenure?: number;
    totalRepayment?: string;
    monthlyPayment?: string;
  };
  metadata?: {
    loanType?: {
      id?: string;
      name?: string;
      interestRate?: string;
      description?: string;
    };
    member?: {
      fullName?: string;
      erpId?: string;
      department?: string;
    };
    savings?: {
      totalSavings?: string;
      monthlyTarget?: string;
    };
  };
  loanId?: string;
  loanDetails?: any;
  nextApprovalLevel?: number;
  approvalSteps?: Array<{
    level: number;
    approverRole: string;
    status: string;
  }>;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  assigneeId?: string;
  assigneeName?: string;
}

export interface RepaymentProcessingResult {
  processed: number;
  failed: number;
  errors?: string[];
}

export interface LoanRequestContent {
  loanId: string;
  erpId: string;
  amount: string;
  tenure: number;
  purpose: string;
  totalRepayment: string;
  monthlyPayment: string;
}

export interface LoanRequestMetadata {
  loanType: {
    id: string;
    name: string;
    description: string;
    interestRate: string;
  };
  member: {
    erpId: string;
    fullName: string;
    department: string;
  };
  savings: {
    totalSavings: string;
    monthlyTarget: string;
  };
}
