import { FC, useMemo } from 'react';
import { 
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  Skeleton,
  Button,
  Grid,
  useTheme
} from '@mui/material';
import {
  ArrowUpward,
  ArrowDownward,
  SwapHoriz,
  AccessTime,
  KeyboardArrowRight,
  AccountBalance,
  Savings,
  MonetizationOn,
  Receipt,
  LocalAtm,
  AccountBalanceWallet,
  CreditCard,
  Add,
  Remove,
  AttachMoney,
  Paid
} from '@mui/icons-material';
import { format } from 'date-fns';
import { formatCurrency } from '@/utils/formatting/format';
import { useQuery } from '@tanstack/react-query';
import { transactionService } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface RecentTransactionsSidebarProps {
  limit?: number;
}

// First, ensure proper typing for the transactions data
interface Transaction {
  id: string;
  amount: number;
  baseType: 'CREDIT' | 'DEBIT';
  transactionType: string;
  module: string;
  status: string;
  description?: string;
  createdAt: string;
}

// Define the possible API response structure
interface TransactionsApiResponse {
  data: Transaction[];
  [key: string]: any;
}

const RecentTransactionsSidebar: FC<RecentTransactionsSidebarProps> = ({ limit = 20 }) => {
  const theme = useTheme();
  const router = useRouter();

  // Fetch recent transactions across all entities
  const { data: transactionsResponse, isLoading } = useQuery<TransactionsApiResponse>({
    queryKey: ['recent-transactions', limit],
    queryFn: async () => {
      try {
        const response = await transactionService.getUserTransactions(undefined, 1, limit);
        // Normalize the response to match TransactionsApiResponse
        let data: Transaction[] = [];
        if (response && Array.isArray(response.data)) {
          // If response.data is already an array of transactions
          data = response.data as unknown as Transaction[];
        } else if (
          response &&
          typeof response.data === 'object' &&
          response.data !== null &&
          Array.isArray((response.data as any).data)
        ) {
          // If response.data.data is the array (paginated)
          data = (response.data as any).data.map((item: any) => ({
            id: item.id,
            amount: item.amount,
            baseType: item.baseType,
            transactionType: item.transactionType,
            module: item.module,
            status: item.status,
            description: item.description,
            createdAt: item.createdAt,
          })) as Transaction[];
        }
        return { data };
      } catch (error) {
        console.error('Error fetching transactions:', error);
        return { data: [] };
      }
    },
    staleTime: 300000 // 5 minutes
  });

  // Add data validation and transformation
  const transactionItems = useMemo(() => {
    // Check if we have a valid response with data property
    if (!transactionsResponse?.data) {
      console.log('No transaction data available');
      return [];
    }

    // If data is an object with a data property (wrapped response)
    if (
      typeof transactionsResponse.data === 'object' &&
      Array.isArray((transactionsResponse.data as any)?.data)
    ) {
      return (transactionsResponse.data as any)?.data || [];
    }

    // If data is already an array
    if (Array.isArray(transactionsResponse.data)) {
      return transactionsResponse.data;
    }

    console.warn('Transaction data is not an array:', transactionsResponse.data);
    return [];
  }, [transactionsResponse]);

  // Helper function to get transaction icon based on type and module
  const getTransactionIcon = (type: string, baseType: string, module: string) => {
    // Check specific transaction types first
    switch (type) {
      case 'SAVINGS_DEPOSIT':
        return <Savings sx={{ color: theme.palette.success.main }} />;
      case 'SAVINGS_WITHDRAWAL':
        return <AccountBalanceWallet sx={{ color: theme.palette.error.main }} />;
      case 'SHARES_PURCHASE':
        return <Paid sx={{ color: theme.palette.info.main }} />;
      case 'SHARES_REDEMPTION':
        return <AttachMoney sx={{ color: theme.palette.warning.main }} />;
      case 'LOAN_DISBURSEMENT':
        return <LocalAtm sx={{ color: theme.palette.success.main }} />;
      case 'LOAN_REPAYMENT':
        return <CreditCard sx={{ color: theme.palette.primary.main }} />;
    }

    // More general check by transaction type pattern
    if (type.includes('DEPOSIT')) {
      return <Savings sx={{ color: theme.palette.success.main }} />;
    } else if (type.includes('WITHDRAWAL')) {
      return <AccountBalanceWallet sx={{ color: theme.palette.error.main }} />;
    } else if (type.includes('PURCHASE')) {
      return <Paid sx={{ color: theme.palette.info.main }} />;
    } else if (type.includes('REDEMPTION')) {
      return <AttachMoney sx={{ color: theme.palette.warning.main }} />;
    } else if (type.includes('DISBURSEMENT')) {
      return <LocalAtm sx={{ color: theme.palette.success.main }} />;
    } else if (type.includes('REPAYMENT')) {
      return <CreditCard sx={{ color: theme.palette.primary.main }} />;
    }
    
    // Fallback to module-specific icons
    switch (module) {
      case 'SAVINGS':
        return baseType === 'CREDIT' 
          ? <Savings sx={{ color: theme.palette.success.main }} />
          : <AccountBalanceWallet sx={{ color: theme.palette.error.main }} />;
      case 'LOAN':
        return baseType === 'CREDIT'
          ? <LocalAtm sx={{ color: theme.palette.success.main }} />
          : <CreditCard sx={{ color: theme.palette.primary.main }} />;
      case 'SHARES':
        return baseType === 'CREDIT'
          ? <Paid sx={{ color: theme.palette.info.main }} />
          : <AttachMoney sx={{ color: theme.palette.warning.main }} />;
      default:
        return baseType === 'CREDIT'
          ? <Add sx={{ color: theme.palette.success.main }} />
          : <Remove sx={{ color: theme.palette.error.main }} />;
    }
  };

  // Helper function to format transaction type display
  const getTransactionTypeDisplay = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Helper function to get transaction module color
  const getModuleColor = (module: string) => {
    switch (module.toUpperCase()) {
      case 'SAVINGS':
        return theme.palette.primary.main;
      case 'LOAN':
        return theme.palette.secondary.main;
      case 'SHARES':
        return theme.palette.info.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return 'success';
      case 'PENDING':
      case 'PROCESSING':
        return 'warning';
      case 'FAILED':
      case 'CANCELLED': 
        return 'error';
      case 'REVERSED':
        return 'info';
      default:
        return 'default';
    }
  };

  // Helper function to format description
  const formatDescription = (description: string | undefined) => {
    if (!description) return '';
    
    // Truncate long descriptions
    if (description.length > 30) {
      return `${description.substring(0, 30)}...`;
    }
    return description;
  };

  if (isLoading) {
    return (
      <Paper sx={{ p: 3, height: '100%' }} elevation={0}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Recent Transactions</Typography>
        </Box>
        {[...Array(5)].map((_, index) => (
          <Box key={index} sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Skeleton variant="circular" width={32} height={32} sx={{ mr: 2 }} />
              <Box sx={{ width: '100%' }}>
                <Skeleton width="60%" height={24} />
                <Skeleton width="40%" height={20} />
              </Box>
            </Box>
            {index < 4 && <Divider sx={{ my: 1 }} />}
          </Box>
        ))}
      </Paper>
    );
  }

  return (
    <Paper 
      sx={{ 
        p: 3, 
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }} 
      elevation={0}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Recent Transactions</Typography>
        <Button 
          endIcon={<KeyboardArrowRight />} 
          onClick={() => router.push('/member/transactions')}
          size="small"
        >
          View All
        </Button>
      </Box>
      
      {isLoading ? (
        // ... loading skeleton ...
        <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <AccessTime sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
          <Typography variant="body2">
            No recent transactions found
          </Typography>
        </Box>
      ) : !Array.isArray(transactionItems) || transactionItems.length === 0 ? (
        <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
          <AccessTime sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
          <Typography variant="body2">
            No recent transactions found
          </Typography>
        </Box>
      ) : (
        <Box sx={{ 
          flexGrow: 1, 
          overflowY: 'auto', // <-- Make scrollable
          position: 'relative',
          minHeight: '400px',
          maxHeight: '500px',
          // Hide scrollbar by default, show on hover
          scrollbarWidth: 'thin',
          scrollbarColor: `${theme.palette.divider} transparent`,
          '&::-webkit-scrollbar': {
            width: 8,
            background: 'transparent',
            transition: 'background 0.2s',
          },
          '&:hover::-webkit-scrollbar': {
            background: theme.palette.action.hover,
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'transparent',
            borderRadius: 4,
            transition: 'background 0.2s',
          },
          '&:hover::-webkit-scrollbar-thumb': {
            background: theme.palette.divider,
          },
        }}>
          <List>
            {transactionItems.map((transaction: Transaction, index: number) => (
              <Box key={transaction.id || index}>
                <ListItem 
                  sx={{ 
                    px: 0,
                    py: 1.5,
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                      cursor: 'pointer',
                      borderRadius: 1
                    }
                  }}
                  onClick={() => console.log('Transaction details:', transaction)}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {getTransactionIcon(
                      transaction.transactionType, 
                      transaction.baseType, 
                      transaction.module
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Grid container spacing={1} alignItems="center">
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {getTransactionTypeDisplay(transaction.transactionType)}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <Chip
                            label={transaction.baseType}
                            size="small"
                            color={transaction.baseType === 'CREDIT' ? 'success' : 'error'}
                            variant="outlined"
                            sx={{ 
                              height: 16, 
                              fontSize: '0.6rem',
                              fontWeight: 600,
                              mr: 1,
                              width: '55px',
                              '& .MuiChip-label': { px: 0.8 }
                            }}
                          />
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 500,
                              color: transaction.baseType === 'CREDIT' 
                                ? theme.palette.success.main 
                                : theme.palette.error.main,
                              minWidth: '80px',
                              textAlign: 'right'
                            }}
                            >
                            {transaction.baseType === 'CREDIT' ? '+' : '-'}
                            {formatCurrency(Number(transaction.amount))}
                          </Typography>
                        </Grid>
                      </Grid>
                    }
                    secondary={
                      <>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {formatDescription(transaction.description)}
                        </Typography>
                        <Grid container spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                          <Grid size={{ xs: 7 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="caption" color="text.secondary">
                                {format(new Date(transaction.createdAt), 'MMM dd, yyyy')}
                              </Typography>
                              <Box
                                sx={{
                                  width: 8,
                                  height: 8,
                                  backgroundColor: getModuleColor(transaction.module),
                                  borderRadius: '50%',
                                  mx: 0.8
                                }}
                              />
                              <Typography 
                                variant="caption" 
                                sx={{ color: getModuleColor(transaction.module) }}
                              >
                                {transaction.module}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid size={{ xs: 5 }} sx={{ textAlign: 'right' }}>
                            <Chip
                              label={transaction.status}
                              size="small"
                              color={getStatusColor(transaction.status) as any}
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          </Grid>
                        </Grid>
                      </>
                    }
                  />
                </ListItem>
                {index < transactionItems.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
          {/* Gradient overlay */}
          {transactionItems.length > 5 && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '32px',
                background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%)',
                pointerEvents: 'none',
                zIndex: 1,
              }}
            />
          )}
        </Box>
      )}
    </Paper>
  );
};

export default RecentTransactionsSidebar;