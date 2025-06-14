import { Decimal } from '@prisma/client/runtime/library';

export interface LoanEligibilityRequest {
    biodataId: string;
    loanTypeId: string;
    requestedAmount: number;
}

export interface LoanCalculationRequest {
    loanTypeId: string;
    amount: number;
    tenure: number;
}

export interface LoanApplication {
    biodataId: string;
    erpId: string;
    loanTypeId: string;
    loanAmount: number;
    loanTenure: number;
    loanPurpose: string;
}

export interface PaymentScheduleEntry {
    paymentNumber: number;
    paymentDate: Date;
    principalAmount: Decimal;
    interestAmount: Decimal;
    totalPayment: Decimal;
    remainingBalance: Decimal;
}

export interface LoanCalculation {
    monthlyPayment: Decimal;
    totalInterest: Decimal;
    totalRepayment: Decimal;
    schedule: PaymentScheduleEntry[];
}

export interface LoanStatusUpdate {
    status: string;
    notes?: string;
}

export interface LoanRepaymentUpload {
    loanId: string;
    erpId: string;
    uploadedAmount: Decimal;
    repaymentMonth: number;
    repaymentYear: number;
    description?: string;
}