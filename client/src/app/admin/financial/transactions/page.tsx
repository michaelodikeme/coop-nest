"use client";

import { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  Chip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button as MuiButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import { DataTable, DataTableColumn } from '@/components/organisms/DataTable';
import { Button } from '@/components/atoms/Button';
import PermissionGate from '@/components/atoms/PermissionGate';
import { Module } from '@/types/permissions.types';
import { formatCurrency } from '@/utils/formatting/format';
import { 
  useTransactions, 
  useTransactionStats, 
  useUpdateTransactionStatus 
} from '@/lib/hooks/admin/useAdminTransactions';
import { TransactionRecord, TransactionType, TransactionStatus } from '@/types/transaction.types';
import { TransactionDetailsModal } from '@/components/features/admin/transaction';

export default function AdminTransactionsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionType | ''>('');
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | ''>('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionRecord | null>(null);
  
  // Define filters object based on state
  const filters = {
    ...(searchTerm ? { search: searchTerm } : {}),
    ...(typeFilter ? { transactionType: typeFilter as TransactionType } : {}),
    ...(statusFilter ? { status: statusFilter as TransactionStatus } : {}),
    ...(dateRange.start ? { startDate: dateRange.start } : {}),
    ...(dateRange.end ? { endDate: dateRange.end } : {}),
    page: currentPage,
    limit: pageSize
  };
  
  // Fetch transactions and stats using our custom hooks
  const { data: transactionData, isLoading, error, refetch } = useTransactions(filters);
  const { data: transactionStats, isLoading: isLoadingStats } = useTransactionStats();
  const updateTransactionStatus = useUpdateTransactionStatus();

  const handleApproveTransaction = (id: string) => {
    updateTransactionStatus.mutate({
      id,
      status: 'COMPLETED',
      notes: 'Approved by admin'
    }, {
      onSuccess: () => {
        setSelectedTransaction(null);
        refetch();
      }
    });
  };

  const transactionColumns: DataTableColumn<TransactionRecord>[] = [
    {
      id: 'reference',
      label: 'Reference',
      accessor: (row) => row.reference || row.id.substring(0, 8),
      filterable: true,
    },
    {
      id: 'baseType',
      label: 'Debit/Credit',
      accessor: (row) => row.baseType || 'N/A',
      filterable: true,
    },
    {
      id: 'transactionType',
      label: 'Type',
      accessor: 'transactionType',
      Cell: ({ value }) => (
        <Chip 
          label={value} 
          color={
            value?.includes('DEPOSIT') ? 'success' :
            value?.includes('WITHDRAWAL') ? 'warning' :
            value?.includes('LOAN') ? 'info' :
            'default'
          }
          size="small"
        />
      ),
      filterable: true,
    },
    {
      id: 'amount',
      label: 'Amount',
      accessor: 'amount',
      Cell: ({ value }) => formatCurrency(value),
      filterable: false,
    },
    {
      id: 'status',
      label: 'Status',
      accessor: 'status',
      Cell: ({ value }) => (
        <Chip 
          label={value} 
          color={
            value === 'COMPLETED' ? 'success' :
            value === 'PENDING' ? 'warning' :
            value === 'FAILED' ? 'error' :
            'default'
          }
          size="small"
        />
      ),
      filterable: true,
    },
    {
      id: 'createdAt',
      label: 'Date',
      accessor: 'createdAt',
      Cell: ({ value }) => new Date(value).toLocaleDateString(),
      filterable: true,
    },
    {
      id: 'actions',
      label: 'Actions',
      accessor: 'id',
      Cell: ({ row }) => (
        <PermissionGate permissions={['VIEW_TRANSACTIONS']} module={Module.TRANSACTION}>
          <Button 
            size="small" 
            variant="outlined"
            onClick={() => setSelectedTransaction(row.original)}
          >
            View
          </Button>
        </PermissionGate>
      ),
      filterable: false,
    },
  ];

  // Calculate transaction statistics
  const stats = {
    totalTransactions: transactionStats?.totalCount || 0,
    totalAmount: transactionStats?.totalAmount || 0,
    totalDeposits: transactionStats?.totalDeposits || 0,
    totalWithdrawals: transactionStats?.totalWithdrawals || 0,
    totalSavingsDeposits: transactionStats?.totalSavingsDeposits || 0,
    totalSavingsWithdrawals: transactionStats?.totalSavingsWithdrawals || 0,
    totalSharesDeposits: transactionStats?.totolSharesDeposits || 0,
    totalLoanRepayments: transactionStats?.totalLoanRepayments || 0,
    totalLoanDisbursements: transactionStats?.totalLoanDisbursements || 0,
  };

  return (
    <Box sx={{ maxWidth: '100%', pt: 2, pb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight={600}>
          Transaction Management
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <MuiButton 
            startIcon={<RefreshIcon />}
            variant="outlined"
            onClick={() => refetch()}
          >
            Refresh
          </MuiButton>
          
          <PermissionGate permissions={['EXPORT_TRANSACTIONS']} module={Module.TRANSACTION}>
            <MuiButton 
              startIcon={<DownloadIcon />}
              variant="outlined"
              onClick={() => {/* Implement export functionality */}}
            >
              Export
            </MuiButton>
          </PermissionGate>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Transactions
              </Typography>
              <Typography variant="h5" component="div" fontWeight={600}>
                {isLoadingStats ? 'Loading...' : stats.totalTransactions}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Gross Total Amount
              </Typography>
              <Typography variant="h5" component="div" fontWeight={600}>
                {isLoadingStats ? 'Loading...' : formatCurrency(stats.totalAmount)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Deposits
              </Typography>
              <Typography variant="h5" component="div" fontWeight={600}>
                {isLoadingStats ? 'Loading...' : formatCurrency(stats.totalDeposits)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Withdrawals
              </Typography>
              <Typography variant="h5" component="div" fontWeight={600}>
                {isLoadingStats ? 'Loading...' : formatCurrency(stats.totalWithdrawals)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Loan Disbursements
              </Typography>
              <Typography variant="h5" component="div" fontWeight={600}>
                {isLoadingStats ? 'Loading...' : formatCurrency(stats.totalLoanDisbursements)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Loan Repayments
              </Typography>
              <Typography variant="h5" component="div" fontWeight={600}>
                {isLoadingStats ? 'Loading...' : formatCurrency(stats.totalLoanRepayments)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Savings Deposits
              </Typography>
              <Typography variant="h5" component="div" fontWeight={600}>
                {isLoadingStats ? 'Loading...' : formatCurrency(stats.totalSavingsDeposits)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Shares
              </Typography>
              <Typography variant="h5" component="div" fontWeight={600}>
                {isLoadingStats ? 'Loading...' : formatCurrency(stats.totalSharesDeposits)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              label="Search"
              variant="outlined"
              size="small"
              fullWidth
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid size={{ xs: 12, sm: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select
                value={typeFilter}
                label="Type"
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="SAVINGS_DEPOSIT">Deposits</MenuItem>
                <MenuItem value="SAVINGS_WITHDRAWAL">Withdrawals</MenuItem>
                <MenuItem value="LOAN_REPAYMENT">Loan Repayments</MenuItem>
                <MenuItem value="LOAN_DISBURSEMENT">Loan Disbursements</MenuItem>
                <MenuItem value="SHARES_PURCHASE">Share Purchases</MenuItem>
                <MenuItem value="FEE">Fees</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="FAILED">Failed</MenuItem>
                <MenuItem value="REVERSED">Reversed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 2 }}>
            <TextField
              label="Start Date"
              type="date"
              size="small"
              fullWidth
              InputLabelProps={{
                shrink: true,
              }}
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            />
          </Grid>
          
          <Grid size={{ xs: 12, sm: 2 }}>
            <TextField
              label="End Date"
              type="date"
              size="small"
              fullWidth
              InputLabelProps={{
                shrink: true,
              }}
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            />
          </Grid>
          
          <Grid size={{ xs: 12, sm: 1 }}>
            <Button 
              variant="outlined" 
              fullWidth
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('');
                setStatusFilter('');
                setDateRange({ start: '', end: '' });
              }}
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Transactions Table */}
      <Paper sx={{ p: 2 }}>
        <DataTable
          columns={transactionColumns}
          data={transactionData?.data || []}
          pagination={{
            pageIndex: currentPage - 1, // Convert from 1-based to 0-based indexing
            pageSize: pageSize,
            pageCount: transactionData?.meta?.totalPages || 1,
            totalRecords: transactionData?.meta?.totalCount || 0,
          }}
          onPageChange={(newPage) => {
            console.log(`Navigation to page ${newPage + 1}`);
            setCurrentPage(newPage + 1); // Convert back to 1-based for API
          }}
          onPageSizeChange={(newSize) => {
            console.log(`Changed page size to ${newSize}`);
            setPageSize(newSize);
            setCurrentPage(1); // Reset to first page when changing page size
          }}
          loading={isLoading}
          enableFiltering={true}
        />
      </Paper>

      {/* Use the new modular TransactionDetailsModal component */}
      <TransactionDetailsModal
        transaction={selectedTransaction}
        isOpen={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        onApprove={handleApproveTransaction}
        isApproving={updateTransactionStatus.isPending}
      />
    </Box>
  );
}