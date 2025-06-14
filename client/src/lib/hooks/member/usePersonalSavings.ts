import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { personalSavingsService } from '@/lib/api/services/personalSavingsService';
import { requestService } from '@/lib/api/services/requestService';
import { useToast } from '@/components/molecules/Toast';
import { BalanceHistory, RequestStatus } from '@/types/personal-savings.types';

export function usePersonalSavingsPlans(params?: any) {
  return useQuery({
    queryKey: ['personalSavingsPlans', params],
    queryFn: () => personalSavingsService.getPersonalSavingsPlans({
      ...params,
      includePending: params?.includePending !== false // Default to true
    }),
  });
}

export function usePersonalSavingsPlan(id?: string) {
  return useQuery({
    queryKey: ['personalSavingsPlan', id],
    queryFn: () => personalSavingsService.getPersonalSavingsPlanById(id!),
    enabled: !!id,
  });
}

export function useCreatePersonalSavingsPlan() {
  const queryClient = useQueryClient();
  const toast = useToast();
  
  return useMutation({
    mutationFn: personalSavingsService.requestPersonalSavingsPlan,
    onSuccess: () => {
      toast.success('Personal savings plan request submitted successfully');
      queryClient.invalidateQueries({ queryKey: ['personalSavingsPlans'] });
      queryClient.invalidateQueries({ queryKey: ['personalSavingsMemberSummary'] });
    },
    onError: (error: any) => {
      toast.error('Failed to submit request');
      console.error('Error creating personal savings plan:', error);
    }
  });
}

export function useProcessDeposit() {
  const queryClient = useQueryClient();
  const toast = useToast();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => 
      personalSavingsService.processDeposit(id, data),
    onSuccess: (_, { id }) => {
      toast.success('Deposit processed successfully');
      queryClient.invalidateQueries({ queryKey: ['personalSavingsPlan', id] });
      queryClient.invalidateQueries({ queryKey: ['personalSavingsPlans'] });
      queryClient.invalidateQueries({ queryKey: ['personalSavingsMemberSummary'] });
    },
    onError: (error: any) => {
      toast.error('Failed to process deposit');
      console.error('Error processing deposit:', error);
    }
  });
}

export function useRequestWithdrawal() {
  const queryClient = useQueryClient();
  const toast = useToast();
  
  return useMutation({
    mutationFn: ({id, data}: {id: string, data: any}) => 
      personalSavingsService.requestWithdrawal(id, data),
    onSuccess: () => {
      toast.success('Withdrawal request submitted successfully');
      queryClient.invalidateQueries({ queryKey: ['personalSavingsPlans'] });
      queryClient.invalidateQueries({ queryKey: ['personalSavingsMemberSummary'] });
    },
    onError: (error: any) => {
      toast.error('Failed to submit withdrawal request');
      console.error('Error requesting withdrawal:', error);
    }
  });
}

export function useBalanceHistory(id?: string, params?: any) {
  return useQuery({
    queryKey: ['personalSavingsBalanceHistory', id, params],
    queryFn: async () => {
      try {
        // Get balance history from the API
        const response = await personalSavingsService.getBalanceHistory(id!, params);
        
        // Extract the data from the response
        const rawData = response || response;
        
        // Create a clean BalanceHistory object with the required structure
        const formattedData: BalanceHistory = {
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
                  month: monthDisplay,
                  balance: Number(item.balance),
                  date: item.date
                });
              }
            } else {
              monthlyMap.set(monthKey, {
                month: monthDisplay,
                balance: Number(item.balance),
                date: item.date
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

export function useTransactionHistory(id?: string, params?: any) {
  return useQuery({
    queryKey: ['transactions', id, params],
    queryFn: () => personalSavingsService.getTransactionHistory(id!, params),
    enabled: !!id,
  });
}

export function useMemberSummary(erpId?: string) {
  return useQuery({
    queryKey: ['personalSavingsMemberSummary', erpId],
    queryFn: async () => {
      const response = await personalSavingsService.getMemberSummary(erpId!);
      
      // Add processing for plan categorization
      if (response.pendingRequests) {
        // Move approved plans with IDs from pendingRequests to activePlans
        const approvedPlansWithIds = response.pendingRequests.filter(
          plan => plan.status === RequestStatus.APPROVED && plan.id
        );
        
        if (approvedPlansWithIds.length > 0) {
          // Remove these from pendingRequests
          response.pendingRequests = response.pendingRequests.filter(
            plan => !(plan.status === RequestStatus.APPROVED && plan.id)
          );
          
          // Add them to activePlans
          response.activePlans = [
            ...response.activePlans,
            ...approvedPlansWithIds
          ];
        }
      }
      
      return response;
    },
    enabled: !!erpId,
  });
}

export function useClosePlan() {
  const queryClient = useQueryClient();
  const toast = useToast();
  
  return useMutation({
    mutationFn: personalSavingsService.closePlan,
    onSuccess: (_, id) => {
      toast.success('Plan closed successfully');
      queryClient.invalidateQueries({ queryKey: ['personalSavingsPlan', id] });
      queryClient.invalidateQueries({ queryKey: ['personalSavingsPlans'] });
      queryClient.invalidateQueries({ queryKey: ['personalSavingsMemberSummary'] });
    },
    onError: (error: any) => {
      toast.error('Failed to close plan');
      console.error('Error closing personal savings plan:', error);
    }
  });
}

export function usePersonalSavingsPlanTypes() {
  return useQuery({
    queryKey: ['personalSavingsPlanTypes'],
    queryFn: async () => {
      try {
        const data = await personalSavingsService.getPersonalSavingsPlanTypes();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error in usePersonalSavingsPlanTypes:', error);
        throw error;
      }
    },
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch pending personal savings request details
 */
export function usePendingSavingsRequest(requestId?: string) {
  const toast = useToast();
  
  return useQuery({
    queryKey: ['personalSavingsPendingRequest', requestId],
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