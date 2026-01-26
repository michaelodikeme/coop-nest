import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Grid,
  useTheme,
  CircularProgress,
  Collapse,
  IconButton
} from '@mui/material';
import {
  Add as AddIcon,
  Cancel as CancelIcon,
  Check as CheckIcon,
  Info as InfoIcon,
  AccessTime as AccessTimeIcon,
  Person as PersonIcon,
  ExpandMore as ExpandMoreIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { savingsService } from '@/lib/api';
import { formatDate, formatCurrency } from '@/utils/formatting/format';

interface WithdrawalRequestsProps {
  maxAmount?: number;
}

const WithdrawalRequests: React.FC<WithdrawalRequestsProps> = ({ maxAmount = 0 }) => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [openNewRequest, setOpenNewRequest] = useState(false);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Add expanded state for each card
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  
  // Toggle expand/collapse function
  const handleExpandCard = (id: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  // Fetch withdrawal requests
  const { data: withdrawalRequests, isLoading } = useQuery({
    queryKey: ['withdrawal-requests'],
    queryFn: () => savingsService.getWithdrawalRequests(),
    staleTime: 300000, // 5 minutes
  });

  // Cancel withdrawal request mutation
  const cancelMutation = useMutation({
    mutationFn: (requestId: string) => 
      savingsService.cancelWithdrawalRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawal-requests'] });
      queryClient.invalidateQueries({ queryKey: ['savings-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['savings-summary'] });
      setOpenCancelDialog(false);
      setSelectedRequest(null);
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to cancel withdrawal request');
    }
  });

  // Create withdrawal request mutation
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

  // Handler for submitting a new withdrawal request
  const handleSubmitRequest = () => {
    setError(null);
    const amountValue = parseFloat(amount);
    
    if (!amountValue || isNaN(amountValue)) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (amountValue <= 0) {
      setError('Amount must be greater than zero');
      return;
    }
    
    // Check against minimum withdrawal amount (₦1,000 based on backend validation)
    if (amountValue < 1000) {
      setError('Minimum withdrawal amount is ₦1,000');
      return;
    }
    
    // Check against maximum available balance
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

  // Handler for canceling a withdrawal request
  const handleCancelRequest = () => {
    if (selectedRequest) {
      cancelMutation.mutate(selectedRequest);
    }
  };
  
  // Handler for closing the new request dialog
  const handleCloseNewRequest = () => {
    setOpenNewRequest(false);
    setAmount('');
    setReason('');
    setError(null);
  };

  // Function to render status chip
  const renderStatusChip = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <Chip
            icon={<AccessTimeIcon fontSize="small" />}
            label="Pending"
            size="small"
            color="warning"
          />
        );
      case 'IN_REVIEW':
        return (
          <Chip
            icon={<PersonIcon fontSize="small" />}
            label="In Review"
            size="small"
            color="primary"
          />
        );
      case 'APPROVED':
        return (
          <Chip
            icon={<CheckIcon fontSize="small" />}
            label="Approved"
            size="small"
            color="info"
          />
        );
      case 'COMPLETED':
        return (
          <Chip
            icon={<CheckIcon fontSize="small" />}
            label="Completed"
            size="small"
            color="success"
          />
        );
      case 'REJECTED':
        return (
          <Chip
            icon={<CancelIcon fontSize="small" />}
            label="Rejected"
            size="small"
            color="error"
          />
        );
      default:
        return <Chip label={status} size="small" />;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Extract requests from response - fix the response structure access
  const requests = withdrawalRequests?.data?.data || [];
  
  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Withdrawal Requests</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenNewRequest(true)}
          data-withdrawal-new-request
        >
          New Request
        </Button>
      </Box>
      
      {requests.length > 0 ? (
        <Stack spacing={2}>
          {requests.map((request: any) => {
            const isExpanded = expandedCards[request.id] || false;
            
            return (
              <Card 
                key={request.id} 
                variant="outlined"
                sx={{ 
                  // borderColor: request.status === 'PENDING' ? theme.palette.warning.light : 'inherit',
                  borderWidth: request.status === 'PENDING' ? 2 : 1
                }}
              >
                <CardContent sx={{ pb: 1 }}>
                  {/* Summary section - always visible */}
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: theme.palette.action.hover }
                  }}
                  onClick={() => handleExpandCard(request.id)}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={500}>
                        {request.amount || (request.rawAmount ? formatCurrency(Number(request.rawAmount)) : 'Amount not available')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {request.requestDate ? formatDate(request.requestDate) : 'date not available'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {renderStatusChip(request.status)}
                      <IconButton 
                        size="small" 
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card click from triggering
                          handleExpandCard(request.id);
                        }}
                        sx={{ 
                          ml: 1,
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: theme.transitions.create('transform')
                        }}
                      >
                        <KeyboardArrowDownIcon />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  <Typography variant="body2" sx={{ mb: isExpanded ? 1 : 0 }}>
                    <strong>Reason:</strong> {request.reason || 'No reason provided'}
                  </Typography>
                  
                  {/* Expandable content */}
                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <Box sx={{ mt: 2 }}>
                      <Divider sx={{ my: 1.5 }} />
                      
                      {/* Approval steps section */}
                      {request.approvalSteps && request.approvalSteps.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" fontWeight={500} gutterBottom>
                            Approval Progress:
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {request.approvalSteps.map((step: any, index: number) => {
                              // Get the actual step status from the step data
                              const actualStatus = step.status || 'PENDING';
                              let displayStatus = actualStatus;
                              let stepIcon;
                              let statusColor;
                              let statusLabel;
                              
                              // Determine appropriate status display based on step status and request status
                              if (actualStatus === 'APPROVED') {
                                displayStatus = 'APPROVED';
                                statusLabel = 'Approved';
                                statusColor = 'success.main';
                                stepIcon = <CheckIcon fontSize="small" color="success" />;
                              } 
                              else if (actualStatus === 'REJECTED') {
                                displayStatus = 'REJECTED';
                                statusLabel = 'Rejected';
                                statusColor = 'error.main';
                                stepIcon = <CancelIcon fontSize="small" color="error" />;
                              }
                              else if (actualStatus === 'IN_REVIEW' || (step.level === request.currentApprovalLevel && request.status === 'IN_REVIEW')) {
                                displayStatus = 'IN_REVIEW';
                                statusLabel = 'In Review';
                                statusColor = 'primary.main';
                                stepIcon = <PersonIcon fontSize="small" color="primary" />;
                              }
                              else if (actualStatus === 'REVIEWED' || (step.level === request.currentApprovalLevel - 1 && request.status === 'REVIEWED')) {
                                displayStatus = 'REVIEWED';
                                statusLabel = 'Reviewed';
                                statusColor = 'info.main';
                                stepIcon = <CheckIcon fontSize="small" color="info" />;
                              }
                              else {
                                displayStatus = 'PENDING';
                                statusLabel = 'Pending';
                                statusColor = 'text.secondary';
                                stepIcon = <AccessTimeIcon fontSize="small" color="disabled" />;
                              }
                              
                              return (
                                <Box 
                                  key={index}
                                  sx={{ 
                                    display: 'flex',
                                    gap: 1,
                                    alignItems: 'flex-start',
                                    opacity: displayStatus === 'PENDING' ? 0.6 : 1,
                                    mb: 1
                                  }}
                                >
                                  {stepIcon}
                                  <Box>
                                    <Typography variant="body2" sx={{ fontSize: '0.85rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
                                      <Box component="span" sx={{ fontWeight: 500 }}>
                                        Level {step.level}: {step.role}:
                                      </Box> 
                                      <Box component="span" sx={{ 
                                        color: statusColor,
                                        fontWeight: 500,
                                        ml: 0.5
                                      }}>
                                        {statusLabel}
                                      </Box>
                                      {step.approver && (
                                        <Box component="span" sx={{ ml: 0.5 }}>
                                          by {step.approver?.firstName ? 
                                            `${step.approver?.firstName} ${step.approver?.lastName}` : 
                                            step.approver.name || "System Administrator"}
                                        </Box>
                                      )}
                                    </Typography>
                                    
                                    {step.notes && (
                                      <Typography 
                                        variant="body2" 
                                        sx={{ 
                                          display: 'block', 
                                          color: 'text.secondary', 
                                          ml: 0.5,
                                          fontSize: '0.8rem',
                                          fontStyle: 'italic',
                                          mt: 0.25
                                        }}
                                      >
                                        Note: {step.notes}
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                              );
                            })}
                          </Box>
                        </Box>
                      )}
                      
                      {/* Financial impact section */}
                      {request.savings && (
                        <Box sx={{ mt: 2, p: 1, bgcolor: theme.palette.grey[50], borderRadius: .5 }}>
                          <Typography variant="body2" fontWeight={500} gutterBottom>
                            Financial Impact:
                          </Typography>
                          <Grid container spacing={1}>
                            <Grid size={{ xs: 6 }}>
                              <Typography variant="caption" color="text.secondary">Current Balance:</Typography>
                              <Typography variant="body2">{request.savings.totalSavings}</Typography>
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                              <Typography variant="caption" color="text.secondary">After Withdrawal:</Typography>
                              <Typography variant="body2">{request.savings.remainingBalance}</Typography>
                            </Grid>
                          </Grid>
                        </Box>
                      )}
                    </Box>
                  </Collapse>
                  
                  {/* Cancel button - show only if status is PENDING and regardless of expanded state */}
                  {request.status === 'PENDING' && (
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRequest(request.id);
                          setOpenCancelDialog(true);
                        }}
                      >
                        Cancel Request
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      ) : (
        <Box sx={{ textAlign: 'center', py: 4, bgcolor: theme.palette.grey[50], borderRadius: 2 }}>
          <Typography color="text.secondary" gutterBottom>
            No withdrawal requests found
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setOpenNewRequest(true)}
            sx={{ mt: 1 }}
          >
            Create New Request
          </Button>
        </Box>
      )}
      
      {/* New Withdrawal Request Dialog */}
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
              <Grid size={{ xs: 12 }}>
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
                  helperText={`Maximum available: ${formatCurrency(maxAmount)}`}
                />
              </Grid>
              
              <Grid size={{ xs: 12 }}>
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
      
      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={openCancelDialog}
        onClose={() => !cancelMutation.isPending && setOpenCancelDialog(false)}
      >
        <DialogTitle>Cancel Withdrawal Request?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to cancel this withdrawal request? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOpenCancelDialog(false)}
            disabled={cancelMutation.isPending}
          >
            No, Keep It
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleCancelRequest}
            disabled={cancelMutation.isPending}
          >
            {cancelMutation.isPending ? (
              <>
                <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
                Cancelling...
              </>
            ) : 'Yes, Cancel It'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WithdrawalRequests;
