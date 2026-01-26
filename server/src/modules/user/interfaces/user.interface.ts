import { Role, MembershipStatus, NotificationType, NotificationPriority } from '@prisma/client';
import { Module } from '../../../types/permissions';

// export interface IUser {
//   id: string;
//   biodataId?: string;
//   username?: string;
//   emailAddress?: string;
//   password?: string;
//   isActive: boolean;
//   isMember: boolean;
//   createdAt: Date;
//   updatedAt: Date;
//   roleAssignments?: IUserRole[];
//   biodata?: IBiodata;
//   adminProfile?: IAdminProfile;
// }

export interface ICreateUserInput {
  biodataId?: string;
  username?: string;
  password: string;
  isMember: boolean;
  roleIds?: string[]; // Allow assigning multiple roles on creation
  expiryDates?: { [roleId: string]: Date }; // Optional role expiry dates
}

export interface IUserRole {
  id: string;
  userId: string;
  roleId: string;
  assignedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  role?: Role;
}

export interface IRole {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  approvalLevel: number;
  canApprove: boolean;
  moduleAccess: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserSession {
  id: string;
  userId: string;
  deviceInfo?: string;
  ipAddress?: string;
  lastActivity: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: any;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  expiresAt?: Date;
  priority: NotificationPriority;
  requestId?: string;
  transactionId?: string;
}

export interface IUserLoginInput {
  username: string;
  password: string;
  deviceInfo?: string;
  ipAddress?: string;
}

export interface IUserUpdateInput {
  username?: string;
  isActive?: boolean;
}

export interface IChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface IAssignRoleInput {
  userId: string;
  roleId: string;
  expiresAt?: Date;
}

// Define interface for role permissions cache
export interface IRolePermissionsCache {
  permissions: string[];
  approvalLevel: number;
  canApprove: boolean;
  moduleAccess: Module[];
}

// Define interfaces for role assignment and user types
export interface IRoleAssignment {
  role: {
    name: string;
    approvalLevel: number;
  };
}

export interface IUserWithRoles {
  roleAssignment: IRoleAssignment;
}


export interface IBiodata {
  id: string;
  erpId: string;
  ippisId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName: string;
  dateOfEmployment: Date;
  staffNo: string;
  department: string;
  residentialAddress: string;
  emailAddress: string;
  phoneNumber: string;
  nextOfKin: string;
  relationshipOfNextOfKin: string;
  nextOfKinPhoneNumber: string;
  nextOfKinEmailAddress: string;
  profilePhoto?: string;
  isVerified: boolean;
  isApproved: boolean;
  isDeleted: boolean;
  membershipStatus: MembershipStatus;
}

export interface IUserPermissions {
  role: string;
  permissions: string[];
  moduleAccess: string[];
  approvalLevel: number;
  canApprove: boolean;
}

export interface IUserQueryFilters {
  isActive?: boolean;
  isMember?: boolean;
  username?: string;
  emailAddress?: string;
  biodataId?: string;
  roleId?: string;
  hasPermission?: string;
  hasModuleAccess?: string;
  approvalLevel?: number;
}

// export interface ILoginResponse {
//   user: IUser;
//   session: IUserSession;
//   tokens: {
//     accessToken: string;
//     refreshToken: string;
//     expiresIn: number;
//   };
// }