import { useQueryWithToast, useMutationWithToast } from '@/lib/hooks/redux/useDataFetching';
import { memberService } from '@/lib/api/services/memberService';
import type { Member, MemberFormData } from '@/types/member.types';
import type { BankAccount } from '@/types/account.types';
import { useQueryClient } from '@tanstack/react-query';
import { MembershipStatus } from '@/types/member.types';

interface MemberFilterParams {
  erpId?: string;
  ippisId?: string;
  staffNo?: string;
  department?: string;
  isVerified?: boolean;
  isApproved?: boolean;
  isDeleted?: boolean;
  membershipStatus?: MembershipStatus;
  searchTerm?: string;
  page?: number;
  limit?: number;
}

/**
 * Hook for managing member data and operations
 * @param page Page number (default: 1)
 * @param limit Items per page (default: 10)
 * @param filters Filtering options
 * @param countOnly If true, only fetches count for dashboard metrics
 */
export function useMembers(page = 1, limit = 10, filters: MemberFilterParams = {}, countOnly = false) {
  const queryClient = useQueryClient();
  
  // Create a stable query key that doesn't change on re-renders
  const queryKey = countOnly 
    ? ['members', 'count'] 
    : ['members', page.toString(), limit.toString(), JSON.stringify(filters)];
  
  // Get paginated members list or just the count
  const membersQuery = useQueryWithToast(
    queryKey,
    () => {
      if (countOnly) {
        // For dashboard, we just need the count, so use a simpler query
        return memberService.getAllBiodata({ limit: 1, page: 1 });
      }
      // Convert membershipStatus to string if present
      const filtersWithStringStatus = {
        ...filters,
        membershipStatus: filters.membershipStatus !== undefined ? String(filters.membershipStatus) : undefined,
        page,
        limit
      };
      return memberService.getAllBiodata(filtersWithStringStatus);
    },
    {
      placeholderData: (prev) => prev,
      errorMessage: 'Failed to load members'
    }
  );
  
  // Create new member
  const createMember = useMutationWithToast(
    (data: MemberFormData) => memberService.createBiodata(data),
    {
      successMessage: 'Member created successfully',
      errorMessage: 'Failed to create member',
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['members'] });
      }
    }
  );
  
  // Update member
  const updateMember = useMutationWithToast(
    ({ id, data }: { id: string; data: Partial<MemberFormData> }) => 
      memberService.updateBiodata(id, data),
    {
      successMessage: 'Member updated successfully',
      errorMessage: 'Failed to update member',
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['members'] });
      }
    }
  );
  
  // Delete member
  const deleteMember = useMutationWithToast(
    (id: string) => memberService.deleteBiodata(id),
    {
      successMessage: 'Member deleted successfully',
      errorMessage: 'Failed to delete member',
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['members'] });
      }
    }
  );
  
  return {
    members: membersQuery.data?.data || [],
    totalMembers: 
      membersQuery.data?.total ??
      (Array.isArray(membersQuery.data?.data) ? membersQuery.data.data.length : 0),
    pagination: membersQuery.data ? {
      total: membersQuery.data.total ??
        (Array.isArray(membersQuery.data.data) ? membersQuery.data.data.length : 0),
      page: membersQuery.data.page,
      limit: membersQuery.data.limit,
      totalPages: membersQuery.data.totalPages
    } : null,
    isLoading: membersQuery.isLoading,
    error: membersQuery.error,
    createMember,
    updateMember,
    deleteMember,
  };
}

/**
 * Hook for working with a single member
 */
export function useMember(id: string | undefined, options = { enabled: true }) {
  const queryClient = useQueryClient();
  
  // Get member by ID
  const memberQuery = useQueryWithToast(
    ['member', id ?? ''],
    () => id ? memberService.getBiodataById(id) : Promise.reject('No member ID provided'),
    {
      enabled: !!id && options.enabled,
      errorMessage: 'Failed to load member details'
    }
  );
  
  // Update member
  const updateMember = useMutationWithToast(
    (data: Partial<MemberFormData>) => {
      if (!id) throw new Error('No member ID provided');
      return memberService.updateBiodata(id, data);
    },
    {
      successMessage: 'Member updated successfully',
      errorMessage: 'Failed to update member',
      onSuccess: (data) => {
        queryClient.setQueryData(['member', id], data);
        queryClient.invalidateQueries({ queryKey: ['members'] });
      }
    }
  );
  
  // Change member status
  const changeMemberStatus = useMutationWithToast(
    (params: { status: 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'; note?: string }) => {
      if (!id) throw new Error('No member ID provided');
      return memberService.updateMembershipStatus(id, params.status, params.note);
    },
    {
      successMessage: (data) => `Member status changed to ${data?.membershipStatus}`,
      errorMessage: 'Failed to change member status',
      onSuccess: (data) => {
        queryClient.setQueryData(['member', id], data);
        queryClient.invalidateQueries({ queryKey: ['members'] });
      }
    }
  );
  
  // Verify member
  const verifyMember = useMutationWithToast(
    () => {
      if (!id) throw new Error('No member ID provided');
      return memberService.verifyMemberBiodata(id);
    },
    {
      successMessage: 'Member verified successfully',
      errorMessage: 'Failed to verify member',
      onSuccess: (data) => {
        queryClient.setQueryData(['member', id], data);
        queryClient.invalidateQueries({ queryKey: ['members'] });
      }
    }
  );
  
  return {
    member: memberQuery.data,
    isLoading: memberQuery.isLoading,
    error: memberQuery.error,
    updateMember,
    changeMemberStatus,
    verifyMember,
  };
}

/**
 * Hook for working with member bank accounts
 */
export function useMemberBankAccounts(memberId: string) {
  const queryClient = useQueryClient();
  
  // Add bank account
  const addBankAccount = useMutationWithToast(
    (accountData: Omit<BankAccount, 'id'>) => {
      if (!memberId) throw new Error('No member ID provided');
      return memberService.addBankAccount(memberId, accountData);
    },
    {
      successMessage: 'Bank account added successfully',
      errorMessage: 'Failed to add bank account',
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['member', memberId] });
      }
    }
  );
  
  return {
    addBankAccount,
  };
}

/**
 * Hook for handling approvals-related operations
 */
export function useApprovals(page = 1, limit = 10) {
  const queryClient = useQueryClient();
  
  // Get unapproved members
  const unapprovedMembersQuery = useQueryWithToast(
    ['unapproved-members', page.toString(), limit.toString()],
    () => memberService.getUnapprovedBiodata(page, limit),
    {
      placeholderData: (prev) => prev,
      errorMessage: 'Failed to load unapproved members'
    }
  );
  
  // Approve member
  const approveMember = useMutationWithToast(
    ({ id, note }: { id: string; note?: string }) => memberService.approveBiodata(id, note),
    {
      successMessage: 'Member approved successfully',
      errorMessage: 'Failed to approve member',
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['unapproved-members'] });
        queryClient.invalidateQueries({ queryKey: ['members'] });
      }
    }
  );
  
  return {
    unapprovedMembers: unapprovedMembersQuery.data?.data || [],
    pagination: unapprovedMembersQuery.data ? {
      total: unapprovedMembersQuery.data.total,
      page: unapprovedMembersQuery.data.page,
      limit: unapprovedMembersQuery.data.limit,
      totalPages: unapprovedMembersQuery.data.totalPages
    } : null,
    isLoading: unapprovedMembersQuery.isLoading,
    error: unapprovedMembersQuery.error,
    approveMember,
  };
}

/**
 * Hook for creating a new member (admin)
 */
export function useCreateMember() {
  return useMutationWithToast(
    (data: MemberFormData) => {
      // Logging for debugging
      console.log('Making API request to:', '/biodata');
      return memberService.createBiodata(data);
    },
    {
      successMessage: 'Member registration request submitted for approval.',
      errorMessage: 'Failed to register member',
    }
  );
}
