import { 
  Role, 
  Session, 
  AuthTokens, 
  RoleAssignment
} from './auth.types';
import type { Biodata } from './member.types';

export interface User {
  data: User;
  id: string;
  username: string;
  email?: string;
  role: Role | null;
  approvalLevel?: number;
  permissions?: string[];
  modules?: string[];
  biodataId?: string;
  biodata?: Biodata;
  isCreated?: boolean;
  isMember?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  adminProfile?: AdminProfile;
  roleAssignments: RoleAssignment[];
  session?: Session;
  tokens?: AuthTokens;
  notifications?: Notification[];
}

export interface AdminProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
  phoneNumber: string;
  department: string;
  position: string;
  staffId: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  metadata?: any;
  requestId?: string | null;
  transactionId?: string | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  expiresAt?: string | null;
  priority: string;
}

export interface UserFilterParams {
  isActive?: boolean;
  roleId?: string;
  hasPermission?: string;
}
