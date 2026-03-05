import { z } from 'zod';

// Input validation schemas
export const createWithdrawalSchema = z.object({
    amount: z.number().positive('Amount must be positive').min(1000, 'Minimum withdrawal amount is ₦1,000'),
    reason: z.string().min(10, 'Please provide a detailed reason for the withdrawal').max(500, 'Reason is too long'),
    biodataId: z.string().uuid('Invalid member ID'),
    erpId: z.string().min(1, 'ERP ID is required')
});

export const adminWithdrawalCreationSchema = z.object({
    biodataId: z.string().uuid('Invalid member ID'),
    erpId: z.string().min(1, 'ERP ID is required'),
    amount: z.number().positive('Amount must be positive').min(1000, 'Minimum withdrawal amount is ₦1,000'),
    reason: z.string().min(10, 'Please provide a detailed reason for the withdrawal').max(500, 'Reason is too long'),
    withdrawalType: z.enum(['SAVINGS', 'PERSONAL_SAVINGS'], {
        errorMap: () => ({ message: 'Withdrawal type must be either SAVINGS or PERSONAL_SAVINGS' })
    }),
    savingsId: z.string().uuid('Invalid savings ID').optional(),
    personalSavingsId: z.string().uuid('Invalid personal savings ID').optional()
});

export const updateWithdrawalSchema = z.object({
    status: z.enum(['PENDING', 'IN_REVIEW', 'REVIEWED', 'APPROVED', 'REJECTED', 'COMPLETED']),
    notes: z.string().optional()
});

export const withdrawalQuerySchema = z.object({
    biodataId: z.string().uuid('Invalid member ID').optional(),
    status: z.enum(['PENDING', 'IN_REVIEW', 'REVIEWED', 'APPROVED', 'REJECTED', 'COMPLETED']).optional(),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(10),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    sortBy: z.string().optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});
