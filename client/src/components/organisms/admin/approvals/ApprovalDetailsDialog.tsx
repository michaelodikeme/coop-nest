'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Chip,
  Divider,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  Card,
  CardContent,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ReviewIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/api/contexts/AuthContext';
import { requestService } from '@/lib/api/services/requestService';
import { RequestType, RequestStatus } from '@/types/request.types';
import { formatCurrency } from '@/utils/formatting/format';

interface ApprovalDetailsDialogProps {
  requestId: string | null;
  open: boolean;
  onClose: () => void;
  onProcessRequest: (action: 'approve' | 'reject' | 'review', notes?: string) => void;
  isProcessing?: boolean;
}

export function ApprovalDetailsDialog({
  requestId,
  open,
  onClose,
  onProcessRequest,
  isProcessing = false
}: ApprovalDetailsDialogProps) {
  const [action, setAction] = useState<'approve' | 'reject' | 'review'>('review');
  const [notes, setNotes] = useState('');
  const { user, hasPermission } = useAuth();

  // Fetch request details
  const { data: request, isLoading } = useQuery({
    queryKey: ['request', requestId],
    queryFn: () => requestService.getRequestById(requestId!),
    enabled: !!requestId && open,
  });

  const handleSubmit = () => {
    onProcessRequest(action, notes.trim() || undefined);
    setNotes('');
    setAction('review');
  };

  const handleClose = () => {
    setNotes('');
    setAction('review');
    onClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case RequestStatus.PENDING: return 'warning';
      case RequestStatus.IN_REVIEW: return 'info';
      case RequestStatus.REVIEWED: return 'secondary';
      case RequestStatus.APPROVED: return 'success';
      case RequestStatus.REJECTED: return 'error';
      case RequestStatus.COMPLETED: return 'default';
      default: return 'default';
    }
  };

  const getRequestTypeLabel = (type: string) => {
    switch (type) {
      case 'PERSONAL_SAVINGS_CREATION': return 'Personal Savings Plan Creation';
      case 'PERSONAL_SAVINGS_WITHDRAWAL': return 'Personal Savings Withdrawal';
      case RequestType.LOAN_APPLICATION: return 'Loan Application';
      case RequestType.SAVINGS_WITHDRAWAL: return 'Savings Withdrawal';
      default: return type.replace(/_/g, ' ');
    }
  };

  const canProcessRequest = (currentStatus: string) => {
    // Only allow processing if request is in a processable state
    return [RequestStatus.PENDING, RequestStatus.IN_REVIEW, RequestStatus.REVIEWED].includes(currentStatus as RequestStatus);
  };

  const renderPersonalSavingsDetails = () => {
    if (!request?.content) return null;
    
    const isCreationRequest = request.type === 'PERSONAL_SAVINGS_CREATION' || request.content.planTypeId;
    const isWithdrawalRequest = request.type === 'PERSONAL_SAVINGS_WITHDRAWAL' || request.content.withdrawalAmount;

    return (
      <Card variant="outlined" sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {isCreationRequest ? 'Plan Creation Details' : 'Withdrawal Details'}
          </Typography>
          
          <Grid container spacing={2}>
            {isCreationRequest && (
              <>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">Plan Type</Typography>
                  <Typography variant="body1">{request.content.planType || 'N/A'}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">Plan Name</Typography>
                  <Typography variant="body1">{request.content.planName || 'Default Plan'}</Typography>
                </Grid>
                {request.content.targetAmount && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">Target Amount</Typography>
                    <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
                      <MoneyIcon fontSize="small" sx={{ mr: 0.5 }} />
                      {formatCurrency(request.content.targetAmount)}
                    </Typography>
                  </Grid>
                )}
              </>
            )}
            
            {isWithdrawalRequest && (
              <>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">Withdrawal Amount</Typography>
                  <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
                    <MoneyIcon fontSize="small" sx={{ mr: 0.5 }} />
                    {formatCurrency(request.content.withdrawalAmount || request.content.amount)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">Current Balance</Typography>
                  <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
                    <MoneyIcon fontSize="small" sx={{ mr: 0.5 }} />
                    {formatCurrency(request.content.currentBalance || 0)}
                  </Typography>
                </Grid>
              </>
            )}
            
            <Grid size={12}>
              <Typography variant="body2" color="text.secondary">Reason/Notes</Typography>
              <Typography variant="body1">
                {request.content.reason || request.content.notes || 'No additional notes provided'}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const renderApprovalHistory = () => {
    if (!request?.approvalSteps || request.approvalSteps.length === 0) return null;

    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>Approval History</Typography>
        <Stepper orientation="vertical">
          {request.approvalSteps.map((step, index) => (
            <Step key={step.id} active={true} completed={step.status === 'APPROVED'}>
              <StepLabel
                StepIconComponent={() => (
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      bgcolor: step.status === 'APPROVED' ? 'success.main' : 
                              step.status === 'REJECTED' ? 'error.main' : 'grey.400',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '0.8rem'
                    }}
                  >
                    {index + 1}
                  </Box>
                )}
              >
                <Typography variant="body2">
                  Level {step.level} - {step.approverRole}
                </Typography>
                {step.approver && (
                  <Typography variant="caption" color="text.secondary">
                    {step.approver.firstName} ({step.approver.username})
                  </Typography>
                )}
              </StepLabel>
              {step.notes && (
                <StepContent>
                  <Typography variant="body2" color="text.secondary">
                    {step.notes}
                  </Typography>
                  {step.approvedAt && (
                    <Typography variant="caption" color="text.secondary">
                      {new Date(step.approvedAt).toLocaleString()}
                    </Typography>
                  )}
                </StepContent>
              )}
            </Step>
          ))}
        </Stepper>
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '60vh' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Request Details</Typography>
        <IconButton onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : request ? (
          <>
            {/* Request Header Info */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">Request Type</Typography>
                <Typography variant="body1">{getRequestTypeLabel(request.type)}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">Status</Typography>
                <Chip 
                  label={request.status} 
                  color={getStatusColor(request.status) as any}
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">Requested By</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PersonIcon fontSize="small" sx={{ mr: 0.5 }} />
                  <Typography variant="body1">
                    {request.initiator?.firstName || 'Unknown'} ({request.initiator?.username})
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">Date Requested</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CalendarIcon fontSize="small" sx={{ mr: 0.5 }} />
                  <Typography variant="body1">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* Request-specific details */}
            {renderPersonalSavingsDetails()}

            {/* Approval History */}
            {renderApprovalHistory()}

            {/* Processing Actions */}
            {canProcessRequest(request.status) && hasPermission(['REVIEW_PERSONAL_SAVINGS', 'APPROVE_PERSONAL_SAVINGS']) && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>Process Request</Typography>
                
                <FormControl component="fieldset" sx={{ mb: 2 }}>
                  <FormLabel component="legend">Action</FormLabel>
                  <RadioGroup
                    row
                    value={action}
                    onChange={(e) => setAction(e.target.value as any)}
                  >
                    <FormControlLabel 
                      value="review" 
                      control={<Radio />} 
                      label="Mark as Reviewed"
                    />
                    <FormControlLabel 
                      value="approve" 
                      control={<Radio />} 
                      label="Approve"
                    />
                    <FormControlLabel 
                      value="reject" 
                      control={<Radio />} 
                      label="Reject"
                    />
                  </RadioGroup>
                </FormControl>

                <TextField
                  fullWidth
                  label="Notes (optional)"
                  multiline
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes or comments about this decision..."
                />

                {action === 'reject' && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    Please provide a reason for rejection in the notes field above.
                  </Alert>
                )}
              </Box>
            )}
          </>
        ) : (
          <Alert severity="error">Failed to load request details</Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} disabled={isProcessing}>
          Cancel
        </Button>
        {request && canProcessRequest(request.status) && hasPermission(['REVIEW_PERSONAL_SAVINGS', 'APPROVE_PERSONAL_SAVINGS']) && (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isProcessing || (action === 'reject' && !notes.trim())}
            startIcon={isProcessing ? <CircularProgress size={16} /> : null}
            color={action === 'approve' ? 'success' : action === 'reject' ? 'error' : 'primary'}
          >
            {isProcessing ? 'Processing...' : `${action.charAt(0).toUpperCase() + action.slice(1)} Request`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
