'use client';

import { useState, useMemo } from 'react';
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
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress
} from '@mui/material';
import { 
  AccountBalance,
  TrendingUp,
  Savings,
  MonetizationOn,
  History,
  CalendarMonth,
  Info as InfoIcon,
  SwapHoriz,
  FileDownload,
  Add as AddIcon,
  Cancel as CancelIcon,
  Check as CheckIcon,
  AccessTime as AccessTimeIcon,
  Person as PersonIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  ArrowUpward,
  ArrowDownward,
  Receipt
} from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import LastTransactionSummary from '@/components/features/member/savings/LastTransactionSummary';
import TransactionHistory from '@/components/features/member/savings/TransactionHistory';
import WithdrawalRequests from '@/components/features/member/savings/WithdrawalRequests';
import TransactionForm from '@/components/features/member/savings/TransactionForm';
import SavingsChart from '@/components/features/member/savings/SavingsChart';
import LoadingScreen from '@/components/atoms/LoadingScreen';
import { savingsService } from '@/lib/api';
import { useAuth } from '@/lib/api/contexts/AuthContext';
import { formatCurrency, formatDate } from '@/utils/formatting/format';
import { format } from 'date-fns';
import { WithdrawalStatus } from '@/types/financial.types';
import { Transaction } from '@/types/transaction.types';



export default function SavingsPage() {
  const theme = useTheme();
  const { user } = useAuth();
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [openNewRequest, setOpenNewRequest] = useState(false);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: { amount: number, reason: string }) => 
      savingsService.createWithdrawalRequest({
        amount: data.amount,
        reason: data.reason
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawal-requests'] });
      queryClient.invalidateQueries({ queryKey: ['savings-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['savings-summary'] });
      handleCloseNewRequest();
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to submit withdrawal request');
    }
  });

  const handleCloseNewRequest = () => {
    setOpenNewRequest(false);
    setAmount('');
    setReason('');
    setError(null);
  };

  const handleSubmitRequest = () => {
    setError(null);
    const amountValue = parseFloat(amount);
    const maxAmount = Number(savingsSummary?.data?.balance || 0) * 0.8;
    
    if (!amountValue || isNaN(amountValue)) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (amountValue <= 0) {
      setError('Amount must be greater than zero');
      return;
    }
    
    if (amountValue < 1000) {
      setError('Minimum withdrawal amount is ₦1,000');
      return;
    }
    
    if (amountValue > maxAmount) {
      setError(`Amount exceeds your available balance of ${formatCurrency(maxAmount)}`);
      return;
    }
    
    if (!reason.trim()) {
      setError('Please provide a reason for the withdrawal (minimum 10 characters)');
      return;
    }
    
    if (reason.trim().length < 10) {
      setError('Please provide a more detailed reason (minimum 10 characters)');
      return;
    }
    
    createMutation.mutate({ amount: amountValue, reason });
  };

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

  // Fetch withdrawal requests - used for withdrawal requests tab and notifications
  const { data: withdrawalRequestsData, isLoading: isWithdrawalLoading } = useQuery({
    queryKey: ['withdrawal-requests'],
    queryFn: () => savingsService.getWithdrawalRequests(),
    enabled: !!user?.biodata?.id,
    select: (data) => {
      if (!data?.data) return { data: [] };
      const filtered = data.data.filter(req => req.type === 'SAVINGS_WITHDRAWAL');
      return { ...data, data: filtered };
    }
  });

  // Fetch last transaction for summary card
  const { data: lastTransactionData, isLoading: isLastTransactionLoading } = useQuery({
    queryKey: ['last-transaction'],
    queryFn: async () => {
      const result = await savingsService.getTransactions({ page: 1, limit: 1 });
      // Service already unwraps, so return the first transaction or null
      return result?.data?.[0] || null;
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

  // Check if user has active withdrawal requests
  const hasActiveWithdrawalRequests = useMemo(() => {
    if (!withdrawalRequestsData?.data) return false;
    return withdrawalRequestsData.data.some(req => 
      ['PENDING', 'IN_REVIEW', 'APPROVED'].includes(req.status)
    );
  }, [withdrawalRequestsData]);
  
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
            onClick={() => setOpenNewRequest(true)}
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
        <Grid item xs={12} md={3}>
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
          <Grid item xs={12} md={3}>
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
          <Grid item xs={12} md={3}>
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

        <Grid item xs={12} md={3}>
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
            icon={<InfoIcon />} 
            iconPosition="start" 
          />
          <Tab 
            label="Transactions" 
            icon={<History />} 
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
                <Grid item xs={12} md={4}>
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
                <Grid item xs={12} md={4}>
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
                <Grid item xs={12} md={4}>
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
      </Box>

      <Dialog 
        open={openNewRequest} 
        onClose={handleCloseNewRequest}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>New Withdrawal Request</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <Grid container spacing={2}>
                <TextField
                  label="Amount"
                  type="number"
                  fullWidth
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  InputProps={{
                    startAdornment: <Box component="span" mr={0.5}>₦</Box>,
                  }}
                  margin="normal"
                  variant="outlined"
                  helperText={`Maximum available: ${formatCurrency(Number(savingsSummary?.data?.balance || 0) * 0.8)}`}
                />
              
                <TextField
                  label="Reason for Withdrawal"
                  multiline
                  rows={3}
                  fullWidth
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  margin="normal"
                  variant="outlined"
                  helperText="Please provide a detailed reason (minimum 10 characters)"
                />
            </Grid>
            
            <Alert severity="info" icon={<InfoIcon />} sx={{ mt: 2 }}>
              <Typography variant="body2">
                Withdrawal requests are subject to approval and typically processed within 2-3 business days.
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseNewRequest}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSubmitRequest}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                Submitting...
              </>
            ) : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}