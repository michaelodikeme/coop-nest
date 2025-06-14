'use client';

import { useAuth } from '@/lib/api/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import LoadingScreen from '@/components/atoms/LoadingScreen';
import AdminLayout from '@/components/templates/admin/AdminLayout';
import { isAdminUser } from '@/lib/utils/roleUtils';
import { useEffect } from 'react';

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isInitializing, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isInitializing && (!isAuthenticated || !isAdminUser(user))) {
      router.replace('/auth/login');
    }
  }, [isLoading, isInitializing, isAuthenticated, user, router]);

  if (isLoading || isInitializing) {
    return <LoadingScreen />;
  }

  // While redirecting, render nothing or a loading screen
  if (!isAuthenticated || !isAdminUser(user)) {
    return <LoadingScreen message="Unauthenticated, Please log in" />;
  }

  return <AdminLayout>{children}</AdminLayout>;
}