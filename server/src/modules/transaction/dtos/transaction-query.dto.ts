import { z } from 'zod';
import { TransactionStatus, TransactionType, TransactionModule } from '@prisma/client';

// Helper function to create Zod enum from Prisma enum
function createEnumSchema<T extends string>(enumObj: Record<string, T>) {
  return z.enum(Object.values(enumObj) as [T, ...T[]]);
}

// Create Zod enums
const transactionTypeSchema = createEnumSchema(TransactionType);
const transactionStatusSchema = createEnumSchema(TransactionStatus);
const transactionModuleSchema = createEnumSchema(TransactionModule);

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

// Define type based on the schema
export type TransactionQueryDto = z.infer<typeof transactionQuerySchema>;