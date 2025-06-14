import { FC } from 'react';
import { 
  Box, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon, 
  Typography, 
  Chip, 
  Divider, 
  Button,
  Skeleton,
  useTheme
} from '@mui/material';
import { 
  ArrowUpward, 
  ArrowDownward, 
  MoreHoriz, 
  SwapHoriz 
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { savingsService } from '@/lib/api';
import { format } from 'date-fns';

interface RecentTransactionsProps {
  limit?: number;
}

const RecentTransactions: FC<RecentTransactionsProps> = ({ limit = 5 }) => {
  const theme = useTheme();
  const router = useRouter();
  
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['savings-transactions', limit],
    queryFn: () => savingsService.getTransactions(),
    select: (data) => data.slice(0, limit),
    staleTime: 300000, // 5 minutes
  });
  
  // Function to determine transaction icon based on type
  const getTransactionIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'DEPOSIT':
        return <ArrowUpward sx={{ color: theme.palette.success.main }} />;
      case 'WITHDRAWAL':
        return <ArrowDownward sx={{ color: theme.palette.error.main }} />;
      default:
        return <SwapHoriz sx={{ color: theme.palette.info.main }} />;
    }
  };
  
  // Function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  // Function to format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };
  
  // Function to get status chip color
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'FAILED':
        return 'error';
      default:
        return 'default';
    }
  };
  
  // Navigate to all transactions
  const handleViewAll = () => {
    router.push('/member/savings');
  };
  
  return (
    <Box>
      {isLoading ? (
        // Skeleton loading state
        Array.from(new Array(limit)).map((_, index) => (
          <Box key={index} sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', mb: 1 }}>
              <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
              <Box sx={{ width: '100%' }}>
                <Skeleton width="60%" height={24} />
                <Skeleton width="40%" height={20} />
              </Box>
            </Box>
            <Divider />
          </Box>
        ))
      ) : transactions && transactions.length > 0 ? (
        <List sx={{ p: 0 }}>
          {transactions.map((transaction: any, index: number) => (
            <Box key={transaction.id || index}>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {getTransactionIcon(transaction.type)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1).toLowerCase()}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: transaction.type.toUpperCase() === 'DEPOSIT' 
                            ? theme.palette.success.main 
                            : theme.palette.error.main
                        }}
                      >
                        {formatCurrency(transaction.amount)}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(transaction.transactionDate)}
                      </Typography>
                      <Chip
                        label={transaction.status}
                        size="small"
                        color={getStatusColor(transaction.status) as any}
                        sx={{ fontSize: '0.7rem', height: 20 }}
                      />
                    </Box>
                  }
                />
              </ListItem>
              {index < transactions.length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      ) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            No recent transactions found
          </Typography>
        </Box>
      )}
      
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
        <Button 
          variant="text" 
          endIcon={<MoreHoriz />}
          onClick={handleViewAll}
        >
          View All Transactions
        </Button>
      </Box>
    </Box>
  );
};

export default RecentTransactions;
