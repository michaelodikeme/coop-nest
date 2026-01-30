import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { personalSavingsService, CreatePersonalSavingsRequest, RequestWithdrawalData } from '@/lib/api/services/personalSavingsService';

export function usePersonalSavingsTransactions(planId: string, params?: {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  type?: string;
}) {
  return useQuery({
    queryKey: ['personal-savings-transactions', planId, params],
    queryFn: () => personalSavingsService.getPersonalSavingsTransactions(planId, params),
    enabled: !!planId,
  });
}

// Alias for usePersonalSavingsTransactions for components that use this name
export function useTransactionHistory(planId: string, params?: {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  type?: string;
}) {
  return usePersonalSavingsTransactions(planId, params);
}

export function useMemberSummary(erpId: string | undefined) {
  return useQuery({
    queryKey: ['personal-savings-summary', erpId],
    queryFn: () => personalSavingsService.getMemberSummary(erpId!),
    enabled: !!erpId,
  });
}

export function usePersonalSavingsPlans(params?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  return useQuery({
    queryKey: ['personal-savings-plans', params],
    queryFn: () => personalSavingsService.getPersonalSavingsPlans(params),
  });
}

export function usePersonalSavingsPlan(planId: string) {
  return useQuery({
    queryKey: ['personal-savings-plan', planId],
    queryFn: () => personalSavingsService.getPersonalSavingsPlan(planId),
    enabled: !!planId,
  });
}

// Get available personal savings plan types
export function usePersonalSavingsPlanTypes() {
  return useQuery({
    queryKey: ['personal-savings-plan-types'],
    queryFn: () => personalSavingsService.getPersonalSavingsPlanTypes(),
  });
}

// Create a new personal savings plan request
export function useCreatePersonalSavingsPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePersonalSavingsRequest) =>
      personalSavingsService.createPersonalSavingsRequest(data),
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['personal-savings-plans'] });
      queryClient.invalidateQueries({ queryKey: ['personal-savings-summary'] });
    },
  });
}

// Request withdrawal from a personal savings plan
export function useRequestWithdrawal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RequestWithdrawalData }) =>
      personalSavingsService.requestWithdrawal(id, data),
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['personal-savings-plan', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['personal-savings-plans'] });
      queryClient.invalidateQueries({ queryKey: ['personal-savings-summary'] });
    },
  });
}

// Get balance history for charts
export function useBalanceHistory(planId: string, params?: {
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ['personal-savings-balance-history', planId, params],
    queryFn: () => personalSavingsService.getBalanceHistory(planId, params),
    enabled: !!planId,
  });
}

// Get a specific pending savings request
export function usePendingSavingsRequest(requestId: string) {
  return useQuery({
    queryKey: ['pending-savings-request', requestId],
    queryFn: () => personalSavingsService.getPendingSavingsRequest(requestId),
    enabled: !!requestId,
  });
}