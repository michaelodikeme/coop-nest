import { z } from 'zod';
import { MembershipStatus } from '@prisma/client';
import { IBiodataUpload, IBiodataValidationResult } from '../interfaces/biodata.interface';
import { PhoneNumberService } from '../../../utils/phoneNumber';

// Custom phone number validator and transformer
const phoneNumberValidator = z.string()
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

export const createBiodataSchema = z.object({
  erpId: z.string().min(1, 'ERP ID is required'),
  ippisId: z.string().min(1, 'IPPIS ID is required'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  middleName: z.string().optional(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  dateOfEmployment: z.coerce.date(),
  staffNo: z.string().min(1, 'Staff number is required'),
  department: z.string().min(1, 'Department is required'),
  residentialAddress: z.string().min(5, 'Residential address must be at least 5 characters'),
  emailAddress: z.string().email('Invalid email address'),
  phoneNumber: phoneNumberValidator,
  nextOfKin: z.string().min(2, 'Next of kin name must be at least 2 characters'),
  relationshipOfNextOfKin: z.string().min(2, 'Relationship must be specified'),
  nextOfKinPhoneNumber: phoneNumberValidator,
  nextOfKinEmailAddress: z.string().email('Invalid next of kin email address'),
  profilePhoto: z.string().optional(),
});

export const updateBiodataSchema = createBiodataSchema.partial();

export const accountInfoSchema = z.object({
  bankId: z.string().uuid('Invalid bank ID'),
  accountNumber: z.string().regex(/^\d{10}$/, 'Account number must be 10 digits'),
  bvn: z.string().regex(/^\d{11}$/, 'BVN must be 11 digits'),
  accountName: z.string().min(2, 'Account name must be at least 2 characters'),
});

export const verifyBiodataSchema = z.object({
  phoneNumber: phoneNumberValidator,
  verifierNotes: z.string().optional(),
});

export const approveBiodataSchema = z.object({
  biodataId: z.string().uuid('Invalid biodata ID'),
  approverNotes: z.string().optional(),
});

export const updateMembershipStatusSchema = z.object({
  membershipStatus: z.nativeEnum(MembershipStatus),
  reason: z.string().min(1, 'Reason for status change is required'),
});

export const biodataQuerySchema = z.object({
  erpId: z.string().optional(),
  ippisId: z.string().optional(),
  staffNo: z.string().optional(),
  department: z.string().optional(),
  isVerified: z.boolean().optional(),
  isApproved: z.boolean().optional(),
  isDeleted: z.boolean().optional(),
  membershipStatus: z.nativeEnum(MembershipStatus).optional(),
  searchTerm: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const biodataApprovalRequestSchema = z.object({
  biodataId: z.string().uuid('Invalid biodata ID'),
  requestType: z.enum(['BIODATA_APPROVAL', 'BIODATA_UPDATE']),
  content: z.object({
    changes: z.object(createBiodataSchema.shape).partial().optional(),
    notes: z.string().optional(),
  }),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
});

export const phoneVerificationSchema = z.object({
  phoneNumber: phoneNumberValidator,
});

export const verifyOtpSchema = z.object({
  phoneNumber: phoneNumberValidator,
  otp: z.string().min(4, 'OTP must be at least 4 characters'),
});

export const validateBiodataUpload = (data: any): IBiodataValidationResult => {
  const errors: { field: string; message: string }[] = [];

  // Update required fields to match your schema
  const requiredFields = [
    'erpId',
    'ippisId',
    'firstName',  // Changed from 'name'
    'lastName',   // Added
    'dateOfEmployment',
    'department',
    'staffNo',
    'residentialAddress',
    'emailAddress',
    'phoneNumber',
    'nextOfKin',
    'relationshipOfNextOfKin',
    'nextOfKinPhoneNumber',
    'nextOfKinEmailAddress'
  ];

  requiredFields.forEach(field => {
    if (!data[field]) {
      errors.push({
        field,
        message: `${field} is required`
      });
    }
  });

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (data.emailAddress && !emailRegex.test(data.emailAddress)) {
    errors.push({
      field: 'emailAddress',
      message: 'Invalid email address format'
    });
  }
  if (data.nextOfKinEmailAddress && !emailRegex.test(data.nextOfKinEmailAddress)) {
    errors.push({
      field: 'nextOfKinEmailAddress',
      message: 'Invalid next of kin email address format'
    });
  }

  // Phone number validation with formatting
  if (data.phoneNumber) {
    try {
      // Try to format the phone number
      data.phoneNumber = PhoneNumberService.formatToInternational(data.phoneNumber);
    } catch {
      errors.push({
        field: 'phoneNumber',
        message: 'Invalid Nigerian phone number format'
      });
    }
  }

  if (data.nextOfKinPhoneNumber) {
    try {
      // Try to format the next of kin phone number
      data.nextOfKinPhoneNumber = PhoneNumberService.formatToInternational(data.nextOfKinPhoneNumber);
    } catch {
      errors.push({
        field: 'nextOfKinPhoneNumber',
        message: 'Invalid next of kin Nigerian phone number format'
      });
    }
  }

  // Date validation
  if (data.dateOfEmployment && !(data.dateOfEmployment instanceof Date) && isNaN(new Date(data.dateOfEmployment).getTime())) {
    errors.push({
      field: 'dateOfEmployment',
      message: 'Invalid date of employment'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? data : undefined // Return formatted data if valid
  };
};