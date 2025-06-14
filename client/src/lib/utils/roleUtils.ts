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
  
  // Check for admin roles first in roleAssignments
  const adminRoles = ['SUPER_ADMIN', 'ADMIN', 'CHAIRMAN', 'TREASURER'];
  
  if (user.roleAssignments && user.roleAssignments.length > 0) {
    const adminAssignment = user.roleAssignments.find(
      assignment => adminRoles.includes(assignment.role?.name)
    );
    
    if (adminAssignment) {
      return adminAssignment.role.name.replace(/_/g, ' ').toLowerCase();
    }
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
  
  // Check roleAssignments
  if (payload?.roleAssignments && Array.isArray(payload.roleAssignments) && payload.roleAssignments.length > 0) {
    for (const assignment of payload.roleAssignments) {
      if (assignment?.role?.name) {
        return assignment.role.name;
      }
    }
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

  // Check direct role
  if (user.role?.name && roles.includes(user.role.name)) {
    return true;
  }

  // Check role assignments
  if (user.roleAssignments && user.roleAssignments.length > 0) {
    return user.roleAssignments.some(assignment =>
      assignment.isActive &&
      assignment.role &&
      roles.includes(assignment.role.name) &&
      (!assignment.expiresAt || new Date(assignment.expiresAt) > new Date())
    );
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

  // Flatten from all active role assignments
  if (Array.isArray(rawUser.roleAssignments) && rawUser.roleAssignments.length > 0) {
    const activeAssignments = rawUser.roleAssignments.filter((ra: RoleAssignment) => ra.isActive !== false && ra.role);

    // Use first active as primary role, fallback to first assignment
    const primaryAssignment = activeAssignments[0] || rawUser.roleAssignments[0];
    role = primaryAssignment?.role || null;

    // Flatten permissions and modules from all active assignments
    permissions = [
      ...new Set(
        activeAssignments.flatMap((ra: RoleAssignment) =>
          Array.isArray(ra.role.permissions)
            ? ra.role.permissions.map((p: any) => (typeof p === 'string' ? p : p?.name)).filter(Boolean)
            : []
        ) as string[]
      ),
    ];
    modules = [
      ...new Set(
        activeAssignments.flatMap((ra: RoleAssignment) =>
          Array.isArray(ra.role.moduleAccess)
            ? ra.role.moduleAccess.map((m: any) => (typeof m === 'string' ? m : m?.name)).filter(Boolean)
            : []
        ) as string[]
      ),
    ];
    approvalLevel = Math.max(
      0,
      ...activeAssignments.map((ra: RoleAssignment) => ra.role.approvalLevel || 0)
    );
  } else if (rawUser.role) {
    // Fallback if only one role
    permissions = Array.isArray(rawUser.role.permissions)
      ? rawUser.role.permissions.map((p: any) => (typeof p === 'string' ? p : p?.name)).filter(Boolean)
      : [];
    modules = Array.isArray(rawUser.role.moduleAccess)
      ? rawUser.role.moduleAccess.map((m: any) => (typeof m === 'string' ? m : m?.name)).filter(Boolean)
      : [];
    approvalLevel = rawUser.role.approvalLevel || 0;
  }

  // Compose the formatted user object
  const formattedUser: User = {
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
      (Array.isArray(rawUser.roleAssignments) &&
        rawUser.roleAssignments.some(
          (r: RoleAssignment) =>
            r.isActive !== false &&
            r.role &&
            typeof r.role.name === 'string' &&
            (r.role.name === 'MEMBER' ||
              r.role.name.toUpperCase() === 'MEMBER' ||
              r.role.name.includes('MEMBER'))
        )),
    isActive: rawUser.isActive !== false,
    roleAssignments: Array.isArray(rawUser.roleAssignments) ? rawUser.roleAssignments : [],
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
      roleAssignments: formattedUser.roleAssignments?.length,
    });
  }

  return formattedUser;
}