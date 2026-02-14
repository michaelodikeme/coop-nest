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
  ListItemButton,
  Divider,
  Chip,
  Tabs,
  Tab,
  Badge,
  LinearProgress,
  Tooltip
} from '@mui/material';
import { ChevronRight } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';


// Helper functions
// Function to get status chip
export function MemberSummary() {
  const { user } = useAuth();
  const router = useRouter();
  const { data: response, isLoading } = useMemberSummary(user?.biodata?.erpId);
  const [activeTab, setActiveTab] = useState(0);

  const data = response?.data;

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

  const activePlans = data.activePlans ?? [];
  const pendingRequests = data.pendingRequests ?? [];
  const hasPendingRequests = pendingRequests.length > 0;

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Personal Savings Summary
      </Typography>

      {/* SUMMARY CARDS */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: 'Total Saved', value: data.totalSaved },
          { label: 'Total Withdrawals', value: data.totalWithdrawals },
          { label: 'Current Balance', value: data.currentBalance },
        ].map((item) => (
          <Grid key={item.label} xs={12} md={4}>
            <Card>
              <CardHeader title={item.label} sx={{ pb: 0 }} />
              <CardContent>
                <Typography variant="h4" fontWeight="bold">
                  {formatCurrency(item.value)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                Active Plans
                <Badge sx={{ ml: 1 }} badgeContent={activePlans.length} />
              </Box>
            }
          />
          {hasPendingRequests && (
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  Pending Requests
                  <Badge sx={{ ml: 1 }} badgeContent={pendingRequests.length} color="warning" />
                </Box>
              }
            />
          )}
        </Tabs>

        <CardContent>
          {activeTab === 0 ? (
            <List disablePadding>
              {activePlans.map((plan: any, index: number) => (
                <React.Fragment key={plan.id}>
                  {index > 0 && <Divider />}
                  <ListItemButton
                    sx={{ py: 2 }}
                    onClick={() => router.push(`/member/savings/personal/${plan.id}`)}
                  >
                    <ListItemText
                      disableTypography
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography component="span" fontWeight={500}>
                            {plan.planName || 'Savings Plan'}
                          </Typography>
                          {getStatusChip(plan)}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Typography component="div" variant="body2">
                            Created: {new Date(plan.createdAt).toLocaleDateString()}
                          </Typography>

                          {plan.targetAmount && (
                            <Typography component="div" variant="body2" color="text.secondary">
                              Target: {formatCurrency(plan.targetAmount)}
                            </Typography>
                          )}

                          {plan.pendingWithdrawal && (
                            <Box sx={{ mt: 1, p: 1, bgcolor: 'warning.light', borderRadius: 1 }}>
                              <Typography component="div" variant="body2" fontWeight={500}>
                                Withdrawal: {formatCurrency(plan.pendingWithdrawal.amount)}
                              </Typography>
                              <Typography component="div" variant="caption">
                                Status: {plan.pendingWithdrawal.status}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      }
                    />

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography fontWeight="bold">
                        {formatCurrency(plan.currentBalance || 0)}
                      </Typography>
                      <ChevronRight color="action" />
                    </Box>
                  </ListItemButton>
                </React.Fragment>
              ))}
            </List>
          ) : (
            <List disablePadding>
              {pendingRequests.map((request: any, index: number) => (
                <React.Fragment key={request.id}>
                  {index > 0 && <Divider />}
                  <ListItem>
                    <ListItemText
                      disableTypography
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography component="span" fontWeight={500}>
                            {request.content?.planName || 'New Savings Plan'}
                          </Typography>
                          {getStatusChip(request)}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Typography component="div" variant="body2">
                            Requested: {new Date(request.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      }
                    />
                    <Chip size="small" label={`ID: ${request.id?.slice(0, 6)}…`} />
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
