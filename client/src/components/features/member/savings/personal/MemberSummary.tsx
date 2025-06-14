import { useMemberSummary } from '@/lib/hooks/member/usePersonalSavings';
import { useAuth } from '@/lib/api/contexts/AuthContext';
import { formatCurrency } from '@/utils/formatting/format';
import { PersonalSavingsStatus, RequestStatus, ApprovalStatus } from '@/types/personal-savings.types';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  Grid,
  Box,
  Typography, 
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Tabs,
  Tab,
  Badge,
  LinearProgress
} from '@mui/material';
import React, { useState } from 'react';

export function MemberSummary() {
  const { user } = useAuth();
  const { data, isLoading } = useMemberSummary(user?.biodata?.erpId);
  const [activeTab, setActiveTab] = useState(0);
  
  if (isLoading) {
    return <LinearProgress sx={{ my: 4 }} />;
  }
  
  if (!data) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">
          Unable to load summary data. Please try again later.
        </Typography>
      </Box>
    );
  }
  
  // Check if there are pending requests
  const hasPendingRequests = data.pendingRequests && data.pendingRequests.length > 0;
  
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Personal Savings Summary
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardHeader title="Total Saved" sx={{ pb: 0 }} />
            <CardContent>
              <Typography variant="h4" fontWeight="bold">
                {formatCurrency(data.totalSaved)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardHeader title="Total Withdrawals" sx={{ pb: 0 }} />
            <CardContent>
              <Typography variant="h4" fontWeight="bold">
                {formatCurrency(data.totalWithdrawals)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardHeader title="Current Balance" sx={{ pb: 0 }} />
            <CardContent>
              <Typography variant="h4" fontWeight="bold">
                {formatCurrency(data.currentBalance)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            aria-label="savings plans tabs"
          >
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  Active Plans
                  <Badge 
                    badgeContent={data.activePlans.length} 
                    color="primary" 
                    sx={{ ml: 1 }} 
                  />
                </Box>
              }
            />
            {hasPendingRequests && (
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    Pending Requests
                    <Badge 
                      badgeContent={data.pendingRequests.length} 
                      color="warning" 
                      sx={{ ml: 1 }} 
                    />
                  </Box>
                }
              />
            )}
          </Tabs>
        </Box>
        
        <CardContent>
          {activeTab === 0 ? (
            // Active Plans Tab
            data.activePlans.length === 0 ? (
              <Box textAlign="center" py={4}>
                <Typography color="textSecondary">
                  No active plans found
                </Typography>
              </Box>
            ) : (
              <List disablePadding>
                {data.activePlans.map((plan, index) => (
                  <React.Fragment key={plan.id}>
                    {index > 0 && <Divider />}
                    <ListItem sx={{ py: 2 }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="body1" fontWeight="medium">
                              {plan.planName || "Savings Plan"}
                            </Typography>
                            {getStatusChip(plan)}
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                            <Typography variant="body2" component="span">
                              Created: {new Date(plan.createdAt).toLocaleDateString()}
                            </Typography>
                            
                            {plan.targetAmount && (
                              <Typography variant="body2" color="text.secondary" sx={{ display: 'block' }}>
                                Target: {formatCurrency(plan.targetAmount)}
                              </Typography>
                            )}
                            
                            {plan.pendingWithdrawal && (
                              <Box sx={{ mt: 1, p: 1, bgcolor: 'warning.light', borderRadius: 1 }}>
                                <Typography variant="body2" color="warning.dark" fontWeight="medium">
                                  Withdrawal: {formatCurrency(plan.pendingWithdrawal.amount)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Status: {plan.pendingWithdrawal.status}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        }
                      />
                      <Typography variant="body1" fontWeight="bold">
                        {formatCurrency(plan.currentBalance || 0)}
                      </Typography>
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            )
          ) : (
            // Pending Requests Tab
            <List disablePadding>
              {data.pendingRequests.map((request, index) => (
                <React.Fragment key={request.requestId}>
                  {index > 0 && <Divider />}
                  <ListItem sx={{ py: 2 }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1" fontWeight="medium">
                            {request.planName || "New Savings Plan"}
                          </Typography>
                          {getStatusChip(request)}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Typography variant="body2">
                            Requested: {new Date(request.createdAt).toLocaleDateString()}
                          </Typography>
                          
                          {request.targetAmount && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              Target Amount: {formatCurrency(request.targetAmount)}
                            </Typography>
                          )}
                          
                          {request.approvalSteps && request.approvalSteps.length > 0 && (
                            <Box sx={{ mt: 1.5 }}>
                              <Typography variant="caption" color="text.secondary">
                                Approval Level: {request.currentApprovalLevel || 1} of {request.approvalSteps.length}
                              </Typography>
                              <Box sx={{ display: 'flex', mt: 0.5 }}>
                                {request.approvalSteps.map((step, i) => (
                                  <Box 
                                    key={i} 
                                    sx={{ 
                                      width: 8, 
                                      height: 8, 
                                      borderRadius: '50%', 
                                      mr: 0.5,
                                      bgcolor: getApprovalStepColor(step, request.currentApprovalLevel || 1)
                                    }} 
                                  />
                                ))}
                              </Box>
                            </Box>
                          )}
                        </Box>
                      }
                    />
                    <Chip 
                      label={`ID: ${request.requestId?.substring(0, 6)}...`}
                      variant="outlined"
                      size="small"
                    />
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

// Helper functions
// Function to get status chip
function getStatusChip(item: { 
  type?: string; 
  status?: string;
  id?: string; // Add id to check for approved plans that are now active
  pendingWithdrawal?: { 
    amount: number; 
    status: string;
  };
}) {
  // For pending creation requests
  if (item.type === 'PENDING_CREATION') {
    // If plan is approved and has an ID, it's actually active
    if (item.status === RequestStatus.APPROVED && item.id) {
      return <Chip size="small" color="success" label="Active" />;
    }

    switch (item.status) {
      case RequestStatus.PENDING:
        return <Chip size="small" color="warning" label="Pending" />;
      case RequestStatus.IN_REVIEW:
        return <Chip size="small" color="info" label="In Review" />;
      case RequestStatus.REVIEWED:
        return <Chip size="small" color="secondary" label="Reviewed" />;
      case RequestStatus.APPROVED:
        return <Chip size="small" color="success" label="Active" />; // Changed from "Processing" to "Active"
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

function getApprovalStepColor(step: any, currentLevel: number) {
  if (step.status === ApprovalStatus.APPROVED) {
    return 'success.main';
  } else if (step.status === ApprovalStatus.REJECTED) {
    return 'error.main';
  } else if (step.level < currentLevel) {
    return 'success.light';
  } else if (step.level === currentLevel) {
    return 'primary.main';
  } else {
    return 'grey.300';
  }
}