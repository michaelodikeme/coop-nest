import { z } from 'zod';
import { TransactionStatus, TransactionType, TransactionModule } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// Helper function to create Zod enum from Prisma enum
export function createEnumSchema<T extends string>(enumObj: Record<string, T>) {
  return z.enum(Object.values(enumObj) as [T, ...T[]]);
}

// Create Zod enums
export const transactionTypeSchema = createEnumSchema(TransactionType);
export const transactionStatusSchema = createEnumSchema(TransactionStatus);
export const transactionModuleSchema = createEnumSchema(TransactionModule);

// Base schema with common fields
const baseTransactionSchema = {
  description: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  requestId: z.string().uuid().optional(),
  parentTxnId: z.string().uuid().optional()
};

// Create Transaction Schema
export const createTransactionSchema = z.object({
  transactionType: transactionTypeSchema,
  module: transactionModuleSchema,
  amount: z.union([
    z.number(),
    z.string(),
    z.instanceof(Decimal)
  ]).optional(),
  balanceAfter: z.union([
    z.string(),
    z.instanceof(Decimal)
  ]).optional(),
  ...baseTransactionSchema,
  relatedEntityId: z.string().uuid().optional(),
  relatedEntityType: z.string().optional(),
  initiatedBy: z.string().uuid(),
  autoComplete: z.boolean().optional()
});

// Update Transaction Status Schema
export const updateTransactionStatusSchema = z.object({
  status: transactionStatusSchema,
  approvedBy: z.string().uuid().optional(),
  notes: z.string().optional()
});

// Reverse Transaction Schema
export const reverseTransactionSchema = z.object({
  reason: z.string().min(1, 'Reason is required for reversing a transaction'),
  initiatedBy: z.string().uuid()
});

// Batch Transaction Schema
export const batchTransactionSchema = z.object({
  transactions: z.array(createTransactionSchema).min(1, 'At least one transaction is required'),
  processAsUnit: z.boolean().optional().default(false)
});

// Transaction Query Schema
export const transactionQuerySchema = z.object({
  module: transactionModuleSchema.optional(),
  transactionType: transactionTypeSchema.optional(),
  status: transactionStatusSchema.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  relatedEntityId: z.string().uuid().optional(),
  relatedEntityType: z.string().optional(),
  initiatedBy: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});

// Report Query Schema
// export const reportQuerySchema = z.object({
//   module: transactionModuleSchema.optional(),
//   startDate: z.string().datetime().optional(),
//   endDate: z.string().datetime().optional(),
//   groupBy: z.enum(['day', 'week', 'month', 'module', 'type']).optional().default('day'),
//   format: z.enum(['json', 'csv', 'pdf', 'excel']).optional().default('json')
// });

// Assuming this is where reportQuerySchema is defined
export const reportQuerySchema = z.object({
  groupBy: z.enum(['module', 'type', 'day', 'week', 'month']),
  format: z.enum(['json', 'csv', 'pdf', 'excel']),
  module: transactionModuleSchema.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  approvedBy: z.string().uuid().optional(),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
  includeDetails: z.boolean().optional(),
});

// Export types based on schemas
export type CreateTransactionDto = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionStatusDto = z.infer<typeof updateTransactionStatusSchema>;
export type ReverseTransactionDto = z.infer<typeof reverseTransactionSchema>;
export type BatchTransactionDto = z.infer<typeof batchTransactionSchema>;
export type TransactionQueryDto = z.infer<typeof transactionQuerySchema>;
export type ReportQueryDto = z.infer<typeof reportQuerySchema>;