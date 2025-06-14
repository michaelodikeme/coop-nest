// filepath: src/modules/transaction/dtos/update-transaction-status.dto.ts
import { z } from 'zod';
import { TransactionStatus } from '@prisma/client';

// Helper function to create Zod enum from Prisma enum
function createEnumSchema<T extends string>(enumObj: Record<string, T>) {
  return z.enum(Object.values(enumObj) as [T, ...T[]]);
}

// Create Zod enum for transaction status
const transactionStatusSchema = createEnumSchema(TransactionStatus);

// Update Transaction Status Schema
export const updateTransactionStatusSchema = z.object({
  status: transactionStatusSchema,
  approvedBy: z.string().uuid().optional(),
  notes: z.string().optional()
});

// Define type based on the schema
export type UpdateTransactionStatusDto = z.infer<typeof updateTransactionStatusSchema>;
