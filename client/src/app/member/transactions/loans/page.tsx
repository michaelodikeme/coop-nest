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
  Tabs,
  Tab,
} from '@mui/material';
import { 
  InsertDriveFile, 
  FilterList,
  AccountBalance as AccountBalanceIcon,
  Payment as PaymentIcon,
  CreditCard as CreditCardIcon,
} from '@mui/icons-material';
import { transactionService } from '@/lib/api/services/transactionService';
import TransactionTable from '@/components/features/member/transactions/TransactionTable';
import FilterDrawer from '@/components/features/member/transactions/FilterDrawer';
import DateRangeSelector from '@/components/molecules/DateRangeSelector';
import TransactionSummaryCard from '@/components/features/member/transactions/TransactionsSummaryChart';
import LoanActivityChart from '@/components/features/member/transactions/LoanActivityChart';
import { formatCurrency } from '@/utils/formatting/format';
import ExportDialog from '@/components/molecules/ExportDialog';
import { useQuery } from '@tanstack/react-query';
import { filterTransactions } from '@/utils/filtering/filterTransactions';

export default function LoanTransactionsPage() {
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
  });

  // Query for transactions
  const {
    data: transactionsData,
    isLoading: isLoadingTransactions,
  } = useQuery({
    queryKey: ['loan-transactions', page, rowsPerPage, filters],
    queryFn: async () => {
      try {
        console.log('Fetching loan transactions with:', { page, rowsPerPage });
        // Get all user transactions
        const response = await transactionService.getUserTransactions(
          undefined, 
          page, 
          rowsPerPage
        );
        
        console.log('API response:', response);
        
        // Filter for LOAN module transactions
        let loanTransactions = (response.data || []).filter(tx => 
          tx.module === 'LOAN' || tx.transactionType?.includes('LOAN_')
        );
        
        // Apply additional filters
        if (filters.transactionType || filters.status || filters.startDate || filters.endDate) {
          loanTransactions = loanTransactions.filter(tx => {
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
          data: loanTransactions,
          pagination: {
            ...response.pagination,
            totalCount: loanTransactions.length
          }
        };
      } catch (error) {
        console.error("Error fetching loan transactions:", error);
        return { data: [], pagination: { page, limit: rowsPerPage, totalCount: 0, totalPages: 0 } };
      }
    },
  });

  // Calculate disbursements and repayments from filtered data
  const disbursements = transactionsData?.data
    .filter(tx => tx.transactionType === 'LOAN_DISBURSEMENT')
    .reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;

  const repayments = transactionsData?.data
    .filter(tx => tx.transactionType === 'LOAN_REPAYMENT')
    .reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;

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

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Generate data for charts
  const getChartData = () => {
    if (!transactionsData?.data) return [];
    
    // Group by month for better visualization
    const byMonth = transactionsData.data.reduce((acc, tx) => {
      const date = new Date(tx.createdAt);
      const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      
      if (!acc[monthYear]) {
        acc[monthYear] = {
          date: monthYear,
          disbursement: 0,
          repayment: 0
        };
      }
      
      if (tx.transactionType === 'LOAN_DISBURSEMENT') {
        acc[monthYear].disbursement += Number(tx.amount);
      } else if (tx.transactionType === 'LOAN_REPAYMENT') {
        acc[monthYear].repayment += Number(tx.amount);
      }
      
      return acc;
    }, {} as Record<string, { date: string; disbursement: number; repayment: number }>);
    
    return Object.values(byMonth);
  };
  
  return (
    <Container maxWidth="xl" sx={{ pb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight={500}>
          Loan Transactions
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View and analyze your loan activity and repayment history
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <TransactionSummaryCard
            title="Total Disbursements"
            value={formatCurrency(disbursements)}
            icon={<CreditCardIcon />}
            trend={{
              value: 0,
              label: ''
            }}
            loading={isLoadingTransactions}
            color={theme.palette.info.main}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <TransactionSummaryCard
            title="Total Repayments"
            value={formatCurrency(repayments)}
            icon={<PaymentIcon />}
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
            title="Outstanding Balance"
            value={formatCurrency(disbursements - repayments)}
            icon={<AccountBalanceIcon />}
            trend={{
              value: 0,
              label: ''
            }}
            loading={isLoadingTransactions}
            color={theme.palette.warning.main}
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
          Loan Activity
        </Typography>
        
        <Box sx={{ height: 300, mt: 4, mb: 2 }}>
          <LoanActivityChart data={getChartData()} isLoading={isLoadingTransactions} />
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
            Loan Transaction History
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
                  transactionType: filters.transactionType
              }}
              onFilterChange={handleFilterChange}
              onResetFilters={handleResetFilters}
              transactionTypes={['LOAN_DISBURSEMENT', 'LOAN_REPAYMENT']} onApplyFilters={function (filters: any): void {
                  throw new Error('Function not implemented.');
              } } filterOptions={{
                  transactionTypes: [],
                  statuses: []
              }}      />

      {/* Export Dialog */}
      <ExportDialog
        open={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        title="Export Loan Transactions"
        entityType="transactions"
        filters={{
          module: 'LOAN',
          startDate: filters.startDate?.toISOString(),
          endDate: filters.endDate?.toISOString(),
          status: filters.status,
          transactionType: filters.transactionType,
        }}
      />
    </Container>
  );
}