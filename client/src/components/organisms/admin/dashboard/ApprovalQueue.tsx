import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Box, 
  List, 
  ListItem, 
  ListItemAvatar, 
  ListItemText, 
  Avatar, 
  Typography, 
  Divider, 
  Chip,
  Button,
  Skeleton,
  Stack
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { approvalService } from '@/lib/api/services/approvalService';
import { RequestType, RequestStatus } from '@/types/request.types';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonIcon from '@mui/icons-material/Person';
import MoneyIcon from '@mui/icons-material/Money';
import SavingsIcon from '@mui/icons-material/Savings';
import { formatDistanceToNow } from 'date-fns';

interface ApprovalQueueProps {
  limit?: number;
}

const ApprovalQueue = ({ limit = 5 }: ApprovalQueueProps) => {
  const router = useRouter();
  
  // Use the enhanced approval service method
  const { data: approvals, isLoading, error } = useQuery({
    queryKey: ['admin-pending-approvals-list', 1, limit],
    queryFn: async () => {
      const pendingApprovals = await approvalService.getPendingApprovals(1, limit);
      console.log('ApprovalQueue - fetched approvals:', pendingApprovals);
      return pendingApprovals;
    },
    staleTime: 60000, // 1 minute
    refetchInterval: 60000, // Auto-refresh every minute
  });

  console.log('Approval Queue Component - approvals:', approvals);
  console.log('Approval Queue Component - loading:', isLoading);
  console.log('Approval Queue Component - error:', error);

  const getIcon = (type?: string) => {
    switch (type?.toUpperCase()) {
      case RequestType.LOAN_APPLICATION:
      case RequestType.LOAN_DISBURSEMENT:
        return <MoneyIcon />;
      case RequestType.BIODATA_UPDATE:
      case RequestType.ACCOUNT_CREATION:
      case RequestType.ACCOUNT_UPDATE:
      case RequestType.ACCOUNT_VERIFICATION:
        return <PersonIcon />;
      case RequestType.SAVINGS_WITHDRAWAL:
        return <SavingsIcon />;
      default:
        return <AssignmentIcon />;
    }
  };

  const getPriorityColor = (status?: string, priority?: string) => {
    if (status === RequestStatus.PENDING && priority?.toUpperCase() === 'HIGH') {
      return 'error';
    }
    if (status === RequestStatus.IN_REVIEW) {
      return 'warning';
    }
    if (status === RequestStatus.REVIEWED) {
      return 'info';
    }
    return 'default';
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case RequestStatus.PENDING:
        return 'Pending';
      case RequestStatus.IN_REVIEW:
        return 'In Review';
      case RequestStatus.REVIEWED:
        return 'Reviewed';
      default:
        return status || 'Unknown';
    }
  };

  const handleApprovalClick = (id: string, type?: string) => {
    console.log(`Navigating to approval: ${id}, type: ${type}`);
    let path = '/admin/approvals';
    
    switch (type?.toUpperCase()) {
      case RequestType.LOAN_APPLICATION:
      case RequestType.LOAN_DISBURSEMENT:
        path = `/admin/approvals/loans/${id}`;
        break;
      case RequestType.SAVINGS_WITHDRAWAL:
        path = `/admin/approvals/withdrawals/${id}`;
        break;
      case RequestType.ACCOUNT_CREATION:
      case RequestType.ACCOUNT_UPDATE:
      case RequestType.ACCOUNT_VERIFICATION:
      case RequestType.BIODATA_UPDATE:
        path = `/admin/approvals/members/${id}`;
        break;
      default:
        path = `/admin/approvals/requests/${id}`;
    }
    
    router.push(path);
  };

  if (isLoading) {
    return (
      <Stack spacing={2}>
        {[...Array(limit)].map((_, index) => (
          <Box key={index} sx={{ display: 'flex', my: 1 }}>
            <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
            <Box width="100%">
              <Skeleton variant="text" width="60%" height={20} />
              <Skeleton variant="text" width="40%" height={20} />
            </Box>
          </Box>
        ))}
      </Stack>
    );
  }

  if (error) {
    console.error('ApprovalQueue error:', error);
    return (
      <Box textAlign="center" py={3}>
        <Typography color="error">Failed to load pending approvals.</Typography>
        <Typography variant="body2" color="text.secondary">
          Check console for details.
        </Typography>
      </Box>
    );
  }

  if (!approvals || approvals.length === 0) {
    return (
      <Box textAlign="center" py={3}>
        <Typography color="textSecondary">
          No pending approvals assigned to you at this time.
        </Typography>
      </Box>
    );
  }

  return (
    <List disablePadding>
      {approvals.map((approval, index) => (
        <React.Fragment key={approval.id}>
          <ListItem 
            alignItems="flex-start"
            sx={{ 
              py: 2, 
              cursor: 'pointer',
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
            onClick={() => handleApprovalClick(approval.id, approval.type)}
          >
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: 'primary.light' }}>
                {getIcon(approval.type)}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body1" fontWeight={500}>
                    {approval.initiator?.firstName || "Member"}'s {approval.type?.replace(/_/g, ' ')}
                  </Typography>
                  <Chip 
                    label={getStatusLabel(approval.status)} 
                    size="small" 
                    color={getPriorityColor(approval.status, approval.priority) as any}
                    variant="outlined"
                  />
                </Box>
              }
              secondary={
                <React.Fragment>
                  <Typography variant="body2" color="text.secondary">
                    {approval.biodata?.fullName || "No name provided"}
                    {approval.biodata?.department ? ` - ${approval.biodata.department}` : ''}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    {formatDistanceToNow(new Date(approval.createdAt), { addSuffix: true })}
                    {approval.nextApprovalLevel ? ` • Level ${approval.nextApprovalLevel}` : ''}
                  </Typography>
                </React.Fragment>
              }
            />
          </ListItem>
          {index < approvals.length - 1 && <Divider component="li" />}
        </React.Fragment>
      ))}
    </List>
  );
};

export default ApprovalQueue;