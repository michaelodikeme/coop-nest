"use client";

import { useState, useEffect, useMemo } from 'react';
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
  Tabs,
  Tab,
} from '@mui/material';
import { 
  BarChart, 
  InsertDriveFile, 
  FilterList,
  AccountBalance as AccountBalanceIcon,
  MonetizationOn as MonetizationOnIcon,
  ShowChart as ShowChartIcon,
} from '@mui/icons-material';
import { transactionService } from '@/lib/api/services/transactionService';
import TransactionTable from '@/components/features/member/transactions/TransactionTable';
import FilterDrawer from '@/components/features/member/transactions/FilterDrawer';
import DateRangeSelector from '@/components/molecules/DateRangeSelector';
import TransactionSummaryCard from '@/components/features/member/transactions/TransactionSummaryCard';
import TransactionActivityChart from '@/components/features/member/transactions/TransactionActivityChart';
import ModuleDistributionChart from '@/components/features/member/transactions/ModuleDistributionChart';
import { formatCurrency } from '@/utils/formatting/format';
import ExportDialog from '@/components/molecules/ExportDialog';
import { useQuery } from '@tanstack/react-query';
import { filterTransactions } from '@/utils/filtering/filterTransactions';

export default function TransactionsPage() {
  const theme = useTheme();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  
  // Filter state
  const [filters, setFilters] = useState({
    startDate: null as Date | null,
    endDate: null as Date | null,
    status: '',
    transactionType: '',
    module: '',
  });

  // Query for transactions
  const {
    data: transactionsData,
    isLoading: isLoadingTransactions,
    refetch: refetchTransactions,
  } = useQuery({
    queryKey: ['member-transactions', page, rowsPerPage, filters],
    queryFn: async () => {
      try {
        console.log('Fetching transactions with:', { page, rowsPerPage });
        // Call the member-accessible endpoint
        const response = await transactionService.getUserTransactions(
          undefined, // Current user
          page,
          rowsPerPage
        );
        
        console.log('API response:', response);
        
        // The response structure is already what we need - no restructuring required
        // Just apply client-side filtering if needed
        let filteredTransactions = response.data || [];
        
        if (filters.module || filters.transactionType || filters.status || filters.startDate || filters.endDate) {
          filteredTransactions = filteredTransactions.filter(tx => {
            // Module filter
            const matchesModule = !filters.module || tx.module === filters.module;
            
            // Transaction type filter
            const matchesType = !filters.transactionType || tx.transactionType === filters.transactionType;
            
            // Status filter
            const matchesStatus = !filters.status || tx.status === filters.status;
            
            // Date range filters
            let matchesDateRange = true;
            const txDate = new Date(tx.createdAt);
            
            if (filters.startDate) {
              matchesDateRange = matchesDateRange && txDate >= filters.startDate;
            }
            
            if (filters.endDate) {
              // Include full end day by setting time to 23:59:59
              const endDateTime = new Date(filters.endDate);
              endDateTime.setHours(23, 59, 59, 999);
              matchesDateRange = matchesDateRange && txDate <= endDateTime;
            }
            
            return matchesModule && matchesType && matchesStatus && matchesDateRange;
          });
        }
        
        return {
          data: filteredTransactions,
          pagination: response.pagination
        };
      } catch (error) {
        console.error("Error fetching transactions:", error);
        return { data: [], pagination: { page, limit: rowsPerPage, totalCount: 0, totalPages: 0 } };
      }
    },
  });

  // Calculate summary data
  const summaryData = useMemo(() => {
    const transactions = transactionsData?.data || [];
    
    const creditTotal = transactions
      .filter(tx => tx.baseType === 'CREDIT')
      .reduce((sum, tx) => sum + Number(tx.amount), 0);
      
    const debitTotal = transactions
      .filter(tx => tx.baseType === 'DEBIT')
      .reduce((sum, tx) => sum + Number(tx.amount), 0);
      
    return {
      creditTotal,
      debitTotal,
      netFlow: creditTotal - debitTotal
    };
  }, [transactionsData]);

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
      module: '',
    });
    setPage(1);
  };

  // Generate data for charts
  const getChartData = () => {
    if (!transactionsData?.data) return [];
    
    // Group by date
    const byDate = transactionsData.data.reduce((acc, tx) => {
      const date = new Date(tx.createdAt).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = {
          date,
          credit: 0,
          debit: 0
        };
      }
      
      if (tx.baseType === 'CREDIT') {
        acc[date].credit += Number(tx.amount);
      } else {
        acc[date].debit += Number(tx.amount);
      }
      
      return acc;
    }, {} as Record<string, { date: string; credit: number; debit: number }>);
    
    return Object.values(byDate);
  };
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  return (
    <Container maxWidth="xl" sx={{ pb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight={500}>
          Transactions
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View and analyze all your transaction history across the cooperative
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <TransactionSummaryCard
            title="Total Incoming"
            value={formatCurrency(summaryData.creditTotal)}
            icon={<AccountBalanceIcon />}
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
            title="Total Outgoing"
            value={formatCurrency(summaryData.debitTotal)}
            icon={<MonetizationOnIcon />}
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
            title="Net Flow"
            value={formatCurrency(summaryData.creditTotal - summaryData.debitTotal)}
            icon={<ShowChartIcon />}
            trend={{
              value: summaryData.creditTotal - summaryData.debitTotal > 0 ? 1 : -1,
              label: summaryData.creditTotal - summaryData.debitTotal > 0 ? 'Net Positive' : 'Net Negative'
            }}
            loading={isLoadingTransactions}
            color={summaryData.creditTotal - summaryData.debitTotal >= 0 ? theme.palette.success.main : theme.palette.error.main}
          />
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Paper 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 2, 
          boxShadow: 'none',
          border: `1px solid ${theme.palette.divider}`
        }}
      >
        <Box sx={{ mb: 2 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Activity Over Time" />
            <Tab label="Transaction Breakdown" />
          </Tabs>
        </Box>

        <Box sx={{ height: 300, mt: 4, mb: 2 }}>
          {activeTab === 0 && (
            <TransactionActivityChart data={getChartData()} isLoading={isLoadingTransactions} />
          )}
          {activeTab === 1 && (
            <ModuleDistributionChart data={transactionsData?.data || []} isLoading={isLoadingTransactions} />
          )}
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
          startDate: filters.startDate ? filters.startDate.toISOString() : '',
          endDate: filters.endDate ? filters.endDate.toISOString() : '',
          status: filters.status,
          transactionType: filters.transactionType,
          module: filters.module,
        }}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        showModuleFilter onApplyFilters={function (filters: any): void {
          throw new Error('Function not implemented.');
        } } filterOptions={{
          transactionTypes: [],
          statuses: []
        }}      />

      {/* Export Dialog */}
      <ExportDialog
        open={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        title="Export Transactions"
        entityType="transactions"
        filters={{
          startDate: filters.startDate?.toISOString(),
          endDate: filters.endDate?.toISOString(),
          status: filters.status,
          transactionType: filters.transactionType,
          module: filters.module,
        }}
      />
    </Container>
  );
}