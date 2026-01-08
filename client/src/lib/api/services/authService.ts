import { apiService } from '@/lib/api/apiService';
import {
    LoginResponse,
    AdminProfile,
    ChangePasswordData,
    BiodataVerificationResponse,
    Role,
    Session,
    SessionsResponse,
    PermissionResponse,
    ModuleAccess, ResetPasswordData
} from '@/types/auth.types';
import type {
  User 
} from '@/types/user.types';

export class AuthApiService {
  // Authentication endpoints
  async login(username: string, password: string): Promise<LoginResponse> {
    return apiService.post<LoginResponse>('/auth/login', { username, password });
  }

  async createUserAccount(username: string, password: string, biodataId: string): Promise<User> {
    return apiService.post('/auth/user', { username, password, biodataId });
  }

  async logout(): Promise<{ message: string }> {
    return apiService.post('/auth/logout');
  }

  async getActiveSessions(): Promise<Session[]> {
    try {
      // Specify the correct return type from the API
      const response = await apiService.get<SessionsResponse>('/auth/me/sessions');
      
      // Check if we have a properly structured response
      if (response && typeof response === 'object') {
        if ('data' in response && Array.isArray(response.data)) {
          return response.data;
        } else if ('sessions' in response && Array.isArray(response.sessions)) {
          return response.sessions;
        }
      }
      
      // If we received an array directly, use it
      if (Array.isArray(response)) {
        return response;
      }
      
      console.warn('Unexpected session response format:', response);
      return [];
    } catch (error) {
      console.error('Failed to fetch active sessions:', error);
      return [];
    }
  }

  async invalidateSession(sessionId: string): Promise<{ message: string }> {
    return apiService.post(`/auth/me/sessions/${sessionId}/invalidate`);
  }

  async logoutAllSessions(): Promise<{ message: string }> {
    return apiService.post('/auth/me/sessions/invalidate-all');
  }

  // User profile and permissions
  async getCurrentUser(): Promise<User> {
    return apiService.get('/users/me');
  }

  async updateCurrentUser(userData: Partial<User>): Promise<User> {
    return apiService.put('/users/me', userData);
  }

  async changePassword(data: ChangePasswordData): Promise<{ message: string }> {
    return apiService.post('/users/me/change-password', data);
  }

  async resetPassword(data:ResetPasswordData ): Promise<{ message: string }> {
      return apiService.post('/users/me/reset-password', data);
  }



  async getCurrentUserPermissions(): Promise<PermissionResponse> {
    return apiService.get('/users/me/permissions');
  }

  async getCurrentUserModuleAccess(): Promise<ModuleAccess> {
    return apiService.get('/users/me/module-access');
  }

  // Request management
  async getAssignedRequests(): Promise<any[]> {
    return apiService.get('/users/me/requests/assigned');
  }

  async getInitiatedRequests(): Promise<any[]> {
    return apiService.get('/users/me/requests/initiated');
  }

  async getApprovedRequests(): Promise<any[]> {
    return apiService.get('/users/me/requests/approved');
  }

  // User management endpoints
  async getAllUsers(): Promise<User[]> {
    return apiService.get('/users');
  }

  async getUserById(id: string): Promise<User> {
    return apiService.get(`/users/${id}`);
  }

  async getUserPermissions(id: string): Promise<PermissionResponse> {
    return apiService.get(`/users/${id}/permissions`);
  }

  async getUserModuleAccess(id: string): Promise<ModuleAccess> {
    return apiService.get(`/users/${id}/module-access`);
  }

  async updateUser(userId: string, userData: Partial<User>): Promise<User> {
    return apiService.put(`/users/${userId}`, userData);
  }

  async createAdminProfile(userId: string, profileData: Omit<AdminProfile, 'id'>): Promise<AdminProfile> {
    return apiService.post(`/users/${userId}/admin-profile`, profileData);
  }

  async deactivateUser(userId: string): Promise<{ message: string }> {
    return apiService.post(`/users/${userId}/deactivate`);
  }

  // Role management
  async assignRole(userId: string, roleId: string): Promise<User> {
    return apiService.post('/users/assign-role', { userId, roleId });
  }

  async updateUserRole(userRoleId: string, updates: Partial<Role>): Promise<User> {
    return apiService.put(`/users/roles/${userRoleId}`, updates);
  }

  async getUsersByRole(roleId: string): Promise<User[]> {
    return apiService.get(`/users/by-role/${roleId}`);
  }

  async getApprovers(level: number): Promise<User[]> {
    return apiService.get(`/users/approvers/${level}`);
  }

  // Biodata verification endpoints
  async verifyBiodata(phoneNumber: string): Promise<BiodataVerificationResponse> {
    return apiService.post('/biodata/verify', { phoneNumber });
  }

  async validateOTP(otp: string): Promise<{ message: string }> {
    return apiService.post('/biodata/verify/otp', { otp });
  }

  // Add this new method
  async refreshToken(refreshToken: string): Promise<{ 
    accessToken: string; 
    refreshToken: string; 
    expiresIn: number;
  }> {
    return apiService.post<{ accessToken: string; refreshToken: string; expiresIn: number }>(
      '/auth/refresh-token', 
      { refreshToken }
    );
  }
}

export const authApi = new AuthApiService();