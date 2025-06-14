'use client';

import { Box } from '@mui/material';
import { withRoleGuard as ProtectedRoute } from '@/hooks/auth/withRoleGuard';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import SavingsPage from '../../(member)/savings/page';

export default function DashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['MEMBER']}>
      <DashboardLayout>
        <Box>
          <SavingsPage />
        </Box>
      </DashboardLayout>
    </ProtectedRoute>
  );
}