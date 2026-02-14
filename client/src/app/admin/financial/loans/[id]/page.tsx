'use client';

import { useState, use } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  alpha,
  useTheme,
  Tabs,
  Tab
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import PaymentsIcon from '@mui/icons-material/Payments';
import HistoryIcon from '@mui/icons-material/History';
import { useRouter } from 'next/navigation';
import { formatCurrency, formatDate } from '@/utils/formatting/format';
import { useAdminLoanDetails } from '@/lib/hooks/admin/useAdminFinancial';
import LoadingScreen from '@/components/atoms/LoadingScreen';
import { LoanStatus } from '@/types/loan.types';

export default function AdminLoanDetailsPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params);
  const loanId = resolvedParams.id;

  return <LoanDetailsPageContent loanId={loanId} />;
}

function LoanDetailsPageContent({ loanId }: { loanId: string }) {
  const theme = useTheme();
  const router = useRouter();
  const [tabValue, setTabValue] = useState(0);

  const { data: loan, isLoading, error } = useAdminLoanDetails(loanId);

  // Get color and label for loan status
  const getStatusChip = (status: LoanStatus) => {
    const statusConfig: Record<string, { color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning', label: string }> = {
      PENDING: { color: 'warning', label: 'Pending' },
      IN_REVIEW: { color: 'info', label: 'In Review' },
      REVIEWED: { color: 'secondary', label: 'Reviewed' },
      APPROVED: { color: 'success', label: 'Approved' },
      REJECTED: { color: 'error', label: 'Rejected' },
      DISBURSED: { color: 'primary', label: 'Disbursed' },
      ACTIVE: { color: 'primary', label: 'Active' },
      COMPLETED: { color: 'default', label: 'Completed' },
      DEFAULTED: { color: 'error', label: 'Defaulted' },
      CANCELLED: { color: 'default', label: 'Cancelled' },
    };
    return statusConfig[status] || { color: 'default', label: status };
  };

  // Get payment schedule status chip
  const getScheduleStatusChip = (status: string) => {
    const statusConfig: Record<string, { color: 'default' | 'success' | 'warning' | 'error', label: string }> = {
      PENDING: { color: 'warning', label: 'Pending' },
      PAID: { color: 'success', label: 'Paid' },
      PARTIAL: { color: 'warning', label: 'Partial' },
      LATE: { color: 'error', label: 'Late' },
    };
    return statusConfig[status] || { color: 'default', label: status };
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error || !loan) {
    return (
      <Box sx={{ p: 3 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="error" variant="h6">
            {error ? 'Error loading loan details' : 'Loan not found'}
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Tooltip title="Go back">
              <IconButton onClick={() => router.back()}>
                <ArrowBackIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Paper>
      </Box>
    );
  }

  // Calculate progress
  const totalAmount = Number(loan.totalAmount || 0);
  const paidAmount = Number(loan.paidAmount || 0);
  const remainingBalance = Number(loan.remainingBalance || 0);
  const progress = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

  const { color, label } = getStatusChip(loan.status as LoanStatus);

  return (
    <Box sx={{ maxWidth: '100%', pt: 2, pb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Tooltip title="Go back">
          <IconButton onClick={() => router.back()}>
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" component="h1" fontWeight={600}>
            Loan Details
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ID: {loanId.substring(0, 8)}...
          </Typography>
        </Box>
        <Chip label={label} color={color} sx={{ fontWeight: 500 }} />
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary" variant="subtitle2" gutterBottom>
                Principal Amount
              </Typography>
              <Typography variant="h5" fontWeight={600}>
                {formatCurrency(Number(loan.principalAmount || 0))}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary" variant="subtitle2" gutterBottom>
                Total with Interest
              </Typography>
              <Typography variant="h5" fontWeight={600}>
                {formatCurrency(totalAmount)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary" variant="subtitle2" gutterBottom>
                Amount Paid
              </Typography>
              <Typography variant="h5" fontWeight={600} color="success.main">
                {formatCurrency(paidAmount)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary" variant="subtitle2" gutterBottom>
                Remaining Balance
              </Typography>
              <Typography variant="h5" fontWeight={600} color="warning.main">
                {formatCurrency(remainingBalance)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Progress Bar */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle2">Repayment Progress</Typography>
          <Typography variant="subtitle2">{Math.round(progress)}%</Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{ height: 10, borderRadius: 5 }}
        />
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(_, v) => setTabValue(v)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<PersonIcon />} label="Loan Info" iconPosition="start" />
          <Tab icon={<PaymentsIcon />} label="Payment Schedule" iconPosition="start" />
          <Tab icon={<HistoryIcon />} label="Repayment History" iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {tabValue === 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Loan Information</Typography>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">Loan Type</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{loan.loanType?.name || 'N/A'}</Typography>

              <Typography variant="subtitle2" color="text.secondary">Interest Rate</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{loan.loanType?.interestRate || 0}%</Typography>

              <Typography variant="subtitle2" color="text.secondary">Tenure</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{loan.tenure} months</Typography>

              <Typography variant="subtitle2" color="text.secondary">Purpose</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{loan.purpose || 'N/A'}</Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">Member</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{loan.member?.fullName || 'N/A'}</Typography>

              <Typography variant="subtitle2" color="text.secondary">ERP ID</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{loan.erpId || 'N/A'}</Typography>

              <Typography variant="subtitle2" color="text.secondary">Created</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{formatDate(loan.createdAt)}</Typography>

              <Typography variant="subtitle2" color="text.secondary">Disbursed</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{loan.disbursedAt ? formatDate(loan.disbursedAt) : 'Not yet disbursed'}</Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {tabValue === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Payment Schedule</Typography>
          <Divider sx={{ mb: 3 }} />

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                  <TableCell>#</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell align="right">Expected</TableCell>
                  <TableCell align="right">Principal</TableCell>
                  <TableCell align="right">Interest</TableCell>
                  <TableCell align="right">Paid</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(loan.paymentSchedules || []).map((schedule: any, index: number) => {
                  const { color: scheduleColor, label: scheduleLabel } = getScheduleStatusChip(schedule.status);
                  return (
                    <TableRow key={schedule.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{formatDate(schedule.dueDate)}</TableCell>
                      <TableCell align="right">{formatCurrency(Number(schedule.expectedAmount || 0))}</TableCell>
                      <TableCell align="right">{formatCurrency(Number(schedule.principalAmount || 0))}</TableCell>
                      <TableCell align="right">{formatCurrency(Number(schedule.interestAmount || 0))}</TableCell>
                      <TableCell align="right">{formatCurrency(Number(schedule.paidAmount || 0))}</TableCell>
                      <TableCell>
                        <Chip label={scheduleLabel} color={scheduleColor} size="small" />
                      </TableCell>
                    </TableRow>
                  );
                })}
                {(!loan.paymentSchedules || loan.paymentSchedules.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="text.secondary">No payment schedule available</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {tabValue === 2 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Repayment History</Typography>
          <Divider sx={{ mb: 3 }} />

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Month/Year</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(loan.repayments || []).map((repayment: any) => (
                  <TableRow key={repayment.id}>
                    <TableCell>{formatDate(repayment.repaymentDate)}</TableCell>
                    <TableCell align="right">{formatCurrency(Number(repayment.amount || 0))}</TableCell>
                    <TableCell>{repayment.repaymentMonth}/{repayment.repaymentYear}</TableCell>
                    <TableCell>
                      <Chip
                        label={repayment.isReconciled ? 'Reconciled' : 'Pending'}
                        color={repayment.isReconciled ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {(!loan.repayments || loan.repayments.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography color="text.secondary">No repayments recorded</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
}
