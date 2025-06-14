import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Chip,
  Skeleton,
  Typography,
  useTheme
} from '@mui/material';
import {
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from '@mui/icons-material';
import { formatCurrency, formatDate } from '@/utils/formatting/format';
import { TransactionRecord } from '@/lib/api';

interface RecentTransactionsTableProps {
  transactions: TransactionRecord[];
  isLoading?: boolean;
  limit?: number;
}

export default function RecentTransactionsTable({ 
  transactions, 
  isLoading = false,
  limit = 10
}: RecentTransactionsTableProps) {
  const theme = useTheme();
  
  const displayTransactions = transactions.slice(0, limit);
  
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'PROCESSING':
        return 'info';
      case 'FAILED':
      case 'CANCELLED':
      case 'REVERSED':
        return 'error';
      default:
        return 'default';
    }
  };
  
  // Function to format transaction type into readable text
  const formatTransactionType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  if (isLoading) {
    return (
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Type</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Date</TableCell>
            <TableCell align="right">Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.from(new Array(5)).map((_, index) => (
            <TableRow key={index}>
              <TableCell><Skeleton /></TableCell>
              <TableCell><Skeleton /></TableCell>
              <TableCell><Skeleton /></TableCell>
              <TableCell align="right"><Skeleton width={80} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }
  
  if (!displayTransactions.length) {
    return (
      <Box sx={{ textAlign: 'center', py: 3 }}>
        <Typography variant="body1" color="text.secondary">
          No transactions found
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Type</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Date</TableCell>
            <TableCell align="right">Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {displayTransactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {transaction.baseType === 'CREDIT' ? (
                    <Box sx={{ 
                      mr: 1, 
                      width: 24, 
                      height: 24, 
                      borderRadius: '50%', 
                      bgcolor: theme.palette.success.light + '30',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <ArrowDownwardIcon fontSize="small" sx={{ color: theme.palette.success.main }} />
                    </Box>
                  ) : (
                    <Box sx={{ 
                      mr: 1, 
                      width: 24, 
                      height: 24, 
                      borderRadius: '50%', 
                      bgcolor: theme.palette.error.light + '30',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <ArrowUpwardIcon fontSize="small" sx={{ color: theme.palette.error.main }} />
                    </Box>
                  )}
                  <Typography variant="body2">{formatTransactionType(transaction.transactionType)}</Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                  {transaction.description || '-'}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography 
                  variant="body2" 
                  fontWeight={500}
                  color={transaction.baseType === 'CREDIT' ? 'success.main' : 'error.main'}
                >
                  {transaction.baseType === 'CREDIT' ? '+' : '-'}{formatCurrency(Number(transaction.amount))}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {formatDate(transaction.createdAt)}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Chip 
                  size="small" 
                  label={transaction.status} 
                  color={getStatusColor(transaction.status) as any}
                  sx={{ fontWeight: 500, fontSize: '0.75rem' }}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}