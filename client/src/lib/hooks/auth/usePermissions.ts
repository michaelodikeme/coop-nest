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
    if (!user?.roleAssignments) return true;
    
    const assignment = user.roleAssignments.find(ra => ra.role.id === roleId);
    if (!assignment) return true;
    
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
    if (!user || !user.permissions || !isRoleActive()) return false;

    const permissionsToCheck = 
      typeof requiredPermissions === 'string' 
        ? [requiredPermissions] 
        : requiredPermissions;

    return permissionsToCheck.every(permission => 
      user.permissions?.includes(permission)
    );
  }, [user, isRoleActive]);

  /**
   * Check if user has access to the specified module
   */
  const hasModuleAccess = useCallback((requiredModule: Module) => {
    if (!user || !user.modules || !isRoleActive()) return false;
    
    return user.modules.includes(requiredModule);
  }, [user, isRoleActive]);

  /**
   * Check if the user meets or exceeds the specified approval level
   */
  const checkApprovalLevel = useCallback((requiredLevel: number): boolean => {
    if (!user || user.approvalLevel === undefined || !isRoleActive()) return false;
    const userApprovalLevel = user.approvalLevel || 0;
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
    if (!user?.roleAssignments || user.roleAssignments.length === 0) {
      return null;
    }
    
    const expiryDate = user.roleAssignments[0].expiresAt;
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
    roleExpiresAt: user?.roleAssignments?.[0]?.expiresAt,
    permissions: user?.permissions || [],
    modules: user?.modules || [],
    approvalLevel: user?.approvalLevel || 0,
    daysUntilRoleExpiry: daysUntilRoleExpiry(),
    getRoleExpiryDate
  };
}
