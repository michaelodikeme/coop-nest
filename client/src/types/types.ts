// Export the general paginated response type
export interface PaginatedResponse<T> {
  meta: any;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiErrorResponse {
  message: string;
  code: string;
  type: string;
  errors?: Record<string, string>;
}

export interface ApiResponse<T = any> {
  status: string;
  data?: T;
  message?: string;
  error?: ApiErrorResponse;
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

