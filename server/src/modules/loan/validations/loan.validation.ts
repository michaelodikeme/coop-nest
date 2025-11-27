import { z } from 'zod';
import { LoanStatus } from '@prisma/client';

// Basic number validations
const positiveDecimal = z.number()
  .positive('Amount must be greater than 0')
  .multipleOf(0.01, 'Amount must have at most 2 decimal places');

const positiveInteger = z.number()
  .int('Must be a whole number')
  .positive('Must be greater than 0');

// Common schemas
const erpIdSchema = z.string()
  .regex(/^[A-Z]+-[A-Z]+-\d+$/, 'Invalid ERP ID format');
  // .regex(/^ERP\d+$/, 'Invalid ERP ID format');

// Loan eligibility schema
export const loanEligibilitySchema = z.object({
  loanTypeId: z.string().uuid('Invalid loan type ID'),
})

// Loan application schema
export const loanApplicationSchema = z.object({
  biodataId: z.string().uuid('Invalid biodata ID'),
  erpId: erpIdSchema,
  loanTypeId: z.string().uuid('Invalid loan type ID'),
  loanAmount: positiveDecimal,
  loanTenure: z.number()
    .int('Tenure must be a whole number')
    .min(1, 'Tenure must be at least 1 month')
    .max(36, 'Tenure cannot exceed 36 months'),
  loanPurpose: z.string()
    .min(10, 'Loan purpose must be at least 10 characters')
    .max(500, 'Loan purpose cannot exceed 500 characters')
});

// Loan status update schema
export const loanStatusUpdateSchema = z.object({
  status: z.nativeEnum(LoanStatus, {
    required_error: 'Status is required',
    invalid_type_error: 'Invalid loan status'
  }),
  notes: z.string()
    .min(10, 'Notes must be at least 10 characters')
    .max(500, 'Notes cannot exceed 500 characters')
    .optional()
    .superRefine((val, ctx) => {
      const status = (ctx.path as any).find((p: any) => p === 'status');
      if ([LoanStatus.APPROVED, LoanStatus.REJECTED, LoanStatus.DEFAULTED].includes(status) && !val) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Notes are required when updating to this status'
        });
        return false;
      }
      return true;
    })
});

// Query parameters schema
export const loanQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
  status: z.nativeEnum(LoanStatus).optional(),
  erpId: erpIdSchema.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  loanType: z.string().uuid('Invalid loan type ID').optional(),
  sortBy: z.enum(['createdAt', 'loanAmount', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
}, {
  message: 'Start date must be before or equal to end date',
  path: ['dateRange']
});

// Loan calculation schema
export const loanCalculationSchema = z.object({
    loanTypeId: z.string().uuid('Invalid loan type ID'),
    amount: positiveDecimal,
    tenure: z.number()
        .int('Tenure must be a whole number')
        .min(1, 'Tenure must be at least 1 month')
        .max(36, 'Tenure cannot exceed 36 months')
});

// Loan summary query schema
export const loanSummaryQuerySchema = z.object({
    startDate: z.string().optional().refine(val => {
        if (!val) return true;
        return !isNaN(Date.parse(val));
    }, { message: 'Invalid start date format' }),
    
    endDate: z.string().optional().refine(val => {
        if (!val) return true;
        return !isNaN(Date.parse(val));
    }, { message: 'Invalid end date format' })
});

// Query parameters schema for getAllLoans
export const loansQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  status: z.union([
    z.nativeEnum(LoanStatus),
    z.string().transform(val => val.split(',') as LoanStatus[])
  ]).optional(),
  loanTypeId: z.string().uuid('Invalid loan type ID').optional(),
  erpId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sortBy: z.enum(['createdAt', 'principalAmount', 'status', 'disbursedAt', 'lastPaymentDate']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  biodataId: z.string().uuid('Invalid biodata ID').optional(),
  minAmount: z.string().regex(/^\d+$/).transform(Number).optional(),
  maxAmount: z.string().regex(/^\d+$/).transform(Number).optional()
});

// Types
export type LoanApplicationInput = z.infer<typeof loanApplicationSchema>;
export type LoanStatusUpdateInput = z.infer<typeof loanStatusUpdateSchema>;
export type LoanQueryParams = z.infer<typeof loanQuerySchema>;
export type LoanCalculationInput = z.infer<typeof loanCalculationSchema>;
