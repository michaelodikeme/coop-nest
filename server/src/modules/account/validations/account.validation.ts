import { z } from 'zod';

export const createAccountSchema = z.object({
  body: z.object({
    bankId: z.string().uuid('Invalid bank ID'),
    accountNumber: z.string().length(10, 'Account number must be exactly 10 digits'),
    bvn: z.string().length(11, 'BVN must be exactly 11 digits'),
    accountName: z.string().min(3, 'Account name must be at least 3 characters')
  })
});

export const updateAccountSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid account ID')
  }),
  body: z.object({
    bankId: z.string().uuid('Invalid bank ID').optional(),
    accountNumber: z.string().length(10, 'Account number must be exactly 10 digits').optional(),
    bvn: z.string().length(11, 'BVN must be exactly 11 digits').optional(),
    accountName: z.string().min(3, 'Account name must be at least 3 characters').optional(),
    reason: z.string().min(10, 'Please provide a reason for the update').max(500)
  })
});

export const verifyAccountSchema = z.object({
  body: z.object({
    accountNumber: z.string().length(10, 'Account number must be exactly 10 digits'),
    bankCode: z.string().min(1).max(6, 'Invalid bank code')
  })
});

export const processRequestSchema = z.object({
  params: z.object({
    requestId: z.string().uuid('Invalid request ID')
  }),
  body: z.object({
    approved: z.boolean(),
    notes: z.string().min(1, 'Please provide approval/rejection notes').max(500)
  })
});

export const getAccountSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid account ID')
  })
});

export const getAccountsQuerySchema = z.object({
  query: z.object({
    biodataId: z.string().uuid('Invalid biodata ID').optional(),
    bankId: z.string().uuid('Invalid bank ID').optional(),
    isVerified: z.boolean().optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional()
  })
});