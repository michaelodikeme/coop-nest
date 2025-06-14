import { Box, Grid, Skeleton } from '@mui/material';
import StatCard from '@/components/molecules/StatCard';
import { formatCurrency, formatDate } from '@/utils/formatting/format';
import { SavingsSummary } from '@/types/financial.types';

interface SummaryCardsProps {
  savings?: SavingsSummary;
  loans?: Array<any>;
  totalOutstandingBalance?: number;
  nextPaymentDue?: {
    loanId: string;
    dueDate: Date;
    amount: number;
    remainingBalance: number;
  } | null;
  isLoading?: boolean;
}

export default function SummaryCards({ 
  savings, 
  loans = [],
  totalOutstandingBalance,
  nextPaymentDue,
  isLoading = false 
}: SummaryCardsProps) {
  // Use the total outstanding balance directly from backend calculation
  const totalLoanBalance = totalOutstandingBalance || 
    loans?.reduce((sum, loan) => {
      const amount = Number(loan.data.remainingBalance);
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0) || 0;
  
  if (isLoading) {
    return (
      <Grid container spacing={3}>
        {[1, 2, 3, 4].map(i => (
          <Grid size={{ xs: 12, sm: 12, md: 3 }} key={i}>
            <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 2 }} />
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <StatCard
          title="Total Savings"
          value={formatCurrency(Number(savings?.totalSavingsAmount || 0))}
          subtitle={savings?.lastDeposit ? 
            `Last deposit: ${formatDate(new Date(savings.lastDeposit))}` : 
            'No recent deposits'}
          icon="savings"
          color="primary"
        />
      </Grid>
      
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <StatCard
          title="Shares Value"
          value={formatCurrency(Number(savings?.shares?.totalSharesAmount || 0))}
          subtitle={`Monthly contribution: ${formatCurrency(Number(savings?.shares?.monthlyAmount || 0))}`}
          icon="pie_chart"
          color="success"
        />
      </Grid>
      
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <StatCard
          title="Active Loans"
          value={formatCurrency(Number(totalLoanBalance))}
          subtitle={
            loans && loans.length > 0
              ? <Box component="div" sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {loans.map(loan => (
                    <Box component="span" key={loan.id} sx={{ fontSize: '0.75rem', lineHeight: 1.2 }}>
                      {formatCurrency(Number(loan.remainingBalance))}
                      <Box component="span" sx={{ display: 'block', color: 'text.secondary', fontSize: '0.7rem' }}>
                        {loan.loanType?.name || 'Loan'}
                        {loan.tenure && <span> ({loan.tenure} months)</span>}
                      </Box>
                    </Box>
                  ))}
                </Box>
              : 'No active loans'
          }
          icon="account_balance"
          color="warning"
        />
      </Grid>
      
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <StatCard
          title="Next Payment Due"
          value={loans && loans.length > 0 
            ? formatCurrency(loans.reduce((sum, loan) => {
                const nextSchedule = loan.paymentSchedules?.find(
                  (schedule: { status: string }) => schedule.status === 'PENDING' || schedule.status === 'PARTIAL'
                );
                return sum + (nextSchedule ? Number(nextSchedule.expectedAmount) : 0);
              }, 0))
            : 'No payments due'
          }
          subtitle={
            loans && loans.length > 0
              ? <Box component="div" sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {loans.map(loan => {
                    const nextSchedule = loan.paymentSchedules?.find(
                      (schedule: { status: string }) => schedule.status === 'PENDING' || schedule.status === 'PARTIAL'
                    );
                    if (!loan.nextPaymentDue || !nextSchedule) return null;
                    
                    return (
                      <Box component="span" key={loan.id} sx={{ fontSize: '0.75rem', lineHeight: 1.2 }}>
                        {formatDate(new Date(loan.nextPaymentDue))} - {formatCurrency(Number(nextSchedule.expectedAmount))}
                        <Box component="span" sx={{ display: 'block', color: 'text.secondary', fontSize: '0.7rem' }}>
                          {loan.loanType?.name || 'Loan'}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              : ''
          }
          icon="calendar_today"
          color="info"
        />
      </Grid>
    </Grid>
  );
}
