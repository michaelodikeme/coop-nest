'use client';

import { useAuth } from '@/lib/api/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import LoadingScreen from '@/components/atoms/LoadingScreen';
import MemberLayout from '@/components/templates/member/MemberLayout';
import { isMemberUser } from '@/lib/utils/roleUtils';
import { useEffect } from 'react';

export default function MemberRootLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isInitializing, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isInitializing && (!isAuthenticated || !isMemberUser(user))) {
      router.replace('/auth/login');
    }
  }, [isLoading, isInitializing, isAuthenticated, user, router]);

  // Show loading screen while checking auth
  if (isLoading || isInitializing) {
    return <LoadingScreen />;
  }

  // Don't render if user is not authenticated
  if (!isAuthenticated || !isMemberUser(user)) {
    return <LoadingScreen message="Unauthenticated, Please log in" />;
  }

  // Render the main layout with children
  return <MemberLayout>{children}</MemberLayout>;
}