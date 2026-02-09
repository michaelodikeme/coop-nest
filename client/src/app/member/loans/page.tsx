'use client';

import { Key, useState } from 'react';
import { 
  Box, 
  Container, 
  Grid, 
  Button,
  Typography,
  Paper,
  Tabs,
  Tab,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Divider,
  Alert,
  useTheme,
  IconButton 
} from '@mui/material';
import { 
  Add as AddIcon,
  MonetizationOn,
  RequestQuote,
  History,
  CheckCircle,
  Schedule,
  Warning,
  ArrowForward,
  KeyboardArrowRight
} from '@mui/icons-material';
import { useQueryWithToast } from '@/lib/hooks/redux/useDataFetching';
import { memberService, loanService } from '@/lib/api';
import { format } from 'date-fns';
import { formatCurrency, formatDate } from '@/utils/formatting/format';
import { Loan } from '@/types/loan.types';
import { LoanApplicationModal } from '@/components/features/member/loans/LoanApplicationModal';
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton';
import { LoanDetailsModal } from '@/components/features/member/loans/LoanDetailsModal';
import { LoanFAQModal } from '@/components/features/member/loans/LoanFAQModal';

// TabPanel component for the loan tabs
const TabPanel = (props: {
  children?: React.ReactNode;
  index: number;
  value: number;
}) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`loan-tabpanel-${index}`}
      aria-labelledby={`loan-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

// LoanCard component to display loan details
const LoanCard = ({ loan }: { loan: Loan }) => {
  const theme = useTheme();
  const [showDetails, setShowDetails] = useState(false);
  
  // Calculate payment progress percentage
  const progressPercent = Math.min(
    100,
    Math.round((Number(loan.paidAmount) / Number(loan.totalAmount)) * 100)
  );
  
  // Find next payment schedule
  const nextPaymentSchedule = loan.paymentSchedules?.find(
    schedule => schedule.status === 'PENDING' || schedule.status === 'PARTIAL'
  );

  // Generate status chip based on loan status
  const getLoanStatusChip = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return <Chip icon={<CheckCircle fontSize="small" />} label="Active" color="success" size="small" />;
      case 'PENDING':
        return <Chip icon={<Schedule fontSize="small" />} label="Pending" color="warning" size="small" />;
      case 'REJECTED':
        return <Chip icon={<Warning fontSize="small" />} label="Rejected" color="error" size="small" />;
      case 'COMPLETED':
        return <Chip icon={<CheckCircle fontSize="small" />} label="Completed" color="info" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };
  
  return (
    <>
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="h6" sx={{ mr: 1 }}>
                  {loan.loanType?.name || 'Loan'}
                </Typography>
                {getLoanStatusChip(loan.status)}
              </Box>
              <Typography variant="body2" color="text.secondary">
                {loan.purpose}
              </Typography>
            </Box>
            <Typography variant="h6" color="primary">
              {formatCurrency(Number(loan.principalAmount || 0))}
            </Typography>
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">Payment Progress</Typography>
              <Typography variant="body2" fontWeight={500}>
                {progressPercent}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={progressPercent} 
              sx={{ height: 8, borderRadius: 4 }} 
            />
          </Box>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={6}>
              <Typography variant="body2" color="text.secondary">Paid Amount</Typography>
              <Typography variant="body1" fontWeight={500}>
                {formatCurrency(Number(loan.paidAmount))}
              </Typography>
            </Grid>
            <Grid size={6}>
              <Typography variant="body2" color="text.secondary">Remaining</Typography>
              <Typography variant="body1" fontWeight={500}>
                {formatCurrency(Number(loan.remainingBalance))}
              </Typography>
            </Grid>
            <Grid size={6}>
              <Typography variant="body2" color="text.secondary">Next Payment</Typography>
              <Box>
                <Typography variant="body1" fontWeight={500}>
                  {nextPaymentSchedule ? (
                    format(new Date(nextPaymentSchedule.dueDate), 'MMM dd, yyyy')
                  ) : '-'}
                </Typography>
                {nextPaymentSchedule && (
                  <Typography variant="caption" color="text.secondary">
                    Amount: {formatCurrency(Number(nextPaymentSchedule.expectedAmount))}
                  </Typography>
                )}
              </Box>
            </Grid>
            <Grid size={6}>
              <Typography variant="body2" color="text.secondary">Interest Rate</Typography>
              <Typography variant="body1" fontWeight={500}>
                {formatInterestRate(loan.loanType?.interestRate)}
              </Typography>
            </Grid>
          </Grid>
          
          <Button
            variant="outlined"
            size="small"
            endIcon={<KeyboardArrowRight fontSize="small" />}
            sx={{ mt: 1 }}
            onClick={() => setShowDetails(true)}
          >
            View Details
          </Button>
        </CardContent>
      </Card>

      {showDetails && (
        <LoanDetailsModal
          open={showDetails}
          onClose={() => setShowDetails(false)}
          loanId={loan.id}
        />
      )}
    </>
  );
};

// Loan Application Card component
const LoanApplicationCard = ({ onApply }: { onApply: () => void }) => (
  <Paper sx={{ p: 3, mb: 3, borderRadius: 2, textAlign: 'center' }}>
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <MonetizationOn color="primary" sx={{ fontSize: 60 }} />
      <Typography variant="h5">Need a Loan?</Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Apply for a loan to meet your financial needs with competitive interest rates and flexible repayment options.
      </Typography>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={onApply}
      >
        Apply Now
      </Button>
    </Box>
  </Paper>
);

// Helper function to format interest rate
const formatInterestRate = (rate: string | number | undefined): string => {
  if (!rate) return '0%';
  const interestRate = Number(rate);
  if (isNaN(interestRate)) return '0%';
  // Convert decimal to percentage and round to 1 decimal place
  return `${(interestRate * 100).toFixed(1)}%`;
};

// Main Loans Page component
export default function LoansPage() {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [showLoanFAQ, setShowLoanFAQ] = useState(false);

  // First get member's biodata
  const { data: biodataData } = useQueryWithToast(
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

  // Then fetch member's loans
  const { data: loansData, isLoading: isLoansLoading } = useQueryWithToast(
    ['member-loans', biodataData?.data?.biodataId],
    async () => {
      const memberId = biodataData?.biodataId;
      if (!memberId) throw new Error('Member ID is required');
      return loanService.getMemberLoans(memberId);
    },
    {
      enabled: !!biodataData?.biodataId,
      errorMessage: 'Failed to load loan information',
      staleTime: 300000,
      unwrapResponse: true,
      onSuccess: (data) => {
        console.log('Fetched member loans (unwrapped):', data);
      }
    }
  );

  
//   const totalOutstandingBalance = loansData?.reduce((sum, loan) => (
//     const amount = Number(loan.data.remainingBalance);
//     return sum + (isNan(amount) ? 0: amount);
// ), 0);

  // Filter loans based on status
  const activeLoans = loansData?.filter((loan: { status: string; }) => 
    loan.status.toUpperCase() === 'ACTIVE' || 
    loan.status.toUpperCase() === 'DISBURSED'
  ) || [];

  // // Total loans balance
  // const totalLoanBalance = totalOutstandingBalance || 
  // loans?.reduce((sum, loan) => {
  //   const amount = Number(loan.data.remainingBalance);
  //   return sum + (isNaN(amount) ? 0 : amount);
  // }, 0) || 0;

  const pendingLoans = loansData?.filter((loan: { status: string; }) => 
    loan.status.toUpperCase() === 'PENDING' || 
    loan.status.toUpperCase() === 'IN_REVIEW' ||
    loan.status.toUpperCase() === 'REVIEWED'
  ) || [];

  const completedLoans = loansData?.filter((loan: { status: string; }) =>
    loan.status.toUpperCase() === 'COMPLETED' ||
    loan.status.toUpperCase() === 'REJECTED' || loan.status.toUpperCase() === 'DISBURSED'
  ) || [];

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (isLoansLoading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <DashboardSkeleton />
        </Box>
      </Container>
    );
  }

  if (!loansData) {
    return (
      <Container maxWidth="xl">
        <Alert severity="error" sx={{ mt: 4 }}>
          Unable to load loan information. Please try again later.
        </Alert>
      </Container>
    );
  }

  // Calculate total outstanding balance from all active loans
  const totalOutstandingBalance = activeLoans?.reduce((sum: number, loan: { remainingBalance: any; }) => {
    const remainingBalance = Number(loan.remainingBalance);
    return sum + (isNaN(remainingBalance) ? 0 : remainingBalance);
  }, 0) || 0;

  return (
    <Container maxWidth="xl">
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 4 
      }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          My Loans
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowLoanForm(true)}
        >
          Apply for Loan
        </Button>
      </Box>
      
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ 
            borderRadius: 2,
            boxShadow: `0 2px 14px 0 ${theme.palette.grey[200]}`,
            overflow: 'hidden'
          }}>
            <Box sx={{ p: 2, pt: 1, borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange}
                textColor="primary"
                indicatorColor="primary"
              >
                <Tab 
                  icon={<CheckCircle fontSize="small" />} 
                  iconPosition="start" 
                  label={`Active (${activeLoans.length})`} 
                />
                <Tab 
                  icon={<Schedule fontSize="small" />} 
                  iconPosition="start" 
                  label={`Pending (${pendingLoans.length})`} 
                />
                <Tab 
                  icon={<History fontSize="small" />} 
                  iconPosition="start" 
                  label={`History (${completedLoans.length})`} 
                />
              </Tabs>
            </Box>
            
            <Box sx={{ p: 3 }}>
              <TabPanel value={tabValue} index={0}>
                {activeLoans.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">You have no active loans</Typography>
                  </Box>
                ) : (
                  activeLoans.map((loan: Loan) => (
                    <LoanCard key={loan.id} loan={loan} />
                  ))
                )}
              </TabPanel>
              
              <TabPanel value={tabValue} index={1}>
                {pendingLoans.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">You have no pending loan applications</Typography>
                  </Box>
                ) : (
                  pendingLoans.map((loan: Loan) => (
                    <LoanCard key={loan.id} loan={loan} />
                  ))
                )}
              </TabPanel>
              
              <TabPanel value={tabValue} index={2}>
                {completedLoans.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">You have no completed loans</Typography>
                  </Box>
                ) : (
                  completedLoans.map((loan: Loan) => (
                    <LoanCard key={loan.id} loan={loan} />
                  ))
                )}
              </TabPanel>
            </Box>
          </Paper>
        </Grid>
        
        <Grid size={{ xs: 12, md: 4 }}>
          
          <Paper sx={{ p: 3, borderRadius: 2, mb: 3, boxShadow: `0 2px 14px 0 ${theme.palette.grey[200]}` }}>
            <Typography variant="h6" gutterBottom>
              Loan Summary
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid size={6}>
                <Typography variant="body2" color="text.secondary">
                  Total Outstanding
                </Typography>
                <Typography variant="h6">
                  {formatCurrency(totalOutstandingBalance)}
                </Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant="body2" color="text.secondary">
                  Active Loans
                </Typography>
                <Typography variant="h6">
                  {activeLoans.length}
                </Typography>
              </Grid>
              {/* Add loan breakdown if needed */}
              {activeLoans.length > 0 && (
                <Grid size={12}>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Outstanding by Loan
                    </Typography>
                    {activeLoans.map((loan: { id: Key | null | undefined; loanType: { name: any; }; remainingBalance: any; }) => (
                      <Box 
                        key={loan.id} 
                        sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          mb: 1,
                          fontSize: '0.875rem'
                        }}
                      >
                        <Typography variant="body2">
                          {loan.loanType?.name || 'Loan'}
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {formatCurrency(Number(loan.remainingBalance))}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Grid>
              )}
              <Grid size={12}>
                <Alert 
                  severity="info" 
                  sx={{ borderRadius: 1 }}
                  icon={<RequestQuote />}
                >
                  Eligible for up to {formatCurrency(10000)} in new loans
                </Alert>
              </Grid>
            </Grid>
          </Paper>

          <LoanApplicationCard onApply={() => setShowLoanForm(true)} />

          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: `0 2px 14px 0 ${theme.palette.grey[200]}` }}>
            <Typography variant="h6" gutterBottom>
              Quick Help
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body2" paragraph color="text.secondary">
              Need assistance with your loan application or have questions about our loan programs?
            </Typography>
            <Button
              variant="outlined"
              fullWidth
              endIcon={<ArrowForward />}
              onClick={() => setShowLoanFAQ(true)}
            >
              Loan FAQ
            </Button>
          </Paper>
        </Grid>
      </Grid>
      
      {/* You would add your modal components here for loan application forms */}
      {showLoanForm && (
        <LoanApplicationModal 
          open={showLoanForm} 
          onClose={() => setShowLoanForm(false)} 
        />
      )}
      {showLoanFAQ && (
        <LoanFAQModal 
          open={showLoanFAQ} 
          onClose={() => setShowLoanFAQ(false)} 
        />
      )}
    </Container>
  );
}