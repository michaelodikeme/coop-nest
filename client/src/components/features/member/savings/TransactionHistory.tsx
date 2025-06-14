import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Stack,
  Skeleton,
  useTheme,
  Button
} from '@mui/material';
import {
  Search,
  FileDownload,
  ArrowDownward,
  ArrowUpward,
  SwapHoriz,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { savingsService } from '@/lib/api';
import { format } from 'date-fns';
import { TransactionTypeEnum as TransactionType, TransactionModule } from '@/types/financial.types';
// import { TransactionModule } from '@/types/transaction.types';

interface TransactionHistoryProps {
  limit?: number;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ limit }) => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');

  // Update query to use proper pagination and filtering
  const { data: response, isLoading, error } = useQuery({
    queryKey: ['savings-transactions-history', page, rowsPerPage, moduleFilter, searchTerm, limit],
    queryFn: () => savingsService.getTransactions({
      page: page + 1, 
      limit: limit || rowsPerPage,
      // We don't need to filter by type on the API as we'll filter client-side by module
    }),
    staleTime: 300000,
  });

  // Display error if one occurs
  if (error) {
    return (
      <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2, p: 3 }}>
        <Typography color="error">
          Error loading transactions: {(error as Error).message}
        </Typography>
      </Paper>
    );
  }

  // Access transactions directly from the response
  const transactions = response?.data || response || [];
  const totalCount = response?.meta?.total || (Array.isArray(transactions) ? transactions.length : 0);

  // Filter and paginate transactions
  const filteredTransactions = React.useMemo(() => {
    if (!transactions) return [];
    
    // Extract the array from PaginatedResponse if needed
    const transactionsArray = Array.isArray(transactions) ? transactions : (transactions.data || []);
    
    return transactionsArray.filter((tx: any) => {
      // Search in description and transactionType
      const matchesSearch = searchTerm === '' || 
        tx.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.transactionType?.toLowerCase().includes(searchTerm.toLowerCase());

      // Filter by module
      const matchesModule = moduleFilter === 'ALL' || 
        tx.module === moduleFilter;
        
      return matchesSearch && matchesModule;
    });
  }, [transactions, searchTerm, moduleFilter]);

  // Handle page change
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Function to format currency
  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(numAmount);
  };
  
  // Function to format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  // Function to render transaction type icon/chip
  const renderTypeChip = (type: string | undefined, baseType: string | undefined) => {
    if (!type) {
      return (
        <Chip
          icon={<SwapHoriz />}
          label="Unknown"
          size="small"
          color="default"
          variant="outlined"
        />
      );
    }
    
    // Handle different transaction types
    switch (type) {
      case TransactionType.SAVINGS_DEPOSIT:
        return (
          <Chip
            icon={<ArrowUpward />}
            label="Savings Deposit"
            size="small"
            color="success"
            variant="outlined"
          />
        );
      case TransactionType.SAVINGS_WITHDRAWAL:
        return (
          <Chip
            icon={<ArrowDownward />}
            label="Withdrawal"
            size="small"
            color="error"
            variant="outlined"
          />
        );
      case TransactionType.SHARES_PURCHASE:
        return (
          <Chip
            icon={<ArrowUpward />}
            label="Shares Purchase"
            size="small"
            color="info"
            variant="outlined"
          />
        );
      default:
        // For other types, determine if it's credit or debit
        const isCredit = baseType === 'CREDIT';
        return (
          <Chip
            icon={isCredit ? <ArrowUpward /> : <ArrowDownward />}
            label={type.replace(/_/g, ' ')}
            size="small"
            color={isCredit ? "success" : "error"}
            variant="outlined"
          />
        );
    }
  };

  // Function to render status chip
  const renderStatusChip = (status: string | undefined) => {
    if (!status) {
      return <Chip label="Unknown" size="small" />;
    }
    
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return <Chip label="Completed" size="small" color="success" />;
      case 'PENDING':
        return <Chip label="Pending" size="small" color="warning" />;
      case 'FAILED':
        return <Chip label="Failed" size="small" color="error" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2 }}>
      {/* Filters */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <TextField
          placeholder="Search transactions..."
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ width: { xs: '100%', sm: 240 } }}
        />

        <Stack direction="row" spacing={2}>
          <FormControl sx={{ minWidth: 120 }} size="small">
            <InputLabel>Module</InputLabel>
            <Select
              value={moduleFilter}
              label="Module"
              onChange={(e) => setModuleFilter(e.target.value)}
            >
              <MenuItem value="ALL">All</MenuItem>
              <MenuItem value={TransactionModule.SAVINGS}>Savings</MenuItem>
              <MenuItem value={TransactionModule.SHARES}>Shares</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            size="small"
            startIcon={<FileDownload />}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Export
          </Button>
        </Stack>
      </Box>

      {/* Transactions Table */}
      <TableContainer>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell align="center">Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              // Loading skeleton
              Array.from(new Array(5)).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton width={100} /></TableCell>
                  <TableCell><Skeleton width={80} /></TableCell>
                  <TableCell><Skeleton width={120} /></TableCell>
                  <TableCell align="right"><Skeleton width={70} /></TableCell>
                  <TableCell align="center"><Skeleton width={80} /></TableCell>
                </TableRow>
              ))
            ) : filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    No transactions found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((transaction: any) => (
                <TableRow key={transaction.id}>
                  <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                  <TableCell>{renderTypeChip(transaction.transactionType, transaction.baseType)}</TableCell>
                  <TableCell>{transaction.description || '-'}</TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <Typography 
                        sx={{ 
                          color: transaction.baseType === 'CREDIT'
                            ? theme.palette.success.main 
                            : theme.palette.error.main,
                          fontWeight: 500
                        }}
                      >
                        {transaction.baseType === 'CREDIT' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: theme.palette.text.secondary,
                          textTransform: 'capitalize',
                          fontSize: '0.7rem'
                        }}
                      >
                        {transaction.baseType?.toLowerCase() || 'unknown'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    {renderStatusChip(transaction.status)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {!limit && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalCount} // Use API-provided count
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      )}
    </Paper>
  );
};

export default TransactionHistory;
