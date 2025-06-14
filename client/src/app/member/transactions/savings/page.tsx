"use client";

import { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  Stack,
  useTheme,
} from '@mui/material';
import { 
  InsertDriveFile, 
  FilterList,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material';
import { transactionService } from '@/lib/api/services/transactionService';
import TransactionTable from '@/components/features/member/transactions/TransactionTable';
import FilterDrawer from '@/components/features/member/transactions/FilterDrawer';
import DateRangeSelector from '@/components/molecules/DateRangeSelector';
import TransactionSummaryCard from '@/components/features/member/transactions/TransactionSummaryCard';
import SavingsActivityChart from '@/components/features/member/transactions/SavingsActivityChart';
import { formatCurrency } from '@/utils/formatting/format';
import ExportDialog from '@/components/molecules/ExportDialog';
import { useQuery } from '@tanstack/react-query';
import { filterTransactions } from '@/utils/filtering/filterTransactions';

export default function SavingsTransactionsPage() {
  const theme = useTheme();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState({
    startDate: null as Date | null,
    endDate: null as Date | null,
    status: '',
    transactionType: '',
  });

  // Query for transactions
  const {
    data: transactionsData,
    isLoading: isLoadingTransactions,
  } = useQuery({
    queryKey: ['savings-transactions', page, rowsPerPage, filters],
    queryFn: async () => {
      try {
        console.log('Fetching savings transactions with:', { page, rowsPerPage });
        // Get all user transactions
        const response = await transactionService.getUserTransactions(
          undefined, 
          page, 
          rowsPerPage
        );
        
        console.log('API response:', response);
        
        // Filter for SAVINGS module transactions
        let savingsTransactions = (response.data || []).filter(tx => 
          tx.module === 'SAVINGS' || tx.metadata?.savingsId
        );
        
        // Apply additional filters
        if (filters.transactionType || filters.status || filters.startDate || filters.endDate) {
          savingsTransactions = savingsTransactions.filter(tx => {
            const matchesType = !filters.transactionType || tx.transactionType === filters.transactionType;
            const matchesStatus = !filters.status || tx.status === filters.status;
            
            let matchesDateRange = true;
            const txDate = new Date(tx.createdAt);
            
            if (filters.startDate) {
              matchesDateRange = matchesDateRange && txDate >= filters.startDate;
            }
            
            if (filters.endDate) {
              const endDateTime = new Date(filters.endDate);
              endDateTime.setHours(23, 59, 59, 999);
              matchesDateRange = matchesDateRange && txDate <= endDateTime;
            }
            
            return matchesType && matchesStatus && matchesDateRange;
          });
        }
        
        return {
          data: savingsTransactions,
          pagination: {
            ...response.pagination,
            totalCount: savingsTransactions.length
          }
        };
      } catch (error) {
        console.error("Error fetching savings transactions:", error);
        return { data: [], pagination: { page, limit: rowsPerPage, totalCount: 0, totalPages: 0 } };
      }
    },
  });

  // Handle filter changes
  const handleFilterChange = (newFilters: any) => {
    setFilters({
      ...filters,
      ...newFilters,
    });
    setPage(1); // Reset to first page when filters change
  };

  // Handle filter reset
  const handleResetFilters = () => {
    setFilters({
      startDate: null,
      endDate: null,
      status: '',
      transactionType: '',
    });
    setPage(1);
  };

  // Calculate deposit and withdrawal totals
  const deposits = transactionsData?.data
    .filter(tx => tx.transactionType === 'DEPOSIT')
    .reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;

  const withdrawals = transactionsData?.data
    .filter(tx => tx.transactionType === 'WITHDRAWAL')
    .reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;

  // Generate data for charts
  const chartData = isLoadingTransactions ? [] : (transactionsData?.data || []).map(tx => ({
    date: new Date(tx.createdAt).toLocaleDateString(),
    amount: Number(tx.amount),
    type: tx.baseType === 'CREDIT' ? 'deposit' as const : 'withdrawal' as const
  }));
  
  return (
    <Container maxWidth="xl" sx={{ pb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight={500}>
          Savings Transactions
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View and analyze your savings account activity
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <TransactionSummaryCard
            title="Total Deposits"
            value={formatCurrency(deposits)}
            icon={<TrendingUpIcon />}
            trend={{
              value: 0,
              label: ''
            }}
            loading={isLoadingTransactions}
            color={theme.palette.success.main}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <TransactionSummaryCard
            title="Total Withdrawals"
            value={formatCurrency(withdrawals)}
            icon={<TrendingDownIcon />}
            trend={{
              value: 0,
              label: ''
            }}
            loading={isLoadingTransactions}
            color={theme.palette.error.main}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <TransactionSummaryCard
            title="Net Savings"
            value={formatCurrency(deposits - withdrawals)}
            icon={<AccountBalanceIcon />}
            trend={{
              value: 0,
              label: ''
            }}
            loading={isLoadingTransactions}
            color={theme.palette.primary.main}
          />
        </Grid>
      </Grid>

      {/* Chart Section */}
      <Paper 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 2, 
          boxShadow: 'none',
          border: `1px solid ${theme.palette.divider}`
        }}
      >
        <Typography variant="h6" gutterBottom>
          Savings Activity
        </Typography>
        
        <Box sx={{ height: 300, mt: 4, mb: 2 }}>
          <SavingsActivityChart data={chartData} isLoading={isLoadingTransactions} />
        </Box>
      </Paper>

      {/* Filters and Actions */}
      <Paper 
        sx={{ 
          p: 2, 
          mb: 4, 
          borderRadius: 2, 
          boxShadow: 'none',
          border: `1px solid ${theme.palette.divider}`
        }}
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ mb: { xs: 2, sm: 0 } }}>
            Transaction History
          </Typography>
          
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => setIsFilterDrawerOpen(true)}
              size="small"
            >
              Filter
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<InsertDriveFile />}
              onClick={() => setIsExportDialogOpen(true)}
              size="small"
            >
              Export
            </Button>
          </Stack>
        </Box>
        
        <DateRangeSelector 
          startDate={filters.startDate}
          endDate={filters.endDate}
          onDateChange={(startDate, endDate) => handleFilterChange({ startDate, endDate })}
          onReset={handleResetFilters}
        />
      </Paper>

      {/* Transactions Table */}
      <TransactionTable
        transactions={transactionsData?.data || []}
        pagination={transactionsData?.pagination}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
        isLoading={isLoadingTransactions}
      />

      {/* Filter Drawer */}
      <FilterDrawer 
        open={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={{
          startDate: filters.startDate?.toISOString() || '',
          endDate: filters.endDate?.toISOString() || '',
          status: filters.status,
          transactionType: filters.transactionType
        }}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        transactionTypes={['DEPOSIT', 'WITHDRAWAL']}
        onApplyFilters={handleFilterChange}
        filterOptions={{
          statuses: [
            { value: 'COMPLETED', label: 'Completed' },
            { value: 'PENDING', label: 'Pending' },
            { value: 'FAILED', label: 'Failed' }
          ],
          transactionTypes: [
            { value: 'DEPOSIT', label: 'Deposit' },
            { value: 'WITHDRAWAL', label: 'Withdrawal' }
          ]
        }}
      />

      {/* Export Dialog */}
      <ExportDialog
        open={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        title="Export Savings Transactions"
        entityType="transactions"
        filters={{
          module: 'SAVINGS',
          startDate: filters.startDate?.toISOString(),
          endDate: filters.endDate?.toISOString(),
          status: filters.status,
          transactionType: filters.transactionType,
        }}
      />
    </Container>
  );
}