import { z } from 'zod';
import { PhoneNumberService } from '../../../utils/phoneNumber';

// Custom phone number validator and transformer
export const phoneNumberValidator = z.string()
  .refine(
    (value) => PhoneNumberService.isValidNigerianNumber(value),
    {
      message: 'Invalid Nigerian phone number format'
    }
  )
  .transform((value) => {
    try {
      return PhoneNumberService.formatToInternational(value);
    } catch (error) {
      return value;
    }
  });

// Admin Profile Schemas
export const createAdminProfileSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  emailAddress: z.string().email(),
  phoneNumber: phoneNumberValidator,
  department: z.string(),
  staffId: z.string(),
  position: z.string(),
  isActive: z.boolean().default(false),
  isVerified: z.boolean().default(false)
});

export const verifyAdminProfileSchema = z.object({
  phoneNumber: phoneNumberValidator,
});

export const verifyAdminOtpSchema = z.object({
  phoneNumber: phoneNumberValidator,
  otp: z.string().length(6)
});

export const createAdminUserSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(8),
  adminProfileId: z.string().uuid()
});

export const processAdminProfileSchema = z.object({
    status: z.enum(['APPROVED', 'REJECTED']),
    comment: z.string().optional()
});

export const adminActionSchema = z.object({
    reason: z.string().min(1, 'Reason is required'),
    comment: z.string().optional()
});