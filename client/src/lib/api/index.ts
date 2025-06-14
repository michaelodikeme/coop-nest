// Export API service instance
export { apiService } from '@/lib/api/apiService';

// Export all service modules
export { authApi as authService } from './services/authService';
export { memberService } from './services/memberService';
export { userService } from './services/userService';
export { accountService } from './services/accountService';
export { savingsService } from './services/savingsService';
export { loanService } from './services/loanService';
export { transactionService } from './services/transactionService';

// Export service types
export type { ApiResponse, ApiErrorResponse, PaginatedResponse } from '@/types/types';
export type { User, UserFilterParams } from '@/types/user.types';
export type { Member, MemberFormData, MemberFilterParams } from '@/types/member.types';
export type { BankAccount, AccountFilterParams } from '@/types/account.types';
export type { Loan, LoanRecord } from '@/types/loan.types';
export type { Transaction, TransactionRecord } from '@/types/transaction.types';
