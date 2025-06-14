"use client";

import React, { useState, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  Grid, 
  Card, 
  CardContent, 
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  LinearProgress,
  Tooltip,
  alpha,
  useTheme
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { DataTable, DataTableColumn } from '@/components/organisms/DataTable';
import { Button } from '@/components/atoms/Button';
import PermissionGate from '@/components/atoms/PermissionGate';
import { Modal } from '@/components/molecules/Modal';
import { Module } from '@/types/permissions.types';
import { formatCurrency, formatDate } from '@/utils/formatting/format';
import { useRouter } from 'next/navigation';
import { Loan, LoanType, LoanStatus } from '@/types/loan.types';
import { 
  useAdminLoans, 
  useAdminLoanTypes, 
  useAdminLoansSummary,
  useEnhancedLoansSummary 
} from '@/lib/hooks/admin/useAdminFinancial';
import { useDateRange } from '@/lib/hooks/useDateRange';
import DateRangePicker from '@/components/molecules/DateRangePicker';

export default function AdminLoansPage() {
  const theme = useTheme();
  const router = useRouter();
  
  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LoanStatus | ''>('');
  const [loanTypeFilter, setLoanTypeFilter] = useState<string>('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  
  // Date range filter
  const { 
    dateRange, 
    setDateRange, 
    startDate, 
    endDate 
  } = useDateRange();
  
  // Define the filters object based on selected filters
  const filters = useMemo(() => ({
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(searchTerm ? { search: searchTerm } : {}),
    ...(loanTypeFilter ? { loanTypeId: loanTypeFilter } : {}),
    ...(startDate ? { startDate: startDate.toISOString().split('T')[0] } : {}),
    ...(endDate ? { endDate: endDate.toISOString().split('T')[0] } : {})
  }), [statusFilter, searchTerm, loanTypeFilter, startDate, endDate]);

  // Fetch loans and loan types using the hooks from useAdminFinancial
  const { data: loansData, isLoading, refetch } = useAdminLoans(currentPage, pageSize, filters);
  const { data: loanTypes, isLoading: isLoadingLoanTypes } = useAdminLoanTypes();
  const { data: loanSummary, isLoading: isLoadingSummary } = useAdminLoansSummary();
  const { data: enhancedSummary, isLoading: isLoadingEnhanced } = useEnhancedLoansSummary();

  // Log fetched data for debugging
  React.useEffect(() => {
    if (loansData) {
      console.log('Loans Data from AdminLoansPage:', loansData);
    }
    if (loanTypes) {
      console.log('Loan Types from AdminLoansPage:', loanTypes);
    }
    if (loanSummary) {
      console.log('Loan Summary from AdminLoansPage:', loanSummary);
    }
    if (enhancedSummary) {
      console.log('Enhanced Summary from AdminLoansPage:', enhancedSummary);
    }
  }, [loansData, loanTypes, loanSummary, enhancedSummary]);

  // Handle tab change
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    
    // Set status filter based on tab
    switch (newValue) {
      case 0: // All loans
        setStatusFilter('');
        break;
      case 1: // Pending approval loans
        setStatusFilter('PENDING' as LoanStatus);
        break;
      case 2: // Active and Disbursed loans
        setStatusFilter(['DISBURSED'] as any);
        break;
      case 3: // In process loans (IN_REVIEW, REVIEWED, APPROVED)
        setStatusFilter(['IN_REVIEW'] as any);
        break;
      case 4: // Completed loans
        setStatusFilter('COMPLETED' as LoanStatus);
        break;
      default:
        setStatusFilter('');
    }
  };

  // Reset filters
  const handleResetFilters = () => {
    setStatusFilter('');
    setLoanTypeFilter('');
    setSearchTerm('');
    setDateRange([null, null]);
    setActiveTab(0);
    setIsFilterModalOpen(false);
  };

  // Apply filters
  const handleApplyFilters = () => {
    setIsFilterModalOpen(false);
    refetch();
  };

  // Get color and label for loan status chips
  const getStatusChip = (status: LoanStatus) => {
    const statusConfig: Record<string, { color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning', label: string }> = {
      PENDING: { color: 'warning', label: 'Pending' },
      IN_REVIEW: { color: 'info', label: 'In Review' },
      REVIEWED: { color: 'secondary', label: 'Reviewed' },
      APPROVED: { color: 'success', label: 'Approved' },
      REJECTED: { color: 'error', label: 'Rejected' },
      DISBURSED: { color: 'primary', label: 'Disbursed' },
      ACTIVE: { color: 'primary', label: 'Active' },
      COMPLETED: { color: 'default', label: 'Completed' },
      DEFAULTED: { color: 'error', label: 'Defaulted' },
      CANCELLED: { color: 'default', label: 'Cancelled' },
    };
    
    return statusConfig[status] || { color: 'default', label: status };
  };

  // Define columns for DataTable
  const loansColumns: DataTableColumn<Loan>[] = [
    {
      id: 'id',
      label: 'Loan ID',
      accessor: 'id',
      Cell: ({ value }) => (
        <Typography variant="body2" fontFamily="monospace">
          {value.substring(0, 8)}
        </Typography>
      ),
      filterable: true,
    },
    {
      id: 'member',
      label: 'Member',
      accessor: (row) => row.member?.fullName || '',
      Cell: ({ row }) => (
        <Box>
          <Typography variant="body2">{row.original.member?.fullName || 'N/A'}</Typography>
          <Typography variant="caption" color="text.secondary">
            {row.original.member?.erpId || ''}
          </Typography>
        </Box>
      ),
      filterable: true,
    },
    {
      id: 'loanType',
      label: 'Loan Type',
      accessor: (row) => row.loanType?.name || '',
      filterable: true,
    },
    {
      id: 'amount',
      label: 'Amount',
      accessor: 'principalAmount',
      Cell: ({ value }) => formatCurrency(Number(value)),
      filterable: false,
    },
    {
      id: 'status',
      label: 'Status',
      accessor: 'status',
      Cell: ({ value }) => {
        const { color, label } = getStatusChip(value as LoanStatus);
        return (
          <Chip
            label={label}
            color={color}
            size="small"
            sx={{ minWidth: 85, fontWeight: 500 }}
          />
        );
      },
      filterable: true,
    },
    {
      id: 'progress',
      label: 'Progress',
      accessor: (row) => {
        const total = Number(row.totalAmount);
        const paid = Number(row.paidAmount);
        return total > 0 ? Math.round((paid / total) * 100) : 0;
      },
      Cell: ({ value }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
          <Box sx={{ width: '100%' }}>
            <LinearProgress
              variant="determinate"
              value={value}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
          <Box sx={{ minWidth: 35, textAlign: 'right' }}>
            <Typography variant="body2" color="text.secondary">{value}%</Typography>
          </Box>
        </Box>
      ),
      filterable: false,
    },
    {
      id: 'createdAt',
      label: 'Created',
      accessor: 'createdAt',
      Cell: ({ value }) => formatDate(value),
      filterable: false,
    },
    {
      id: 'actions',
      label: 'Actions',
      accessor: 'id',
      Cell: ({ row }) => (
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
          <PermissionGate permissions={['VIEW_LOANS']} module={Module.LOAN}>
            <Tooltip title="View Details">
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/admin/financial/loans/${row.original.id}`);
                }}
                sx={{ 
                  color: theme.palette.primary.main,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.1)
                  }
                }}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </PermissionGate>
        </Box>
      ),
      filterable: false,
    },
  ];

  // Calculate loan statistics for summary cards
  const loanStats = useMemo(() => ({
    totalLoans: loansData?.data?.meta?.totalCount || 0,
    totalDisbursed: loanSummary?.data?.totalDisbursed || 0,
    totalOutstanding: loanSummary?.data?.totalOutstanding || 0,
    totalRepaid: enhancedSummary?.data?.totalRepaid || 0,
    pendingApproval: enhancedSummary?.data?.pendingLoans || 0,
    activeLoans: enhancedSummary?.data?.newLoansCount || 0
  }), [loansData, loanSummary, enhancedSummary]);

  return (
    <Box sx={{ maxWidth: '100%', pt: 2, pb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight={600}>
          Loan Management
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder="Search loans..."
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: 250 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          
          <Tooltip title="Apply filters">
            <IconButton onClick={() => setIsFilterModalOpen(true)}>
              <FilterListIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="subtitle2">
                Total Loans
              </Typography>
              <Typography variant="h5" component="div" fontWeight={600}>
                {isLoadingSummary ? '-' : loanStats.totalLoans}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                All time
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="subtitle2">
                Active Loans
              </Typography>
              <Typography variant="h5" component="div" fontWeight={600}>
                {isLoadingEnhanced ? '-' : loanStats.activeLoans}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Currently active
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="subtitle2">
                Pending Approval
              </Typography>
              <Typography variant="h5" component="div" fontWeight={600} color="warning.main">
                {isLoadingEnhanced ? '-' : loanStats.pendingApproval}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Awaiting review
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="subtitle2">
                Disbursed Amount
              </Typography>
              <Typography variant="h5" component="div" fontWeight={600}>
                {isLoadingSummary ? '-' : formatCurrency(loanStats.totalDisbursed)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Funds released
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="subtitle2">
                Outstanding
              </Typography>
              <Typography variant="h5" component="div" fontWeight={600} color="info.main">
                {isLoadingSummary ? '-' : formatCurrency(loanStats.totalOutstanding)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                To be collected
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="subtitle2">
                Total Repaid
              </Typography>
              <Typography variant="h5" component="div" fontWeight={600} color="success.main">
                {isLoadingEnhanced ? '-' : formatCurrency(loanStats.totalRepaid)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Collected amount
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs for loan filtering */}
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="loan status tabs"
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            '& .MuiTabs-indicator': {
              height: 3,
            } 
          }}
        >
          <Tab label="All Loans" />
          <Tab label="Pending" />
          <Tab label="Active" />
          <Tab label="In Process" />
          <Tab label="Completed" />
        </Tabs>
      </Paper>

      {/* Loans data table */}
      <Paper sx={{ p: 2 }}>
        {isLoading && (
          <LinearProgress 
            sx={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              height: 3, 
              zIndex: 1 
            }} 
          />
        )}
        
        <DataTable
          columns={loansColumns}
          data={loansData?.data.data || []}
          pagination={{
            pageIndex: currentPage - 1,
            pageSize: pageSize,
            pageCount: loansData?.data?.meta?.totalPages || 1,
            totalRecords: loansData?.data?.meta?.totalCount || 0,
          }}
          onPageChange={(newPage) => setCurrentPage(newPage + 1)}
          onPageSizeChange={setPageSize}
          loading={isLoading || isLoadingLoanTypes}
          enableFiltering={true}
          onRowClick={(row) => router.push(`/admin/financial/loans/${row.id}`)}
          noDataMessage={
            Object.keys(filters).length > 0 
              ? "No loans match your search criteria" 
              : "No loans available in the system"
          }
          headerBackgroundColor={alpha(theme.palette.primary.main, 0.03)}
        />
      </Paper>

      {/* Filter Modal */}
      <Modal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        title="Filter Loans"
        maxWidth="sm"
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 1 }}>
          <Box>
            <Typography variant="subtitle2" mb={1}>Loan Status</Typography>
            <TextField
              select
              fullWidth
              size="small"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as LoanStatus)}
              sx={{ minWidth: 200 }}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="REVIEWED">Reviewed</option>
              <option value="APPROVED">Approved</option>
              <option value="DISBURSED">Disbursed</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="DEFAULTED">Defaulted</option>
              <option value="CANCELLED">Cancelled</option>
            </TextField>
          </Box>

          <Box>
            <Typography variant="subtitle2" mb={1}>Loan Type</Typography>
            <TextField
              select
              fullWidth
              size="small"
              value={loanTypeFilter}
              onChange={(e) => setLoanTypeFilter(e.target.value)}
              sx={{ minWidth: 200 }}
            >
              <option value="">All Loan Types</option>
              {Array.isArray(loanTypes) ? loanTypes.map((type: LoanType) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              )) : null}
            </TextField>
          </Box>

          <Box>
            <Typography variant="subtitle2" mb={1}>Date Range</Typography>
            <DateRangePicker 
              value={dateRange} 
              onChange={setDateRange} 
              size="small"
            />
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
            <Button
              variant="text"
              onClick={handleResetFilters}
            >
              Reset
            </Button>
            <Button
              variant="contained"
              onClick={handleApplyFilters}
            >
              Apply Filters
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}