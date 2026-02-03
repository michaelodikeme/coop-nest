import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { savingsService } from '@/lib/api/services/savingsService';
import { loanService } from '@/lib/api/services/loanService';
import { transactionService } from '@/lib/api/services/transactionService';
import { apiService } from '@/lib/api/apiService';
import { useToast } from '@/components/molecules/Toast';
import { Loan, LoanSummary } from '@/types/loan.types';
import { SavingsRecord, WithdrawalStatus } from '@/types/financial.types';
import { RequestStatus, RequestType } from '@/types/request.types';

// Enhanced hook for all savings with better filtering
export function useAdminSavings(page = 1, limit = 10, filters = {}) {
  return useQuery({
    queryKey: ['admin-savings', page, limit, filters],
    queryFn: async () => {
      try {
        const response = await savingsService.getAllSavings(page, limit, filters);
        // Service already unwraps, so return as-is
        return response;
      } catch (error) {
        console.error('Error fetching savings:', error);
        throw error;
      }
    },
    placeholderData: (previousData) => previousData,
  });
}

// Enhanced savings summary hook
export function useAdminSavingsSummary() {
  const currentYear = new Date().getFullYear();
  
  return useQuery({
    queryKey: ['admin-savings-summary', currentYear],
    queryFn: async () => {
      try {
        // Return the direct response from savingsService without extracting .data
        const response = await savingsService.getAdminSavingsSummary();
        return response; // Return the full transformed object
      } catch (error) {
        console.error('Error fetching savings summary:', error);
        throw error;
      }
    },
  });
}

// Monthly savings hook with fixed structure
export function useAdminMonthlySavings(year: number, month: number, page = 0, limit = 50) {
  return useQuery({
    queryKey: ['admin-monthly-savings', year, month, page, limit],
    queryFn: async () => {
      try {
        // Pass pagination params to the API call
        const response = await savingsService.getMonthlySavings(year, month, {page, limit}) as any;

        return response.data || response;
      } catch (error) {
        console.error(`Error fetching monthly savings for ${month}/${year}:`, error);
        throw error;
      }
    },
    enabled: !!year && !!month,
  });
}

// Enhanced file upload hook with better error handling
export function useAdminSavingsUpload() {
  const queryClient = useQueryClient();
  const toast = useToast();
  
  return useMutation({
    mutationFn: async (file: File) => {
      try {
        // Check file type and size
        if (!['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'].includes(file.type)) {
          throw new Error('Please upload only Excel (.xlsx) or CSV files');
        }
        
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          throw new Error('File size exceeds the 5MB limit');
        }
        
        return await savingsService.uploadBulkSavings(file);
      } catch (error) {
        console.error('Error in upload mutation:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate multiple queries to ensure data is refreshed
      queryClient.invalidateQueries({ queryKey: ['admin-savings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-savings-summary'] });
      queryClient.invalidateQueries({ queryKey: ['admin-monthly-savings'] });
      toast.success('Savings data uploaded successfully');
    },
    onError: (error: any) => {
      console.error('Failed to upload savings:', error);
      toast.error(error?.message || 'Failed to upload savings data. Please check file format and try again.');
    }
  });
}

// New hook for withdrawal requests
export function useAdminWithdrawalRequests(page = 1, limit = 10, filters: { status?: string, search?: string } = {}) {
  return useQuery({
    queryKey: ['admin-withdrawal-requests', page, limit, filters],
    queryFn: async () => {
      try {
        const response = await savingsService.getWithdrawalRequests({
          page,
          limit,
          status: filters.status as RequestStatus,
          ...(filters.search ? { search: filters.search } : {})
        });
        console.log('Withdrawal requests response:', response);
        return response;
      } catch (error) {
        console.error('Error fetching withdrawal requests:', error);
        throw error;
      }
    },
    placeholderData: (previousData) => previousData,
  });
}

// New hook for withdrawal request processing
export function useProcessWithdrawal() {
  const queryClient = useQueryClient();
  const toast = useToast();
  
  return useMutation({
    mutationFn: async ({ 
      withdrawalId, 
      status, 
      notes,
      isLastApproval = false 
    }: { 
      withdrawalId: string, 
      status: RequestStatus, 
      notes?: string,
      isLastApproval?: boolean
    }) => {
      return await savingsService.updateWithdrawalStatus(withdrawalId, {
        status,
        notes,
        isLastApproval
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawal-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-savings-summary'] });
      queryClient.invalidateQueries({ queryKey: ['withdrawal-details', variables.withdrawalId] });
      queryClient.invalidateQueries({ queryKey: ['admin-members-savings-summary'] });
      queryClient.invalidateQueries({ queryKey: ['admin-transaction-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-monthly-stats'] });
      queryClient.invalidateQueries({ queryKey: ['my-personal-savings-summary'] });
      queryClient.invalidateQueries({ queryKey: ['my-savings-summary'] });
      queryClient.invalidateQueries({ queryKey: ['admin-personal-savings'] });
      queryClient.invalidateQueries({ queryKey: ['personal-savings-details'] });
      queryClient.invalidateQueries({ queryKey: ['admin-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['my-transactions'] }); // Member transaction history
      toast.success('Withdrawal request updated successfully');
    },
    onError: (error: any) => {
      console.error('Failed to process withdrawal:', error);
      toast.error(error?.message || 'Failed to process withdrawal request');
    }
  });
}

// New hook for withdrawal statistics
export function useWithdrawalStatistics(dateRange?: { startDate?: string, endDate?: string }) {
  return useQuery({
    queryKey: ['withdrawal-statistics', dateRange?.startDate, dateRange?.endDate],
    queryFn: async () => {
      try {
        return await savingsService.getWithdrawalStatistics(dateRange);
      } catch (error) {
        console.error('Failed to fetch withdrawal statistics:', error);
        throw error;
      }
    }
  });
}

export function useAdminLoans(page = 1, limit = 10, filters = {}) {
  return useQuery({
    queryKey: ['admin-loans', page, limit, filters],
    queryFn: async () => {
      const response = await loanService.getLoans(page, limit, filters);
      // For debugging
      console.log('Loans API response:', response);
      return response; // The response is already structured correctly
    },
    placeholderData: (previousData) => previousData,
  });
}

export function useAdminLoanTypes() {
  return useQuery({
    queryKey: ['admin-loan-types'],
    queryFn: async () => {
      try {
        // Explicitly type the response as any or a more specific type if available
        const response: any = await loanService.getLoanTypes();
        
        // Check the response structure and ensure we return an array
        console.log('Loan types response:', response);
        
        // If response is already an array, return it
        if (Array.isArray(response)) {
          return response;
        }

        if (response && response.data) {
          // If response has a data property, return that
          return response.data;
        }
        
        // Default fallback
        return [];
      } catch (error) {
        console.error('Error fetching loan types:', error);
        return [];
      }
    },
  });
}

export function useAdminLoansSummary() {
  return useQuery({
    queryKey: ['admin-loan-summary'],
    queryFn: async () => {
      const response = await loanService.getLoansSummary();
      // For debugging
      console.log('Loan Summary API response:', response);
      return response; // Return the unwrapped data
    },
  });
}

export function useAdminShares(page = 1, limit = 10, search = '') {
  return useQuery({
    queryKey: ['admin-shares', page, limit, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        type: 'SHARE',
      });
      
      if (search) params.append('search', search);
      
      return await apiService.get(`/savings?${params.toString()}`);
    },
  });
}

export function useSharesConfig() {
  return useQuery({
    queryKey: ['shares-config'],
    queryFn: async () => {
      try {
        return await apiService.get('/settings/shares');
      } catch (error) {
        console.error('Failed to fetch share amount:', error);
        return { shareValue: 5000 }; // Default value
      }
    },
  });
}

export function useSharesSummary() {
  return useQuery({
    queryKey: ['shares-summary'],
    queryFn: async () => {
      try {
        return await apiService.get('/savings/summary?type=SHARE');
      } catch (error) {
        console.error('Failed to fetch shares summary:', error);
        throw error;
      }
    },
  });
}

export function useUpdateSharePrice() {
  const queryClient = useQueryClient();
  const toast = useToast();
  
  return useMutation({
    mutationFn: async (newPrice: number) => {
      return await apiService.put('/settings/shares', { shareValue: newPrice });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shares-config'] });
      toast.success('Share price updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update share price:', error);
      toast.error('Failed to update share price');
    },
  });
}

export function useIssueShares(shareValue: number) {
  const queryClient = useQueryClient();
  const toast = useToast();
  
  return useMutation({
    mutationFn: async (data: { biodataId: string, quantity: number }) => {
      return await apiService.post('/savings', {
        biodataId: data.biodataId,
        type: 'SHARE',
        amount: data.quantity * shareValue,
        quantity: data.quantity,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-shares'] });
      queryClient.invalidateQueries({ queryKey: ['shares-summary'] });
      toast.success('Shares issued successfully');
    },
    onError: (error) => {
      console.error('Failed to issue shares:', error);
      toast.error('Failed to issue shares');
    },
  });
}

export function useAdminTransactions(page = 1, limit = 10, filters = {}) {
  return useQuery({
    queryKey: ['admin-transactions', page, limit, filters],
    queryFn: async () => {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      // Add filters to query params
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value as string);
      });
      
      return await apiService.get(`/transactions?${queryParams.toString()}`);
    },
  });
}

export function useTransactionStats() {
  return useQuery({
    queryKey: ['transaction-stats'],
    queryFn: async () => {
      try {
        return await transactionService.getTransactionStats();
      } catch (error) {
        console.error('Failed to fetch transaction stats:', error);
        throw error;
      }
    },
  });
}

/**
 * Enhanced loan summary with additional metrics and trend data
 */
export function useEnhancedLoansSummary(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['admin-loans-summary-enhanced', startDate, endDate],
    queryFn: async () => {
      // Get the basic loan summary
      const response = await loanService.getLoansSummaryWithTrends(startDate, endDate);
      console.log('Enhanced Loan Summary API response:', response);
      
      // Add enhanced metrics to the summary
      return {
        ...response,
        pendingLoans: response.pendingLoans || 0,
        newLoansCount: response.newLoansCount || 0,
        totalRepaid: response.totalDisbursed - response.totalOutstanding || 0
      };
    },
  });
}

/**
 * Custom hook for fetching member-centric savings summary
 * This provides an optimized view showing one row per member with aggregated totals
 */
export function useMembersSavingsSummary(
  page = 1, 
  limit = 10, 
  filters: {
    search?: string;
    department?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    status?: string;
  } = {}
) {
  return useQuery({
    queryKey: ['members-savings-summary', page, limit, filters],
    queryFn: async () => {
      try {
        const response = await savingsService.getMembersSummary({
          page,
          limit,
          ...filters
        });
        console.log('Members savings summary response:', response);
        // Service already unwraps, return as-is
        return response;
      } catch (error) {
        console.error('Error fetching members savings summary:', error);
        throw error;
      }
    },
    placeholderData: (previousData) => previousData,
  });
}

// Add this function to the existing file

export function useWithdrawalDetails(withdrawalId: string) {
  return useQuery({
    queryKey: ['withdrawal-details', withdrawalId],
    queryFn: async () => {
      try {
        const result = await savingsService.getWithdrawalRequestById(withdrawalId);
        return result.data;
      } catch (error) {
        console.error('Failed to fetch withdrawal details:', error);
        throw error;
      }
    },
    enabled: !!withdrawalId,
  });
}

// Make sure the useApprovals hook is available in a file like:
// c:\Users\miche\OneDrive\Desktop\coop-nest\coop-nest\client\src\lib\hooks\admin\useApprovals.ts

export function useWithdrawalRequestApprovals(
  type: string[],
  page = 1,
  limit = 10,
  status?: string,
  search?: string
) {
  return useQuery({
    queryKey: ['approvals', type, page, limit, status, search],
    queryFn: async () => {
      try {
        return await savingsService.getWithdrawalRequests({
          page,
          limit,
          status: status === 'ALL' ? undefined : (status as RequestStatus),
          type: type as RequestType[],
          search
        });
      } catch (error) {
        console.error('Failed to fetch approvals:', error);
        throw error;
      }
    }
  });
}

// Add this export at the bottom
export { useMonthlyFinancialData } from './useMonthlyFinancialData';
export { useRecentTransactions } from './useAdminTransactions';
export { useActivityFeedData } from './useActivityFeedData';
