'use client';

import { useState, useMemo } from 'react';
import LastTransactionSummary from '@/components/features/member/savings/LastTransactionSummary';
import React from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Grid, 
  Paper, 
  Card, 
  CardContent, 
  Tabs, 
  Tab, 
  Divider, 
  Stack, 
  Chip,
  IconButton,
  Tooltip,
  Badge,
  LinearProgress,
  Alert,
  AlertTitle,
  useTheme
} from '@mui/material';
import TransactionHistory from '@/components/features/member/savings/TransactionHistory';
import WithdrawalRequests from '@/components/features/member/savings/WithdrawalRequests';
import TransactionForm from '@/components/features/member/savings/TransactionForm';
import SavingsChart from '@/components/features/member/savings/SavingsChart';
import { useQuery } from '@tanstack/react-query';
import { savingsService } from '@/lib/api';
import { useAuth } from '@/lib/api/contexts/AuthContext';
import { formatCurrency, formatDate } from '@/utils/formatting/format';
import LoadingScreen from '@/components/atoms/LoadingScreen';
import { 
  AccountBalance, 
  TrendingUp, 
  Savings, 
  MonetizationOn,
  History,
  CalendarMonth,
  Info,
  SwapHoriz,
  FileDownload,
  ArrowUpward,
  ArrowDownward,
  Receipt
} from '@mui/icons-material';
import { format } from 'date-fns';
import { WithdrawalStatus } from '@/types/financial.types';
import { Transaction } from '@/types/transaction.types';

export default function SavingsPage() {
  const theme = useTheme();
  const { user } = useAuth();
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  // Fetch savings summary
  const { data: savingsSummary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['savings-summary'],
    queryFn: () => savingsService.getSavingsSummary()
  });
  
  // Fetch member's savings data using getMySavings (not admin-only)
  const { data: mySavings, isLoading: isSavingsLoading } = useQuery({
    queryKey: ['my-savings'],
    queryFn: () => savingsService.getMySavings(),
    enabled: !!user?.biodata?.id
  });
  
  // Keep existing transactions query (for the Transactions tab)
  const { data: allTransactions, isLoading: isTransactionsLoading } = useQuery({
    queryKey: ['savings-transactions'],  // Rename this key to be more descriptive
    queryFn: () => savingsService.getTransactions(),
    enabled: !!user?.biodata?.id
  });

  // Add a new query specifically for withdrawal requests
  const { data: withdrawalRequestsData, isLoading: isWithdrawalLoading } = useQuery({
    queryKey: ['withdrawal-requests'],
    queryFn: () => savingsService.getWithdrawalRequests(),
    enabled: !!user?.biodata?.id
  });

  // Inside your component, add a query to get the last transaction
  const { data: lastTransactionData, isLoading: isLastTransactionLoading } = useQuery({
    queryKey: ['last-transaction'],
    queryFn: async () => {
      const result = await savingsService.getTransactions({ page: 1, limit: 1 });
      console.log('Last transaction data:', result);
      // Service already unwraps, so data is the array
      return result?.data?.[0] || null;
    },
    enabled: !!user?.biodata?.id
  });

  const { data: transactionList, isLoading: istransactionListLoading } = useQuery({
    queryKey: ['transaction-list'],
    queryFn: async () => {
      const result = await savingsService.getTransactions({ page: 1, limit: 10 });
      console.log('Transaction list data:', result);
      // Always return an array
      return result?.data || [];
    },
    enabled: !!user?.biodata?.id
  });
  
  // Transform savings data for chart using correct fields
  const savingsChartData = useMemo(() => {
    if (!mySavings?.data?.length) {
      console.log('No savings data found');
      return [];
    }
    
    console.log('Transforming savings data for chart', mySavings.data);
    
    // Sort by year and month to ensure chronological order
    const sortedData = [...mySavings.data].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
    
    // Try multiple paths to find correct data
    const mappedData = sortedData.map(item => {
      let amount = 0;
      
      // Option 1: Use totalSavingsAmount field (most reliable)
      if (item.balance) {
        amount = Number(item.balance);
      }
      // Option 2: Fall back to balance field
      else if (item.balance) {
        amount = Number(item.balance);
      }
      console.log(`Month ${item.month}: Savings Amount = ${amount}`);
      
      return {
        month: item.month,
        year: item.year, // Make sure this property is included
        amount
      };
    });
    
    console.log('Mapped savings data:', mappedData);
    return mappedData;
  }, [mySavings]);
  
  // Transform shares data for chart
  const sharesChartData = useMemo(() => {
    if (!mySavings?.data?.length) return [];
    
    // Sort by year and month
    const sortedData = [...mySavings.data].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
    
    return sortedData.map(item => ({
      month: item.month,
      year: item.year, // Make sure this property is included
      // Use totalSharesAmount from shares array
      amount: item.shares?.[0] ? Number(item.shares[0].totalSharesAmount || 0) : 0
    }));
  }, [mySavings]);
  
  // Get current month data
  const currentMonthData = useMemo(() => {
    if (!mySavings?.data?.length) return null;
    
    return mySavings.data.find(
      item => item.month === currentMonth && item.year === currentYear
    );
  }, [mySavings, currentMonth, currentYear]);
  
  // Extract all transactions from savings records
  const allSavingsTransactions = useMemo(() => {
    if (!mySavings?.data?.length) return [];
    
    return mySavings.data.flatMap(record => record.transactions || []);
  }, [mySavings]);
  
  // Filter transactions to get pending withdrawal requests
  const withdrawalRequests = useMemo(() => {
    if (!allTransactions) return { data: [] };
    
    const transactionsArray = Array.isArray(allTransactions) 
      ? allTransactions 
      : [];
    
    const pendingWithdrawals = transactionsArray.filter(
      tx => tx && typeof tx === 'object' && tx.type === 'WITHDRAWAL' && 
           tx.status === WithdrawalStatus.PENDING
    );
    
    return { data: pendingWithdrawals };
  }, [allTransactions]);
  
  // Replace the current withdrawal requests filter with this direct query data access
  const hasActiveWithdrawalRequests = withdrawalRequestsData?.data &&
    withdrawalRequestsData.data.length > 0;
  
  // Calculate share percentage
  const sharesPercentage = useMemo(() => {
    if (!savingsSummary?.data?.monthlyTarget || !savingsSummary?.shares?.monthlyAmount) return 10;
    
    return Math.round(
      (Number(savingsSummary?.data.shares.monthlyAmount) / Number(savingsSummary.data?.monthlyTarget)) * 100
    );
  }, [savingsSummary]);
  
  // Loading states
  const isLoading = isSummaryLoading || isSavingsLoading || isWithdrawalLoading;
  
  if (isLoading) {
    return <LoadingScreen />;
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  const exportSavingsStatement = async () => {
    try {
      const blob = await savingsService.downloadSavingsStatement(user?.biodata?.erpId || '');
      // Create a URL for the blob and trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `savings-statement-${user?.biodata?.erpId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting statement:', error);
      // Handle error
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" color="text.primary" fontWeight="medium" gutterBottom>
            Savings & Shares
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track your savings, shares, and manage withdrawals
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title="Download Savings Statement">
            <Button
              variant="outlined"
              color="primary"
              startIcon={<FileDownload />}
              onClick={exportSavingsStatement}
            >
              Export Statement
            </Button>
          </Tooltip>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SwapHoriz />}
            onClick={() => {
              setActiveTab(2);
              // Small delay to allow tab to switch, then trigger new request modal
              setTimeout(() => {
                const newRequestButton = document.querySelector('[data-withdrawal-new-request]') as HTMLElement;
                if (newRequestButton) {
                  newRequestButton.click();
                }
              }, 100);
            }}
            disabled={isSummaryLoading || !savingsSummary?.data?.balance || (savingsSummary?.data?.balance || 0) <= 0}
          >
            Request Withdrawal
          </Button>
        </Box>
      </Box>

      {/* Notification for pending withdrawal requests */}
      {hasActiveWithdrawalRequests && (
        <Alert
          severity="info"
          sx={{ mb: 3, borderRadius: 2 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => setActiveTab(2)}
            >
              View Details
            </Button>
          }
        >
          <AlertTitle>Pending Withdrawal Request</AlertTitle>
          You have {withdrawalRequestsData?.data?.length || 0} pending withdrawal
          {(withdrawalRequestsData?.data?.length || 0) === 1 ? ' request' : ' requests'}.
          Processing usually takes 2-3 business days.
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card elevation={0} sx={{ 
            borderRadius: 2, 
            height: '100%',
            background: (theme) => `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
            color: 'white'
          }}>
            <CardContent sx={{ px: 3, py: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6" fontWeight="medium">Total Savings</Typography>
                <AccountBalance />
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {formatCurrency(Number(savingsSummary?.data?.totalSavingsAmount || 0))}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
                Net amount after share deductions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
          <Card elevation={0} sx={{ 
            borderRadius: 2, 
            height: '100%',
            background: (theme) => `linear-gradient(45deg, ${theme.palette.secondary.main} 30%, ${theme.palette.secondary.dark} 90%)`,
            color: 'white'
          }}>
            <CardContent sx={{ px: 3, py: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6" fontWeight="medium">Total Shares</Typography>
                <TrendingUp />
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {formatCurrency(Number(savingsSummary?.data?.shares?.totalSharesAmount || 0))}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
                Accrued from your monthly contributions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
          <Card elevation={0} sx={{ 
            borderRadius: 2, 
            height: '100%',
            background: (theme) => `linear-gradient(45deg, ${theme.palette.success.main} 30%, ${theme.palette.success.dark} 90%)`,
            color: 'white'
          }}>
            <CardContent sx={{ px: 3, py: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6" fontWeight="medium">Monthly Contribution</Typography>
                <Savings />
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {formatCurrency(Number(savingsSummary?.data?.monthlyTarget || 0))}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
                Your regular monthly deduction
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Card elevation={0} sx={{ 
            borderRadius: 2, 
            height: '100%',
            background: (theme) => theme.palette.mode === 'dark' 
              ? 'linear-gradient(45deg, #455a64 30%, #263238 90%)' 
              : 'linear-gradient(45deg, #78909c 30%, #546e7a 90%)',
            color: 'white'
          }}>
            <CardContent sx={{ px: 3, py: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6" fontWeight="medium">
                  {format(new Date(currentYear, currentMonth - 1), 'MMM yyyy')}
                </Typography>
                <CalendarMonth />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h4" fontWeight="bold">
                  {currentMonthData ? 
                    formatCurrency(Number(currentMonthData.balance || 0)) : 
                    formatCurrency(0)
                  }
                </Typography>
                <Chip 
                  label="ACTIVE"
                  size="small"
                  color="success"
                  sx={{ ml: 1, color: 'white', bgcolor: 'rgba(255,255,255,0.15)' }}
                />
              </Box>
              <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
                Current month contribution
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>      
      
      {/* Last Transaction Summary */}
      <Box>
        <LastTransactionSummary 
          transaction={lastTransactionData as unknown as Transaction | undefined}
          isLoading={isLastTransactionLoading}
        />
      </Box>

      {/* Tabs for Savings & Shares */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          aria-label="savings and shares tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab 
            label="Overview" 
            icon={<Info />} 
            iconPosition="start" 
          />
          <Tab 
            label="Transactions" 
            icon={<History />} 
            iconPosition="start" 
          />
          <Tab
            label={
              <Badge
                color="error"
                badgeContent={withdrawalRequestsData?.data?.length || 0}
                showZero={false}
              >
                Withdrawal Requests
              </Badge>
            }
            icon={<Receipt />}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box sx={{ py: 2 }}>
        {/* Overview Tab */}
        {activeTab === 0 && (
          <Box>
            <SavingsChart 
              savingsData={savingsChartData} 
              shareData={sharesChartData}
              showShares={true}
              // Use the savingsSummary.totalSavings value for the total savings
              totalSavings={Number(savingsSummary?.data?.totalSavingsAmount || 0)}
              totalShares={Number(savingsSummary?.data.shares?.totalSharesAmount || 0)}
              isLoading={isSavingsLoading}
            />
            
            {/* "How It Works" section with updated data */}
            <Box sx={{ mt: 4, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                How It Works
              </Typography>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Paper sx={{ p: 2, borderRadius: 2, height: '100%', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'primary.light',
                        color: 'primary.dark',
                        borderRadius: '50%',
                        p: 1,
                        mr: 2,
                        width: 40,
                        height: 40
                      }}>
                        <MonetizationOn />
                      </Box>
                      <Typography variant="h6">Monthly Contributions</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Every month, your contribution of {formatCurrency(Number(savingsSummary?.data?.monthlyTarget || 0))} is automatically deducted 
                      from your salary. This amount is split between your savings and shares accounts.
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Paper sx={{ p: 2, borderRadius: 2, height: '100%', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'secondary.light',
                        color: 'secondary.dark',
                        borderRadius: '50%',
                        p: 1,
                        mr: 2,
                        width: 40,
                        height: 40
                      }}>
                        <TrendingUp />
                      </Box>
                      <Typography variant="h6">Shares Allocation</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Approximately {sharesPercentage}% of your 
                      monthly contribution goes to your shares account.
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Paper sx={{ p: 2, borderRadius: 2, height: '100%', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'success.light',
                        color: 'success.dark',
                        borderRadius: '50%',
                        p: 1,
                        mr: 2,
                        width: 40,
                        height: 40
                      }}>
                        <SwapHoriz />
                      </Box>
                      <Typography variant="h6">Withdrawals</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      You can request withdrawals from your savings balance at any time. Requests are subject to 
                      approval and typically processed within 2-3 business days. The current maximum withdrawal is {' '}
                      {formatCurrency(savingsSummary?.data?.totalSavingsAmount || 0)}.
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </Box>
        )}

        {/* Transactions Tab */}
        {activeTab === 1 && (
          <Box>
            <TransactionHistory 
              // Pass a reasonable limit if needed, but allow component to handle pagination
              limit={undefined}
            />
          </Box>
        )}

        {/* Withdrawal Requests Tab */}
        {activeTab === 2 && (
          <Box>
            <Grid container spacing={3}>
              <Grid size={12}>
                <Paper sx={{ p: 3, borderRadius: 2, mb: 3, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
                  
                  {isWithdrawalLoading ? (
                    <LinearProgress />
                  ) : (
                    <WithdrawalRequests maxAmount={Number(savingsSummary?.data?.balance || 0) * 0.8} />
                  )}
                  
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Withdrawal Process:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      1. Submit a withdrawal request specifying the amount and reason
                      <br />
                      2. Your request will be reviewed by the cooperative management
                      <br />
                      3. Once approved, funds will be transferred to your registered bank account
                      <br />
                      4. You'll receive notifications at each step of the process
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}
      </Box>
    </Container>
  );
}