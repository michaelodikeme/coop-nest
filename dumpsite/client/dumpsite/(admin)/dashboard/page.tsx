'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/auth/auth';
import LoadingScreen from '@/components/common/LoadingScreen';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      // Redirect based on user role
      if (user.role?.name === 'MEMBER') {
        router.replace('/member/dashboard');
      } else if (['ADMIN', 'SUPER_ADMIN'].includes(user.role?.name || '')) {
        router.replace('/admin/dashboard');
      }
    } else if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  return <LoadingScreen message="Loading dashboard..." />;
}