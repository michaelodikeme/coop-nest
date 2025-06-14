import { z } from 'zod';
import { Decimal } from '@prisma/client/runtime/library';

export const repaymentSchema = z.object({
    loanId: z.string().uuid('Invalid loan ID'),
    erpId: z.string().regex(/^ERP\d+$/, 'Invalid ERP ID format'),
    uploadedAmount: z.number()
        .positive('Amount must be greater than 0')
        .multipleOf(0.01, 'Amount cannot have more than 2 decimal places')
        .transform((val) => new Decimal(val)),
    repaymentMonth: z.number()
        .int('Month must be a whole number')
        .min(1, 'Month must be between 1 and 12')
        .max(12, 'Month must be between 1 and 12'),
    repaymentYear: z.number()
        .int('Year must be a whole number')
        .min(2020, 'Year cannot be before 2020')
        .max(2099, 'Year cannot be after 2099'),
    description: z.string()
        .max(500, 'Description cannot exceed 500 characters')
        .optional(),
    uploadedBy: z.string()
});

export const repaymentTemplateSchema = z.object({
    ERP_ID: z.string().regex(/^ERP\d+$/, 'Invalid ERP ID format'),
    NAME: z.string().min(1, 'Name is required'),
    DEPARTMENT: z.string().min(1, 'Department is required'),
    LOAN_TYPE: z.string().min(1, 'Loan type is required'),
    MONTH: z.number()
        .int('Month must be a whole number')
        .min(1, 'Month must be between 1 and 12')
        .max(12, 'Month must be between 1 and 12'),
    YEAR: z.number()
        .int('Year must be a whole number')
        .min(2020, 'Year cannot be before 2020')
        .max(2099, 'Year cannot be after 2099'),
    AMOUNT: z.string()
        .regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid number with up to 2 decimal places'),
    REMAINING_BALANCE: z.string()
        .regex(/^\d+(\.\d{1,2})?$/, 'Remaining balance must be a valid number with up to 2 decimal places'),
    DESCRIPTION: z.string()
        .max(500, 'Description cannot exceed 500 characters')
        .optional()
});


// Bulk repayment upload schema
export const bulkRepaymentSchema = z.object({
  file: z.any(),
  uploadedBy: z.string().uuid('Invalid user ID'),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional()
});

export type RepaymentEntryInput = z.infer<typeof repaymentSchema>;
export type RepaymentTemplateInput = z.infer<typeof repaymentTemplateSchema>;
export type BulkRepaymentInput = z.infer<typeof bulkRepaymentSchema>;
