import { useQueryWithToast } from '@/lib/hooks/redux/useDataFetching';
import { loanService, memberService } from '@/lib/api';
import { savingsService } from '@/lib/api/services/savingsService';
import { transactionService } from '@/lib/api/services/transactionService';
import { requestService } from '@/lib/api/services/requestService';
import { useMembers } from '@/lib/hooks/admin/useMembers';
import { useApprovals } from '@/lib/hooks/admin/useApprovals';
import { useMemo } from 'react';
import { useMembersSavingsSummary } from '@/lib/hooks/admin/useAdminFinancial';
import { useQuery } from '@tanstack/react-query';

// Stable date strings for month-over-month trend queries
const _now = new Date();
const _curMonthStart = new Date(_now.getFullYear(), _now.getMonth(), 1).toISOString().split('T')[0];
const _curMonthEnd = _now.toISOString().split('T')[0];
const _prevMonthStart = new Date(_now.getFullYear(), _now.getMonth() - 1, 1).toISOString().split('T')[0];
const _prevMonthEnd = new Date(_now.getFullYear(), _now.getMonth(), 0).toISOString().split('T')[0];
const _curMonthNum = _now.getMonth() + 1;
const _prevMonthNum = _curMonthNum > 1 ? _curMonthNum - 1 : 12;

/**
 * Centralized hook for admin dashboard data
 * Follows the pattern from useMemberDashboard to provide comprehensive data access
 */
export function useAdminDashboard() {
  // Fetch members count only for dashboard metrics
  const { totalMembers, isLoading: isMembersLoading } = useMembers(1, 1, {}, true);

  const pendingApprovalsQuery = useQueryWithToast(
    ['admin-pending-approvals-count'],
    () => requestService.getPendingRequestCount(),
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

  // Fetch request statistics → for approval rate calculation
  const requestStatsQuery = useQueryWithToast(
    ['admin-request-statistics'],
    () => requestService.getRequestStatistics(),
    {
      errorMessage: 'Failed to load request statistics',
      staleTime: 300000
    }
  );

  // Fetch savings overview (all-time totals) → for portfolio health calculation
  const savingsOverviewQuery = useQueryWithToast(
    ['admin-savings-overview'],
    () => savingsService.getAdminOverview(),
    {
      errorMessage: 'Failed to load savings overview',
      staleTime: 300000
    }
  );

  // Month-scoped member count queries for trend calculation
  const { data: curMonthMembersData } = useQuery({
    queryKey: ['dashboard-members-cur-month', _curMonthStart],
    queryFn: () => memberService.getAllBiodata({ page: 1, limit: 1, startDate: _curMonthStart, endDate: _curMonthEnd }),
    staleTime: 300000,
  });

  const { data: prevMonthMembersData } = useQuery({
    queryKey: ['dashboard-members-prev-month', _prevMonthStart],
    queryFn: () => memberService.getAllBiodata({ page: 1, limit: 1, startDate: _prevMonthStart, endDate: _prevMonthEnd }),
    staleTime: 300000,
  });

  // Month-scoped loan summary queries for trend calculation
  const { data: curMonthLoansData } = useQuery({
    queryKey: ['dashboard-loans-cur-month', _curMonthStart],
    queryFn: () => loanService.getLoansSummary(_curMonthStart, _curMonthEnd),
    staleTime: 300000,
  });

  const { data: prevMonthLoansData } = useQuery({
    queryKey: ['dashboard-loans-prev-month', _prevMonthStart],
    queryFn: () => loanService.getLoansSummary(_prevMonthStart, _prevMonthEnd),
    staleTime: 300000,
  });

  // Calculate metrics with robust fallbacks
  const metrics = useMemo(() => {
    // UPDATED: Get active savings count from members summary
    const activeSavings = membersSavingsQuery.data?.meta?.total ?? 0;
    console.log('useAdminDashboard Active Savings (Members with savings):', activeSavings);

    // Active Loans: prefer pendingLoans (number), fallback to 0
    const activeLoans =
      typeof loansQuery.data?.totalOutstanding === 'number'
        ? loansQuery.data?.totalOutstanding
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

    // Approval Rate: (approved / total) * 100
    const reqStats = requestStatsQuery.data;
    const approvalRate = reqStats?.total > 0
      ? Math.round((reqStats.approved / reqStats.total) * 100)
      : 0;

    // Portfolio Health score
    const totalSavings = Number(savingsOverviewQuery.data?.totalSavings || 0);
    const totalShares = Number(savingsOverviewQuery.data?.totalShares || 0);
    const totalAssets = totalSavings + totalShares;
    const totalDebt = Number(loansQuery.data?.totalOutstanding || 0);
    const totalLoanAmount = Number(loansQuery.data?.totalDisbursed || 0);
    const assetToDebtRatio = totalDebt > 0 ? totalAssets / totalDebt : totalAssets > 0 ? 5.0 : 1.0;
    const portfolioAtRisk = Math.min((totalDebt / Math.max(totalLoanAmount, 1)) * 10, 10);
    const phDefaultRate = Math.min(portfolioAtRisk * 0.5, 5);
    const liquidityRatio = Math.min(totalSavings / Math.max(totalDebt, 1), 2.0);
    const portfolioHealth = Math.min(
      Math.round((assetToDebtRatio * 20) + ((10 - portfolioAtRisk) * 5) + ((5 - phDefaultRate) * 8) + (liquidityRatio * 25)),
      100
    );

    // Helper for percentage change
    const calcGrowth = (current: number, previous: number): number =>
      previous > 0 ? Math.round(((current - previous) / previous) * 1000) / 10 : 0;

    // Members trend: new members registered this month vs previous month
    const curMembers = Number((curMonthMembersData as any)?.meta?.total ?? (curMonthMembersData as any)?.total ?? 0);
    const prevMembers = Number((prevMonthMembersData as any)?.meta?.total ?? (prevMonthMembersData as any)?.total ?? 0);
    const membersGrowth = calcGrowth(curMembers, prevMembers);

    // Savings trend: deposits this month vs previous month (from monthlyStats)
    const monthlyData = monthlyStatsQuery.data?.monthlyData;
    const curMonthStats = monthlyData?.find((m: any) => m.month === _curMonthNum);
    const prevMonthStats = monthlyData?.find((m: any) => m.month === _prevMonthNum);
    const curDeposits = Number(curMonthStats?.deposits ?? 0);
    const prevDeposits = Number(prevMonthStats?.deposits ?? 0);
    const savingsGrowth = calcGrowth(curDeposits, prevDeposits);

    // Loans trend: outstanding amount this month vs previous month
    const curOutstanding = Number((curMonthLoansData as any)?.totalOutstanding ?? (curMonthLoansData as any)?.data?.totalOutstanding ?? 0);
    const prevOutstanding = Number((prevMonthLoansData as any)?.totalOutstanding ?? (prevMonthLoansData as any)?.data?.totalOutstanding ?? 0);
    const loansGrowth = calcGrowth(curOutstanding, prevOutstanding);

    // Pending approvals trend: percentage of all requests currently pending
    const totalRequests = reqStats?.total ?? 0;
    const pendingApprovalsPercent = totalRequests > 0
      ? Math.round((Number(pendingApprovals) / totalRequests) * 100)
      : 0;

    const trends = {
      members: {
        direction: (membersGrowth >= 0 ? 'up' : 'down') as 'up' | 'down',
        percentage: Math.abs(membersGrowth),
      },
      savings: {
        direction: (savingsGrowth >= 0 ? 'up' : 'down') as 'up' | 'down',
        percentage: Math.abs(savingsGrowth),
      },
      loans: {
        direction: (loansGrowth >= 0 ? 'up' : 'down') as 'up' | 'down',
        percentage: Math.abs(loansGrowth),
      },
      pendingApprovals: {
        direction: (Number(pendingApprovals) > 5 ? 'up' : 'down') as 'up' | 'down',
        percentage: pendingApprovalsPercent,
      },
    };

    return {
      totalMembers: totalMembers || 0,
      activeSavings,
      activeLoans,
      monthlyTransactions,
      pendingApprovals,
      totalDeposits,
      totalWithdrawals,
      approvalRate,
      portfolioHealth,
      trends,
    };
  }, [
    totalMembers,
    membersSavingsQuery.data,
    loansQuery.data,
    transactionStatsQuery.data,
    pendingApprovalsQuery.data,
    requestStatsQuery.data,
    savingsOverviewQuery.data,
    monthlyStatsQuery.data,
    curMonthMembersData,
    prevMonthMembersData,
    curMonthLoansData,
    prevMonthLoansData,
  ]);

  // Process monthly data for charts
  const monthlyChartData = useMemo(() => {
    if (monthlyStatsQuery.data?.monthlyData && Array.isArray(monthlyStatsQuery.data.monthlyData) && monthlyStatsQuery.data.monthlyData.length > 0) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return {
        labels: monthlyStatsQuery.data.monthlyData.map(item => monthNames[(item.month - 1) || 0]),
        datasets: [
          {
            label: 'Deposits',
            data: monthlyStatsQuery.data.monthlyData.map(item => item.deposits || 0),
            borderColor: 'rgb(76, 175, 80)',
            backgroundColor: 'rgba(76, 175, 80, 0.5)',
            tension: 0.3,
          },
          {
            label: 'Withdrawals',
            data: monthlyStatsQuery.data.monthlyData.map(item => item.withdrawals || 0),
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
    membersSavingsQuery.isLoading ||
    transactionStatsQuery.isLoading ||
    monthlyStatsQuery.isLoading ||
    pendingApprovalsQuery.isLoading ||
    requestStatsQuery.isLoading ||
    savingsOverviewQuery.isLoading;

  // Update errors object
  const errors = {
    members: totalMembers === undefined && !isMembersLoading,
    approvals: pendingApprovalsQuery.error,
    loans: loansQuery.error,
    savings: membersSavingsQuery.error,
    transactions: transactionStatsQuery.error,
    monthlyStats: monthlyStatsQuery.error,
    requestStats: requestStatsQuery.error,
    savingsOverview: savingsOverviewQuery.error,
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
      savings: membersSavingsQuery.isLoading,
      transactions: transactionStatsQuery.isLoading,
      monthlyStats: monthlyStatsQuery.isLoading,
      requestStats: requestStatsQuery.isLoading,
      savingsOverview: savingsOverviewQuery.isLoading,
    },
    errors
  };
}