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
  Skeleton,
  Stack
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { transactionService } from '@/lib/api/services/transactionService';
import { formatCurrency } from '@/utils/formatting/format';

// Import icons
import MoneyIcon from '@mui/icons-material/Money';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import PaidIcon from '@mui/icons-material/Paid';

interface ActivityStreamProps {
  limit?: number;
}

interface Transaction {
  id: string;
  transactionType: string;
  status: string;
  amount: number;
  description?: string;
  createdAt: string;
}

const ActivityStream: React.FC<ActivityStreamProps> = ({ limit = 5 }) => {
  // Fetch recent transactions for activity feed
  const { data: transactions = [], isLoading, error } = useQuery<Transaction[]>({
    queryKey: ['admin-recent-transactions', limit],
    queryFn: async () => {
      const result = await transactionService.getRecentAdminTransactions(limit);
      // Normalize to array of Transaction and ensure amount is a number
      const records = Array.isArray(result)
        ? result
        : result && Array.isArray(result.data)
        ? result.data
        : [];
      return records.map((tx: any) => ({
        ...tx,
        amount: typeof tx.amount === 'string' ? Number(tx.amount) : tx.amount,
      }));
    },
    staleTime: 60 * 1000 // 1 minute
  });

  const getIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'DEPOSIT':
        return <ArrowUpwardIcon />;
      case 'WITHDRAWAL':
        return <ArrowDownwardIcon />;
      case 'LOAN_DISBURSEMENT':
        return <MoneyIcon />;
      case 'LOAN_REPAYMENT':
        return <PaidIcon />;
      default:
        return <AccountBalanceIcon />;
    }
  };

  const getIconColor = (type: string) => {
    switch (type.toUpperCase()) {
      case 'DEPOSIT':
        return '#4caf50';  // green
      case 'WITHDRAWAL':
        return '#f44336';  // red
      case 'LOAN_DISBURSEMENT':
        return '#2196f3';  // blue
      case 'LOAN_REPAYMENT':
        return '#ff9800';  // orange
      default:
        return '#9e9e9e';  // grey
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'FAILED':
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
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
    return (
      <Box textAlign="center" py={2}>
        <Typography color="error">Failed to load recent activity.</Typography>
      </Box>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <Box textAlign="center" py={2}>
        <Typography color="text.secondary">No recent activity to display.</Typography>
      </Box>
    );
  }

  return (
    <List disablePadding>
      {transactions.map((transaction, index) => (
        <React.Fragment key={transaction.id}>
          <ListItem alignItems="flex-start" sx={{ py: 1.5 }}>
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: getIconColor(transaction.transactionType) }}>
                {getIcon(transaction.transactionType)}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" fontWeight={500}>
                    {transaction.transactionType.replace(/_/g, ' ')}
                  </Typography>
                  <Chip 
                    label={transaction.status} 
                    size="small" 
                    color={getStatusColor(transaction.status) as any} 
                    variant="outlined"
                  />
                </Box>
              }
              secondary={
                <React.Fragment>
                  <Typography variant="body2" color="text.primary" sx={{ mt: 0.5 }}>
                    {formatCurrency(transaction.amount)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {transaction.description || 'No description'} • 
                    {formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })}
                  </Typography>
                </React.Fragment>
              }
            />
          </ListItem>
          {index < transactions.length - 1 && <Divider component="li" />}
        </React.Fragment>
      ))}
    </List>
  );
};

export default ActivityStream;