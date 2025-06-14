'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  useApprovalDetails, 
  useApproveRequest, 
  useRejectRequest, 
  useReviewRequest, 
  useMarkReviewed,
  useDisburseLoan,
  useApprovalHistory
} from '@/lib/hooks/admin/useApprovals';
import PermissionGate from '@/components/atoms/PermissionGate';
import { Module } from '@/types/permissions.types';
import { useAuth } from '@/lib/api/contexts/AuthContext';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Divider, 
  Chip, 
  Grid, 
  TextField, 
  Card, 
  CardContent,
  Stepper, 
  Step, 
  StepLabel, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { formatCurrency } from '@/utils/formatting/format';
import { ApprovalChain } from '@/components/molecules/ApprovalChain';
import { ApprovalStatus, LoanRequest } from '@/types/loan.types';

export default function LoanApprovalDetailPage() {
  const { id } = useParams();
  const { data: request, isLoading, error } = useApprovalDetails(id as string);
  const { data: history, isLoading: isHistoryLoading } = useApprovalHistory(id as string);
  
  // Mutations
  const { mutate: approve, isPending: isApproving } = useApproveRequest();
  const { mutate: reject, isPending: isRejecting } = useRejectRequest();
  const { mutate: review, isPending: isReviewing } = useReviewRequest();
  const { mutate: markReviewed, isPending: isMarkingReviewed } = useMarkReviewed();
  const { mutate: disburseLoan, isPending: isDisbursing } = useDisburseLoan();
  
  // UI state
  const [comments, setComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  
  const router = useRouter();
  const { user, hasPermission, checkApprovalLevel } = useAuth();
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
      <CircularProgress />
      </Box>
    );
  }
  
  if (error || !request) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: 400, justifyContent: 'center' }}>
      <Typography variant="h6" color="error" gutterBottom>
      Error loading loan request
      </Typography>
      <Button 
      variant="outlined" 
      startIcon={<ArrowBackIcon />}
      onClick={() => router.back()}
      >
      Go Back
      </Button>
      </Box>
    );
  }
  
  // Cast the request to our defined type to help TypeScript
  const typedRequest = request as unknown as LoanRequest;
  
  // Extract loan data with proper alignment to backend structure
  const loanData = {
    // Basic loan information
    id: typedRequest.content?.loanId || typedRequest.loanId || '',
    amount: parseFloat(typedRequest.content?.amount || '0'),
    purpose: typedRequest.content?.purpose || 'Not specified',
    tenure: typedRequest.content?.tenure || 0,
    
    // Loan type information (properly aligned with backend metadata)
    loanType: typedRequest.metadata?.loanType?.name || 'Standard Loan',
    loanTypeId: typedRequest.metadata?.loanType?.id || '',
    interestRate: typedRequest.metadata?.loanType?.interestRate || '0%',
    
    // Member information from metadata
    memberName: typedRequest.metadata?.member?.fullName || 'Unknown Member',
    memberERP: typedRequest.metadata?.member?.erpId || '',
    memberDepartment: typedRequest.metadata?.member?.department || '',
    
    // Financial calculations
    totalRepayment: parseFloat(typedRequest.content?.totalRepayment || '0'),
    monthlyPayment: parseFloat(typedRequest.content?.monthlyPayment || '0'),
    
    // Savings snapshot (from backend)
    savings: {
      totalSavings: parseFloat(typedRequest.metadata?.savings?.totalSavings || '0'),
      monthlyTarget: parseFloat(typedRequest.metadata?.savings?.monthlyTarget || '0')
    },
    
    // Status tracking
    status: typedRequest.status || 'PENDING',
    nextApprovalLevel: typedRequest.nextApprovalLevel || 1,
    currentApprovalRole: typedRequest.nextApprovalLevel === 1 ? 'ADMIN' : 
    typedRequest.nextApprovalLevel === 2 ? 'TREASURER' :
    typedRequest.nextApprovalLevel === 3 ? 'CHAIRMAN' :
    typedRequest.nextApprovalLevel === 4 ? 'TREASURER' : ''
  };
  
  // Loan details from detailed loan information
  const loanDetails = typedRequest.loanDetails?.data || typedRequest.loanDetails || {};
  
  // Calculate loan-to-savings ratio (important for approval decision)
  const loanToSavingsRatio = loanData.savings.totalSavings > 0 ? 
  (loanData.amount / loanData.savings.totalSavings).toFixed(2) : 'N/A';
  
  // Determine active step based on status
  const getActiveStep = () => {
    switch (typedRequest.status) {
      case 'PENDING': return 0;
      case 'IN_REVIEW': return 1;
      case 'REVIEWED': return 2;
      case 'APPROVED': return 3;
      case 'COMPLETED': return 4;
      case 'REJECTED': return -1; // Special case
      default: return 0;
    }
  };
  
  // Check if user can take action based on status and approval level
  const canApprove = () => {
    // Admin (level 1) can move PENDING to IN_REVIEW 
    if (typedRequest.status === 'PENDING' && 
      checkApprovalLevel(1) && 
      hasPermission('REVIEW_LOAN_APPLICATIONS')) {
        return true;
      }
      
      // Treasurer (level 2) can move IN_REVIEW to REVIEWED
      if (typedRequest.status === 'IN_REVIEW' && 
        checkApprovalLevel(2) && 
        hasPermission('REVIEW_LOAN')) {
          return true;
        }
        
        // Chairman (level 3) can move REVIEWED to APPROVED
        if (typedRequest.status === 'REVIEWED' && 
          checkApprovalLevel(3) && 
          hasPermission('APPROVE_LOANS')) {
            return true;
          }
          
          // Only appropriate level and status can take action
          return false;
        };
        
        // Check if user can disburse
        const canDisburse = () => {
          return typedRequest.status === 'APPROVED' && 
          checkApprovalLevel(2) && 
          hasPermission('DISBURSE_LOAN');
        };
        
        // Handle approval action based on current status
        const handleApprovalAction = () => {
          switch (typedRequest.status) {
            case 'PENDING':
            review({ requestId: id as string, notes: comments });
            break;
            case 'IN_REVIEW':
            markReviewed({ requestId: id as string, notes: comments });
            break;
            case 'REVIEWED':
            approve({ requestId: id as string, notes: comments });
            break;
            default:
            console.error('Invalid action for current status');
          }
        };
        
        // Handle loan disbursement
        const handleDisburseLoan = () => {
          if (typedRequest.loanId) {
            disburseLoan({ 
              requestId: id as string, 
              loanId: typedRequest.loanId, 
              notes: comments 
            });
          } else {
            console.error('No loan ID found for this request');
          }
        };
        
        // Handle rejection
        const handleReject = () => {
          reject({ 
            requestId: id as string, 
            reason: rejectionReason 
          });
          setIsRejectDialogOpen(false);
        };
        
        // Get button text based on status
        const getActionButtonText = () => {
          switch (typedRequest.status) {
            case 'PENDING': return 'Move to Review';
            case 'IN_REVIEW': return 'Mark as Reviewed';
            case 'REVIEWED': return 'Approve Loan';
            default: return 'Process';
          }
        };
        
        // Calculate the loan approval stage
        const getLoanApprovalStage = () => {
          if (typedRequest.status === 'PENDING') return "Initial Review (Admin)";
          if (typedRequest.status === 'IN_REVIEW') return "Financial Review (Treasurer)";
          if (typedRequest.status === 'REVIEWED') return "Final Approval (Chairman)";
          if (typedRequest.status === 'APPROVED') return "Awaiting Disbursement";
          if (typedRequest.status === 'COMPLETED') return "Disbursed";
          return "Processing";
        };
        
        return (
          <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />} 
          sx={{ mr: 2 }}
          onClick={() => router.back()}
          >
          Back
          </Button>
          <Typography variant="h4" fontWeight={600}>
          Loan Approval Request
          </Typography>
          </Box>
          
          {/* Current status banner */}
          <Box mb={3}>
          <Alert severity={
            typedRequest.status === 'REJECTED' ? 'error' :
            typedRequest.status === 'APPROVED' ? 'success' :
            typedRequest.status === 'COMPLETED' ? 'success' :
            'info'
          }>
          <Typography variant="subtitle1" fontWeight={500}>
          Status: {typedRequest.status} - {getLoanApprovalStage()}
          </Typography>
          {typedRequest.notes && (
            <Typography variant="body2" mt={0.5}>
            {typedRequest.notes}
            </Typography>
          )}
          </Alert>
          </Box>
          
          {/* Status stepper with approval chain */}
          <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
          Approval Workflow
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <ApprovalChain
          steps={(typedRequest.approvalSteps || []).map(step => ({
            ...step,
            status: step.status as ApprovalStatus
          }))}
          currentLevel={typedRequest.nextApprovalLevel}
          />
          
          {typedRequest.status === 'REJECTED' && (
            <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Chip 
            label="REJECTED" 
            color="error" 
            sx={{ fontWeight: 600, fontSize: '0.9rem', py: 1, px: 2 }}
            />
            {typedRequest.notes && (
              <Typography variant="body2" color="error.main" mt={1}>
              Reason: {typedRequest.notes}
              </Typography>
            )}
            </Box>
          )}
          </Paper>
          
          <Grid container spacing={3}>
          {/* Left column - Loan details */}
          <Grid size={{ xs: 12, md: 7, lg: 8 }}>
          <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
          Loan Details
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="body2" color="text.secondary">Member Name</Typography>
          <Typography variant="body1" fontWeight={500}>
          {loanData.memberName}
          </Typography>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="body2" color="text.secondary">ERP ID</Typography>
          <Typography variant="body1" fontWeight={500}>
          {loanData.memberERP}
          </Typography>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="body2" color="text.secondary">Department</Typography>
          <Typography variant="body1" fontWeight={500}>
          {loanData.memberDepartment || 'Not specified'}
          </Typography>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="body2" color="text.secondary">Loan Amount</Typography>
          <Typography variant="body1" fontWeight={500}>
          {formatCurrency(loanData.amount)}
          </Typography>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="body2" color="text.secondary">Total Repayment</Typography>
          <Typography variant="body1" fontWeight={500}>
          {formatCurrency(loanData.totalRepayment)}
          </Typography>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="body2" color="text.secondary">Loan Type</Typography>
          <Typography variant="body1" fontWeight={500}>
          {loanData.loanType}
          </Typography>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="body2" color="text.secondary">Term (Months)</Typography>
          <Typography variant="body1" fontWeight={500}>
          {loanData.tenure} months
          </Typography>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="body2" color="text.secondary">Interest Rate</Typography>
          <Typography variant="body1" fontWeight={500}>
          {loanData.interestRate}
          </Typography>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="body2" color="text.secondary">Monthly Payment</Typography>
          <Typography variant="body1" fontWeight={500}>
          {formatCurrency(loanData.monthlyPayment)}
          </Typography>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="body2" color="text.secondary">Loan-to-Savings Ratio</Typography>
          <Typography 
          variant="body1" 
          fontWeight={500}
          color={parseFloat(loanToSavingsRatio) > 3 ? 'error.main' : 'inherit'}
          >
          {loanToSavingsRatio}x
          {parseFloat(loanToSavingsRatio) > 3 && (
            <Typography variant="caption" color="error.main" component="span" sx={{ ml: 1 }}>
            (Exceeds 3x policy)
            </Typography>
          )}
          </Typography>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="body2" color="text.secondary">Application Date</Typography>
          <Typography variant="body1" fontWeight={500}>
          {new Date(typedRequest.createdAt).toLocaleDateString()}
          </Typography>
          </Grid>
          
          <Grid size={{ xs: 12 }}>
          <Typography variant="body2" color="text.secondary">Purpose</Typography>
          <Typography variant="body1" fontWeight={500}>
          {loanData.purpose}
          </Typography>
          </Grid>
          
          {/* Show the user's savings information */}
          <Grid size={{ xs: 12 }}>
          <Divider sx={{ my: 1 }} />
          <Typography variant="subtitle2" fontWeight={500} gutterBottom>
          Member Savings Information
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, mt: 1 }}>
          <Box>
          <Typography variant="body2" color="text.secondary">Total Savings</Typography>
          <Typography variant="body1" fontWeight={500}>
          {formatCurrency(loanData.savings.totalSavings)}
          </Typography>
          </Box>
          <Box>
          <Typography variant="body2" color="text.secondary">Monthly Target</Typography>
          <Typography variant="body1" fontWeight={500}>
          {formatCurrency(loanData.savings.monthlyTarget)}
          </Typography>
          </Box>
          </Box>
          </Grid>
          </Grid>
          </Paper>
          </Grid>
          
          {/* Right column - Action panel */}
          <Grid size={{ xs: 12, md: 5, lg: 4 }}>
          {/* Approval workflow details */}
          <Card sx={{ mb: 3 }}>
          <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight={600}>
          Request Status
          </Typography>
          <Chip 
          label={typedRequest.status} 
          color={
            typedRequest.status === 'PENDING' ? 'warning' :
            typedRequest.status === 'IN_REVIEW' ? 'info' :
            typedRequest.status === 'REVIEWED' ? 'secondary' :
            typedRequest.status === 'APPROVED' ? 'success' :
            typedRequest.status === 'REJECTED' ? 'error' : 'default'
          }
          />
          </Box>
          
          <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
          Next Approval Level
          </Typography>
          <Typography variant="body1" fontWeight={500}>
          {typedRequest.nextApprovalLevel === 1 ? 'Admin (Review)' : 
            typedRequest.nextApprovalLevel === 2 ? 'Treasurer (Financial Review)' :
            typedRequest.nextApprovalLevel === 3 ? 'Chairman (Final Approval)' :
            typedRequest.nextApprovalLevel === 4 ? 'Treasurer (Disbursement)' : 'Completed'}
            </Typography>
            </Box>
            
            <List dense>
            {typedRequest.approvalSteps?.map((step) => (
              <ListItem key={step.level} sx={{ px: 0 }}>
              <ListItemText
              primary={`Level ${step.level}: ${step.approverRole}`}
              secondary={step.status}
              primaryTypographyProps={{ 
                variant: 'body2', 
                fontWeight: step.status !== 'PENDING' ? 500 : 'normal'
              }}
              secondaryTypographyProps={{ 
                color: step.status === 'APPROVED' ? 'success.main' : 
                step.status === 'REJECTED' ? 'error.main' : 'text.secondary' 
              }}
              />
              {step.status === 'APPROVED' && (
                <Chip 
                label="Approved" 
                size="small" 
                color="success" 
                />
              )}
              {step.status === 'REJECTED' && (
                <Chip 
                label="Rejected" 
                size="small" 
                color="error" 
                />
              )}
              </ListItem>
            ))}
            </List>
            </CardContent>
            </Card>
            
            {/* Actions - ADMIN: show only if status is PENDING and user has REVIEW_LOAN_APPLICATIONS permission */}
            {typedRequest.status === 'PENDING' && hasPermission('REVIEW_LOAN_APPLICATIONS') && checkApprovalLevel(1) && (
              <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
              Initial Review (Admin)
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <TextField
              label="Review Comments"
              multiline
              rows={4}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              fullWidth
              placeholder="Add your review comments here..."
              sx={{ mb: 3 }}
              />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button
              variant="outlined"
              color="error"
              onClick={() => setIsRejectDialogOpen(true)}
              disabled={isApproving || isRejecting || isReviewing}
              >
              Reject
              </Button>
              
              <Button
              variant="contained"
              color="primary"
              onClick={() => review({ requestId: id as string, notes: comments })}
              disabled={isApproving || isRejecting || isReviewing}
              >
              {isReviewing ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Move to Review'
              )}
              </Button>
              </Box>
              </Paper>
            )}
            
            {/* Actions - TREASURER: show only if status is IN_REVIEW and user has REVIEW_LOAN permission */}
            {typedRequest.status === 'IN_REVIEW' && hasPermission('REVIEW_LOAN') && checkApprovalLevel(2) && (
              <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
              Financial Review (Treasurer)
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <TextField
              label="Financial Review Comments"
              multiline
              rows={4}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              fullWidth
              placeholder="Add your financial review comments here..."
              sx={{ mb: 3 }}
              />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button
              variant="outlined"
              color="error"
              onClick={() => setIsRejectDialogOpen(true)}
              disabled={isApproving || isRejecting || isMarkingReviewed}
              >
              Reject
              </Button>
              
              <Button
              variant="contained"
              color="primary"
              onClick={() => markReviewed({ requestId: id as string, notes: comments })}
              disabled={isApproving || isRejecting || isMarkingReviewed}
              >
              {isMarkingReviewed ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Mark as Reviewed'
              )}
              </Button>
              </Box>
              </Paper>
            )}
            
            {/* Actions - CHAIRMAN: show only if status is REVIEWED and user has APPROVE_LOANS permission */}
            {typedRequest.status === 'REVIEWED' && hasPermission('APPROVE_LOANS') && checkApprovalLevel(3) && (
              <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
              Final Approval (Chairman)
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <TextField
              label="Approval Comments"
              multiline
              rows={4}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              fullWidth
              placeholder="Add your approval comments here..."
              sx={{ mb: 3 }}
              />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button
              variant="outlined"
              color="error"
              onClick={() => setIsRejectDialogOpen(true)}
              disabled={isApproving || isRejecting}
              >
              Reject
              </Button>
              
              <Button
              variant="contained"
              color="primary"
              onClick={() => approve({ requestId: id as string, notes: comments })}
              disabled={isApproving || isRejecting}
              >
              {isApproving ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Approve Loan'
              )}
              </Button>
              </Box>
              </Paper>
            )}
            
            {/* Actions - DISBURSEMENT: show only if status is APPROVED and user has DISBURSE_LOAN permission */}
            {typedRequest.status === 'APPROVED' && hasPermission('DISBURSE_LOAN') && checkApprovalLevel(2) && (
              <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
              Loan Disbursement
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <TextField
              label="Disbursement Notes"
              multiline
              rows={4}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              fullWidth
              placeholder="Add disbursement notes here..."
              sx={{ mb: 3 }}
              />
              
              <Button
              variant="contained"
              color="success"
              fullWidth
              onClick={handleDisburseLoan}
              disabled={isDisbursing || !typedRequest.loanId}
              >
              {isDisbursing ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Process Disbursement'
              )}
              </Button>
              </Paper>
            )}
            
            {/* Completed Loan */}
            {typedRequest.status === 'COMPLETED' && (
              <Paper sx={{ p: 3, mb: 3, bgcolor: 'success.light' }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
              Loan Disbursed
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Typography variant="body1" sx={{ mb: 1 }}>
              This loan has been successfully disbursed.
              </Typography>
              
              <Typography variant="body2" color="text.secondary">
              Disbursed on: {typedRequest.completedAt ? new Date(typedRequest.completedAt).toLocaleDateString() : 'N/A'}
              </Typography>
              </Paper>
            )}
            
            {/* Rejected Loan */}
            {typedRequest.status === 'REJECTED' && (
              <Paper sx={{ p: 3, mb: 3, bgcolor: 'error.light' }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
              Loan Rejected
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Typography variant="body1" sx={{ mb: 1 }}>
              This loan application has been rejected.
              </Typography>
              
              {typedRequest.notes && (
                <Typography variant="body2" color="error.main">
                Reason: {typedRequest.notes}
                </Typography>
              )}
              </Paper>
            )}
            
            {/* Request details sidebar */}
            <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
            Request Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <List dense disablePadding>
            <ListItem disableGutters>
            <ListItemText 
            primary="Request ID" 
            secondary={id}
            />
            </ListItem>
            <ListItem disableGutters>
            <ListItemText 
            primary="Requested By" 
            secondary={typedRequest.metadata?.member?.fullName || "Member"}
            />
            </ListItem>
            <ListItem disableGutters>
            <ListItemText 
            primary="Request Date" 
            secondary={new Date(typedRequest.createdAt).toLocaleString()}
            />
            </ListItem>
            <ListItem disableGutters>
            <ListItemText 
            primary="Last Updated" 
            secondary={new Date(typedRequest.updatedAt).toLocaleString()}
            />
            </ListItem>
            {typedRequest.assigneeId && (
              <ListItem disableGutters>
              <ListItemText 
              primary="Assigned To" 
              secondary={typedRequest.assigneeName || typedRequest.assigneeId}
              />
              </ListItem>
            )}
            </List>
            </Paper>
            </Grid>
            </Grid>
            
            {/* Rejection Dialog */}
            <Dialog open={isRejectDialogOpen} onClose={() => setIsRejectDialogOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Reject Loan Request</DialogTitle>
            <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please provide a reason for rejecting this loan request.
            </Typography>
            <TextField
            autoFocus
            label="Rejection Reason"
            fullWidth
            multiline
            rows={4}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            required
            error={!rejectionReason.trim()}
            helperText={!rejectionReason.trim() ? 'Reason is required for rejection' : ''}
            />
            </DialogContent>
            <DialogActions>
            <Button onClick={() => setIsRejectDialogOpen(false)}>Cancel</Button>
            <Button 
            onClick={handleReject} 
            variant="contained" 
            color="error" 
            disabled={!rejectionReason.trim() || isRejecting}
            >
            {isRejecting ? <CircularProgress size={24} /> : 'Reject Loan'}
            </Button>
            </DialogActions>
            </Dialog>
            </Box>
          );
        }