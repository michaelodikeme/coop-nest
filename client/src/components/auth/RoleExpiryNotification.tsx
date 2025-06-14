import React from 'react';
import { usePermissions } from '@/lib/hooks/auth/usePermissions';

export const RoleExpiryNotification = () => {
  const { roleExpiresAt, isRoleActive, daysUntilRoleExpiry } = usePermissions();
  
  if (!roleExpiresAt || (isRoleActive() && (daysUntilRoleExpiry === null || daysUntilRoleExpiry > 14))) {
    return null;
  }
  
  if (!isRoleActive) {
    return (
      <div className="role-expiry-alert expired">
        Your role has expired. Some features may be unavailable.
      </div>
    );
  }
  
  return (
    <div className="role-expiry-alert expiring">
      Your role will expire in {daysUntilRoleExpiry} days.
    </div>
  );
};