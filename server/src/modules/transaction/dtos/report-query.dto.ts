import { z } from 'zod';
import { TransactionModule } from '@prisma/client';

// Helper function to create Zod enum from Prisma enum
function createEnumSchema<T extends string>(enumObj: Record<string, T>) {
  return z.enum(Object.values(enumObj) as [T, ...T[]]);
}

// Create Zod enum for transaction module
const transactionModuleSchema = createEnumSchema(TransactionModule);

// Report Query Schema
export const reportQuerySchema = z.object({
  module: transactionModuleSchema.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  groupBy: z.enum(['day', 'week', 'month', 'module', 'type']).optional().default('day'),
  format: z.enum(['json', 'csv', 'pdf', 'excel']).optional().default('json')
});

// Define type based on the schema
export type ReportQueryDto = z.infer<typeof reportQuerySchema>;