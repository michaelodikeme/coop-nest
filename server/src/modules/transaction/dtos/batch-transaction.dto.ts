import { z } from 'zod';
import { createTransactionSchema } from './create-transaction.dto';

// Batch Transaction Schema
export const batchTransactionSchema = z.object({
  transactions: z.array(createTransactionSchema).min(1, 'At least one transaction is required'),
  processAsUnit: z.boolean().optional().default(false)
});

// Define type based on the schema
export type BatchTransactionDto = z.infer<typeof batchTransactionSchema>;