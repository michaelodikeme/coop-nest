'use client';

import { useState, useMemo } from 'react';
import { 
  Box, Container, Typography, Button, Alert, 
  IconButton, Grid 
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import { format } from 'date-fns';
import { useMemberDashboard } from '@/lib/hooks/member/useMemberDashboard';
import SummaryCards from '@/components/organisms/member/dashboard/SummaryCards';
import FinancialInsights from '@/components/organisms/member/dashboard/FinancialInsights';
import RecentTransactionsSidebar from '@/components/organisms/member/dashboard/RecentTransactionsSidebar';
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton';
import { useQueryClient } from '@tanstack/react-query';

export default function MemberDashboard() {
  const queryClient = useQueryClient();
  const [showAlert, setShowAlert] = useState(true);
  
  // Use our comprehensive data hook
  const {
      memberBiodata,
      savingsSummary,
      activeLoans,
      monthlyTrend: rawMonthlyTrend,
      nextPaymentDue,
      totalOutstandingBalance,
      isAnyLoading,
      error
    } = useMemberDashboard();
    
    // Add the required 'year' property to each item in monthlyTrend
    const monthlyTrend = rawMonthlyTrend?.map(item => ({
      ...item,
      year: new Date().getFullYear().toString() // Use current year or extract from month if available
    }));
  
  console.log('memberBiodata:', memberBiodata); // Add this to inspect the structure

  console.log('Dashboard render with: ', {
    activeLoans,
    totalOutstandingBalance,
    activeLoansCount: activeLoans?.length,
    nextPaymentDue
  });

  // Refresh data
  const handleRefreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['member-biodata'] });
    queryClient.invalidateQueries({ queryKey: ['member-savings-summary'] });
    queryClient.invalidateQueries({ queryKey: ['member-loans'] });
    queryClient.invalidateQueries({ queryKey: ['member-transactions'] });
    queryClient.invalidateQueries({ queryKey: ['member-savings-stats'] });
  };

  const biodataObject = useMemo(() => {
    if (!memberBiodata) return null;
    
    // Check if memberBiodata has a nested data property (API response format)
    return memberBiodata.data ? memberBiodata.data : memberBiodata;
  }, [memberBiodata]);

  const savingsObject = useMemo(() => {
    if (!savingsSummary) return null;
    
    // Check if savingsSummary has a nested data property (API response format)
    return savingsSummary.data ? savingsSummary.data : savingsSummary;
  }, [savingsSummary]);

  // Show loading state
  if (isAnyLoading) {
    return <DashboardSkeleton />;
  }

  // Handle CRITICAL errors only (biodata is required, savings/loans are optional)
  if (error.biodata) {
    return (
      <Container maxWidth="xl">
        <Alert severity="error" sx={{ mt: 4 }}>
          Unable to load your profile information. Please try again later.
        </Alert>
      </Container>
    );
  }

  // Show non-critical errors as warnings (savings and loans can be empty for new users)
  const hasNonCriticalErrors = error.savings || error.loans;

  // Check for upcoming payment
  const hasUpcomingPayment = nextPaymentDue && 
    new Date(nextPaymentDue.dueDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return (
    <Container maxWidth="xl">
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        mb: 4
      }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }} gutterBottom>
            Welcome, {biodataObject?.biodata?.firstName || 'Member'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Here's your financial overview as of {format(new Date(), 'MMM dd, yyyy')}
          </Typography>
        </Box>

        {/* Quick Actions */}
        <Box sx={{ display: 'flex', gap: 1, mt: { xs: 2, md: 0 } }}>
          <IconButton onClick={handleRefreshData} title="Refresh data">
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Non-Critical Error Warning */}
      {hasNonCriticalErrors && (
        <Alert
          severity="info"
          sx={{ mb: 3, borderRadius: 2 }}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={handleRefreshData}
            >
              <RefreshIcon fontSize="inherit" />
            </IconButton>
          }
        >
          <Typography variant="subtitle2">
            Some data could not be loaded. This is normal for new members. Click refresh to try again.
          </Typography>
        </Alert>
      )}

      {/* Information Alert */}
      {showAlert && hasUpcomingPayment && (
        <Alert
          severity="warning"
          sx={{ mb: 4, borderRadius: 2 }}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => setShowAlert(false)}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
        >
          <Typography variant="subtitle2">
            You have a loan payment due on {nextPaymentDue ?
              format(new Date(nextPaymentDue.dueDate), 'MMMM dd, yyyy') : ''}
          </Typography>
        </Alert>
      )}

      <Grid container spacing={4}>
        <Grid size={12}>
          <SummaryCards 
            savings={savingsObject}
            loans={activeLoans} 
            totalOutstandingBalance={totalOutstandingBalance}
            nextPaymentDue={nextPaymentDue} 
            isLoading={isAnyLoading}
          />
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <FinancialInsights 
            monthlyTrend={monthlyTrend} 
            loanData={activeLoans}
          />
        </Grid>
        
        <Grid size={{ xs: 12, lg: 4 }}>
          <RecentTransactionsSidebar/>
        </Grid>
      </Grid>
    </Container>
  );
}