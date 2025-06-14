'use client';

import React from 'react';
import { usePermissions } from '@/lib/hooks/auth/usePermissions';
import { Module } from '@/types/permissions.types';

interface PermissionGateProps {
  children: React.ReactNode;
  permissions?: string | string[];
  module?: Module;
  approvalLevel?: number;
  fallback?: React.ReactNode;
}

/**
 * Component that conditionally renders based on user permissions
 */
const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  permissions,
  module,
  approvalLevel,
  fallback = null
}) => {
  const { hasPermission, hasModuleAccess, checkApprovalLevel } = usePermissions();
  
  // If no restrictions provided, always render children
  if (!permissions && !module && approvalLevel === undefined) {
    return <>{children}</>;
  }

  // Check permissions
  const hasRequiredPermission = permissions 
    ? hasPermission(permissions)
    : true;

  // Check module access
  const hasRequiredModuleAccess = module 
    ? hasModuleAccess(module)
    : true;
    
  // Check approval level
  const hasRequiredApprovalLevel = approvalLevel !== undefined 
    ? checkApprovalLevel(approvalLevel)
    : true;

  // Only render if all checks pass
  if (hasRequiredPermission && hasRequiredModuleAccess && hasRequiredApprovalLevel) {
    return <>{children}</>;
  }

  // Otherwise render fallback
  return <>{fallback}</>;
};

export default PermissionGate;
