import { z } from 'zod';

// Nigerian phone number validator (same logic as backend)
const phoneNumberValidator = z.string().refine(
  (value) =>
    /^(\+234|0)[789][01]\d{8}$/.test(value), // Adjust this regex if your backend uses a different one
  {
    message: 'Invalid Nigerian phone number format',
  }
);

export const memberFormSchema = z.object({
  erpId: z.string().min(1, 'ERP ID is required'),
  ippisId: z.string().min(1, 'IPPIS ID is required'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  middleName: z.string().optional(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  dateOfEmployment: z.string().refine(
    (val) => !isNaN(Date.parse(val)),
    { message: 'Invalid date of employment' }
  ),
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

export const bankAccountSchema = z.object({
  accountNumber: z.string()
  .min(10, 'Account number must be at least 10 digits')
  .max(20, 'Account number cannot exceed 20 digits'),
  bankId: z.string().min(1, 'Bank ID is required'),
  accountName: z.string().min(1, 'Account name is required'),
  accountType: z.enum(['SAVINGS', 'CURRENT']).optional(),
  isPrimary: z.boolean().default(false),
  bvn: z.string().optional(),
});
