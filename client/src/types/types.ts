// API Response wrapper - matches actual backend response structure
export interface ApiResponse<T = any> {
  success: boolean;
  status: string;
  message: string;
  data: T;
  code?: number;
}

export interface ApiErrorResponse {
  message: string;
  code: string;
  type: string;
  errors?: Record<string, string>;
}

// Paginated data structure (inner data from API)
export interface PaginatedData<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// For backward compatibility - this is what services should return after unwrapping
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Import auth-related types from auth.ts

// Loan related interfaces
// export interface Loan {
//   id: string;
//   biodataId: string;
//   erpId: string;
//   loanAmount: number;
//   totalInterest: number;
//   totalRepayableAmount: number;
//   paidAmount: number;
//   remainingBalance: number;
//   repayments: LoanRepayment[];
//   loanTenure: number;
//   createdAt: string;
//   updatedAt: string;
//   status: LoanStatus;
//   approvedAt?: string;
//   disbursedAt?: string;
//   completedAt?: string;
//   lastPaymentDate?: string;
//   nextPaymentDue?: string;
//   latePaymentCount: number;
//   totalLatePaymentDays: number;
//   loanPurpose: string;
//   approvalNotes?: string;
//   rejectionReason?: string;
//   loanTypeId: string;
//   loanType: LoanType;
//   paymentSchedules: LoanPaymentSchedule[];
// }


// export interface LoanType {
//   id: string;
//   typeName: string;
//   description: string;
//   interestRate: number;
//   minDuration: number;
//   maxDuration: number;
//   maxLoanAmount: number;
// }

// export interface LoanSummary {
//   id: string;
//   activeLoans: number;
//   totalLoans: number;
//   totalBorrowed: number;
//   totalOutstanding: number;
//   totalPaid: number;
//   totalLatePayments: number;
//   totalLatePaymentDays: number;
// }

