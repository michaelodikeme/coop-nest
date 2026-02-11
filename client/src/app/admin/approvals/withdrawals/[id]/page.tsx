'use client';

import { AwaitedReactNode, JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useWithdrawalDetails, useProcessWithdrawal } from '@/lib/hooks/admin/useAdminFinancial';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Divider,
  Grid,
  Chip,
  Button,
  TextField,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { formatCurrency, formatDate } from '@/utils/formatting/format';
import { useToast } from '@/components/molecules/Toast';
import { PersonOutline as PersonIcon } from '@mui/icons-material';
import { AccountBalanceWallet as WalletIcon } from '@mui/icons-material';
import { RequestStatus } from '@/types/request.types';
import { format } from 'date-fns';

export default function WithdrawalDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const toast = useToast();
  
  const [notes, setNotes] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [action, setAction] = useState<'APPROVE' | 'REJECT' | null>(null);
  
  const { data: withdrawal, isLoading, error } = useWithdrawalDetails(id as string);
  const processMutation = useProcessWithdrawal();
  
  const handleProcess = async () => {
    if (!action || !withdrawal) return;
    
    let nextStatus: RequestStatus;
    const isLastApproval = withdrawal.currentApprovalLevel === 3;

    if (action === 'REJECT') {
      nextStatus = RequestStatus.REJECTED;
    } else { // action === 'APPROVE'
      switch (withdrawal.currentApprovalLevel) {
        case 1:
          nextStatus = RequestStatus.IN_REVIEW; // Treasurer reviews, passes to Chairman
          break;
        case 2:
          nextStatus = RequestStatus.APPROVED; // Chairman approves, passes to Treasurer
          break;
        case 3:
          nextStatus = RequestStatus.COMPLETED; // Treasurer completes disbursement
          break;
        default:
          toast.error('Invalid approval level for action');
          return;
      }
    }
    
    try {
      await processMutation.mutateAsync({
        withdrawalId: withdrawal.id,
        status: nextStatus,
        notes: notes || undefined,
        isLastApproval
      });
      
      toast.success(`Withdrawal ${action === 'APPROVE' ? 'processed' : 'rejected'} successfully`);
      setIsDialogOpen(false);
      router.push('/admin/approvals/withdrawals');
    } catch (err: any) {
      toast.error(err.message || 'Failed to process withdrawal');
    }
  };
  
  const openDialog = (actionType: 'APPROVE' | 'REJECT') => {
    setAction(actionType);
    setIsDialogOpen(true);
  };
  
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" my={4}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Error loading withdrawal details: {error.message || 'Unknown error'}
      </Alert>
    );
  }
  
  if (!withdrawal) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        Withdrawal request not found
      </Alert>
    );
  }
  
  // Extract data from withdrawal object
  const {
    member,
    amount,
    status = withdrawal.status,
    reason = withdrawal.reason,
    requestDate = withdrawal.requestDate,
    approvalSteps = withdrawal.approvalSteps || [],
    nextApprovalLevel = withdrawal.currentApprovalLevel
  } = withdrawal;
  
  // Update member information extraction
  const memberName = member?.name;
  const memberNumber = member?.erpId;
  
  // Update amount extraction to handle the nested structure
  const formattedAmount = amount?.formatted ? amount.formatted : formatCurrency(Number(amount?.raw || 0));
  
  // Extract savings information - API returns unified 'savings' object with 'type' field
  const savingsData = withdrawal.savings;
  const isPersonalSavings = savingsData?.type === 'personal' || withdrawal.type === 'PERSONAL_SAVINGS_WITHDRAWAL';

  // Get current balance from the savings object
  const savingsCurrentBalance = savingsData?.currentBalance?.formatted || formatCurrency(0);
  const rawCurrentBalance = Number(savingsData?.currentBalance?.raw || 0);

  // Get total savings
  const savingsTotalSavings = savingsData?.totalSavings?.formatted || formatCurrency(0);

  // Get remaining balance - now returned directly from API
  const savingsRemainingBalance = savingsData?.remainingBalance?.formatted || formatCurrency(0);
  const rawRemainingBalance = Number(savingsData?.remainingBalance?.raw || 0);

  const canApprove = status === 'PENDING' || status === 'IN_REVIEW' || status === 'APPROVED';
  
  return (
    <Box>
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" fontWeight={600}>Withdrawal Request Details</Typography>
        
        <Button 
          variant="outlined" 
          onClick={() => router.push('/admin/approvals/withdrawals')}
        >
          Back to List
        </Button>
      </Box>
      
      {/* Status Bar */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="subtitle1">Status</Typography>
          <Chip 
            label={status} 
            color={
              status === 'PENDING' || status === 'IN_REVIEW' || status === 'REVIEWED' ? 'warning' :
              status === 'APPROVED' || status === 'COMPLETED' ? 'success' :
              status === 'REJECTED' ? 'error' : 'default'
            }
            sx={{ fontWeight: 500 }}
          />
        </Box>
        
        {canApprove && (
          <Box>
            <Button
              variant="contained"
              color="success"
              sx={{ mr: 1 }}
              onClick={() => openDialog('APPROVE')}
              disabled={processMutation.isPending}
            >
              Approve
            </Button>
            
            <Button
              variant="contained"
              color="error"
              onClick={() => openDialog('REJECT')}
              disabled={processMutation.isPending}
            >
              Reject
            </Button>
          </Box>
        )}
      </Paper>
      
      <Grid container spacing={3}>
        {/* Member Information */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <PersonIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Member Information</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">Name</Typography>
                <Typography variant="body1" fontWeight={500}>{memberName}</Typography>
              </Box>
              
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">ERP ID</Typography>
                <Typography variant="body1">{memberNumber}</Typography>
              </Box>
              
              {withdrawal.member?.department && (
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">Department</Typography>
                  <Typography variant="body1">{withdrawal.member.department}</Typography>
                </Box>
              )}
              
              {withdrawal.member?.phone && (
                <Box>
                  <Typography variant="body2" color="text.secondary">Phone</Typography>
                  <Typography variant="body1">{withdrawal.member.phone}</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Withdrawal Details */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <WalletIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Withdrawal Details</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">Amount</Typography>
                <Typography variant="body1" fontWeight={500} color="primary.main">
                  {formattedAmount}
                </Typography>
              </Box>
              
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">Request Date</Typography>
                <Typography variant="body1">
                  {formatDate(new Date(requestDate))}
                </Typography>
              </Box>
              
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">Purpose</Typography>
                <Typography variant="body1">{reason || 'Not specified'}</Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary">Approval Level</Typography>
                <Typography variant="body1">Level {Math.min(nextApprovalLevel, 3)} of 3</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Savings Information */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <WalletIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Savings Information</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">Current Balance</Typography>
                <Typography variant="body1" fontWeight={500}>
                  {savingsTotalSavings}
                </Typography>
              </Box>
              
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">Remaining After Withdrawal</Typography>
                <Typography 
                  variant="body1" 
                  fontWeight={500}
                  color={rawRemainingBalance < 0 ? 'error.main' : 'success.main'}
                >
                  {savingsRemainingBalance}
                </Typography>
              </Box>
              
              {rawRemainingBalance < 0 && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  This withdrawal would result in a negative balance
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Approval Timeline */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" mb={3}>Approval Timeline</Typography>
          
          <Stepper activeStep={approvalSteps.filter((step: { status: string; }) => step.status !== 'PENDING' && step.status !== 'REJECTED').length} orientation="vertical">
            {approvalSteps.map((step: { 
              id: Key | null | undefined; 
              status: string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | Promise<AwaitedReactNode> | null | undefined; 
              level: string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<AwaitedReactNode> | null | undefined; 
              approverRole: string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<AwaitedReactNode> | null | undefined; 
              approver: { firstName: any; }; 
              approvedAt: string | number | Date; 
              notes: string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<AwaitedReactNode> | null | undefined; 
            }, index: any) => (
              <Step key={step.id}>
                <StepLabel
                  StepIconProps={{
                    sx: {
                      color: step.status === 'APPROVED' || step.status === 'COMPLETED' ? 'success.main' :
                            step.status === 'REJECTED' ? 'error.main' :
                            step.status === 'PENDING' ? 'warning.main' :
                            (step.status === 'IN_REVIEW') ? 'info.main' : 'grey.500'
                    }
                  }}
                >
                  <Box>
                    <Typography variant="body1" fontWeight={500}>
                      Level {step.level}: {step.approverRole}
                    </Typography>
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center" mt={0.5}>
                      <Typography variant="body2" color="text.secondary">
                        {step.approver?.firstName || 'System'} 
                        {step.approvedAt && ` • ${format(new Date(step.approvedAt), 'MMM dd, yyyy')}`}
                      </Typography>
                      
                      <Chip 
                        label={step.status} 
                        size="small"
                        color={step.status === 'APPROVED' || step.status === 'COMPLETED' ? 'success' :
                              step.status === 'REJECTED' ? 'error' :
                              step.status === 'PENDING' ? 'warning' :
                              (step.status === 'IN_REVIEW' || step.status === 'REVIEWED') ? 'info' : 'default'
                            }
                        sx={{ ml: 2 }}
                      />
                    </Box>
                    
                    {step.notes && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                        "{step.notes}"
                      </Typography>
                    )}
                  </Box>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>
      
      {/* Approval/Rejection Dialog */}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <DialogTitle>
          {action === 'APPROVE' ? 'Approve Withdrawal Request' : 'Reject Withdrawal Request'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText mb={2}>
            {action === 'APPROVE' 
              ? `Are you sure you want to approve this withdrawal request for ${formattedAmount}?` 
              : `Are you sure you want to reject this withdrawal request?`
            }
          </DialogContentText>
          
          <TextField
            autoFocus
            multiline
            rows={3}
            margin="dense"
            label="Notes (Optional)"
            fullWidth
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)} disabled={processMutation.isPending}>
            Cancel
          </Button>
          <Button 
            onClick={handleProcess}
            color={action === 'APPROVE' ? 'success' : 'error'}
            variant="contained"
            disabled={processMutation.isPending}
          >
            {processMutation.isPending 
              ? <CircularProgress size={24} /> 
              : action === 'APPROVE' ? 'Approve' : 'Reject'
            }
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}