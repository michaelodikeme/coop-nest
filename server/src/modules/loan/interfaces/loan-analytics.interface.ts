import { Decimal } from '@prisma/client/runtime/library';

export interface LoanStatistics {
    totalLoans: number;
    activeLoans: number;
    completedLoans: number;
    defaultedLoans: number;
    totalDisbursed: Decimal;
    totalCollected: Decimal;
    defaultRate: number;
    collectionRate: number;
}

export interface MonthlyAnalytics {
    month: number;
    year: number;
    totalActiveLoans: number;
    totalActiveLoanAmount: Decimal;
    totalDefaultedLoans: number;
    defaultRate: number;
    averageLoanAmount: Decimal;
    totalDisbursedAmount: Decimal;
    totalRepaidAmount: Decimal;
    collectionRate: number;
}

export interface LoanPortfolioHealth {
    atRiskLoans: AtRiskLoan[];
    restructuredLoans: RestructuredLoan[];
}

export interface AtRiskLoan {
    id: string;
    member: {
        name: string;
        erpId: string;
        department: string;
    };
    loanAmount: Decimal;
    remainingBalance: Decimal;
    latePayments: number;
    daysLate: number;
}

export interface RestructuredLoan {
    id: string;
    member: {
        name: string;
        erpId: string;
        department: string;
    };
    originalAmount: Decimal;
    currentBalance: Decimal;
    restructureDate: Date;
    reason: string;
}
