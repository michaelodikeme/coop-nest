import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionService } from '@/lib/api/services/transactionService';
import { 
  TransactionQueryParams,
  TransactionRecord,
  TransactionSummary,
  TransactionDetailView,
  CreateTransactionPayload
} from '@/types/transaction.types';
import { useToast } from '@/components/molecules/Toast/index';

/**
 * Hook to fetch transactions with filtering and pagination
 */
export function useTransactions(params: TransactionQueryParams = {}) {
  return useQuery({
    queryKey: ['admin-transactions', params],
    queryFn: async () => {
      try {
        // Get the response from the service
        const response = await transactionService.getAllTransactions(params);
        console.log('Transaction response from service:', response);
        
        // The response should already be properly formatted by the service
        // But let's ensure it has the correct structure
        return {
          data: response.data || [],
          meta: {
            totalCount: response.meta?.totalCount || 0,
            totalPages: Math.ceil((response.meta?.totalCount || 0) / (params.limit || 10)),
            currentPage: response.meta?.currentPage || params.page || 1,
            pageSize: response.meta?.pageSize || params.limit || 10
          }
        };
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
        throw error;
      }
    }
  });
}

/**
 * Hook to fetch transaction statistics
 */
export function useTransactionStats() {
  return useQuery({
    queryKey: ['admin-transaction-stats'],
    queryFn: async () => {
      try {
        return await transactionService.getTransactionStats();
      } catch (error) {
        console.error('Failed to fetch transaction stats:', error);
        throw error;
      }
    }
  });
}

/**
 * Hook to fetch transaction summary
 */
export function useTransactionSummary(
  module?: string,
  startDate?: string,
  endDate?: string,
  status?: string,
  groupBy: 'day' | 'week' | 'month' | 'module' | 'type' = 'day'
) {
  return useQuery({
    queryKey: ['admin-transaction-summary', module, startDate, endDate, status, groupBy],
    queryFn: async () => {
      try {
        return await transactionService.getTransactionSummary(
          module, 
          startDate, 
          endDate, 
          status, 
          groupBy
        );
      } catch (error) {
        console.error('Failed to fetch transaction summary:', error);
        throw error;
      }
    }
  });
}

/**
 * Hook to fetch transaction counts by status
 */
export function useTransactionCounts(module?: string) {
  return useQuery({
    queryKey: ['admin-transaction-counts', module],
    queryFn: async () => {
      try {
        return await transactionService.getTransactionCounts(module);
      } catch (error) {
        console.error('Failed to fetch transaction counts:', error);
        throw error;
      }
    }
  });
}

/**
 * Hook to fetch transaction details
 */
export function useTransaction(id: string) {
  return useQuery({
    queryKey: ['transaction', id],
    queryFn: async () => {
      try {
        return await transactionService.getTransaction(id);
      } catch (error) {
        console.error(`Failed to fetch transaction ${id}:`, error);
        throw error;
      }
    },
    enabled: !!id
  });
}

/**
 * Hook to create a new transaction
 */
export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const toast = useToast();
  
  return useMutation({
    mutationFn: (data: CreateTransactionPayload) => 
      transactionService.createTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-transaction-stats'] });
      toast.success('Transaction created successfully');
    },
    onError: (error) => {
      console.error('Failed to create transaction:', error);
      toast.error('Failed to create transaction');
    }
  });
}

/**
 * Hook to update transaction status
 */
export function useUpdateTransactionStatus() {
  const queryClient = useQueryClient();
  const toast = useToast();
  
  return useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) => 
      transactionService.updateTransactionStatus(id, status, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction', variables.id] });
      toast.success(`Transaction ${variables.status.toLowerCase()} successfully`);
    },
    onError: (error) => {
      console.error('Failed to update transaction status:', error);
      toast.error('Failed to update transaction status');
    }
  });
}

/**
 * Hook to reverse a transaction
 */
export function useReverseTransaction() {
  const queryClient = useQueryClient();
  const toast = useToast();
  
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => 
      transactionService.reverseTransaction(id, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction', variables.id] });
      toast.success('Transaction reversed successfully');
    },
    onError: (error) => {
      console.error('Failed to reverse transaction:', error);
      toast.error('Failed to reverse transaction');
    }
  });
}

/**
 * Hook to fetch recent transactions for the activity feed
 */
export function useRecentTransactions(limit = 10) {
  return useQuery({
    queryKey: ['recent-transactions', limit],
    queryFn: async () => {
      try {
        // Get recent transactions with minimal pagination
        // Backend expects sort in format 'field:order' (e.g., 'createdAt:desc')
        const response = await transactionService.getAllTransactions({
          page: 1,
          limit: limit,
          // Sort by most recent first - combined format for backend
          sort: 'createdAt:desc'
        });

        console.log('Recent transactions for activity feed:', response);
        return response.data || [];
      } catch (error) {
        console.error('Error fetching recent transactions:', error);
        throw error;
      }
    },
    staleTime: 60000, // 1 minute cache
    refetchInterval: 120000, // Auto-refresh every 2 minutes
  });
}