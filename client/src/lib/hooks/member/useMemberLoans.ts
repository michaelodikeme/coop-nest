import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { loanService } from '@/lib/api';
import { LoanDetails, Loan } from '@/types/loan.types';
import { useQueryWithToast } from '@/lib/hooks/redux/useDataFetching';
import { useAuth } from '@/lib/api/contexts/AuthContext';

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

export function useLoanCalculator() {
  const [params, setParams] = useState({
    loanTypeId: '',
    amount: 0,
    tenure: 0
  });

  const calculationQuery = useQuery({
    queryKey: ['loan-calculation', params],
    queryFn: async () => {
      try {
        const response = await loanService.calculateLoan(
          params.loanTypeId,
          params.amount,
          params.tenure
        );
        return unwrapResponse(response);
      } catch (error) {
        console.error('Error in loan calculation:', error);
        throw error;
      }
    },
    enabled: !!(params.loanTypeId && params.amount && params.tenure)
  });

  return {
    calculate: setParams,
    result: calculationQuery.data,
    isCalculating: calculationQuery.isLoading
  };
}

export function useLoanDetails(loanId: string) {
  const { data, isLoading, error } = useQuery<LoanDetails>({
    queryKey: ['loan-details', loanId],
    queryFn: async () => {
      try {
        const response = await loanService.getLoanDetails(loanId);
        console.log('Loan Details Response:', response);
        
        // Handle nested data structure
        if (response && typeof response === 'object') {
          return response as LoanDetails;
        }
        
        // Otherwise return the direct response
        return response as LoanDetails;
      } catch (error) {
        console.error('Error in useLoanDetails:', error);
        throw error;
      }
    },
    enabled: !!loanId,
    staleTime: 300000,
  });
  
  // Extract payment schedules
  const paymentSchedules = data?.paymentSchedules || [];
  
  // Calculate payment stats
  const paidSchedules = paymentSchedules.filter(s => s.status === 'PAID').length;
  const totalSchedules = paymentSchedules.length;
  const completionPercentage = totalSchedules ? (paidSchedules / totalSchedules) * 100 : 0;
  
  // Format currency values
  const formattedData = data ? {
    ...data,
    principalAmount: typeof data.principalAmount === 'string' ? 
      parseFloat(data.principalAmount) : data.principalAmount,
    interestAmount: typeof data.interestAmount === 'string' ? 
      parseFloat(data.interestAmount) : data.interestAmount,
    totalAmount: typeof data.totalAmount === 'string' ? 
      parseFloat(data.totalAmount) : data.totalAmount,
    paidAmount: typeof data.paidAmount === 'string' ? 
      parseFloat(data.paidAmount) : data.paidAmount,
    remainingBalance: typeof data.remainingBalance === 'string' ? 
      parseFloat(data.remainingBalance) : data.remainingBalance,
  } : null;

  return {
    loanDetails: formattedData,
    paymentSchedules,
    paymentStats: {
      paidSchedules,
      totalSchedules,
      completionPercentage
    },
    isLoading,
    error
  };
}

export function useMemberLoans() {
  const { user } = useAuth();
  const biodataId = user?.biodataId || user?.biodata?.id;

  const loansQuery = useQueryWithToast(
    ['member-loans', biodataId],
    async () => {
      if (!biodataId) {
        throw new Error('Member ID is required');
      }
      
      try {
        const response = await loanService.getMemberLoans(biodataId);
        console.log('Fetched member loans:', response);
        
        // Unwrap the response if needed
        const loans = unwrapResponse<Loan[]>(response);
        
        return loans.map(loan => ({
          ...loan,
          nextPaymentDue: loan.nextPaymentDue || null
        }));
      } catch (error) {
        console.error('Error fetching member loans:', error);
        throw error;
      }
    },
    {
      enabled: !!biodataId,
      errorMessage: 'Failed to load your loans',
      staleTime: 300000 // 5 minutes
    }
  );

  // Active loans
  const activeLoans = loansQuery.data?.filter(loan => 
    loan.status === 'ACTIVE' || loan.status === 'DISBURSED'
  ) || [];

  // Pending loans
  const pendingLoans = loansQuery.data?.filter(loan => 
    loan.status === 'PENDING' || loan.status === 'APPROVED'
  ) || [];

  // Completed loans
  const completedLoans = loansQuery.data?.filter(loan => 
    loan.status === 'COMPLETED'
  ) || [];

  return {
    loans: loansQuery.data || [],
    activeLoans,
    pendingLoans,
    completedLoans,
    isLoading: loansQuery.isLoading,
    error: loansQuery.error,
    refetch: loansQuery.refetch
  };
}