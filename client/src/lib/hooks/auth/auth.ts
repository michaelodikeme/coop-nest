import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth as useAuthContext } from '@/lib/api/contexts/AuthContext';

/**
 * Hook to protect routes that require authentication
 */
export const useAuthProtection = (redirectPath = '/auth/login') => {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuthContext();
  
  useEffect(() => {
    if (!isAuthenticated && pathname !== redirectPath) {
      router.push(redirectPath);
    }
  }, [isAuthenticated, pathname, router, redirectPath]);
};
