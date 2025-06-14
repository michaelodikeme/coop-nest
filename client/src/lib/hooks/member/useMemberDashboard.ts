import { useQueryWithToast } from '@/lib/hooks/redux/useDataFetching';
import { memberService } from '@/lib/api/services/memberService';
import { savingsService } from '@/lib/api/services/savingsService';
import { loanService } from '@/lib/api/services/loanService';
import { Loan } from '@/types/loan.types';
import { useMemo } from 'react';

// Define interfaces for savings-related types

interface PaymentInfo {
  loanId: string;
  dueDate: Date;
  amount: number;
  remainingBalance: number;
}

/**
* Hook for fetching comprehensive dashboard data for the currently logged in member
*/
export function useMemberDashboard() {
  // Get member biodata
  const biodataQuery = useQueryWithToast(
    ['member-biodata'],
    () => memberService.getCurrentMemberBiodata(),
    {
      errorMessage: 'Failed to load your profile information',
      staleTime: 300000, // 5 minutes
      unwrapResponse: true, // Add this to automatically unwrap the response
      onSuccess: (data) => {
        console.log('Fetched member biodata (unwrapped):', data);
      }
    }
  );
  
  // Get savings summary - this includes shares data as well
  const savingsSummaryQuery = useQueryWithToast(
    ['member-savings-summary'],
    () => savingsService.getSavingsSummary(),
    {
      errorMessage: 'Failed to load savings information',
      staleTime: 300000,
      unwrapResponse: true, // <-- ADD THIS
      onSuccess: (data) => {
        console.log('Fetched savings summary (unwrapped):', data);
      }
    }
  );
  
  // Get monthly savings statistics for charts and trend analysis
  const savingsStatsQuery = useQueryWithToast(
    ['member-savings-stats', new Date().getFullYear().toString()],
    () => savingsService.getMySavings(), // Using getMySavings instead of getSavingsStats
    {
      errorMessage: 'Failed to load savings statistics',
      staleTime: 3600000, // 1 hour
      unwrapResponse: true, // <-- ADD THIS
      onSuccess: (data) => {
        console.log('Fetched savings stats (unwrapped):', data);
      }
    }
  );
  
  // Loans are handled by loansQuery below
  // Get loan data directly from the backend's getMemberLoans endpoint
  const loansQuery = useQueryWithToast(
  ['member-loans', biodataQuery?.data?.biodataId],
  async () => {
    const memberId = biodataQuery.data?.biodataId;
    console.log('Loans memberId:', memberId)
    if (!memberId) throw new Error('Member ID is required');
    const response = await loanService.getMemberLoans(memberId);
    // Unwrap .data property
    const loans = response.data || [];
    console.log('Fetched member loans from backend:', loans);
    return loans.map((loan: { nextPaymentDue: any; }) => ({
      ...loan,
      nextPaymentDue: loan.nextPaymentDue || null
    })) as Loan[];
  },
  {
    enabled: !!biodataQuery.data?.biodataId,
    errorMessage: 'Failed to load loan information',
    staleTime: 300000,
    unwrapResponse: true,
    onSuccess: (data) => {
      console.log('Fetched member loans (unwrapped):', data);
    }
  }
    );

    
  // Extract active loans - the backend already filters by active status
  const activeLoans = useMemo(() => {
    console.log('Raw loansQuery.data:', loansQuery.data ? loansQuery.data : 'No data');
    
    if (!loansQuery.data) return [];
    
    // Filter for active loans
    const filtered = loansQuery.data.filter(loan => 
      loan.status === 'ACTIVE' || loan.status === 'DISBURSED'
    );
    
    console.log('Filtered active loans:', filtered);
    console.log('Filtered loan count:', filtered.length);
    console.log('First loan remainingBalance:', filtered[0]?.remainingBalance);
    
    return filtered;
  }, [loansQuery.data]);
  
  // Calculate total outstanding balance
  const totalOutstandingBalance = useMemo(() => {
    console.log('Calculating totalOutstandingBalance from activeLoans:', activeLoans);
    
    if (!activeLoans.length) return 0;
    
    const total = activeLoans.reduce((sum, loan) => {
      const amount = Number(loan.remainingBalance);
      console.log(`Loan ID ${loan.id} has remainingBalance: ${loan.remainingBalance} (${amount})`);
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    
    console.log('Calculated totalOutstandingBalance:', total);
    return total;
  }, [activeLoans]);
  
  // Calculate next payment due - updated to use nextPaymentDue instead of nextPaymentDate
  const nextPaymentDue = useMemo(() => {
    if (!activeLoans.length) return null;
    
    // Find the loan with the closest upcoming payment
    let closestPayment: PaymentInfo | null = null;
    let closestDate: Date | null = null;
    
    activeLoans.forEach((loan) => {
      // Use nextPaymentDue from API instead of nextPaymentDate
      if (loan.nextPaymentDue) {
        const dueDate = new Date(loan.nextPaymentDue);
        
        // Find the payment schedule for the next payment
        const nextSchedule = loan.paymentSchedules?.find(
          (schedule) => schedule.status === 'PENDING' || schedule.status === 'PARTIAL'
        );
        
        if (!closestDate || dueDate < closestDate) {
          closestDate = dueDate;
          closestPayment = {
            loanId: loan.id,
            dueDate,
            amount: nextSchedule ? Number(nextSchedule.expectedAmount) : 0,
            remainingBalance: Number(loan.remainingBalance)
          };
        }
      }
    });
    
    return closestPayment;
  }, [activeLoans]);
  
  // Add this helper function at the top of the file
  const unwrapApiResponse = <T>(response: any): T => {
    if (!response) return null as T;
    // Check if it's wrapped in a REST response structure
    if (response.data !== undefined && response.status !== undefined) {
      return response.data as T;
    }
    // Direct response
    return response as T;
  };

  // Then update the monthlyTrendData useMemo
  const monthlyTrendData = useMemo(() => {
    console.log('Raw savingsStatsQuery.data:', savingsStatsQuery.data);
    
    // Unwrap API response to get actual data
    const apiData = unwrapApiResponse(savingsStatsQuery.data);
    
    // Type guard to check if apiData has a data property
    const dataArray = (apiData && typeof apiData === 'object' && 'data' in apiData)
      ? (apiData as { data: any[] }).data
      : [];
    
    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      console.log('No monthly trend data found or data is not in expected format:', dataArray);
      return [];
    }
    
    try {
      // Transform the data structure to what we need
      const sortedData = [...dataArray].sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      });
      
      // Map the data with proper property access
      const result = sortedData.map(item => ({
        month: item.month,
        savings: Number(item.balance || 0),
        shares: item.shares?.[0] ? Number(item.shares[0].totalAmount || 0) : 0
      }));
      
      console.log('Transformed monthlyTrendData:', result);
      return result;
    } catch (error) {
      console.error('Error processing monthly trend data:', error);
      return []; 
    }
  }, [savingsStatsQuery.data]);
  
  // Extract shares data from savingsSummary (no separate endpoint needed)
  const sharesSummary = useMemo(() => {
    if (!savingsSummaryQuery.data) return null;
    
    return {
      // Use shares data from within savings summary
      balance: savingsSummaryQuery.data.shares?.totalSharesAmount || 0,
      monthlyTarget: savingsSummaryQuery.data.shares?.monthlyAmount || 0,
      totalSharesAmount: savingsSummaryQuery.data.shares?.totalSharesAmount || 0
    };
  }, [savingsSummaryQuery.data]);

  // Calculate some loan statistics (this wasn't in the original API response)
  const loanStats = useMemo(() => {
    if (!activeLoans.length) return null;
    
    // Calculate total progress across all active loans
    const totalPrincipal = activeLoans.reduce((sum, loan) => sum + Number(loan.principalAmount), 0);
    const totalPaid = activeLoans.reduce((sum, loan) => sum + Number(loan.paidAmount), 0);
    
    // Calculate average progress percentage
    const avgProgress = totalPrincipal > 0 ? (totalPaid / totalPrincipal) * 100 : 0;
    
    return {
      totalPrincipal,
      totalPaid,
      avgProgress,
      activeLoansCount: activeLoans.length
    };
  }, [activeLoans]);
  
  // Get recent transactions (just the latest few)
  const transactionsQuery = useQueryWithToast(
    ['member-transactions'],
    () => savingsService.getTransactions({ 
      page: 1, 
      limit: 5 // Just get the most recent 5 transactions
    }),
    {
      errorMessage: 'Failed to load transaction history',
      staleTime: 300000, // 5 minutes
      unwrapResponse: true, // Unwrap the response to get the data directly
    }
  );

  // Add lastTransaction to the returned object
  const lastTransaction = useMemo(() => {
    if (transactionsQuery.data?.data && transactionsQuery.data.data.length > 0) {
      return transactionsQuery.data.data[0]; // Return the most recent transaction
    }
    return null;
  }, [transactionsQuery.data]);

  // Update the return object to include transactions
  return {
    memberBiodata: biodataQuery.data,
    savingsSummary: savingsSummaryQuery.data,
    sharesSummary,
    activeLoans,
    totalOutstandingBalance,
    nextPaymentDue,
    loanStats,
    monthlyTrend: monthlyTrendData,
    lastTransaction,
    transactions: transactionsQuery.data?.data || [],
    isLoading: {
      biodata: biodataQuery.isLoading,
      savings: savingsSummaryQuery.isLoading,
      loans: loansQuery.isLoading,
      trend: savingsStatsQuery.isLoading,
      transactions: transactionsQuery.isLoading
    },
    isAnyLoading: biodataQuery.isLoading || 
      savingsSummaryQuery.isLoading ||
      loansQuery.isLoading ||
      savingsStatsQuery.isLoading ||
      transactionsQuery.isLoading,
    error: {
      biodata: biodataQuery.error,
      savings: savingsSummaryQuery.error,
      loans: loansQuery.error,
      trend: savingsStatsQuery.error,
      transactions: transactionsQuery.error
    }
  };
}