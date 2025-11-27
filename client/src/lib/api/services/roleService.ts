import { apiService } from '@/lib/api/apiService';
import type { Role, CreateRoleInput, UpdateRoleInput } from '@/types/role.types';

/**
 * Service for managing roles and permissions
 */
class RoleService {
  /**
   * Get all roles
   * GET /roles
   */
  async getAllRoles(): Promise<Role[]> {
    const response = await apiService.get<{ status: string; data: Role[] }>('/roles');
    return response.data;
  }

  /**
   * Get role by ID
   * GET /roles/:id
   */
  async getRoleById(roleId: string): Promise<Role> {
    const response = await apiService.get<{ status: string; data: Role }>(`/roles/${roleId}`);
    return response.data;
  }

  /**
   * Get roles by approval level
   * GET /roles/by-level/:level
   */
  async getRolesByLevel(level: number): Promise<Role[]> {
    const response = await apiService.get<{ status: string; data: Role[] }>(`/roles/by-level/${level}`);
    return response.data;
  }

  /**
   * Get approver roles for a specific level
   * GET /roles/approvers/:level
   */
  async getApproverRoles(level: number): Promise<Role[]> {
    const response = await apiService.get<{ status: string; data: Role[] }>(`/roles/approvers/${level}`);
    return response.data;
  }

  /**
   * Create a new role
   * POST /roles
   */
  async createRole(roleData: CreateRoleInput): Promise<Role> {
    const response = await apiService.post<{ status: string; data: Role }>('/roles', roleData);
    return response.data;
  }

  /**
   * Update a role
   * PUT /roles/:id
   */
  async updateRole(roleId: string, roleData: UpdateRoleInput): Promise<Role> {
    const response = await apiService.put<{ status: string; data: Role }>(`/roles/${roleId}`, roleData);
    return response.data;
  }

  /**
   * Delete a role
   * DELETE /roles/:id
   */
  async deleteRole(roleId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiService.delete<{ status: string; data: { success: boolean; message: string } }>(`/roles/${roleId}`);
    return response.data;
  }
}

export const roleService = new RoleService();
