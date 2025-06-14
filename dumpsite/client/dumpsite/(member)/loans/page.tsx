'use client';

import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { Add as AddIcon } from '@mui/icons-material';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { withRoleGuard as ProtectedRoute } from '@/hooks/auth/withRoleGuard';
import LoanApplicationForm from '@/components/features/loans/LoanApplicationForm';
import LoadingScreen from '@/components/common/LoadingScreen';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { loansApi } from '@/services/api/features/loans/loansApi';
import { useAuth } from '@/hooks/auth/auth';
import { LoanStatus } from '@/types/types';

export default function LoansPage() {
  const [isLoanFormOpen, setIsLoanFormOpen] = useState(false);

  const { 
    data: summary,
    isLoading: summaryLoading,
    error: summaryError
  } = useQuery({
    queryKey: ['loans-summary'],
    queryFn: () => loansApi.getSummary()
  });
  const { user } = useAuth();
  const {
    data: loans,
    isLoading: loansLoading,
    error: loansError,
    refetch: refetchLoans
  } = useQuery({
    queryKey: ['loans', user?.biodata?.id],
    queryFn: () => loansApi.getMemberLoans(user?.biodata?.id as string),
    enabled: !!user?.biodata?.id
  });

  const handleLoanSuccess = () => {
    refetchLoans();
  };

  if (summaryLoading || loansLoading) {
    return (
      <ProtectedRoute allowedRoles={['MEMBER']}>
        <DashboardLayout>
          <LoadingScreen message="Loading loan information..." />
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (summaryError || loansError) {
    throw summaryError || loansError;
  }

  return (
    <ProtectedRoute allowedRoles={['MEMBER']}>
      <DashboardLayout>
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Typography variant="h4" gutterBottom>
                Loans
              </Typography>
              <Typography color="textSecondary">
                View and manage your loan applications
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }} sx={{ textAlign: 'right' }}>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />} 
                sx={{ mb: 2 }}
                onClick={() => setIsLoanFormOpen(true)}
              >
                Apply for Loan
              </Button>
            </Grid>
          </Grid>
        </Box>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 3, width: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Loan Summary
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography color="textSecondary">Active Loans</Typography>
                <Typography variant="h4">
                  {summary?.activeLoans ?? 0}
                </Typography>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography color="textSecondary">Total Borrowed</Typography>
                <Typography variant="h6">
                  ₱{summary?.totalBorrowed.toLocaleString() ?? '0.00'}
                </Typography>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography color="textSecondary">Total Outstanding</Typography>
                <Typography variant="h6" color="warning.main">
                  ₱{summary?.totalOutstanding.toLocaleString() ?? '0.00'}
                </Typography>
              </Box>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 8 }}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Purpose</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="right">Monthly Payment</TableCell>
                    <TableCell align="right">Balance</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loans?.map((loan) => (
                    <TableRow key={loan.id}>
                      <TableCell>
                        {new Date(loan.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{loan.loanPurpose}</TableCell>
                      <TableCell align="right">
                        ₱{loan.loanAmount.toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        ₱{(loan.totalRepayableAmount / loan.loanTenure).toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        ₱{loan.remainingBalance.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={loan.status.toUpperCase()}
                          color={
                            loan.status === LoanStatus.ACTIVE
                              ? 'primary'
                              : loan.status === LoanStatus.COMPLETED
                              ? 'success'
                              : 'warning'
                          }
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!loans || loans.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography color="textSecondary">
                          No loans found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>

        <LoanApplicationForm
          open={isLoanFormOpen}
          onClose={() => setIsLoanFormOpen(false)}
          onSuccess={handleLoanSuccess}
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}