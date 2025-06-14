import { Decimal } from '@prisma/client/runtime/library';

export interface LoanRepaymentData {
    loanId: string;
    erpId: string;
    uploadedAmount: Decimal;
    repaymentMonth: number;
    repaymentYear: number;
    uploadedBy: string;
    scheduleId?: string;      // Add this optional field
    repaymentDate?: Date;     // Add this optional field
    uploadBatchId?: string;   // Add this optional field
    description?: string;     // Add this optional field
}

export interface RepaymentResult {
    success: boolean;
    message?: string;
    error?: string;
    data?: {
        repaymentId: string;
        amountPaid: string;
        remainingBalance: string;
        isFullyPaid: boolean;
        totalRepayableAmount: string;
        totalInterest: string;
        paymentProgress: number;
    };
}

export interface BulkOperationResult {
    successful: number;
    failed: number;
    errors: BulkRepaymentError[];
    processedAmount: Decimal;
    successfulRepayments: {
        erpId: string;
        amount: string | number;
        date: Date;
    }[];
    uploadId: string;
    totalProcessed: number;
    errorCount: number;
}

export interface BulkRepaymentError {
    row: number;
    erpId?: string;
    error: string;
}

export interface RepaymentTemplate {
    ERP_ID: string;
    NAME: string;
    DEPARTMENT: string;
    LOAN_TYPE: string;
    MONTH: number;
    YEAR: number;
    AMOUNT: string;
    REMAINING_BALANCE: string;
    DESCRIPTION?: string;
}

// Add expanded RepaymentValidationResult interface
export interface RepaymentValidationResult {
    isValid: boolean;
    errors: string[];
}

// Add missing interface for monthly repayment summary
export interface MonthlyRepaymentSummary {
    month: number;
    year: number;
    totalDue: number;
    totalAmount: string;
    byLoanType: LoanTypeSummary[];
    schedules: any[];
}

export interface LoanTypeSummary {
    loanType: string;
    count: number;
    totalExpected: string;
}

// Fix missing interface for BulkRepaymentUpload
export interface BulkRepaymentResult {
    batchId: string;
    status: string;
    successful: Array<{
        rowNumber: number;
        erpId: string;
        loanId: string;
        amount: string;
    }>;
    failed: Array<{
        rowNumber: number;
        erpId: string | undefined;
        loanId: string | undefined;
        error: string;
    }>;
    totalProcessed: number;
    totalAmount: string;
}

// Add the extracted repayment data validation interface
export interface ExtractedRepaymentData {
    erpId: string;
    loanId: string;
    scheduleId?: string;
    month: number;
    year: number;
    amount: string | number;
    paymentDate: Date;
    notes?: string;
}
