import { User } from '@/types/user.types';
import { RoleAssignment } from '@/types/auth.types';

/**
 * Checks if a user has admin privileges
 * @param user The user object to check
 * @returns boolean indicating if user has admin privileges
 */
export function isAdminUser(user: User | null): boolean {
  return hasRole(user, ['ADMIN', 'SUPER_ADMIN', 'CHAIRMAN', 'TREASURER']);
}

/**
 * Checks if a user is a regular member (non-admin)
 * @param user The user object to check
 * @returns boolean indicating if the user is a member only
 */
export function isMemberUser(user: User | null): boolean {
  return hasRole(user, ['MEMBER']);
}

/**
 * Gets user's highest role name for display
 * @param user The user object
 * @returns The display name of the user's highest role
 */
export function getUserRoleDisplay(user: User | null): string {
  if (!user) return 'Guest';

  // Check role assignment first
  if (user.roleAssignment?.role?.name) {
    return user.roleAssignment.role.name.replace(/_/g, ' ').toLowerCase();
  }

  // Then check direct role
  if (user.role?.name) {
    return user.role.name.replace(/_/g, ' ').toLowerCase();
  }

  // Fall back to flags
  if (isAdminUser(user)) return 'Admin';
  if (isMemberUser(user)) return 'Member';

  return 'User';
}

/**
 * Extract role name from JWT payload
 * @param payload The JWT payload from auth token
 * @returns The role name or null if not found
 */
export function extractRoleFromToken(payload: any): string | null {
  // Check direct role field
  if (payload?.role?.name) {
    return payload.role.name;
  }

  // Check single roleAssignment
  if (payload?.roleAssignment?.role?.name) {
    return payload.roleAssignment.role.name;
  }

  return null;
}

/**
 * Checks if a user has one of the specified roles
 * @param user The user object to check
 * @param roles Array of role names to check against
 * @returns boolean indicating if the user has one of the specified roles
 */
export function hasRole(user: User | null, roles: string[]): boolean {
  if (!user) return false;

  // Check single role assignment
  if (user.roleAssignment?.role?.name) {
    const isActive = user.roleAssignment.isActive;
    const isNotExpired = !user.roleAssignment.expiresAt || new Date(user.roleAssignment.expiresAt) > new Date();

    if (isActive && isNotExpired && roles.includes(user.roleAssignment.role.name)) {
      return true;
    }
  }

  return false;
}

/**
 * Formats raw user data into a normalized User object with
 * flattened permissions, modules, approvalLevel, and role.
 */
export function formatUserData(rawUser: any): User {
  if (!rawUser || typeof rawUser !== 'object') {
    throw new Error('Invalid user data structure');
  }

  let permissions: string[] = [];
  let modules: string[] = [];
  let approvalLevel = 0;
  let role: any = rawUser.role || null;

  // Handle single role assignment
  if (rawUser.roleAssignment && rawUser.roleAssignment.role) {
    const assignment = rawUser.roleAssignment;
    role = assignment.role;

    // Extract permissions from the single role
    permissions = Array.isArray(assignment.role.permissions)
      ? assignment.role.permissions.map((p: any) => (typeof p === 'string' ? p : p?.name)).filter(Boolean)
      : [];

    // Extract modules from the single role
    modules = Array.isArray(assignment.role.moduleAccess)
      ? assignment.role.moduleAccess.map((m: any) => (typeof m === 'string' ? m : m?.name)).filter(Boolean)
      : [];

    approvalLevel = assignment.role.approvalLevel || 0;
  } else if (rawUser.role) {
    // Fallback if role is directly on user object
    permissions = Array.isArray(rawUser.role.permissions)
      ? rawUser.role.permissions.map((p: any) => (typeof p === 'string' ? p : p?.name)).filter(Boolean)
      : [];
    modules = Array.isArray(rawUser.role.moduleAccess)
      ? rawUser.role.moduleAccess.map((m: any) => (typeof m === 'string' ? m : m?.name)).filter(Boolean)
      : [];
    approvalLevel = rawUser.role.approvalLevel || 0;
  }

  // Compose the formatted user object
  const formattedUser = {
    id: rawUser.id,
    username: rawUser.username || '',
    email: rawUser.email || '',
    role,
    permissions,
    approvalLevel,
    modules,
    biodataId: rawUser.biodataId || rawUser.biodata?.id || '',
    biodata: rawUser.biodata || null,
    isMember:
      rawUser.isMember === true ||
      (rawUser.roleAssignment &&
        rawUser.roleAssignment.role &&
        rawUser.roleAssignment.role.name &&
        (rawUser.roleAssignment.role.name === 'MEMBER' ||
          rawUser.roleAssignment.role.name.toUpperCase() === 'MEMBER' ||
          rawUser.roleAssignment.role.name.includes('MEMBER'))),
    isActive: rawUser.isActive !== false,
    roleAssignment: rawUser.roleAssignment || null,
    session: rawUser.session || null,
    createdAt: rawUser.createdAt,
    updatedAt: rawUser.updatedAt,
    adminProfile: rawUser.adminProfile || null,
    data: rawUser.data || null,
  };

  // Debug output for development
  if (process.env.NODE_ENV !== 'production') {
    console.log('Formatted user:', {
      username: formattedUser.username,
      permissions: formattedUser.permissions,
      modules: formattedUser.modules,
      approvalLevel: formattedUser.approvalLevel,
      isMember: formattedUser.isMember,
      isActive: formattedUser.isActive,
      role: formattedUser.role?.name,
      roleAssignment: formattedUser.roleAssignment?.role?.name,
    });
  }

  return formattedUser;
}