import { useCallback } from 'react';
import { useAuth } from '@/lib/api/contexts/AuthContext';
import { Module } from '@/types/permissions.types';

/**
 * Hook that provides methods for checking permissions and access levels
 */
export function usePermissions() {
  const { user } = useAuth();

  /**
   * Check if user role has expired
   */
  const isRoleExpired = useCallback((roleId: string) => {
    if (!user?.roleAssignment) return true;

    const assignment = user.roleAssignment;
    if (assignment.role.id !== roleId) return true;

    return assignment.expiresAt ? new Date(assignment.expiresAt) < new Date() : false;
  }, [user]);
  
  /**
   * Check if the current role is active
   */
  const isRoleActive = useCallback(() => {
    if (!user?.role?.id) return false;
    return !isRoleExpired(user.role.id);
  }, [user, isRoleExpired]);

  /**
   * Check if the user has all the specified permissions
   */
  const hasPermission = useCallback((requiredPermissions: string | string[]) => {
    if (!user || !user.role.permissions || !isRoleActive()) return false;

    const permissionsToCheck = 
      typeof requiredPermissions === 'string' 
        ? [requiredPermissions] 
        : requiredPermissions;

    return permissionsToCheck.every(permission => 
      user.role.permissions?.includes(permission)
    );
  }, [user, isRoleActive]);

  /**
   * Check if user has access to the specified module
   */
  const hasModuleAccess = useCallback((requiredModule: Module) => {
    if (!user || !user.role.moduleAccess || !isRoleActive()) return false;
    
    return user.role.moduleAccess .includes(requiredModule);
  }, [user, isRoleActive]);

  /**
   * Check if the user meets or exceeds the specified approval level
   */
  const checkApprovalLevel = useCallback((requiredLevel: number): boolean => {
    if (!user || user.role.approvalLevel === undefined || !isRoleActive()) return false;
    const userApprovalLevel = user.role.approvalLevel || 0;
    return userApprovalLevel >= requiredLevel;
  }, [user, isRoleActive]);

  /**
   * Check if the user has a specific role
   */
  const hasRole = useCallback((roleName: string) => {
    if (!user || !user.role || !isRoleActive()) return false;
    
    return user.role.name === roleName;
  }, [user, isRoleActive]);

  /**
   * Get role expiry date if exists
   */
  const getRoleExpiryDate = useCallback((): Date | null => {
    if (!user?.roleAssignment) {
      return null;
    }

    const expiryDate = user.roleAssignment.expiresAt;
    return expiryDate ? new Date(expiryDate) : null;
  }, [user]);

  /**
   * Calculate days until role expiry
   */
  const daysUntilRoleExpiry = useCallback((): number | null => {
    const expiryDate = getRoleExpiryDate();
    if (!expiryDate) return null;
    
    const now = new Date();
    return Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }, [getRoleExpiryDate]);

  return {
    hasPermission,
    hasModuleAccess,
    checkApprovalLevel,
    hasRole,
    isRoleExpired,
    isRoleActive,
    roleExpiresAt: user?.roleAssignment?.expiresAt,
    permissions: user?.role.permissions || [],
    modules: user?.role.moduleAccess || [],
    approvalLevel: user?.role.approvalLevel || 0,
    daysUntilRoleExpiry: daysUntilRoleExpiry(),
    getRoleExpiryDate
  };
}
