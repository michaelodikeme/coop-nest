import { z } from 'zod';
import { TransactionType, TransactionModule } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// Helper function to create Zod enum from Prisma enum
function createEnumSchema<T extends string>(enumObj: Record<string, T>) {
  return z.enum(Object.values(enumObj) as [T, ...T[]]);
}

// Create Zod enums for transaction types and modules
const transactionTypeSchema = createEnumSchema(TransactionType);
const transactionModuleSchema = createEnumSchema(TransactionModule);

// Base transaction schema
const baseTransactionSchema = {
  description: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  requestId: z.string().uuid().optional(),
  parentTxnId: z.string().uuid().optional(),
  autoComplete: z.boolean().optional()
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
  description: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  relatedEntityId: z.string().uuid().optional(),
  relatedEntityType: z.string().optional(),
  requestId: z.string().uuid().optional(),
  parentTxnId: z.string().uuid().optional(),
  initiatedBy: z.string().uuid(),
  autoComplete: z.boolean().optional()
});

// Define type based on the schema
export type CreateTransactionDto = z.infer<typeof createTransactionSchema>;
