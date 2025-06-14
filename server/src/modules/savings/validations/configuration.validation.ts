import { z } from 'zod';

export const savingsSettingSchema = z.object({
  value: z.string(),
  type: z.enum(['number', 'boolean', 'string', 'json']),
  group: z.enum(['shares', 'savings', 'loans', 'system']),
  description: z.string().optional(),
  isActive: z.boolean().default(true)
});

export const configurationUpdateSchema = z.object({
  shareAmount: z.number()
    .positive('Share amount must be positive')
    .min(1000, 'Share amount must be at least ₦1,000')
    .max(1000000, 'Share amount cannot exceed ₦1,000,000')
    .optional(),
  minimumSavingsAmount: z.number()
    .positive('Minimum savings amount must be positive')
    .min(1000, 'Minimum savings amount must be at least ₦1,000')
    .max(500000, 'Minimum savings amount cannot exceed ₦500,000')
    .optional(),
  reason: z.string()
    .min(10, 'Please provide a detailed reason for the change')
    .max(500, 'Reason cannot exceed 500 characters')
});
