'use client';

import { useAuth } from '@/hooks/auth/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoadingScreen from '@/components/common/LoadingScreen';

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    } else if (!isLoading && user && user.role?.name !== 'MEMBER') {
      router.replace('/admin/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user || user.role?.name !== 'MEMBER') {
    return null;
  }

  return <>{children}</>;
}