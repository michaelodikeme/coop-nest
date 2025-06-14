import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountService } from '@/lib/api/services/accountService';
import { useToast } from '@/components/molecules/Toast';
import type { BankAccount } from '@/types/account.types';

/**
 * Helper function to unwrap API responses
 */
function unwrapResponse<T>(response: any): T {
  if (!response) return null as T;
  
  // Check if response has a standard API wrapper structure
  if (response.data !== undefined && 
      response.status !== undefined && 
      (response.status === 'success' || response.success === true)) {
    return response.data as T;
  }
  
  return response as T;
}

interface UseAccountsOptions {
  page?: number;
  limit?: number;
  filters?: {
    status?: string;
    verificationStatus?: string;
  };
}

export const useAccounts = (options: UseAccountsOptions = {}) => {
  const { page = 1, limit = 10, filters = {} } = options;
  const queryClient = useQueryClient();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);

  // Fetch accounts with pagination and filters
  const {
    data: rawData,
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ['bank-accounts', page, limit, filters],
    queryFn: async () => {
      try {
        const response = await accountService.getAccounts(page, limit, filters);
        console.log('Raw accounts response:', response);
        
        // Unwrap the response if needed
        const unwrappedData = unwrapResponse(response);
        
        setError(null);
        return unwrappedData;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load member accounts. Please try again later.';
        setError(errorMessage);
        toast.error(errorMessage);
        throw err;
      }
    }
  });
  
  // Process the data to ensure consistent format
  const data = rawData?.data ? rawData : { 
    data: rawData || [], 
    page: page, 
    limit: limit, 
    total: rawData?.length || 0,
    totalPages: Math.ceil((rawData?.length || 0) / limit)
  };

  // Add a new bank account
  const { mutate: addAccount, isPending: isAdding } = useMutation({
    mutationFn: async (accountData: {
      bankId: string;
      accountNumber: string;
      accountName: string;
      bvn?: string;
    }) => {
      try {
        const response = await accountService.createAccount(accountData);
        return unwrapResponse(response);
      } catch (error) {
        console.error('Error adding account:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Bank account added successfully');
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      setError(null);
    },
    onError: (err) => {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add bank account';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  });

  // Verify an account
  const { mutate: verifyAccount, isPending: isVerifying } = useMutation({
    mutationFn: async (verificationData: { accountNumber: string; bankCode: string }) => {
      try {
        const response = await accountService.verifyAccount(verificationData);
        return unwrapResponse(response);
      } catch (error) {
        console.error('Error verifying account:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      if (data.isValid) {
        toast.success('Account verification successful');
      } else {
        toast.warning('Account verification failed');
      }
      setError(null);
    },
    onError: (err) => {
      const errorMessage = err instanceof Error ? err.message : 'Failed to verify account';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  });

  // Request update to an account
  const { mutate: updateAccount, isPending: isUpdating } = useMutation({
    mutationFn: async ({ 
      id, 
      updatedDetails,
      reason = 'Admin update' 
    }: { 
      id: string; 
      updatedDetails: Partial<BankAccount>;
      reason?: string;
    }) => {
      try {
        const response = await accountService.requestAccountUpdate(id, updatedDetails, reason);
        return unwrapResponse(response);
      } catch (error) {
        console.error('Error updating account:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Bank account updated successfully');
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      setError(null);
    },
    onError: (err) => {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update bank account';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  });

  return {
    accounts: data.data || [],
    pagination: {
      currentPage: data.page || page,
      totalPages: data.totalPages || 1,
      totalItems: data.total || 0,
      limit: data.limit || limit
    },
    isLoading,
    isError,
    error,
    refetch,
    addAccount,
    isAdding,
    updateAccount,
    isUpdating,
    verifyAccount,
    isVerifying,
    setError
  };
};