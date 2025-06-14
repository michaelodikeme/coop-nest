import { z } from 'zod';

export const updateShareAmountSchema = z.object({
  amount: z.number()
    .positive('Share amount must be positive')
    .min(1000, 'Share amount must be at least ₦1,000')
    .max(1000000, 'Share amount cannot exceed ₦1,000,000'),
  reason: z.string()
    .min(10, 'Please provide a detailed reason for the change')
    .max(500, 'Reason cannot exceed 500 characters')
});
