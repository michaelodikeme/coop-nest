'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/auth/auth';
import { useMemberBiodata } from '@/hooks/features/useMemberBiodata';
import { withRoleGuard as ProtectedRoute } from '@/hooks/auth/withRoleGuard';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Stack,
  Button,
  Divider,
  CircularProgress,
  Alert,
  Grid
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { savingsApi } from '@/services/api/features/savings/savingsApi';
import { loansApi } from '@/services/api/features/loans/loansApi';
import { requestsApi } from '@/services/api/endpoints/requestsApi';
import { formatCurrency } from '@/utils/formatting/format';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import SavingsChart from '@/components/shared/components/SavingsChart';
import { ArrowForward, CreditCard, RequestQuote, Savings, AccountBalanceWallet } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { Loan, Request, PaginatedResponse } from '@/types/types';

// Define interfaces for API responses
interface SavingsSummary {
  totalSavings: number;
  totalShares: number;
  monthlyContribution: number;
}

export default function DashboardPage() {
  const { user, isLoading: userLoading } = useAuth();
  const { data: biodata, isLoading: biodataLoading, error: biodataError } = useMemberBiodata();
  const [showError, setShowError] = useState(false);
  const router = useRouter();

  // Fetch savings summary
  const { 
    data: savingsSummary = { totalSavings: 0, totalShares: 0, monthlyContribution: 0 }, 
    isLoading: savingsLoading, 
    error: savingsError 
  } = useQuery({
    queryKey: ['savings-summary'],
    queryFn: async () => {
      try {
        const response = await savingsApi.getSavingsSummary();
        return response || { totalSavings: 0, totalShares: 0, monthlyContribution: 0 };
      } catch (error) {
        console.error('Error fetching savings summary:', error);
        return { totalSavings: 0, totalShares: 0, monthlyContribution: 0 };
      }
    },
    retry: 1,
    staleTime: 30000 // Cache for 30 seconds
  });

  // Fetch member loans
  const {
    data: loans = [],
    isLoading: loansLoading,
    error: loansError
  } = useQuery({
    queryKey: ['member-loans'],
    queryFn: async () => {
      if (!user?.biodata?.id) return [];
      try {
        const response = await loansApi.getMemberLoans(user.biodata.id);
        return response || [];
      } catch (error) {
        console.error('Error fetching member loans:', error);
        return [];
      }
    },
    enabled: !!user?.biodata?.id,
    retry: 1,
    staleTime: 30000
  });

  // Fetch user requests
  const {
    data: requests = { data: [], total: 0, page: 1, limit: 5, totalPages: 1 },
    isLoading: requestsLoading,
    error: requestsError
  } = useQuery({
    queryKey: ['user-requests'],
    queryFn: async () => {
      try {
        const response = await requestsApi.getUserRequests({ limit: 5 });
        return response || { data: [], total: 0, page: 1, limit: 5, totalPages: 1 };
      } catch (error) {
        console.error('Error fetching user requests:', error);
        return { data: [], total: 0, page: 1, limit: 5, totalPages: 1 };
      }
    },
    retry: 1,
    staleTime: 30000
  });

  // Set error flag when any query fails
  useEffect(() => {
    if (savingsError || loansError || requestsError || biodataError) {
      setShowError(true);
    }
  }, [savingsError, loansError, requestsError, biodataError]);

  // Determine active loans and total loan balance
  const activeLoans = loans.filter(
    (loan) => loan.status === 'ACTIVE' || loan.status === 'DISBURSED'
  );
  const totalLoanBalance = activeLoans.reduce(
    (total: number, loan: Loan) => total + (loan.remainingBalance || 0), 
    0
  );

  const navigateToSavings = () => router.push('/savings');
  const navigateToLoans = () => router.push('/loans');
  const navigateToShares = () => router.push('/savings');

  // Hide error after 5 seconds
  useEffect(() => {
    if (showError) {
      const timer = setTimeout(() => setShowError(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showError]);

  return (
    <ProtectedRoute allowedRoles={['MEMBER']}>
      <DashboardLayout>
        <Box sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>
            {userLoading || biodataLoading ? (
              'Loading...'
            ) : (
              `Welcome back, ${biodata?.firstName || user?.adminProfile?.firstName || 'Member'}!`
            )}
          </Typography>

          {(savingsError || loansError || requestsError || biodataError) && showError && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setShowError(false)}>
              There was an error loading some of your information. Please refresh to try again.
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Financial Summary Cards */}
            <Grid size={{ xs:12, md:4 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6">Savings Balance</Typography>
                    <Savings color="primary" />
                  </Box>
                  {savingsLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                      <CircularProgress size={30} />
                    </Box>
                  ) : (
                    <>
                      <Typography variant="h4" gutterBottom>
                        {formatCurrency(savingsSummary?.totalSavings || 0)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Monthly contribution: {formatCurrency(savingsSummary?.monthlyContribution || 0)}
                      </Typography>
                      <Button 
                        variant="text" 
                        endIcon={<ArrowForward />} 
                        onClick={navigateToSavings}
                        sx={{ mt: 2 }}
                      >
                        View Details
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid size={{ xs:12, md:4 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6">Shares Capital</Typography>
                    <AccountBalanceWallet color="primary" />
                  </Box>
                  {savingsLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                      <CircularProgress size={30} />
                    </Box>
                  ) : (
                    <>
                      <Typography variant="h4" gutterBottom>
                        {formatCurrency(savingsSummary?.totalShares || 0)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total share value
                      </Typography>
                      <Button 
                        variant="text" 
                        endIcon={<ArrowForward />} 
                        onClick={navigateToShares}
                        sx={{ mt: 2 }}
                      >
                        View Details
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid size={{ xs:12, md:4 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6">Active Loans</Typography>
                    <CreditCard color="primary" />
                  </Box>
                  {loansLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                      <CircularProgress size={30} />
                    </Box>
                  ) : (
                    <>
                      <Typography variant="h4" gutterBottom>
                        {formatCurrency(totalLoanBalance)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {activeLoans.length} active loan{activeLoans.length !== 1 ? 's' : ''}
                      </Typography>
                      <Button 
                        variant="text" 
                        endIcon={<ArrowForward />} 
                        onClick={navigateToLoans}
                        sx={{ mt: 2 }}
                      >
                        View Details
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Charts and Recent Transactions */}
            <Grid size={{ xs:12, md:8 }}>
              <Stack spacing={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Savings Overview
                    </Typography>
                    <SavingsChart />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Recent Transactions
                    </Typography>
                    <RecentTransactions limit={5} />
                  </CardContent>
                </Card>
              </Stack>
            </Grid>

            {/* Recent Requests & Quick Actions */}
            <Grid size={{ xs:12, md:4 }}>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6">Pending Requests</Typography>
                    <RequestQuote color="primary" />
                  </Box>
                  
                  {requestsLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                      <CircularProgress size={30} />
                    </Box>
                  ) : requests?.data && requests.data.length > 0 ? (
                    <Stack spacing={2} divider={<Divider flexItem />}>
                      {requests.data.slice(0, 3).map((request: Request) => (
                        <Box key={request.id}>
                          <Typography variant="subtitle2">
                            {request.type.replace(/_/g, ' ')} Request
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Status: {request.status}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No pending requests
                    </Typography>
                  )}

                  {requests?.data && requests.data.length > 3 && (
                    <Button 
                      variant="text" 
                      endIcon={<ArrowForward />} 
                      sx={{ mt: 2 }}
                      onClick={() => router.push('/requests')}
                    >
                      View All
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Quick Actions
                  </Typography>
                  <Stack spacing={2}>
                    <Button variant="outlined" onClick={navigateToSavings} fullWidth>
                      Request Withdrawal
                    </Button>
                    <Button variant="outlined" onClick={navigateToLoans} fullWidth>
                      Apply for Loan
                    </Button>
                    <Button variant="outlined" onClick={() => router.push('/profile')} fullWidth>
                      Update Profile
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </DashboardLayout>
    </ProtectedRoute>
  );
}