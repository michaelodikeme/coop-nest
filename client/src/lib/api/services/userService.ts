import { apiService } from '@/lib/api/apiService';
import type { PaginatedResponse } from '@/types/types';
import type { User, UserFilterParams } from '@/types/user.types';

/**
 * Service for managing users and their roles
 * Implements only the endpoints documented in the API
 */
class UserService {
  /**
   * Get current user profile
   * GET /users/me
   */
  async getCurrentUser(): Promise<User> {
    return apiService.get<User>('/users/me');
  }

  /**
   * Update username (requires approval for non-admin users)
   * POST /users/me/update-username
   */
  async updateUsername(username: string): Promise<{ message: string; requestId?: string } | User> {
    return apiService.post('/users/me/update-username', { username });
  }

  /**
   * Change user password
   * POST /users/me/change-password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    return apiService.post<{ message: string }>('/users/me/change-password', {
      currentPassword,
      newPassword
    });
  }

  /**
   * Get current user permissions
   * GET /users/me/permissions
   */
  async getCurrentUserPermissions(): Promise<{ permissions: string[]; approvalLevel: number }> {
    return apiService.get<{ permissions: string[]; approvalLevel: number }>('/users/me/permissions');
  }

  /**
   * Get current user module access
   * GET /users/me/module-access
   */
  async getCurrentUserModuleAccess(): Promise<string[]> {
    return apiService.get<string[]>('/users/me/module-access');
  }

  /**
   * Get requests assigned to current user for approval
   * GET /users/me/requests/assigned
   */
  async getAssignedRequests(page = 1, limit = 10): Promise<PaginatedResponse<any>> {
    return apiService.get<PaginatedResponse<any>>(`/users/me/requests/assigned?page=${page}&limit=${limit}`);
  }

  /**
   * Get requests initiated by current user
   * GET /users/me/requests/initiated
   */
  async getInitiatedRequests(page = 1, limit = 10): Promise<PaginatedResponse<any>> {
    return apiService.get<PaginatedResponse<any>>(`/users/me/requests/initiated?page=${page}&limit=${limit}`);
  }

  /**
   * Get requests approved by current user
   * GET /users/me/requests/approved
   */
  async getApprovedRequests(page = 1, limit = 10): Promise<PaginatedResponse<any>> {
    return apiService.get<PaginatedResponse<any>>(`/users/me/requests/approved?page=${page}&limit=${limit}`);
  }

  /**
   * Assign role to user
   * POST /users/assign-role
   */
  async assignRole(userId: string, roleId: string, expiresAt?: string): Promise<{ id: string; message: string }> {
    return apiService.post<{ id: string; message: string }>('/users/assign-role', {
      userId,
      roleId,
      expiresAt
    });
  }

  /**
   * Update user role assignment
   * PUT /users/roles/:userRoleId
   */
  async updateRoleAssignment(userRoleId: string, updates: { expiresAt?: string; isActive?: boolean }): Promise<{ message: string }> {
    return apiService.put<{ message: string }>(`/users/roles/${userRoleId}`, updates);
  }

  /**
   * Get users with specific role
   * GET /users/by-role/:roleId
   */
  async getUsersByRole(roleId: string, page = 1, limit = 10): Promise<PaginatedResponse<User>> {
    return apiService.get<PaginatedResponse<User>>(`/users/by-role/${roleId}?page=${page}&limit=${limit}`);
  }

  /**
   * Get users who can approve at specific level
   * GET /users/approvers/:level
   */
  async getApprovers(level: number): Promise<User[]> {
    return apiService.get<User[]>(`/users/approvers/${level}`);
  }

  /**
   * Get roles with specific approval level
   * GET /users/roles/by-level/:level
   */
  async getRolesByLevel(level: number): Promise<{ id: string; name: string; description: string }[]> {
    return apiService.get<{ id: string; name: string; description: string }[]>(`/users/roles/by-level/${level}`);
  }
  /**
   * List all users with filtering
   * GET /users
   */
  async getUsers(filters: UserFilterParams = {}): Promise<User[]> {
    const queryParams = new URLSearchParams();

    // Add filters as string values
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiService.get<{ status: string; data: User[] }>(`/users?${queryParams.toString()}`);
    return response.data;
  }

  /**
   * Get all available roles
   * GET /roles
   */
  async getAllRoles(): Promise<{ id: string; name: string; description: string; approvalLevel: number }[]> {
    const response = await apiService.get<{ status: string; data: any[] }>('/roles');
    return response.data;
  }

  /**
   * Get user details by ID
   * GET /users/:id
   */
  async getUserById(id: string): Promise<User> {
    return apiService.get<User>(`/users/${id}`);
  }

  /**
   * Get user permissions by ID
   * GET /users/:id/permissions
   */
  async getUserPermissions(userId: string): Promise<{ permissions: string[]; approvalLevel: number }> {
    return apiService.get<{ permissions: string[]; approvalLevel: number }>(`/users/${userId}/permissions`);
  }

  /**
   * Get user module access by ID
   * GET /users/:id/module-access
   */
  async getUserModuleAccess(userId: string): Promise<string[]> {
    return apiService.get<string[]>(`/users/${userId}/module-access`);
  }

  /**
   * Update user role
   * Note: Users have one role, change by assigning new role
   */
  async changeUserRole(userId: string, newRoleId: string): Promise<{ message: string }> {
    return this.assignRole(userId, newRoleId);
  }

  /**
   * Create/update admin profile
   * POST /users/:id/admin-profile
   */
  async updateAdminProfile(userId: string, profileData: any): Promise<{ message: string }> {
    return apiService.post<{ message: string }>(`/users/${userId}/admin-profile`, profileData);
  }

  /**
   * Deactivate user account
   * POST /users/:id/deactivate
   */
  async deactivateUser(id: string): Promise<User> {
    return apiService.post<User>(`/users/${id}/deactivate`, {});
  }

  /**
   * Admin change user password
   * POST /admin/users/:id/change-password
   */
  async adminChangeUserPassword(userId: string, newPassword: string): Promise<{ message: string }> {
    return apiService.post<{ message: string }>(`/admin/users/${userId}/change-password`, { newPassword });
  }
}

export const userService = new UserService();
