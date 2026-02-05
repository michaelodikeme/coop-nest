import { z } from 'zod';
import { PersonalSavingsStatus, TransactionType, TransactionModule, TransactionStatus, RequestStatus } from '@prisma/client';

// Create personal savings schema
export const createPersonalSavingsSchema = z.object({
  erpId: z.string()
    .regex(
      /^(ERP\d+|FUO-ADM-\d+)$/i, // 'i' flag makes it case-insensitive
      'ERP ID must be either "ERP" or "FUO-ADM-" format followed by numbers (case insensitive)'
    ),
  
  planName: z.string()
    .min(3, 'Plan name must be at least 3 characters')
    .max(50, 'Plan name cannot exceed 50 characters')
    .optional(),
    
  targetAmount: z.number()
    .positive('Target amount must be positive')
    .optional(),
});

// List personal savings query schema
export const listPersonalSavingsQuerySchema = z.object({
  page: z.coerce.number()
    .int('Page must be a whole number')
    .min(1, 'Page must be 1 or greater')
    .default(1),
  limit: z.coerce.number()
    .int('Limit must be a whole number')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(12),
  status: z.nativeEnum(PersonalSavingsStatus)
    .optional(),
  sort: z.enum(['asc', 'desc'] as const)
    .default('desc'),
  erpId: z.string()
    .regex(/^ERP\d+$/, 'Invalid ERP ID format')
    .optional(),
});

// Deposit schema
export const depositSchema = z.object({
  amount: z.number()
    .positive('Amount must be greater than zero'),
  description: z.string()
    .max(200, 'Description cannot exceed 200 characters')
    .optional(),
});

// Withdrawal request schema
export const withdrawalSchema = z.object({
  amount: z.number()
    .positive('Amount must be greater than zero'),
  reason: z.string()
    // .min(10, 'Please provide a reason with at least 10 characters')
    .max(500, 'Reason cannot exceed 500 characters')
    .optional(),
});

// Get personal savings by ID schema
export const getByIdSchema = z.object({
  id: z.string().uuid('Invalid personal savings ID'),
});

// Get transaction history schema
export const transactionHistorySchema = z.object({
  page: z.coerce.number()
    .int('Page must be a whole number')
    .min(1, 'Page must be 1 or greater')
    .default(1),
  limit: z.coerce.number()
    .int('Limit must be a whole number')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(12),
  startDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
    .optional(),
  endDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
    .optional(),
  type: z.nativeEnum(TransactionType)
    .optional(),
  planId: z.string().uuid('Invalid personal savings ID').optional(),
});