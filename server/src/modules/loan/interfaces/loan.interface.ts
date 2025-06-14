import { Decimal } from '@prisma/client/runtime/library';
import { LoanStatus, PaymentStatus, Loan } from '@prisma/client';

export interface LoanApplication {
    biodataId: string;
    erpId: string;
    loanTypeId: string;
    loanAmount: number | Decimal;
    loanTenure: number;
    loanPurpose: string;
    loanTypeName: string;
    loanTypeDescription: string;
    loanTypeInterestRate: number;
}

export interface LoanStatusUpdate {
    status: LoanStatus;
    approvalNotes?: string;
    approvedBy?: string;
    effectiveDate?: Date;
}

export interface LoanSummary {
    id: string;
    status: LoanStatus;
    loanAmount: Decimal;
    remainingBalance: Decimal;
    nextPaymentDate?: Date;
    lastPaymentDate?: Date;
    isLate: boolean;
    daysLate?: number;
}

export interface PaymentScheduleItem {
    paymentDate: Date;
    principalAmount: Decimal;
    interestAmount: Decimal;
    totalAmount: Decimal;
    remainingBalance: Decimal;
    status: PaymentStatus;
}

export interface LoanType {
    id: string;
    name: string;
    interestRate: Decimal;
    minDuration: number;
    maxDuration: number;
    maxLoanAmount: Decimal;
    savingsMultiplier: Decimal;
    isActive: boolean;
    requiresApproval: boolean;
}

export interface LoanApplicationResponse {
    loan: Loan;
    savingsSummary: {
        totalSavingsAmount: Decimal;
        totalGrossAmount: Decimal;
        balance: Decimal;
        monthlyTarget: Decimal;
    };
    eligibility: {
        isEligible: boolean;
        maxAmount: string;
        loanTypeDetails: {
            name: string;
            interestRate: number;
            savingsMultiplier: number;
            duration: {
                min: number;
                max: number;
            };
        };
    };
}
