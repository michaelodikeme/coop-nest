"use client";

import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  CircularProgress,
  Divider,
  Card,
  Stack,
  useTheme,
} from '@mui/material';
import { BarChart, Equalizer as EqualizerIcon, InsertDriveFile, FilterList } from '@mui/icons-material';
import { transactionService } from '@/lib/api/services/transactionService';
import TransactionTable from '@/components/features/member/transactions/TransactionTable';
import FilterDrawer from '@/components/features/member/transactions/FilterDrawer';
import DateRangeSelector from '@/components/molecules/DateRangeSelector';
import TransactionSummaryCard from '@/components/features/member/transactions/TransactionSummaryCard';
import { formatCurrency } from '@/utils/formatting/format';
import ExportDialog from '@/components/molecules/ExportDialog';
import { useQuery } from '@tanstack/react-query';
import { filterTransactions } from '@/utils/filtering/filterTransactions';

export default function SharesTransactionsPage() {
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
    queryKey: ['shares-transactions', page, rowsPerPage, filters],
    queryFn: async () => {
      // Fetch all user transactions and filter by module
      const response = await transactionService.getUserTransactions(
        undefined,
        page, 
        rowsPerPage
      );
      
      // Filter shares transactions
      const sharesTransactions = response.data.filter(tx => 
        tx.module === 'SHARES' || tx.relatedEntityType === 'SHARES'
      );
      
      const filteredData = filterTransactions(sharesTransactions, filters);

      return {
        data: filteredData,
        pagination: {
          page,
          limit: rowsPerPage,
          totalCount: response.pagination.totalCount,
          totalPages: Math.ceil(response.pagination.totalCount / rowsPerPage)
        }
      };
    },
  });

  // Calculate purchases and redemptions from filtered data
  const purchases = transactionsData?.data
    .filter(tx => tx.transactionType === 'SHARE_PURCHASE')
    .reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;

  const redemptions = transactionsData?.data
    .filter(tx => tx.transactionType === 'SHARE_REDEMPTION')
    .reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;
  
  // Handle filter changes from any component
  const handleFilterChange = (newFilters: {
    startDate?: Date | null;
    endDate?: Date | null;
    status?: string;
    transactionType?: string;
  }) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      ...newFilters
    }));
  };

  // Reset all filters to default values
  const handleResetFilters = () => {
    setFilters({
      startDate: null,
      endDate: null,
      status: '',
      transactionType: '',
    });
  };

  return (
    <Container maxWidth="xl" sx={{ pb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight={500}>
          Share Transactions
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View and analyze your share purchase and redemption history
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <TransactionSummaryCard
            title="Total Purchases"
            value={formatCurrency(purchases)}
            icon={<EqualizerIcon />}
            trend={{
              value: 0,
              label: ''
            }}
            loading={false}
            color={theme.palette.success.main}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <TransactionSummaryCard
            title="Total Redemptions"
            value={formatCurrency(redemptions)}
            icon={<EqualizerIcon />}
            trend={{
              value: 0,
              label: ''
            }}
            loading={false}
            color={theme.palette.error.main}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <TransactionSummaryCard
            title="Net Investment"
            value={formatCurrency(purchases - redemptions)}
            icon={<EqualizerIcon />}
            trend={{
              value: 0,
              label: ''
            }}
            loading={false}
            color={theme.palette.primary.main}
          />
        </Grid>
      </Grid>

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
                  transactionType: filters.transactionType,
              }}
              onFilterChange={handleFilterChange}
              onResetFilters={handleResetFilters}
              transactionTypes={['SHARE_PURCHASE', 'SHARE_REDEMPTION']} onApplyFilters={function (filters: any): void {
                  throw new Error('Function not implemented.');
              } } filterOptions={{
                  transactionTypes: [],
                  statuses: []
              }}      />

      {/* Export Dialog */}
      <ExportDialog
        open={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        title="Export Share Transactions"
        entityType="transactions"
        filters={{
          module: 'SHARES',
          startDate: filters.startDate?.toISOString(),
          endDate: filters.endDate?.toISOString(),
          status: filters.status,
          transactionType: filters.transactionType,
        }}
      />
    </Container>
  );
}