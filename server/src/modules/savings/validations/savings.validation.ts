import { z } from 'zod';
import { AccountStatus, TransactionType, TransactionModule, TransactionStatus } from '@prisma/client';

const currentYear = new Date().getFullYear();

// Create savings schema
export const createSavingsSchema = z.object({
  erpId: z.string()
    .regex(/^ERP\d+$/, 'ERP ID must start with ERP followed by numbers'),
  monthlyTarget: z.number()
    .min(3000, 'Gross amount must be at least ₦3,000 to cover shares contribution'),
  month: z.number()
    .int('Month must be a whole number')
    .min(1, 'Month must be between 1 and 12')
    .max(12, 'Month must be between 1 and 12'),
  year: z.number()
    .int('Year must be a whole number')
    .min(2020, 'Year must be 2020 or later')
    .max(currentYear + 1, `Year cannot be more than ${currentYear + 1}`),
  description: z.string()
    .max(500, 'Description cannot exceed 500 characters')
    .optional(),
});
// List savings query schema
export const listSavingsQuerySchema = z.object({
    page: z.coerce.number()
        .int('Page must be a whole number')
        .min(1, 'Page must be 1 or greater')
        .default(1),
    limit: z.coerce.number()
        .int('Limit must be a whole number')
        .min(1, 'Limit must be at least 1')
        .max(100, 'Limit cannot exceed 100')
        .default(12),
    year: z.coerce.number()
        .int('Year must be a whole number')
        .min(2020, 'Year must be 2020 or later')
        .max(currentYear + 1, `Year cannot be more than ${currentYear + 1}`)
        .optional(),
    month: z.coerce.number()
        .int('Month must be a whole number')
        .min(1, 'Month must be between 1 and 12')
        .max(12, 'Month must be between 1 and 12')
        .optional(),
    status: z.nativeEnum(AccountStatus)
        .optional(),
    sort: z.enum(['asc', 'desc'] as const)
        .default('desc'),
    erpId: z.string()
        .regex(/^ERP\d+$/, 'Invalid ERP ID format')
        .optional(),
    department: z.string()
        .trim()
        .optional(),
});

// Monthly savings query schema
export const monthSavingsQuerySchema = z.object({
  year: z.number()
    .int('Year must be a whole number')
    .min(2020, 'Year must be 2020 or later')
    .max(currentYear + 1, `Year cannot be more than ${currentYear + 1}`)
    .optional(),
  month: z.number()
    .int('Month must be a whole number')
    .min(1, 'Month must be between 1 and 12')
    .max(12, 'Month must be between 1 and 12')
    .optional(),
  page: z.number()
    .int('Page must be a whole number')
    .min(1, 'Page must be 1 or greater')
    .default(1),
  limit: z.number()
    .int('Limit must be a whole number')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(12),
});
// Transaction query schema
export const transactionQuerySchema = z.object({
    page: z.number()
        .int('Page must be a whole number')
        .min(1, 'Page must be 1 or greater')
        .default(1),
    limit: z.number()
        .int('Limit must be a whole number')
        .min(1, 'Limit must be at least 1')
        .max(100, 'Limit cannot exceed 100')
        .default(20),
    startDate: z.string()
        .datetime('Start date must be a valid ISO date')
        .optional(),
    endDate: z.string()
        .datetime('End date must be a valid ISO date')
        .superRefine((date, ctx) => {
                const data = ctx.path[ctx.path.length - 2] as { startDate?: string };
                if (!data.startDate) return true;
                if (new Date(date) < new Date(data.startDate)) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: 'End date must be after start date',
                    });
                }
                return true;
        })
        .optional(),
    type: z.nativeEnum(TransactionType)
        .optional(),
    module: z.nativeEnum(TransactionModule)
        .optional(),
    status: z.nativeEnum(TransactionStatus)
        .optional(),
    biodataId: z.string()
        .uuid('Invalid biodata ID')
        .optional(),
});

// Monthly savings params schema
export const monthlySavingsParamsSchema = z.object({
  erpId: z.string()
    .regex(/^ERP\d+$/, 'ERP ID must start with ERP followed by numbers'),
  year: z.number()
    .int('Year must be a whole number')
    .min(2020, 'Year must be 2020 or later')
    .max(currentYear + 1, `Year cannot be more than ${currentYear + 1}`),
  month: z.number()
    .int('Month must be a whole number') 
    .min(1, 'Month must be between 1 and 12')
    .max(12, 'Month must be between 1 and 12'),
});

// Withdrawal request schema
export const withdrawalRequestSchema = z.object({
  amount: z.number()
    .positive('Amount must be greater than 0'),
  reason: z.string()
    .min(10, 'Reason must be at least 10 characters long')
    .max(500, 'Reason cannot exceed 500 characters'),
});

// Withdrawal requests query schema  
export const withdrawalRequestsQuerySchema = z.object({
  page: z.number()
    .int('Page must be a whole number')
    .min(1, 'Page must be 1 or greater')
    .default(1),
  limit: z.number()
    .int('Limit must be a whole number')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(10),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED'] as const)
    .optional(),
});

// Update share amount schema
export const updateShareAmountSchema = z.object({
    amount: z.number()
        .positive('Share amount must be positive')
        .min(1000, 'Share amount must be at least ₦1,000')
        .max(1000000, 'Share amount cannot exceed ₦1,000,000')
});

// Configuration schema
export const configurationSchema = z.object({
    shareAmount: z.number()
        .positive('Share amount must be positive')
        .min(1000, 'Share amount must be at least ₦1,000')
        .max(1000000, 'Share amount cannot exceed ₦1,000,000')
        .optional(),
    minimumSavingsAmount: z.number()
        .positive('Minimum savings amount must be positive')
        .min(1000, 'Minimum savings amount must be at least ₦1,000')
        .max(1000000, 'Minimum savings amount cannot exceed ₦1,000,000')
        .optional()
}).refine(data => 
    data.shareAmount !== undefined || data.minimumSavingsAmount !== undefined, 
    {
        message: 'At least one configuration value must be provided'
    }
);
