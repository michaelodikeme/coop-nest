import { z } from 'zod';

// Reverse Transaction Schema
export const reverseTransactionSchema = z.object({
  reason: z.string().min(1, 'Reason is required for reversing a transaction'),
  initiatedBy: z.string().uuid()
});

// Define type based on the schema
export type ReverseTransactionDto = z.infer<typeof reverseTransactionSchema>;