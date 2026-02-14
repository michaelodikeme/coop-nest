import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { personalSavingsService } from '@/lib/api/services/personalSavingsService';
import { requestService } from '@/lib/api/services/requestService';
import { RequestType } from '@/types/request.types';
import { useToast } from '@/components/molecules/Toast';
import { PaginatedResponse, PersonalSavingsResponse, AdminDashboard } from '@/types/personal-savings.types';
import { RequestStatus } from '@/types/request.types';

/**
 * Hook to fetch all personal savings plans for admin
 * Including filtering and pagination capabilities
 */
export function useAdminPersonalSavingsPlans(params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sort?: string;
  sortDirection?: 'asc' | 'desc';
}) {
  return useQuery({
    queryKey: ['adminPersonalSavingsPlans', params],
    queryFn: () => personalSavingsService.getPersonalSavingsPlans({
      ...params,
      // For admin view, we want to see pending requests as well
      includePending: true,
      // Ensure sort is only "asc" or "desc"
      sort: params?.sort === 'asc' || params?.sort === 'desc' ? params.sort : undefined,
    }),
  });
}

/**
 * Hook to fetch a specific personal savings plan by ID
 */
export function useAdminPersonalSavingsPlan(id?: string) {
  return useQuery({
    queryKey: ['adminPersonalSavingsPlan', id],
    queryFn: () => personalSavingsService.getPersonalSavingsPlan(id!),
    enabled: !!id,
  });
}

/**
 * Hook to fetch personal savings dashboard data for admin
 */
export function useAdminPersonalSavingsDashboard() {
  const toast = useToast();

  return useQuery<AdminDashboard>({
    queryKey: ['adminPersonalSavingsDashboard'],
    queryFn: async () => {
      try {
        const data = await personalSavingsService.getAdminDashboard();
        return data;
      } catch (error) {
        toast.error('Failed to fetch personal savings dashboard data');
        console.error('Error fetching admin personal savings dashboard:', error);
        throw error;
      }
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

/**
 * Hook to process deposits to personal savings plans
 */
export function useAdminProcessDeposit() {
  const queryClient = useQueryClient();
  const toast = useToast();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => 
      personalSavingsService.processDeposit(id, data),
    onSuccess: (_, { id }) => {
      toast.success('Deposit processed successfully');
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['adminPersonalSavingsPlan', id] });
      queryClient.invalidateQueries({ queryKey: ['adminPersonalSavingsPlans'] });
      queryClient.invalidateQueries({ queryKey: ['adminPersonalSavingsDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['personalSavingsPlan', id] });
    },
    onError: (error: any) => {
      toast.error('Failed to process deposit');
      console.error('Error processing deposit:', error);
    }
  });
}

/**
 * Hook to close a personal savings plan
 */
export function useAdminClosePlan() {
  const queryClient = useQueryClient();
  const toast = useToast();
  
  return useMutation({
    mutationFn: (id: string) => personalSavingsService.closePlan(id),
    onSuccess: (_, id) => {
      toast.success('Plan closed successfully');
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['adminPersonalSavingsPlan', id] });
      queryClient.invalidateQueries({ queryKey: ['adminPersonalSavingsPlans'] });
      queryClient.invalidateQueries({ queryKey: ['adminPersonalSavingsDashboard'] });
    },
    onError: (error: any) => {
      toast.error('Failed to close plan');
      console.error('Error closing personal savings plan:', error);
    }
  });
}

/**
 * Hook to fetch pending personal savings request details or list
 */
export function useAdminPendingPersonalSavingsRequests(
  page: number = 1,
  limit: number = 10,
  status?: string
) {
  const toast = useToast();

  return useQuery({
    queryKey: ['adminPendingPersonalSavingsRequests', page, limit, status],
    queryFn: async () => {
      try {
        const response = await requestService.getAllRequests({
          type: RequestType.PERSONAL_SAVINGS_CREATION,
          page,
          limit,
          status: status as RequestStatus | undefined
        });

        // Service layer already unwraps, just return the response
        return response;
      } catch (error) {
        toast.error('Failed to fetch personal savings approval requests');
        console.error('Error fetching pending personal savings requests:', error);
        throw error;
      }
    },
  });
}

/**
 * Hook to fetch pending personal savings requests for approval
 */
export function useAdminPendingPersonalSavingsRequestsById(
p0: string | undefined, page: number = 1, limit: number = 10, status?: string) {
  const toast = useToast();
  
  return useQuery({
    queryKey: ['adminPendingPersonalSavingsRequests', page, limit, status],
    queryFn: async () => {
      try {
        // Use correct request type
        const response = await requestService.getAllRequests({
          type: RequestType.PERSONAL_SAVINGS_CREATION,
          page,
          limit,
          status: status as RequestStatus | undefined
        });
        console.log('Fetched pending personal savings approval requests:', response);
        return response;
      } catch (error) {
        toast.error('Failed to fetch personal savings approval requests');
        console.error('Error fetching pending personal savings withdrawal requests:', error);
        throw error;
      }
    },
  });
}

/**
 * Hook to fetch pending personal savings withdrawal requests for approval
 */
export function useAdminPendingPersonalSavingsWithdrawals(
  page: number = 1,
  limit: number = 10,
  status?: string
) {
  const toast = useToast();

  return useQuery({
    queryKey: ['adminPendingPersonalSavingsWithdrawals', page, limit, status],
    queryFn: async () => {
      try {
        // Use correct request type
        const response = await requestService.getAllRequests({
          type: RequestType.PERSONAL_SAVINGS_WITHDRAWAL,
          page,
          limit,
          status: status as RequestStatus | undefined
        });
        console.log('Fetched pending personal savings withdrawal requests:', response);
        // Service layer already unwraps, just return the response
        return response;
      } catch (error) {
        toast.error('Failed to fetch personal savings withdrawal requests');
        console.error('Error fetching pending personal savings withdrawal requests:', error);
        throw error;
      }
    },
  });
}

/**
 * Hook to approve or reject a personal savings request
 */
export function useAdminProcessPersonalSavingsRequest() {
  const queryClient = useQueryClient();
  const toast = useToast();
  
  return useMutation({
    mutationFn: ({ 
      requestId, 
      action, 
      notes 
    }: { 
      requestId: string, 
      action: 'approve' | 'reject' | 'review' | 'completed', 
      notes?: string 
    }) => {
      // // Map action to RequestStatus
      // let status: RequestStatus;
      // if (action === 'approve') {
      //   status = RequestStatus.APPROVED;
      // } else if (action === 'reject') {
      //   status = RequestStatus.REJECTED;
      // } else {
      //   status = RequestStatus.REVIEWED;
      // }
      // return requestService.updateRequestStatus(requestId, status, notes);

      let status: RequestStatus;
      switch (action) {
        case 'review':
          status = RequestStatus.REVIEWED;
          break;
        case 'approve':
          status = RequestStatus.APPROVED;
          break;
        case 'completed':
          status = RequestStatus.COMPLETED;
          break;
        case 'reject':
          status = RequestStatus.REJECTED;
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }
      return requestService.updateRequestStatus(requestId, status, notes);
      // ...existing code...
    },
    onSuccess: (_, variables) => {
      toast.success('Request processed successfully');
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['adminPendingPersonalSavingsRequests'] });
      queryClient.invalidateQueries({ queryKey: ['adminPendingPersonalSavingsWithdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['adminPersonalSavingsPlans'] });
      queryClient.invalidateQueries({ queryKey: ['adminPersonalSavingsDashboard'] });
      // Also invalidate the specific request details to prevent stale data
      queryClient.invalidateQueries({ queryKey: ['personalSavingsRequestDetails', variables.requestId] });
    },
    onError: (error: any) => {
      toast.error('Failed to process request');
      console.error('Error processing personal savings request:', error);
    }
  });
}

/**
 * Hook to get transaction history for a specific plan
 */
export function useAdminTransactionHistory(id?: string, params?: any) {
  return useQuery({
    queryKey: ['adminPersonalSavingsTransactions', id, params],
    queryFn: () => personalSavingsService.getTransactionHistory(id!, params),
    enabled: !!id,
  });
}

/**
 * Hook to get balance history for a specific plan
 */
export function useAdminBalanceHistory(id?: string, params?: any) {
  return useQuery({
    queryKey: ['adminPersonalSavingsBalanceHistory', id, params],
    queryFn: async () => {
      try {
        // Get balance history from the API
        const response = await personalSavingsService.getBalanceHistory(id!, params);
        
        // Extract the data from the response
        const rawData = response || response;
        
        // Create a clean BalanceHistory object with the required structure
        const formattedData: {
          daily: { date: string; balance: number }[];
          monthly: { date: string; balance: number; month: string }[];
          history: boolean;
        } = {
          daily: [],
          monthly: [],
          history: false
        };
        
        // Process history array if available
        if (rawData?.history && Array.isArray(rawData.history)) {
          // Process daily data directly from history array
          formattedData.daily = rawData.history
            .map(item => ({
              date: item.date,
              balance: Number(item.balance)
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          
          // Process monthly data by grouping
          const monthlyMap = new Map();
          
          rawData.history.forEach(item => {
            const date = new Date(item.date);
            const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
            const monthDisplay = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
            
            if (monthlyMap.has(monthKey)) {
              const existing = monthlyMap.get(monthKey);
              // Only update if this date is newer than the existing one for this month
              if (date > new Date(existing.date)) {
                monthlyMap.set(monthKey, {
                  date: item.date,
                  balance: Number(item.balance),
                  month: monthDisplay
                });
              }
            } else {
              monthlyMap.set(monthKey, {
                date: item.date,
                balance: Number(item.balance),
                month: monthDisplay
              });
            }
          });
          
          // Convert the map to an array and sort by date
          formattedData.monthly = Array.from(monthlyMap.values())
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        }
        
        return formattedData;
      } catch (error) {
        console.error('Error fetching balance history:', error);
        throw error;
      }
    },
    enabled: !!id,
  });
}

/**
 * Hook to get personal savings plan types
 */
export function useAdminPersonalSavingsPlanTypes() {
  return useQuery({
    queryKey: ['adminPersonalSavingsPlanTypes'],
    queryFn: async () => {
      try {
        const data = await personalSavingsService.getPersonalSavingsPlanTypes();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error in useAdminPersonalSavingsPlanTypes:', error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour since plan types don't change often
  });
}


/**
 * Hook to fetch pending personal savings request details
 */
export function usePersonalSavingsRequestDetails(requestId?: string) {
  const toast = useToast();
  
  return useQuery({
    queryKey: ['personalSavingsRequestDetails', requestId],
    queryFn: async () => {
      if (!requestId) throw new Error("Request ID is required");
      try {
        // Get the request details from request service
        const request = await requestService.getRequestById(requestId);
        return request;
      } catch (error: any) {
        toast.error('Failed to fetch request details: ' + (error.message || 'Unknown error'));
        throw error;
      }
    },
    enabled: !!requestId,
  });
}
