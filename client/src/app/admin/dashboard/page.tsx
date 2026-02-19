'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  useTheme,
  Stack,
  Fade,
  Zoom,
} from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { formatCurrency } from '@/utils/formatting/format';
import { Module } from '@/types/permissions.types';
import { useAdminDashboard } from '@/lib/hooks/admin/useAdminDashboard';
import { useActivityFeedData } from '@/lib/hooks/admin/useActivityFeedData';

// Enhanced Components
import { DashboardGrid, DashboardSection } from '@/components/templates/admin/DashboardGrid';
import { MetricCard } from '@/components/organisms/admin/dashboard/MetricCards';
import { ActivityFeed } from '@/components/organisms/admin/dashboard/ActivityFeed';
import { QuickStats } from '@/components/organisms/admin/dashboard/QuickStats';
import PermissionGate from '@/components/atoms/PermissionGate';
import NotificationPanel from '@/components/organisms/admin/dashboard/NotificationPanel';
import ApprovalQueue from '@/components/organisms/admin/dashboard/ApprovalQueue';
import FinancialSummary from '@/components/organisms/admin/dashboard/FinancialSummary';
import MonthlyFinancialChart from '@/components/organisms/admin/dashboard/MonthlyFinancialChart';

// Icons
import RefreshIcon from '@mui/icons-material/Refresh';
import DashboardIcon from '@mui/icons-material/Dashboard';
import UsersIcon from '@mui/icons-material/People';
import SavingsIcon from '@mui/icons-material/Savings';
import MoneyIcon from '@mui/icons-material/Money';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import AssignmentIcon from '@mui/icons-material/Assignment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

export default function DashboardPage() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  // Use the consolidated data hook
  const { 
    metrics, 
    monthlyChartData, 
    isLoading, 
    errors,
    rawData 
  } = useAdminDashboard();

  // ADDED: Fetch real activity data
  const { 
    data: activityData, 
    isLoading: isActivityLoading,
    error: activityError 
  } = useActivityFeedData(10);

  // Handle refresh dashboard data
  const handleRefreshData = async () => {
    setRefreshing(true);
    try {
      console.log('Dashboard - Refreshing data');
      await queryClient.invalidateQueries({ queryKey: ['admin-active-loans'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-members-savings-summary'] }); // Updated key
      await queryClient.invalidateQueries({ queryKey: ['admin-transaction-stats'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-pending-approvals-count'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-monthly-stats'] });
      await queryClient.invalidateQueries({ queryKey: ['members'] });
    } finally {
      setRefreshing(false);
    }
  };

  // Quick stats data
  const quickStatsData = [
    {
      label: 'Monthly Transactions',
      value: metrics.monthlyTransactions,
      color: theme.palette.success.main,
    },
    {
      label: 'Approval Rate',
      value: metrics.approvalRate,
      target: 100,
      suffix: '%',
      color: theme.palette.info.main,
    },
    {
      label: 'Active Members',
      value: metrics.totalMembers,
      color: theme.palette.primary.main,
    },
    {
      label: 'Portfolio Health',
      value: metrics.portfolioHealth,
      target: 100,
      suffix: '%',
      color: theme.palette.warning.main,
    }
  ];

  // Display loading state
  if (isLoading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="400px"
        sx={{ 
          background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.grey[50]} 100%)` 
        }}
      >
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={48} thickness={4} />
          <Typography variant="body1" color="text.secondary">
            Loading dashboard data...
          </Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Fade in timeout={800}>
      <Box sx={{ 
        width: '100%',
        background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.grey[50]} 100%)`,
        minHeight: '100vh',
        pb: 4,
      }}>
        {/* Header Section */}
        <Box 
          sx={{ 
            mb: 4,
            p: 3,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: 'white',
            borderRadius: '0 0 24px 24px',
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Box display="flex" alignItems="center" mb={1}>
                <DashboardIcon sx={{ mr: 2, fontSize: '2rem' }} />
                <Typography variant="h3" component="h1" fontWeight={700}>
                  Admin Dashboard
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                Welcome back! Here's what's happening with your cooperative today.
              </Typography>
            </Box>
            
            <Button 
              startIcon={refreshing ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
              variant="contained" 
              onClick={handleRefreshData}
              disabled={refreshing}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.25)',
                },
                borderRadius: 2,
                px: 3,
              }}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </Box>
        </Box>

        <Box sx={{ px: 3 }}>
          <DashboardGrid spacing={3}>
            {/* Key Metrics - Top Row */}
            <DashboardSection size={{ xs: 12 }}>
              <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mb: 3 }}>
                Key Performance Indicators
              </Typography>
              
              <DashboardGrid spacing={2}>
                <PermissionGate permissions={['VIEW_MEMBERS']} module={Module.ACCOUNT}>
                  <DashboardSection size={{ xs: 12, sm: 6, lg: 3 }}>
                    <Zoom in timeout={600}>
                      <div>
                        <MetricCard
                          title="Total Members"
                          value={metrics.totalMembers}
                          icon={<UsersIcon />}
                          color="primary"
                          trend={{
                            direction: 'up',
                            percentage: 2.5,
                            period: 'vs last month'
                          }}
                          description="Active registered members in the cooperative"
                          onClick={() => window.location.href = '/admin/members'}
                        />
                      </div>
                    </Zoom>
                  </DashboardSection>
                </PermissionGate>
                
                <PermissionGate permissions={['VIEW_SAVINGS']} module={Module.SAVINGS}>
                  <DashboardSection size={{ xs: 12, sm: 6, lg: 3 }}>
                    <Zoom in timeout={700}>
                      <div>
                        <MetricCard
                          title="Active Savings"
                          value={metrics.activeSavings}
                          icon={<SavingsIcon />}
                          color="success"
                          trend={{
                            direction: 'up',
                            percentage: 3.2,
                            period: 'vs last month'
                          }}
                          description="Number of active savings accounts"
                          onClick={() => window.location.href = '/admin/financial/savings'}
                        />
                      </div>
                    </Zoom>
                  </DashboardSection>
                </PermissionGate>
                
                <PermissionGate permissions={['VIEW_LOANS']} module={Module.LOAN}>
                  <DashboardSection size={{ xs: 12, sm: 6, lg: 3 }}>
                    <Zoom in timeout={800}>
                      <div>
                        <MetricCard
                          title="Loan Portfolio"
                          value={formatCurrency(metrics.activeLoans)}
                          icon={<MoneyIcon />}
                          color="warning"
                          trend={{
                            direction: 'up',
                            percentage: 0.8,
                            period: 'vs last month'
                          }}
                          description="Total outstanding loan amount"
                          onClick={() => window.location.href = '/admin/financial/loans'}
                        />
                      </div>
                    </Zoom>
                  </DashboardSection>
                </PermissionGate>
                
                <PermissionGate permissions={['VIEW_REQUESTS']}>
                  <DashboardSection size={{ xs: 12, sm: 6, lg: 3 }}>
                    <Zoom in timeout={900}>
                      <div>
                        <MetricCard
                          title="Pending Approvals"
                          value={metrics.pendingApprovals}
                          icon={<AssignmentIcon />}
                          color="error"
                          trend={{
                            direction: Number(metrics.pendingApprovals) > 5 ? 'up' : 'down',
                            percentage: 10,
                            period: 'requires attention'
                          }}
                          description="Total pending requests awaiting approval" // Updated description
                          onClick={() => window.location.href = '/admin/approvals'}
                        />
                      </div>
                    </Zoom>
                  </DashboardSection>
                </PermissionGate>
              </DashboardGrid>
            </DashboardSection>

            {/* Financial Overview Section */}
            <DashboardSection size={{ xs: 12 }}>
              <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mb: 3 }}>
                Financial Overview
              </Typography>
              
              <DashboardGrid spacing={3}>
                <DashboardSection size={{ xs: 12, md: 8 }}>
                  <MonthlyFinancialChart height={400} showControls={true} />
                </DashboardSection>
                
                <DashboardSection size={{ xs: 12, md: 4 }}>
                  <QuickStats title="Performance Metrics" stats={quickStatsData} />
                </DashboardSection>
              </DashboardGrid>
            </DashboardSection>

            {/* Activity and Approvals Section */}
            <DashboardSection size={{ xs: 12 }}>
              <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mb: 3 }}>
                Recent Activity & Pending Items
              </Typography>
              
              <DashboardGrid spacing={3}>
                <PermissionGate permissions={['VIEW_TRANSACTIONS']} module={Module.TRANSACTION}>
                  <DashboardSection size={{ xs: 12, md: 6 }}>
                    <ActivityFeed
                      title="Recent Transactions"
                      activities={activityData || []} // Use real data
                      loading={isActivityLoading}
                      error={activityError?.message}
                      onViewAll={() => window.location.href = '/admin/financial/transactions'}
                      maxItems={6}
                    />
                  </DashboardSection>
                </PermissionGate>
                
                <PermissionGate permissions={['REVIEW_LOAN', 'APPROVE_LOANS', 'REVIEW_WITHDRAWAL', 'APPROVE_MEMBERS', 'VIEW_REQUESTS']}>
                  <DashboardSection size={{ xs: 12, md: 6 }}>
                    <Box
                      sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 3,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <Box sx={{ p: 3, pb: 1 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                          <Typography variant="h6" fontWeight={600}>
                            Approval Queue
                          </Typography>
                          <Button
                            size="small"
                            onClick={() => window.location.href = '/admin/approvals'}
                            sx={{ color: 'text.secondary' }}
                          >
                            View All
                          </Button>
                        </Box>
                      </Box>
                      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                        <ApprovalQueue limit={5} />
                      </Box>
                    </Box>
                  </DashboardSection>
                </PermissionGate>
              </DashboardGrid>
            </DashboardSection>

            {/* Notifications */}
            {/* <DashboardSection size={{ xs: 12 }}>
              <DashboardGrid spacing={3}>
                <DashboardSection size={{ xs: 12, md: 6 }}>
                  <NotificationPanel 
                    limit={5}
                    onViewAll={() => window.location.href = '/admin/notifications'}
                  />
                </DashboardSection>
              </DashboardGrid>
            </DashboardSection> */}

            {/* Financial SUmmary */}
            <DashboardSection size={{ xs: 12 }}>
              <DashboardGrid spacing={3}>
                <PermissionGate permissions={['VIEW_SAVINGS_STATS', 'VIEW_TRANSACTIONS']} module={Module.REPORTS}>
                  <DashboardSection size={{ xs: 12, md: 12 }}>
                    <Box
                      sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 3,
                        height: '100%',
                        p: 3,
                      }}
                    >
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        Financial Health Summary
                      </Typography>
                      <FinancialSummary />
                    </Box>
                  </DashboardSection>
                </PermissionGate>
              </DashboardGrid>
            </DashboardSection>
          </DashboardGrid>
        </Box>
      </Box>
    </Fade>
  );
}
