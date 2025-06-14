import { useQueryWithToast, useMutationWithToast } from '@/lib/hooks/redux/useDataFetching';
import { memberService } from '@/lib/api/services/memberService';
import { userService } from '@/lib/api/services/userService';
import { useQueryClient } from '@tanstack/react-query';
import { Biodata, MemberFormData } from '@/types/member.types';

function unwrapResponse<T>(response: any): T {
  if (!response) return null as T;
  if (response.data !== undefined && response.status !== undefined) {
    return response.data as T;
  }
  return response as T;
}

/**
 * Hook for managing current member's profile
 */
export function useMemberProfile() {
  const queryClient = useQueryClient();
  
  // Get current member biodata
  const biodataQuery = useQueryWithToast(
    ['member-profile'],
    () => memberService.getCurrentMemberBiodata().then(unwrapResponse),
    {
      errorMessage: 'Failed to load your profile information',
      staleTime: 300000, // 5 minutes
      unwrapResponse: false // Already unwrapped above
    }
  );

  // Get current user data (username, roles, etc)
  const userQuery = useQueryWithToast(
    ['current-user'],
    () => userService.getCurrentUser().then(unwrapResponse),
    {
      errorMessage: 'Failed to load user information',
      staleTime: 300000, // 5 minutes
      unwrapResponse: false
    }
  );
  
  // Extract the biodata from response
  // The getCurrentMemberBiodata returns a Member object which contains biodata property
  type MemberResponse = { biodata?: Biodata; biodataId?: string } | Biodata | null | undefined;
  const memberData = biodataQuery.data as MemberResponse;
  const processedBiodata = (memberData && 'biodata' in memberData ? memberData.biodata : memberData) as Biodata | undefined;
  const biodataId = processedBiodata?.id || (memberData && 'biodataId' in memberData ? memberData.biodataId : undefined);
  
  console.log('Member profile hook - full response:', biodataQuery.data);
  console.log('Member profile hook - extracted biodataId:', biodataId);
  console.log('Member profile hook - processed biodata:', processedBiodata);
  
  // Update profile data - now using the correct biodataId
  const updateProfile = useMutationWithToast(
    (data: Partial<MemberFormData>) => {
      if (!biodataId) {
        throw new Error('Cannot update profile: No biodata ID available');
      }
      console.log('Updating biodata with ID:', biodataId, 'and data:', data);
      return memberService.updateBiodata(biodataId, data);
    },
    {
      successMessage: 'Profile updated successfully',
      errorMessage: 'Failed to update profile',
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['member-profile'] });
        queryClient.invalidateQueries({ queryKey: ['member-biodata'] });
      }
    }
  );

  // Change password
  const changePassword = useMutationWithToast(
    (data: { currentPassword: string; newPassword: string }) => 
      userService.changePassword(data.currentPassword, data.newPassword),
    {
      successMessage: 'Password changed successfully',
      errorMessage: 'Failed to change password'
    }
  );
  
  // Bank account management
  const addBankAccount = useMutationWithToast(
    (data: { bankId: string; accountNumber: string; accountName: string }) => {
      if (!biodataId) {
        throw new Error('Cannot add bank account: No biodata ID available');
      }
      return memberService.addBankAccount(biodataId, data);
    },
    {
      successMessage: 'Bank account added successfully',
      errorMessage: 'Failed to add bank account',
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['member-profile'] });
      }
    }
  );

  return {
    profile: processedBiodata,
    biodataId,
    rawData: biodataQuery.data,
    user: userQuery.data,
    isLoading: biodataQuery.isPending || userQuery.isPending,
    error: biodataQuery.error || userQuery.error,
    updateProfile,
    changePassword,
    addBankAccount
  };
}