import { User } from './user.types';

export interface ApiErrorResponse {
  status?: number;// HTTP status code
  message?: string;// Error message
  code?: string;// Error code (e.g., "INVALID_INPUT", "NOT_FOUND")
  type?: string;// Error type (e.g., "VALIDATION_ERROR", "SERVER_ERROR")
  errors?: string[];// Array of validation error messages (if applicable)
}

// // Re-export the User type for backward compatibility
// export type { User, Role, AdminProfile, AuthTokens };

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

export interface PermissionResponse {
  status: string;
  data: {
    roles: string[];
    permissions: string[];
    moduleAccess: string[];
    approvalLevel: number;
    canApprove: boolean;
  };
}

export interface ModuleAccess {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  refreshToken: string;
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
  lastActive: string;
  expiresAt: string;
  isActive: boolean;
  isRevoked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BiodataVerificationResponse {
  message: string;
  status: string;
  biodataId: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface Role {
  id?: string;
  name: string;
  description?: string;
  permissions: string[];
  approvalLevel?: number;
  canApprove?: boolean;
  moduleAccess?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface RoleAssignment {
  id?: string;
  userId?: string;
  roleId?: string;
  assignedAt?: string;
  expiresAt?: string | null;
  isActive: boolean;
  role: Role;
}

export interface AdminProfile {
  id: string;
  userId?: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
  phoneNumber: string;
  address?: string;
  department: string;
  staffId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  sessionId?: string;
  lastLoginTime?: number;
}

export interface EnhancedAuthTokens extends AuthTokens {
  accessTokenJti?: string;
  refreshTokenJti?: string;
  sessionId?: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  status: string;
  data: {
    user: User;
    tokens: AuthTokens;
    session: any;
  };
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  redis: boolean;
  database: boolean;
  timestamp: Date;
  details?: {
    redisLatency?: number;
    databaseLatency?: number;
  };
}

export interface SessionsResponse {
  status: string;
  data: Session[];
}
