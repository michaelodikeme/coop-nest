import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Divider,
  Stack,
  Chip,
  LinearProgress,
  Avatar,
  useTheme,
  alpha,
  Skeleton,
} from '@mui/material';
import { savingsService } from '@/lib/api/services/savingsService';
import { loanService } from '@/lib/api';
import { formatCurrency } from '@/utils/formatting/format';

// Hooks
import { 
  useAdminLoansSummary,
  useAdminSavingsSummary 
} from '@/lib/hooks/admin/useAdminFinancial';
import { useEnhancedLoansSummary } from '@/lib/hooks/admin/useAdminFinancial';
import { useTransactionStats } from '@/lib/hooks/admin/useAdminTransactions';

// Import Material-UI icons
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import SavingsIcon from '@mui/icons-material/Savings';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PeopleIcon from '@mui/icons-material/People';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import AssessmentIcon from '@mui/icons-material/Assessment';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';

interface FinancialMetric {
  label: string;
  value: string | number;
  growth?: number;
  icon: React.ReactNode;
  color: string;
  description?: string;
}

interface FinancialHealth {
  status: 'excellent' | 'good' | 'fair' | 'poor';
  score: number;
  indicators: {
    assetToDebtRatio: number;
    portfolioAtRisk: number;
    defaultRate: number;
    liquidityRatio: number;
  };
}

const FinancialSummary = () => {
  const theme = useTheme();

  // Fetch savings summary with better error handling
  const { 
    data: savingsSummary, 
    isLoading: isSavingsLoading,
    error: savingsError 
  } = useQuery({
    queryKey: ['admin-savings-summary'],
    queryFn: () => savingsService.getAdminSavingsSummary(),
    staleTime: 60000 * 5, // 5 minutes
    retry: 2,
  });

  // ADD: Use the same hook as AdminTransactionsPage for accurate transaction-based data
  const { 
    data: transactionStats, 
    isLoading: isTransactionStatsLoading,
    error: transactionStatsError 
  } = useTransactionStats();

  // Fetch loans summary with better error handling
  const { 
    data: loansSummary, 
    isLoading: isLoansLoading,
    error: loansError 
  } = useAdminLoansSummary(); // Use the standardized hook

  const { 
    data: enhancedLoansSummary, 
    isLoading: isEnhancedLoading
  } = useEnhancedLoansSummary(); // Add enhanced summary for totalRepaid

  // UPDATE: Include transaction stats loading in overall loading state
  const isLoading = isSavingsLoading || isLoansLoading || isEnhancedLoading || isTransactionStatsLoading;
  const hasError = savingsError || loansError || transactionStatsError;

  // UPDATE: Process savings data to use transaction stats for accurate totals
  const processedSavingsData = React.useMemo(() => {
    if (!savingsSummary || !transactionStats) return null;

    // Use transaction stats for accurate savings totals (same as AdminTransactionsPage)
    const totalSavingsAmount = Number(transactionStats.totalSavingsDeposits || 0);
    const totalSharesAmount = Number(transactionStats.totolSharesDeposits || 0); // Note: API has typo
    
    // Keep other data from savings summary
    let activeMemberCount = 0;
    let monthlyContribution = 0;

    if (savingsSummary.data && Array.isArray(savingsSummary.data)) {
      activeMemberCount = new Set(savingsSummary.data.map(r => r.accountId)).size;
    } else {
      activeMemberCount = Number(savingsSummary.activeAccountsCount || 0);
      monthlyContribution = Number(savingsSummary.monthlyContribution || 0);
    }

    console.log('FinancialSummary - Using transaction stats for savings data:', {
      totalSavingsAmount,
      totalSharesAmount,
      activeMemberCount,
      transactionStats,
      savingsSummary
    });

    return {
      totalSavingsAmount,
      totalSharesAmount,
      activeMemberCount,
      monthlyContribution,
    };
  }, [savingsSummary, transactionStats]);

  // Process loans data safely
  const processedLoansData = React.useMemo(() => {
    if (!loansSummary && !enhancedLoansSummary) return null;

    // Use the same data access pattern as AdminLoansPage
    const totalLoanAmount = Number(loansSummary?.data?.totalDisbursed || 0);
    const totalRepaidAmount = Number(enhancedLoansSummary?.data?.totalRepaid || 0);
    const outstandingAmount = Number(loansSummary?.data?.totalOutstanding || 0);
    const activeLoansCount = Number(loansSummary?.data?.count || 0);

    console.log('FinancialSummary - Processed loan data:', {
      totalLoanAmount,
      totalRepaidAmount, 
      outstandingAmount,
      activeLoansCount,
      rawLoansSummary: loansSummary,
      rawEnhancedSummary: enhancedLoansSummary
    });

    return {
      totalLoanAmount,
      totalRepaidAmount,
      outstandingAmount,
      activeLoansCount,
    };
  }, [loansSummary, enhancedLoansSummary]);

  // Calculate financial health metrics
  const financialHealth: FinancialHealth = React.useMemo(() => {
    if (!processedSavingsData || !processedLoansData) {
      return {
        status: 'fair',
        score: 70,
        indicators: {
          assetToDebtRatio: 1.5,
          portfolioAtRisk: 5.0,
          defaultRate: 2.0,
          liquidityRatio: 0.8,
        },
      };
    }

    const totalAssets = processedSavingsData.totalSavingsAmount + processedSavingsData.totalSharesAmount;
    const totalDebt = processedLoansData.outstandingAmount;
    const assetToDebtRatio = totalDebt > 0 ? totalAssets / totalDebt : totalAssets > 0 ? 5.0 : 1.0;
    
    // Calculate portfolio at risk (simplified calculation)
    const portfolioAtRisk = Math.min((processedLoansData.outstandingAmount / Math.max(processedLoansData.totalLoanAmount, 1)) * 10, 10);
    
    // Calculate default rate (simplified)
    const defaultRate = Math.min(portfolioAtRisk * 0.5, 5);
    
    // Calculate liquidity ratio
    const liquidityRatio = Math.min(processedSavingsData.totalSavingsAmount / Math.max(totalDebt, 1), 2.0);

    // Calculate overall score
    const score = Math.min(
      (assetToDebtRatio * 20) + 
      ((10 - portfolioAtRisk) * 5) + 
      ((5 - defaultRate) * 8) + 
      (liquidityRatio * 25), 
      100
    );

    const status = score >= 85 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'fair' : 'poor';

    return {
      status,
      score: Math.round(score),
      indicators: {
        assetToDebtRatio,
        portfolioAtRisk,
        defaultRate,
        liquidityRatio,
      },
    };
  }, [processedSavingsData, processedLoansData]);

  // Sample growth data (would come from API in production)
  const growthData = {
    savingsGrowth: 4.2,
    sharesGrowth: 2.1,
    loanGrowth: -1.3,
    memberGrowth: 3.5,
  };

  // UPDATE: Create metric cards data with transaction-based savings total
  const metricsData: FinancialMetric[] = [
    {
      label: 'Total Savings',
      value: processedSavingsData?.totalSavingsAmount || 0, // Now uses transaction stats
      growth: growthData.savingsGrowth,
      icon: <SavingsIcon />,
      color: theme.palette.success.main,
      description: 'Total savings deposits from transactions',
    },
    {
      label: 'Total Shares',
      value: processedSavingsData?.totalSharesAmount || 0, // Now uses transaction stats
      growth: growthData.sharesGrowth,
      icon: <AccountBalanceIcon />,
      color: theme.palette.info.main,
      description: 'Total shares purchased from transactions',
    },
    {
      label: 'Active Members',
      value: processedSavingsData?.activeMemberCount || 0,
      growth: growthData.memberGrowth,
      icon: <PeopleIcon />,
      color: theme.palette.primary.main,
      description: 'Members with active accounts',
    },
    {
      label: 'Loan Portfolio',
      value: processedLoansData?.activeLoansCount || 0,
      growth: growthData.loanGrowth,
      icon: <MonetizationOnIcon />,
      color: theme.palette.warning.main,
      description: 'Total loan disbursements',
    },
  ];

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return theme.palette.success.main;
      case 'good': return theme.palette.info.main;
      case 'fair': return theme.palette.warning.main;
      case 'poor': return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  };

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircleIcon />;
      case 'good': return <InfoIcon />;
      case 'fair': return <WarningIcon />;
      case 'poor': return <WarningIcon />;
      default: return <InfoIcon />;
    }
  };

  const MetricCard = ({ metric }: { metric: FinancialMetric }) => (
    <Card 
      elevation={0}
      sx={{ 
        height: '100%',
        border: `1px solid ${alpha(metric.color, 0.2)}`,
        borderRadius: 2,
        overflow: 'hidden',
        position: 'relative',
        '&:hover': {
          boxShadow: theme.shadows[8],
          transform: 'translateY(-2px)',
          transition: 'all 0.3s ease-in-out',
        },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 80,
          height: 80,
          background: `linear-gradient(135deg, ${alpha(metric.color, 0.1)}, ${alpha(metric.color, 0.05)})`,
          borderRadius: '0 0 0 100%',
        }}
      />
      <CardContent sx={{ position: 'relative', zIndex: 1 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Avatar
            sx={{
              bgcolor: alpha(metric.color, 0.1),
              color: metric.color,
              mr: 2,
            }}
          >
            {metric.icon}
          </Avatar>
          <Typography variant="h6" color="text.secondary" fontWeight={500}>
            {metric.label}
          </Typography>
        </Box>
        
        <Typography variant="h4" fontWeight={700} color="text.primary" mb={1}>
          {typeof metric.value === 'number' && metric.value >= 1000 
            ? formatCurrency(metric.value) 
            : metric.value}
        </Typography>
        
        {metric.growth !== undefined && (
          <Box display="flex" alignItems="center" mb={1}>
            <Box
              display="flex"
              alignItems="center"
              sx={{
                color: metric.growth >= 0 ? theme.palette.success.main : theme.palette.error.main,
                typography: 'body2',
                fontWeight: 'medium',
              }}
            >
              {metric.growth >= 0 ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />}
              <Typography variant="body2" fontWeight={600} ml={0.5}>
                {Math.abs(metric.growth)}%
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" ml={1}>
              vs last month
            </Typography>
          </Box>
        )}
        
        {metric.description && (
          <Typography variant="caption" color="text.secondary">
            {metric.description}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <Stack spacing={3}>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((item) => (
            <Grid key={item} size={{ xs: 12, sm: 6, lg: 3 }}>
              <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
                <CardContent>
                  <Stack spacing={2}>
                    <Skeleton variant="circular" width={40} height={40} />
                    <Skeleton variant="text" width="60%" height={24} />
                    <Skeleton variant="text" width="80%" height={32} />
                    <Skeleton variant="text" width="40%" height={20} />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
          </Grid>
        </Grid>
      </Stack>
    );
  }

  if (hasError) {
    return (
      <Card elevation={0} sx={{ border: 1, borderColor: 'error.main', borderRadius: 2 }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <Avatar sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), color: 'error.main', mr: 2 }}>
              <WarningIcon />
            </Avatar>
            <Typography variant="h6" color="error">
              Error Loading Financial Data
            </Typography>
          </Box>
          <Typography color="text.secondary">
            Unable to load financial summary. Please try refreshing the page.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Stack spacing={3}>
      {/* Metric Cards */}
      <Grid container spacing={3}>
        {metricsData.map((metric, index) => (
          <Grid key={index} size={{ xs: 12, sm: 6, lg: 3 }}>
            <MetricCard metric={metric} />
          </Grid>
        ))}
      </Grid>

      {/* Detailed Financial Information */}
      <Grid container spacing={3}>
        {/* Loan Portfolio Details */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                    color: 'warning.main',
                    mr: 2,
                  }}
                >
                  <MonetizationOnIcon />
                </Avatar>
                <Typography variant="h6" fontWeight={600}>
                  Loan Portfolio
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Disbursed
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {formatCurrency(processedLoansData?.totalLoanAmount || 0)}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Repaid Amount
                  </Typography>
                  <Typography variant="h6" fontWeight={600} color="success.main">
                    {formatCurrency(processedLoansData?.totalRepaidAmount || 0)}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Outstanding Amount
                  </Typography>
                  <Typography variant="h6" fontWeight={600} color="warning.main">
                    {formatCurrency(processedLoansData?.outstandingAmount || 0)}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Active Loans
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {processedLoansData?.activeLoansCount || 0}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Financial Health */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar
                  sx={{
                    bgcolor: alpha(getHealthStatusColor(financialHealth.status), 0.1),
                    color: getHealthStatusColor(financialHealth.status),
                    mr: 2,
                  }}
                >
                  {getHealthStatusIcon(financialHealth.status)}
                </Avatar>
                <Box flexGrow={1}>
                  <Typography variant="h6" fontWeight={600}>
                    Financial Health
                  </Typography>
                  <Chip
                    label={financialHealth.status.toUpperCase()}
                    size="small"
                    sx={{
                      bgcolor: alpha(getHealthStatusColor(financialHealth.status), 0.1),
                      color: getHealthStatusColor(financialHealth.status),
                      fontWeight: 600,
                    }}
                  />
                </Box>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <Box mb={3}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Overall Score
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {financialHealth.score}/100
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={financialHealth.score}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: alpha(getHealthStatusColor(financialHealth.status), 0.1),
                    '& .MuiLinearProgress-bar': {
                      bgcolor: getHealthStatusColor(financialHealth.status),
                      borderRadius: 4,
                    },
                  }}
                />
              </Box>
              
              <Stack spacing={1.5}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Asset to Debt Ratio
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {financialHealth.indicators.assetToDebtRatio.toFixed(1)}:1
                  </Typography>
                </Box>
                
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Portfolio at Risk
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {financialHealth.indicators.portfolioAtRisk.toFixed(1)}%
                  </Typography>
                </Box>
                
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Default Rate
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {financialHealth.indicators.defaultRate.toFixed(1)}%
                  </Typography>
                </Box>
                
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Avg. Savings per Member
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {processedSavingsData?.activeMemberCount 
                      ? formatCurrency(processedSavingsData.totalSavingsAmount / processedSavingsData.activeMemberCount)
                      : formatCurrency(0)
                    }
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
};

export default FinancialSummary;