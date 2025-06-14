import React from 'react';
import { Chip, ChipProps } from '@mui/material';
import { styled } from '@mui/material/styles';

// Define the possible status types
type MembershipStatus = 'ACTIVE' | 'PENDING' | 'INACTIVE' | 'SUSPENDED' | string;
type VerificationStatus = 'VERIFIED' | 'PENDING' | 'REJECTED' | 'UNVERIFIED' | string;

interface StatusBadgeProps {
  status: string;
  type?: 'membership' | 'verification';
  size?: 'small' | 'medium';
}

/**
 * Status badge component for showing member status with appropriate colors
 */
export const MemberStatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type = 'membership',
  size = 'small'
}) => {
  // Helper function to get color based on status
  const getColorByStatus = (status: string, type: 'membership' | 'verification'): ChipProps['color'] => {
    if (type === 'membership') {
      switch (status.toUpperCase()) {
        case 'ACTIVE':
          return 'success';
        case 'PENDING':
          return 'warning';
        case 'INACTIVE':
          return 'default';
        case 'SUSPENDED':
          return 'error';
        default:
          return 'default';
      }
    } else {
      // Verification status colors
      switch (status.toUpperCase()) {
        case 'VERIFIED':
          return 'success';
        case 'PENDING':
          return 'warning';
        case 'REJECTED':
          return 'error';
        default:
          return 'default';
      }
    }
  };

  const label = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  const color = getColorByStatus(status, type);

  return (
    <Chip
      label={label}
      color={color}
      size={size}
      sx={{
        fontWeight: 500,
        height: size === 'small' ? 24 : 32,
      }}
    />
  );
};
