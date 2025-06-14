import { useQueryWithToast } from '@/lib/hooks/redux/useDataFetching';
import { loanService } from '@/lib/api';
import { savingsService } from '@/lib/api/services/savingsService';
import { transactionService } from '@/lib/api/services/transactionService';
import { requestService } from '@/lib/api/services/requestService';
import { useMembers } from '@/lib/hooks/admin/useMembers';
import { useApprovals } from '@/lib/hooks/admin/useApprovals';
import { useMemo } from 'react';
import { useMembersSavingsSummary } from '@/lib/hooks/admin/useAdminFinancial';

/**
 * Centralized hook for admin dashboard data
 * Follows the pattern from useMemberDashboard to provide comprehensive data access
 */
export function useAdminDashboard() {
  // Fetch members count only for dashboard metrics
  const { totalMembers, isLoading: isMembersLoading } = useMembers(1, 1, {}, true);

  // Use the correct method for pending approvals count
  // This should get approvals assigned to the current admin user
  const pendingApprovalsQuery = useQueryWithToast(
    ['admin-pending-approvals-count'],
    () => requestService.getPendingApprovalsCount(), // Changed from requestService.getPendingRequestCount()
    {
      errorMessage: 'Failed to load pending approvals',
      staleTime: 60000, // Reduced from 5 minutes to 1 minute for more frequent updates
      refetchInterval: 60000, // Auto-refresh every minute
    }
  );

  // Fetch active loans data
  const loansQuery = useQueryWithToast(
    ['admin-active-loans'],
    () => loanService.getLoansSummary(),
    {
      errorMessage: 'Failed to load loan information',
      staleTime: 300000
    }
  );

  const membersSavingsQuery = useQueryWithToast(
    ['admin-members-savings-summary'],
    () => savingsService.getMembersSummary({ page: 1, limit: 1 }), // Only need count, not data
    {
      errorMessage: 'Failed to load savings information',
      staleTime: 300000
    }
  );

  // Fetch transaction statistics
  const transactionStatsQuery = useQueryWithToast(
    ['admin-transaction-stats'],
    () => transactionService.getTransactionStats(),
    {
      errorMessage: 'Failed to load transaction statistics',
      staleTime: 300000
    }
  );

  // Fetch monthly transaction stats for chart data
  const monthlyStatsQuery = useQueryWithToast(
    ['admin-monthly-stats', new Date().getFullYear().toString()],
    () => transactionService.getMonthlyStats(new Date().getFullYear()),
    {
      errorMessage: 'Failed to load monthly transaction data',
      staleTime: 1800000
    }
  );

  // Calculate metrics with robust fallbacks
  const metrics = useMemo(() => {
    // UPDATED: Get active savings count from members summary
    const activeSavings = membersSavingsQuery.data?.data?.meta?.total ?? 0;
    console.log('useAdminDashboard Active Savings (Members with savings):', activeSavings);

    // Active Loans: prefer pendingLoans (number), fallback to 0
    const activeLoans =
      typeof loansQuery.data?.data?.totalOutstanding === 'number'
        ? loansQuery.data?.data?.totalOutstanding
        : 0;

    // Monthly Transactions: prefer totalCount, fallback to transactions.length
    const monthlyTransactions =
      transactionStatsQuery.data?.totalCount ??
      (Array.isArray(transactionStatsQuery.data?.totalAmount) ? transactionStatsQuery.data.totalAmount.length : 0);

    // Deposits/Withdrawals
    const totalDeposits = transactionStatsQuery.data?.totalDeposits ?? 0;
    const totalWithdrawals = transactionStatsQuery.data?.totalWithdrawals ?? 0;

    // Pending Approvals: use the approval service response directly
    const pendingApprovals = pendingApprovalsQuery.data ?? 0;

    console.log('Dashboard metrics calculated:', {
      totalMembers: totalMembers || 0,
      activeSavings,
      activeLoans,
      monthlyTransactions,
      pendingApprovals,
      totalDeposits,
      totalWithdrawals
    });

    return {
      totalMembers: totalMembers || 0,
      activeSavings,
      activeLoans,
      monthlyTransactions,
      pendingApprovals,
      totalDeposits,
      totalWithdrawals
    };
  }, [
    totalMembers,
    membersSavingsQuery.data, // UPDATED: Use membersSavingsQuery instead of savingsQuery
    loansQuery.data,
    transactionStatsQuery.data,
    pendingApprovalsQuery.data
  ]);

  // Process monthly data for charts
  const monthlyChartData = useMemo(() => {
    if (monthlyStatsQuery.data && Array.isArray(monthlyStatsQuery.data) && monthlyStatsQuery.data.length > 0) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return {
        labels: monthlyStatsQuery.data.map(item => monthNames[(item.month - 1) || 0]),
        datasets: [
          {
            label: 'Deposits',
            data: monthlyStatsQuery.data.map(item => item.totalDeposits || 0),
            borderColor: 'rgb(76, 175, 80)',
            backgroundColor: 'rgba(76, 175, 80, 0.5)',
            tension: 0.3,
          },
          {
            label: 'Withdrawals',
            data: monthlyStatsQuery.data.map(item => item.totalWithdrawals || 0),
            borderColor: 'rgb(244, 67, 54)',
            backgroundColor: 'rgba(244, 67, 54, 0.5)',
            tension: 0.3,
          },
        ],
      };
    }
    // Fallback data
    return {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Deposits',
          data: [6500, 5900, 8000, 8100, 5600, 5500],
          borderColor: 'rgb(76, 175, 80)',
          backgroundColor: 'rgba(76, 175, 80, 0.5)',
          tension: 0.3,
        },
        {
          label: 'Withdrawals',
          data: [2800, 4800, 4000, 1900, 8600, 2700],
          borderColor: 'rgb(244, 67, 54)',
          backgroundColor: 'rgba(244, 67, 54, 0.5)',
          tension: 0.3,
        },
      ],
    };
  }, [monthlyStatsQuery.data]);

  // Update loading states
  const isLoading =
    isMembersLoading ||
    loansQuery.isLoading ||
    membersSavingsQuery.isLoading || // UPDATED: Use membersSavingsQuery
    transactionStatsQuery.isLoading ||
    monthlyStatsQuery.isLoading ||
    pendingApprovalsQuery.isLoading;

  // Update errors object
  const errors = {
    members: totalMembers === undefined && !isMembersLoading,
    approvals: pendingApprovalsQuery.error,
    loans: loansQuery.error,
    savings: membersSavingsQuery.error, // UPDATED: Use membersSavingsQuery
    transactions: transactionStatsQuery.error,
    monthlyStats: monthlyStatsQuery.error
  };

  // Update rawData
  return {
    metrics,
    monthlyChartData,
    rawData: {
      members: totalMembers || 0,
      loans: loansQuery.data || {},
      savings: membersSavingsQuery.data || [], // UPDATED: Use membersSavingsQuery
      transactions: transactionStatsQuery.data || {},
      monthlyStats: monthlyStatsQuery.data || [],
      pendingApprovals: metrics.pendingApprovals
    },
    isLoading,
    loadingStates: {
      members: isMembersLoading,
      approvals: pendingApprovalsQuery.isLoading,
      loans: loansQuery.isLoading,
      savings: membersSavingsQuery.isLoading, // UPDATED: Use membersSavingsQuery
      transactions: transactionStatsQuery.isLoading,
      monthlyStats: monthlyStatsQuery.isLoading
    },
    errors
  };
}