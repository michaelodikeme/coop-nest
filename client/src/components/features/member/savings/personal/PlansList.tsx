import { usePersonalSavingsPlans, useRequestWithdrawal } from '@/lib/hooks/member/usePersonalSavings';
import { PersonalSavingsResponse, PersonalSavingsStatus, RequestStatus } from '@/types/personal-savings.types';
import { useState } from 'react';
import { formatCurrency } from '@/utils/formatting/format';
import { useRouter } from 'next/navigation';
import {
  Button,
  Card,
  CardContent,
  Box,
  Typography,
  Grid,
  Chip,
  Paper,
  TablePagination,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  LinearProgress,
  Divider,
  SelectChangeEvent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import React from 'react';

// Approval progress component
interface ApprovalStep {
  level: string | number;
  approverRole?: string;
}

interface ApprovalProgressProps {
  steps: ApprovalStep[];
  currentLevel: number;
}

function ApprovalProgress({ steps, currentLevel }: ApprovalProgressProps) {
  if (!steps || steps.length === 0) return null;
  
  return (
    <Box sx={{ mt: 1.5 }}>
      <Typography variant="body2" fontWeight="medium" gutterBottom>
        Approval Progress
      </Typography>
      <Stack direction="row" spacing={1} alignItems="center">
        {steps.map(
          (
            step: { level: string | number | bigint | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | Promise<React.AwaitedReactNode> | null | undefined; },
            index: number
          ) => (
          <React.Fragment key={index}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 'medium',
                ...((Number(step.level ?? 0) < currentLevel
                  ? { bgcolor: 'success.light', color: 'success.contrastText', border: '1px solid', borderColor: 'success.main' }
                  : Number(step.level ?? 0) === currentLevel
                  ? { bgcolor: 'primary.light', color: 'primary.contrastText', border: '2px solid', borderColor: 'primary.main' }
                  : { bgcolor: 'grey.100', color: 'text.secondary', border: '1px solid', borderColor: 'grey.300' }))
              }}
            >
              {step.level}
            </Box>
            {index < steps.length - 1 && (
              <Box sx={{ width: 16, height: 1, bgcolor: 'grey.300' }} />
            )}
          </React.Fragment>
        ))}
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
        Current: Level {currentLevel} ({steps.find(s => s.level === currentLevel)?.approverRole || 'Unknown'})
      </Typography>
    </Box>
  );
}

export function PlansList() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [viewFilter, setViewFilter] = useState<'all' | 'active' | 'pending'>('all');
  const [withdrawalModalOpen, setWithdrawalModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PersonalSavingsResponse | null>(null);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalReason, setWithdrawalReason] = useState('');
  const router = useRouter();

  const { data, isLoading, error } = usePersonalSavingsPlans({
    page: page + 1, // API uses 1-indexed pagination
    limit: rowsPerPage,
    includePending: viewFilter !== 'active', // Include pending requests based on filter
  });

  const requestWithdrawalMutation = useRequestWithdrawal();

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewFilterChange = (event: SelectChangeEvent) => {
    setViewFilter(event.target.value as 'all' | 'active' | 'pending');
    setPage(0);
  };

  const handleOpenWithdrawalModal = (plan: PersonalSavingsResponse) => {
    setSelectedPlan(plan);
    setWithdrawalAmount('');
    setWithdrawalReason('');
    setWithdrawalModalOpen(true);
  };

  const handleCloseWithdrawalModal = () => {
    setWithdrawalModalOpen(false);
    setSelectedPlan(null);
    setWithdrawalAmount('');
    setWithdrawalReason('');
  };

  const handleSubmitWithdrawal = () => {
    if (!selectedPlan?.id || !withdrawalAmount) return;

    const amount = parseFloat(withdrawalAmount);
    if (isNaN(amount) || amount <= 0) {
      return;
    }

    requestWithdrawalMutation.mutate({
      id: selectedPlan.id,
      data: {
        amount,
        reason: withdrawalReason || 'Personal savings withdrawal',
      },
    }, {
      onSuccess: () => {
        handleCloseWithdrawalModal();
      },
    });
  };

  // Filter items based on view filter
  const filteredData = data?.data?.filter(item => {
    if (viewFilter === 'active' && item.type === 'PENDING_CREATION') {
      return false;
    }
    if (viewFilter === 'pending' && item.type !== 'PENDING_CREATION') {
      return false;
    }
    return true;
  });

  if (isLoading) {
    return <LinearProgress sx={{ my: 4 }} />;
  }

  if (error) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography color="error">
          Error loading plans: {(error as Error).message}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header with stats */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary" gutterBottom>Active Plans</Typography>
                <Typography variant="h5">{data?.meta?.activeCount || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary" gutterBottom>Pending Requests</Typography>
                <Typography variant="h5">{data?.meta?.pendingCreationCount || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary" gutterBottom>Closed Plans</Typography>
                <Typography variant="h5">{data?.meta?.closedCount || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Header with actions */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="h5" fontWeight="bold">
            My Savings Plans
          </Typography>
          
          <FormControl variant="outlined" size="small" sx={{ minWidth: 180 }}>
            <InputLabel>View</InputLabel>
            <Select
              value={viewFilter}
              onChange={handleViewFilterChange}
              label="View"
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="active">Active Plans Only</MenuItem>
              <MenuItem value="pending">Pending Requests Only</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => router.push('/member/savings/personal/create')}
        >
          Request New Plan
        </Button>
      </Box>
      
      {/* Main content */}
      {!filteredData?.length ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="textSecondary" gutterBottom>
            {viewFilter === 'all' 
              ? "You don't have any personal savings plans yet."
              : viewFilter === 'active'
                ? "You don't have any active personal savings plans."
                : "You don't have any pending savings plan requests."}
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => router.push('/member/savings/personal/create')}
            sx={{ mt: 2 }}
          >
            Request New Plan
          </Button>
        </Paper>
      ) : (
        <Box>
          <Grid container spacing={3}>
            {filteredData.map(item => {
              // Determine if this is a pending creation request or an actual plan
              // Modify the isPending check to handle approved requests that have an ID
              const isPending = item.type === 'PENDING_CREATION' && 
                                !(item.status === RequestStatus.APPROVED && item.id);
              const hasWithdrawal = !!item.pendingWithdrawal;
              
              return (
                <Grid size={{ xs: 12, sm: 6, md: 4}} key={isPending ? item.requestId : item.id}>
                  <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ pb: 1, flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                        <Typography variant="h6" noWrap sx={{ maxWidth: '70%' }}>
                          {item.planName || "Savings Plan"}
                        </Typography>
                        {getStatusChip(item)}
                      </Box>
                      
                      <Divider sx={{ mb: 2 }} />
                      
                      {/* Different content for pending requests vs. active plans */}
                      {isPending ? (
                        // Content for pending creation requests
                        <>
                          <Box sx={{ mb: 1.5 }}>
                            <Typography variant="body2" color="text.secondary">
                              Request ID: {item.requestId?.substring(0, 8)}...
                            </Typography>
                          </Box>
                          
                          {item.targetAmount && (
                            <Box sx={{ mb: 1.5 }}>
                              <Typography variant="body2" color="text.secondary">
                                Target Amount:
                              </Typography>
                              <Typography variant="body1" fontWeight="medium">
                                {formatCurrency(item.targetAmount)}
                              </Typography>
                            </Box>
                          )}
                          
                          <Box sx={{ mb: 1.5 }}>
                            <Typography variant="body2" color="text.secondary">
                              Requested: {new Date(item.createdAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                          
                          {/* Show approval workflow */}
                          {item.approvalSteps && item.approvalSteps.length > 0 && (
                            <ApprovalProgress 
                              steps={item.approvalSteps}
                              currentLevel={item.currentApprovalLevel || 1}
                            />
                          )}
                        </>
                      ) : (
                        // Content for existing plans
                        <>
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                              Balance:
                            </Typography>
                            <Typography variant="h6" fontWeight="medium">
                              {formatCurrency(item.currentBalance || 0)}
                            </Typography>
                          </Box>
                          
                          {item.targetAmount && (
                            <Box sx={{ mb: 1.5 }}>
                              <Typography variant="body2" color="text.secondary">
                                Target: {formatCurrency(item.targetAmount)}
                              </Typography>
                            </Box>
                          )}
                          
                          <Box sx={{ mb: 1.5 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Created: {new Date(item.createdAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                          
                          {/* Show withdrawal request if pending */}
                          {hasWithdrawal && (
                            <Box sx={{ mt: 1, p: 1.5, bgcolor: 'warning.light', borderRadius: 1 }}>
                              <Typography variant="body2" fontWeight="medium" color="warning.dark">
                                Pending Withdrawal: {formatCurrency(item.pendingWithdrawal?.amount ||0)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Status: {item.pendingWithdrawal?.status}
                              </Typography>
                              {item.pendingWithdrawal && item.pendingWithdrawal.approvalSteps && (
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Approval Level: {item.pendingWithdrawal.currentApprovalLevel} of {item.pendingWithdrawal.approvalSteps.length}
                                </Typography>
                              )}
                            </Box>
                          )}
                        </>
                      )}
                    </CardContent>
                    
                    <Box sx={{ p: 2, pt: 0, mt: 'auto' }}>
                      <Stack spacing={1}>
                        <Button
                          variant="outlined"
                          fullWidth
                          onClick={() => router.push(isPending
                            ? `/member/savings/personal/requests/${item.requestId}`
                            : `/member/savings/personal/${item.id || item.requestId}`
                          )}
                        >
                          {isPending ? 'View Request' : 'View Details'}
                        </Button>

                        {/* Show withdrawal button only for active plans without pending withdrawals */}
                        {!isPending && !hasWithdrawal && item.status === PersonalSavingsStatus.ACTIVE && (item.currentBalance || 0) > 0 && (
                          <Button
                            variant="contained"
                            fullWidth
                            startIcon={<AccountBalanceWalletIcon />}
                            onClick={() => handleOpenWithdrawalModal(item)}
                          >
                            Request Withdrawal
                          </Button>
                        )}
                      </Stack>
                    </Box>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          {/* Pagination */}
          <Box mt={3} display="flex" justifyContent="flex-end">
            <TablePagination
              component="div"
              count={data?.meta?.total || 0}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </Box>
        </Box>
      )}

      {/* Withdrawal Request Modal */}
      <Dialog
        open={withdrawalModalOpen}
        onClose={handleCloseWithdrawalModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Request Withdrawal</DialogTitle>
        <DialogContent>
          {selectedPlan && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Plan: {selectedPlan.planName || "Savings Plan"}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Available Balance: {formatCurrency(selectedPlan.currentBalance || 0)}
              </Typography>

              <TextField
                fullWidth
                label="Withdrawal Amount"
                type="number"
                value={withdrawalAmount}
                onChange={(e) => setWithdrawalAmount(e.target.value)}
                margin="normal"
                inputProps={{
                  min: 0,
                  max: selectedPlan.currentBalance || 0,
                  step: 0.01,
                }}
                helperText={`Maximum: ${formatCurrency(selectedPlan.currentBalance || 0)}`}
              />

              <TextField
                fullWidth
                label="Reason (Optional)"
                multiline
                rows={3}
                value={withdrawalReason}
                onChange={(e) => setWithdrawalReason(e.target.value)}
                margin="normal"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseWithdrawalModal}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmitWithdrawal}
            disabled={
              requestWithdrawalMutation.isPending ||
              !withdrawalAmount ||
              parseFloat(withdrawalAmount) <= 0 ||
              parseFloat(withdrawalAmount) > (selectedPlan?.currentBalance || 0)
            }
          >
            {requestWithdrawalMutation.isPending ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Helper function to get status chip
function getStatusChip(item: PersonalSavingsResponse) {
  // For pending creation requests
  if (item.type === 'PENDING_CREATION') {
    // This is the crucial check: if status is APPROVED and we have an ID, 
    // it means the plan has been created but UI hasn't caught up
    if (item.status === RequestStatus.APPROVED && item.id) {
      return <Chip size="small" color="success" label="Active" />;
    }
    
    switch (item.status) {
      case RequestStatus.PENDING:
        return <Chip size="small" color="warning" label="Pending Approval" />;
      case RequestStatus.IN_REVIEW:
        return <Chip size="small" color="info" label="In Review" />;
      case RequestStatus.REVIEWED:
        return <Chip size="small" color="secondary" label="Reviewed" />;
      case RequestStatus.APPROVED:
        return <Chip size="small" color="success" label="Active" />; // Change from "Creating" to "Active"
      default:
        return <Chip size="small" label={item.status} />;
    }
  }
  
  // For existing plans with pending withdrawal
  if (item.pendingWithdrawal) {
    return <Chip size="small" color="warning" label="Withdrawal Pending" />;
  }
  
  // Regular plan statuses
  switch (item.status) {
    case PersonalSavingsStatus.ACTIVE:
      return <Chip size="small" color="success" label="Active" />;
    case PersonalSavingsStatus.CLOSED:
      return <Chip size="small" color="default" label="Closed" />;
    case PersonalSavingsStatus.SUSPENDED:
      return <Chip size="small" color="error" label="Suspended" />;
    default:
      return <Chip size="small" label={item.status} />;
  }
}