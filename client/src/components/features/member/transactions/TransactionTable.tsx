import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Skeleton,
  Box,
  Chip,
  Typography,
  IconButton,
  useTheme
} from '@mui/material';
import {
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { formatCurrency, formatDate } from '@/utils/formatting/format';
import { TransactionRecord } from '@/lib/api';

interface TransactionTableProps {
  transactions: TransactionRecord[];
  pagination?: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
  page: number;
  rowsPerPage: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  onSortChange?: (field: string, direction: 'asc' | 'desc') => void;
  isLoading?: boolean;
}

export default function TransactionTable({
  transactions = [],
  pagination,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onSortChange,
  isLoading = false
}: TransactionTableProps) {
  const theme = useTheme();
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  
  // Debug logs
  console.log('TransactionTable received transactions:', transactions);
  console.log('TransactionTable pagination:', pagination);
  
  // Function to format transaction type into readable text
  const formatTransactionType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };
  
  // Function to get status chip color
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
  
  // Handle page change
  const handleChangePage = (event: unknown, newPage: number) => {
    onPageChange(newPage + 1); // API pagination is 1-based
    setExpandedRow(null); // Reset expanded row when changing page
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    onRowsPerPageChange(parseInt(event.target.value, 10));
    onPageChange(1); // Reset to first page
    setExpandedRow(null); // Reset expanded row
  };
  
  // Toggle row expansion
  const toggleRowExpansion = (transactionId: string) => {
    setExpandedRow(prevId => prevId === transactionId ? null : transactionId);
  };

  // Calculate total rows based on pagination or local data
  const totalRows = pagination ? pagination.totalCount : transactions.length;

  if (isLoading) {
    return (
      <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2 }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.from(new Array(5)).map((_, index) => (
                <TableRow key={index} hover>
                  <TableCell><Skeleton variant="text" width={100} /></TableCell>
                  <TableCell><Skeleton variant="text" width={100} /></TableCell>
                  <TableCell><Skeleton variant="text" width={100} /></TableCell>
                  <TableCell><Skeleton variant="text" width={200} /></TableCell>
                  <TableCell align="right"><Skeleton variant="text" width={80} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    );
  }

  if (!transactions.length) {
    return (
      <Paper 
        sx={{ 
          p: 4, 
          textAlign: 'center', 
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: 'background.paper'
        }}
      >
        <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
          No transactions found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Try changing your search criteria or filters
        </Typography>
      </Paper>
    );
  }

  // Ensure transactions is an array
  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
      <TableContainer>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Status</TableCell>
              <TableCell padding="checkbox"></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {safeTransactions.map((transaction) => (
              <React.Fragment key={transaction.id}>
                <TableRow hover>
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
                    <Typography variant="body2">{formatDate(transaction.createdAt)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      fontWeight={500}
                      color={transaction.baseType === 'CREDIT' ? 'success.main' : 'error.main'}
                    >
                      {transaction.baseType === 'CREDIT' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        maxWidth: 300,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {transaction.description || '-'}
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
                  <TableCell padding="checkbox">
                    <IconButton 
                      size="small" 
                      onClick={() => toggleRowExpansion(transaction.id)}
                      sx={{ 
                        transform: expandedRow === transaction.id ? 'rotate(180deg)' : 'rotate(0)',
                        transition: '0.2s'
                      }}
                    >
                      <ExpandMoreIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
                
                {/* Expanded row details */}
                {expandedRow === transaction.id && (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ py: 2, bgcolor: theme.palette.action.hover }}>
                      <Box sx={{ px: 2 }}>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          Transaction Details
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Typography variant="body2">
                            <strong>Transaction ID:</strong> {transaction.id}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Account:</strong> {transaction.transactionType === 'SHARE_PURCHASE' ? 'Shares Account' : 'Cash Account'}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Type:</strong> {formatTransactionType(transaction.transactionType)}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Date:</strong> {formatDate(transaction.createdAt)}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Amount:</strong> {formatCurrency(transaction.amount)}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Status:</strong> {transaction.status}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Description:</strong> {transaction.description || '-'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={totalRows}
        page={page - 1}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />
    </Paper>
  );
}