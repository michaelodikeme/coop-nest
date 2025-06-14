import { useQuery } from '@tanstack/react-query';
import { memberService } from '@/lib/api/services/memberService';
import { useAuth } from '@/lib/api/contexts/AuthContext';
import type { Biodata } from '@/types/member.types';

/**
 * Helper function to unwrap API responses
 */
function unwrapResponse<T>(response: any): T {
  if (!response) return null as T;
  if (response.data !== undefined && response.status !== undefined) {
    return response.data as T;
  }
  return response as T;
}

export function useMemberBiodata() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const biodataId = user?.biodataId || user?.biodata?.id;

  return useQuery<Biodata>({
    queryKey: ['member-biodata', biodataId],
    queryFn: async () => {
      if (!biodataId) throw new Error('No biodata ID available');
      const response = await memberService.getBiodataById(biodataId);
      return unwrapResponse<Biodata>(response);
    },
    enabled: !isAuthLoading && !!biodataId,
    staleTime: 300000,
    retry: 2
  });
}