import React from 'react';
import {
  Paper,
  Box,
  Typography,
  Divider,
  Chip,
  Skeleton,
  useTheme,
} from '@mui/material';
import {
  ArrowUpward,
  ArrowDownward,
  SwapHoriz,
} from '@mui/icons-material';
import { formatCurrency } from '@/utils/formatting/format';
import { format } from 'date-fns';
import { Transaction, TransactionSummaryProps } from '@/types/transaction.types';
// import { TransactionType } from '@/types/transaction.types';
import { TransactionTypeEnum as TransactionType } from '@/types/financial.types';

// Use the proper interface instead of SavingsRecord
const LastTransactionSummary: React.FC<TransactionSummaryProps> = ({ transaction, isLoading }) => {
  const theme = useTheme();

  if (isLoading) {
    return (
      <Paper sx={{ p: 3, borderRadius: 2, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Last Transaction
        </Typography>
        <Skeleton variant="rectangular" width="100%" height={100} />
      </Paper>
    );
  }

  if (!transaction) {
    return (
      <Paper sx={{ p: 3, borderRadius: 2, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Last Transaction
        </Typography>
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No recent transactions found
          </Typography>
        </Box>
      </Paper>
    );
  }

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy • h:mm a');
    } catch (error) {
      return dateString;
    }
  };

  // Determine transaction icon and color
  const getTransactionIcon = (baseType: string) => {
    if (baseType === "CREDIT") {
      return <ArrowUpward color="success" />;
    } else if (baseType === "DEBIT") {
      return <ArrowDownward color="error" />;
    }
    return <SwapHoriz color="info" />;
  };
  
  const getTransactionTypeDisplay = (type: string) => {
    switch (type) {
      case TransactionType.SAVINGS_DEPOSIT:
        return 'Savings Deposit';
      case TransactionType.SAVINGS_WITHDRAWAL:
        return 'Savings Withdrawal';
      case TransactionType.SHARES_PURCHASE:
        return 'Shares Purchase';
      case TransactionType.SHARES_WITHDRAWAL:
        return 'Shares Withdrawal';
      case TransactionType.PERSONAL_SAVINGS_DEPOSIT:
        return 'Personal Savings Depossit';
      case TransactionType.PERSONAL_SAVINGS_WITHDRAWAL:
        return 'Personal Savings Withdrawals'
      default:
        return 'Unknown';
    }
  };

  // Format amount with + or - prefix
  const formatAmountWithSign = (amount: string | number, baseType: string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return baseType === "CREDIT" ? `+${formatCurrency(numAmount)}` : `-${formatCurrency(numAmount)}`;
  };

  // Get status color
  const getStatusColor = (status: import('@/types/transaction.types').TransactionStatus) => {
    const statusStr = typeof status === 'string' ? status : String(status);
    switch (statusStr.toUpperCase()) {
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

  return (
    <Paper sx={{ p: 3, borderRadius: 2, mb: 4, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
      <Typography variant="h6" gutterBottom>
        Last Transaction
      </Typography>
      
      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: transaction.baseType === "CREDIT" as any ? 'success.light' : 'error.light',
            color: transaction.baseType === "CREDIT" as any ? 'success.dark' : 'error.dark',
            borderRadius: '50%',
            p: 1,
            width: 40,
            height: 40
          }}>
            {getTransactionIcon(transaction.baseType)}
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight="medium">
              {getTransactionTypeDisplay(transaction.transactionType)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatDate(transaction.createdAt)}
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ textAlign: 'right' }}>
          <Typography 
            variant="h6" 
            sx={{ 
              color: transaction.baseType === 'CREDIT' as any
                ? theme.palette.success.main 
                : theme.palette.error.main,
              fontWeight: 'bold'
            }}
          >
            {formatAmountWithSign(transaction.amount, transaction.baseType)}
          </Typography>
          <Chip 
            label={String(transaction.status)} 
            size="small" 
            color={getStatusColor(transaction.status) as any}
            sx={{ mt: 0.5 }}
          />
        </Box>
      </Box>
      
      {transaction.description && (
        <>
          <Divider sx={{ my: 2 }} />
          <Box>
            <Typography variant="body2" color="text.secondary">
              {transaction.description}
            </Typography>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default LastTransactionSummary;