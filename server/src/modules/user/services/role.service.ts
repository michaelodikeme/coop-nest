import {
  ICreateRoleInput,
  IUpdateRoleInput,
  IRoleQueryFilters
} from '../interfaces/role.interface';
import { ApiError } from '../../../utils/apiError';
import { DEFAULT_ROLES, RoleDefinition } from '../../../types/permissions';

import { prisma } from '../../../utils/prisma';

export class RoleService {
  /**
   * Find a role by ID
   */
  async findRoleById(roleId: string) {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new ApiError('Role not found', 404);
    }

    return role;
  }

  /**
   * Find a role by name
   */
  async findRoleByName(name: string) {
    const role = await prisma.role.findFirst({
      where: { name: name.toUpperCase() },
    });

    return role;
  }

  /**
   * Get all roles with optional filters
   */
  async getRoles(filters?: IRoleQueryFilters) {
    const roles = await prisma.role.findMany({
      where: filters,
      orderBy: {
        approvalLevel: 'desc',
      },
    });

    return roles;
  }

  /**
   * Get roles by approval level
   */
  async getRolesByApprovalLevel(level: number) {
    const roles = await prisma.role.findMany({
      where: {
        approvalLevel: level,
      },
    });

    return roles;
  }

  /**
   * Get roles that can approve at a specific level
   */
  async getApproverRoles(level: number) {
    const roles = await prisma.role.findMany({
      where: {
        approvalLevel: level,
        canApprove: true,
      },
    });

    return roles;
  }

  /**
   * Create a new role
   */
  async createRole(input: ICreateRoleInput) {
    // Check if role with same name already exists
    const existingRole = await prisma.role.findFirst({
      where: { name: input.name.toUpperCase() },
    });

    if (existingRole) {
      throw new ApiError('Role with this name already exists', 400);
    }

    const role = await prisma.role.create({
      data: {
        name: input.name.toUpperCase(),
        description: input.description,
        permissions: input.permissions,
        approvalLevel: input.approvalLevel,
        canApprove: input.canApprove,
        moduleAccess: input.moduleAccess as string[],
      },
    });

    return role;
  }

  /**
   * Update a role
   */
  async updateRole(roleId: string, input: IUpdateRoleInput) {
    // Check if role exists
    const existingRole = await this.findRoleById(roleId);

    // Check if it's a system role (from DEFAULT_ROLES)
    const isSystemRole = DEFAULT_ROLES.some(
      (r: RoleDefinition) => r.name === existingRole.name && r.isSystem
    );

    if (isSystemRole) {
      throw new ApiError(
        'Cannot modify system roles. System roles are predefined and protected.',
        403
      );
    }

    const role = await prisma.role.update({
      where: { id: roleId },
      data: {
        description: input.description,
        permissions: input.permissions,
        approvalLevel: input.approvalLevel,
        canApprove: input.canApprove,
        moduleAccess: input.moduleAccess as string[] | undefined,
      },
    });

    return role;
  }

  /**
   * Delete a role
   */
  async deleteRole(roleId: string) {
    // Check if role exists
    const existingRole = await this.findRoleById(roleId);

    // Check if it's a system role
    const isSystemRole = DEFAULT_ROLES.some(
      (r: RoleDefinition) => r.name === existingRole.name && r.isSystem
    );

    if (isSystemRole) {
      throw new ApiError(
        'Cannot delete system roles. System roles are protected.',
        403
      );
    }

    // Check if any users have this role
    const usersWithRole = await prisma.userRole.count({
      where: {
        roleId,
        isActive: true,
      },
    });

    if (usersWithRole > 0) {
      throw new ApiError(
        `Cannot delete role. ${usersWithRole} user(s) currently have this role assigned.`,
        400
      );
    }

    await prisma.role.delete({
      where: { id: roleId },
    });

    return { success: true, message: 'Role deleted successfully' };
  }

  /**
   * Validate if a role definition matches DEFAULT_ROLES
   */
  getRoleDefinition(roleName: string): RoleDefinition | undefined {
    return DEFAULT_ROLES.find((r: RoleDefinition) => r.name === roleName);
  }

  /**
   * Check if a role is a system role
   */
  isSystemRole(roleName: string): boolean {
    const roleDefinition = this.getRoleDefinition(roleName);
    return roleDefinition?.isSystem === true;
  }
}

export const roleService = new RoleService();
