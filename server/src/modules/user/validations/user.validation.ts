import { z } from 'zod';
import { MembershipStatus, NotificationType, NotificationPriority } from '@prisma/client';
import { PERMISSIONS, Module } from '../../../types/permissions';

// Create permission and module validators
const validPermissions = PERMISSIONS.map(p => p.name);
const validModules = Object.values(Module);

// Role Management Schemas
export const roleSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  permissions: z.array(z.string().refine(val => validPermissions.includes(val), {
    message: 'Invalid permission'
  })),
  approvalLevel: z.number().min(0),
  canApprove: z.boolean(),
  moduleAccess: z.array(z.string().refine(val => validModules.includes(val as Module), {
    message: 'Invalid module access'
  })),
});

export const userRoleSchema = z.object({
  roleId: z.string().uuid(),
  expiresAt: z.date().optional(),
});

// User Management Schemas
export const createUserSchema = z.object({
  biodataId: z.string().uuid(),
  username: z.string().optional(),
  // emailAddress: z.string().email().optional(),
  password: z.string().min(8),
  isMember: z.boolean().default(true),
  roleIds: z.array(z.string().uuid()).optional(),
  expiryDates: z.record(z.string().uuid(), z.date()).optional(),
});

export const updateUserSchema = z.object({
  username: z.string().min(3)
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided"
});

export const userLoginSchema = z.object({
  username: z.string(),
  password: z.string(),
  deviceInfo: z.string().optional(),
  ipAddress: z.string().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

// Biodata Schema
export const createBiodataSchema = z.object({
  erpId: z.string(),
  ippisId: z.string(),
  firstName: z.string(),
  middleName: z.string().optional(),
  lastName: z.string(),
  dateOfEmployment: z.date(),
  staffNo: z.string(),
  department: z.string(),
  residentialAddress: z.string(),
  emailAddress: z.string().email(),
  phoneNumber: z.string(),
  nextOfKin: z.string(),
  relationshipOfNextOfKin: z.string(),
  nextOfKinPhoneNumber: z.string(),
  nextOfKinEmailAddress: z.string().email(),
  profilePhoto: z.string().optional(),
  membershipStatus: z.nativeEnum(MembershipStatus).default('ACTIVE'),
});

// Role Assignment Schema
export const assignRoleSchema = z.object({
  userId: z.string().uuid(),
  roleId: z.string().uuid(),
  expiresAt: z.date().optional(),
});

// Update Role Schema
export const updateRoleSchema = z.object({
  isActive: z.boolean().optional(),
  expiresAt: z.date().optional(),
});

// Notification Schema
export const createNotificationSchema = z.object({
  type: z.nativeEnum(NotificationType),
  title: z.string(),
  message: z.string(),
  metadata: z.any().optional(),
  priority: z.nativeEnum(NotificationPriority).default('NORMAL'),
  expiresAt: z.date().optional(),
});

// Query Filters Schema
export const userQuerySchema = z.object({
  isActive: z.boolean().optional(),
  isMember: z.boolean().optional(),
  username: z.string().optional(),
  emailAddress: z.string().email().optional(),
  biodataId: z.string().uuid().optional(),
  roleId: z.string().uuid().optional(),
  hasPermission: z.string().optional(),
  hasModuleAccess: z.string().optional(),
  approvalLevel: z.number().optional(),
});

export const approveUsernameUpdateSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  comment: z.string().optional()
});