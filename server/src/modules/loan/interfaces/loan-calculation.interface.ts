import { Decimal } from '@prisma/client/runtime/library';

export interface LoanCalculationResult {
    loanAmount: Decimal;
    interestRate: Decimal;
    totalInterest: Decimal;
    totalRepayment: Decimal;
    monthlyPayment: Decimal;
    tenure: number;
    schedule: PaymentScheduleEntry[];
    maxEligibleAmount: Decimal;
    savingsBalance?: Decimal;
    isSoftLoan: boolean;
    loanType: {
        id: string;
        name: string;
        description: string;
        interestRate: Decimal;
        minDuration: number;
        maxDuration: number;
        maxLoanAmount: Decimal;
        savingsMultiplier: Decimal;
    };
}

export interface PaymentScheduleEntry {
    paymentNumber: number;
    paymentDate: Date;
    principalAmount: Decimal;
    interestAmount: Decimal;
    totalPayment: Decimal;
    remainingBalance: Decimal;
}

export interface EligibilityCheckResult {
    isEligible: boolean;
    maxAmount: Decimal;
    reason?: string;
    activeLoans: {
        regularLoan: boolean;
        oneYearPlusLoan: boolean;
        softLoan: boolean;
    };
}

export interface LoanTypeConflictCheck {
    hasConflict: boolean;
    errorMessage?: string;
    loanTypeInfo: {
        isRegularLoan: boolean;
        isOneYearPlusLoan: boolean;
        isSoftLoan: boolean;
        hasActiveRegularLoan: boolean;
        hasActiveOneYearPlusLoan: boolean;
        hasActiveSoftLoan: boolean;
    };
}

export interface LoanDurationLimits {
    SOFT_LOAN: { min: 1, max: 6 },
    REGULAR_LOAN: { min: 1, max: 12 },
    ONE_YEAR_PLUS: { min: 12, max: 36 }
}

export enum LoanType {
    SOFT_LOAN = 'SOFT_LOAN',
    REGULAR_LOAN = 'REGULAR_LOAN',
    ONE_YEAR_PLUS = 'ONE_YEAR_PLUS'
}
