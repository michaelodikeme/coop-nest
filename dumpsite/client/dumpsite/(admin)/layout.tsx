'use client';

import { useAuth } from '@/hooks/auth/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoadingScreen from '@/components/common/LoadingScreen';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    } else if (!isLoading && user && !['ADMIN', 'SUPER_ADMIN'].includes(user.role?.name ?? '')) {
      router.replace('/member/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role?.name ?? '')) {
    return null;
  }

  return <>{children}</>;
}