"use client";

import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { 
  Box, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  Grid, 
  Card, 
  CardContent, 
  Alert, 
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  Divider,
  Button as MuiButton,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { DataTable, DataTableColumn } from '@/components/organisms/DataTable';
import { Button } from '@/components/atoms/Button';
import PermissionGate from '@/components/atoms/PermissionGate';
import { Modal } from '@/components/molecules/Modal';
import { useToast } from '@/components/molecules/Toast';
import { Module } from '@/types/permissions.types';
import { formatCurrency, formatDate } from '@/utils/formatting/format';
import { 
  useAdminSavings,
  useAdminMonthlySavings,
  useAdminSavingsSummary,
  useAdminSavingsUpload,
  useAdminWithdrawalRequests,
  useProcessWithdrawal,
  useWithdrawalStatistics,
  useMembersSavingsSummary // Import the new hook
} from '@/lib/hooks/admin/useAdminFinancial';
import SearchIcon from '@mui/icons-material/Search';
import { useRouter } from 'next/navigation';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import DownloadIcon from '@mui/icons-material/Download';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { RequestStatus } from '@/types/request.types';

export default function AdminSavingsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const router = useRouter();

  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [activeTab, setActiveTab] = useState(0);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [withdrawalStatusFilter, setWithdrawalStatusFilter] = useState<string>('PENDING');
  const [withdrawalCurrentPage, setWithdrawalCurrentPage] = useState(1);
  const [withdrawalPageSize, setWithdrawalPageSize] = useState(10);
  const [isViewWithdrawalModalOpen, setIsViewWithdrawalModalOpen] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);
  const [withdrawalActionNotes, setWithdrawalActionNotes] = useState('');
  const [withdrawalAction, setWithdrawalAction] = useState<'APPROVED' | 'REJECTED' | 'PROCESSING' | ''>('');
  const [sortBy, setSortBy] = useState<string>('lastDeposit');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [monthlySavingsPage, setMonthlySavingsPage] = useState(0);
  const [monthlySavingsPageSize, setMonthlySavingsPageSize] = useState(50);
  
  // Create search/filter object
  const filters = {
    ...(searchTerm ? { search: searchTerm } : {}),
  };
  
  const withdrawalFilters = {
    status: withdrawalStatusFilter || undefined,
    ...(searchTerm ? { search: searchTerm } : {})
  };
  
  // Create filters object for member summary
  const memberFilters = {
    search: searchTerm,
    sortBy,
    sortOrder,
    status: withdrawalStatusFilter 
  };
  
  // Fetch data using custom hooks
  const { data: allSavings, isLoading, error } = useAdminSavings(currentPage, pageSize, filters);
  const { data: monthlySavings, isLoading: isLoadingMonthly } = useAdminMonthlySavings(
    filterYear, 
    filterMonth,
    monthlySavingsPage,
    monthlySavingsPageSize
  );
  const { data: savingsSummaryData, isLoading: isLoadingSummary } = useAdminSavingsSummary();
  const savingsUploadMutation = useAdminSavingsUpload();
  const { data: withdrawalRequests, isLoading: isLoadingWithdrawals } = useAdminWithdrawalRequests(
    withdrawalCurrentPage, 
    withdrawalPageSize, 
    withdrawalFilters
  );
  const withdrawalProcessMutation = useProcessWithdrawal();
  const { data: withdrawalStats, isLoading: isLoadingStats } = useWithdrawalStatistics();
  const { 
    data: memberSummary, 
    isLoading: isLoadingMemberSummary, 
    error: memberSummaryError 
  } = useMembersSavingsSummary(currentPage, pageSize, memberFilters);
  
  // Handle tab changes
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setSearchTerm(''); // Reset search when changing tabs
    
    if (newValue === 2) {
      // If switching to withdrawals tab, set default filter
      setWithdrawalStatusFilter('PENDING');
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawal-requests'] });
    } else {
      setWithdrawalStatusFilter('');
    }
  };
  
  // Handle file upload with proper error handling
  const handleFileUpload = async (file: File) => {
    try {
      toast.info('Uploading savings data...');
      await savingsUploadMutation.mutateAsync(file);
      toast.success('Savings data uploaded successfully');
      setIsUploadModalOpen(false);
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload savings data. Please check file format and try again.');
    }
  };
  
  // 1. All Savings table columns are now defined in memberSavingsColumns
  const memberSavingsColumns: DataTableColumn<any>[] = [
    {
      id: 'member',
      label: 'Member',
      accessor: (row) => row.memberName || '',
      Cell: ({ row }) => (
        <Box>
          <Typography variant="body2" fontWeight={500}>
            {row.original.memberName || 'N/A'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.original.erpId || ''}
          </Typography>
        </Box>
      ),
      filterable: true,
    },
    {
      id: 'department',
      label: 'Department',
      accessor: (row) => row.department || '',
      filterable: true,
    },
    {
      id: 'totalSavings',
      label: 'Total Savings',
      accessor: (row) => row.totalSavingsAmount || 0,
      Cell: ({ value }) => formatCurrency(Number(value)),
      filterable: false,
    },
    {
      id: 'totalShares',
      label: 'Total Shares',
      accessor: (row) => row.totalSharesAmount || 0,
      Cell: ({ value }) => formatCurrency(Number(value)),
      filterable: false,
    },
    {
      id: 'totalGross',
      label: 'Total Amount',
      accessor: (row) => row.totalGrossAmount || 0,
      Cell: ({ value }) => formatCurrency(Number(value)),
      filterable: false,
    },
    {
      id: 'lastDeposit',
      label: 'Last Contribution',
      accessor: (row) => row.lastDeposit,
      Cell: ({ value }) => formatDate(value),
      filterable: false,
    },
    {
      id: 'actions',
      label: 'Actions',
      accessor: 'id',
      Cell: ({ row }) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <PermissionGate permissions={['VIEW_SAVINGS']} module={Module.SAVINGS}>
            <Button 
              size="small" 
              variant="outlined"
              onClick={() => router.push(`/admin/members/${row.original.id}/financial`)}
            >
              Details
            </Button>
          </PermissionGate>
        </Box>
      ),
      filterable: false,
    },
  ];
  
  // 2. Monthly Savings table columns are now defined in monthlySavingsColumns
  const monthlySavingsColumns: DataTableColumn<any>[] = [
    {
      id: 'erpId',
      label: 'ERP ID',
      accessor: (row) => row.erpId || '',
      filterable: true,
    },
    {
      id: 'member',
      label: 'Member',
      accessor: (row) => row.biodata?.fullName || '',
      Cell: ({ row }) => (
        <Box>
          <Typography variant="body2">
            {row.original.biodata?.fullName || 'N/A'}
          </Typography>
        </Box>
      ),
      filterable: true,
    },
    {
      id: 'savings',
      label: 'Savings',
      accessor: (row) => row.totalAmount || 0,
      Cell: ({ row }) => formatCurrency(
        Number(row.original.totalAmount || 0)
      ),
      filterable: false,
    },
    {
      id: 'shares',
      label: 'Shares',
      accessor: (row) => row.shares && row.shares[0] ? row.shares[0].totalValue || 0 : 0,
      Cell: ({ row }) => {
        let shareValue = 0;
        if (row.original.shares && row.original.shares[0]) {
          shareValue = Number(row.original.shares[0].totalValue || 0);
        }
        return formatCurrency(shareValue);
      },
      filterable: false,
    },
    {
      id: 'total',
      label: 'Total',
      accessor: (row) => {
        const savingsAmount = Number(row.totalAmount || 0);
        const sharesAmount = row.shares && row.shares[0] ? Number(row.shares[0].totalValue || 0) : 0;
        return savingsAmount + sharesAmount;
      },
      Cell: ({ row }) => {
        const savingsAmount = Number(row.original.totalAmount || 0);
        const sharesAmount = row.original.shares && row.original.shares[0] ? 
                            Number(row.original.shares[0].totalValue || 0) : 0;
        return formatCurrency(savingsAmount + sharesAmount);
      },
      filterable: false,
    },
    {
      id: 'status',
      label: 'Status',
      accessor: (row) => row.status || 'PENDING',
      Cell: ({ value }) => (
        <Chip 
          label={value || 'PENDING'} 
          color={value === 'COMPLETED' || value === 'ACTIVE' ? 'success' : 'warning'}
          size="small"
          sx={{ 
            fontSize: '0.75rem',
            fontWeight: 500,
          }}
        />
      ),
      filterable: true,
    },
  ];

  // 3. Withdrawal Requests table columns are now defined in withdrawalsColumns
  const withdrawalsColumns: DataTableColumn<any>[] = [
    {
      id: 'member',
      label: 'Member',
      accessor: (row) => row?.member?.name || '',
      Cell: ({ row }) => {
        const memberName = row.original?.member?.name || 'N/A';
        const erpId = row.original?.member?.erpId || '';
        
        return (
          <Box>
            <Typography variant="body2" fontWeight={500}>
              {memberName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {erpId}
            </Typography>
          </Box>
        );
      },
      filterable: true,
    },
    {
      id: 'amount',
      label: 'Amount',
      accessor: (row) => row.rawAmount || 0,
      Cell: ({ row }) => row.original.amount || formatCurrency(Number(row.original.rawAmount) || 0),
      filterable: false,
    },
    {
      id: 'requestDate',
      label: 'Request Date',
      accessor: (row) => row.requestDate,
      Cell: ({ value }) => formatDate(value),
      filterable: false,
    },
    {
      id: 'status',
      label: 'Status',
      accessor: 'status',
      Cell: ({ value }) => {
        const statusMap: Record<string, { color: string, label: string }> = {
          'PENDING': { color: 'warning', label: 'Pending' },
          'IN_REVIEW': { color: 'info', label: 'In Review' },
          'REVIEWED': { color: 'info', label: 'Reviewed' },
          'APPROVED': { color: 'success', label: 'Approved' },
          'REJECTED': { color: 'error', label: 'Rejected' },
          'PROCESSING': { color: 'info', label: 'Processing' },
          'COMPLETED': { color: 'success', label: 'Completed' }
        };
        
        const status = statusMap[value] || { color: 'default', label: value };
        
        return (
          <Chip 
            label={status.label}
            color={status.color as any}
            size="small"
          />
        );
      },
      filterable: true,
    },
    {
      id: 'actions',
      label: 'Actions',
      accessor: 'id',
      Cell: ({ row }) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <PermissionGate permissions={['APPROVE_WITHDRAWAL']} module={Module.SAVINGS}>
            <Button 
              size="small" 
              variant="outlined"
              onClick={() => handleViewWithdrawalRequest(row.original)}
            >
              Review
            </Button>
          </PermissionGate>
        </Box>
      ),
      filterable: false,
    },
  ];
  
  const handleViewWithdrawalRequest = (request: any) => {
    setSelectedWithdrawal(request);
    setIsViewWithdrawalModalOpen(true);
  };

  const handleWithdrawalAction = async (action: 'APPROVED' | 'REJECTED' | 'PROCESSING') => {
    if (!selectedWithdrawal) return;
    
    try {
      const isLastApproval = action === 'APPROVED';
      
      await withdrawalProcessMutation.mutateAsync({
        withdrawalId: selectedWithdrawal.id,
        status: action as RequestStatus,
        notes: withdrawalActionNotes,
        isLastApproval
      });
      
      setIsViewWithdrawalModalOpen(false);
      setSelectedWithdrawal(null);
      setWithdrawalActionNotes('');
      setWithdrawalAction('');
    } catch (error) {
      console.error('Failed to process withdrawal:', error);
    }
  };
  
  // Calculate summary statistics safely
  const calculateSavingsSummary = () => {
    const summary = {
      totalMembers: 0,
      totalAmount: 0,
      averageAmount: 0,
      monthlyTarget: 0,
      totalSavings: 0,
      grossContributions: 0,
      lastUpdate: 'N/A',
    };
    
    // Get total members from meta data if available
    if (allSavings?.meta?.total) {
      summary.totalMembers = allSavings.meta.total;
    }
    
    // Calculate totals from savings summary data if available
    if (savingsSummaryData) {
      // No need to navigate through .data since we're returning the full object from the hook
      summary.totalAmount = Number(savingsSummaryData.totalSavings || savingsSummaryData.totalSavingsAmount || 0);
      summary.grossContributions = Number(savingsSummaryData.totalGrossAmount || 0);
      summary.monthlyTarget = Number(savingsSummaryData.monthlyTarget || 0);
      
      const activeAccountsCount = savingsSummaryData.activeAccountsCount || 
                                allSavings?.meta?.total ||
                                1;
      
      summary.averageAmount = summary.totalAmount / activeAccountsCount;
    }
    
    // Get last update from first record if available
    if (Array.isArray(allSavings?.data) && allSavings.data.length > 0) {
      const firstRecord = allSavings.data[0];
      summary.lastUpdate = formatDate(firstRecord.createdAt || firstRecord.date || new Date());
    }
    
    return summary;
  };
  
  const savingsSummary = calculateSavingsSummary();
  
  // 1. Add a function to aggregate data by member
  const aggregateMemberData = (savingsData: any[]): any[] => {
    if (!savingsData || !Array.isArray(savingsData)) return [];
    
    // Use a Map to group by member ID
    const memberMap = new Map();
    
    savingsData.forEach((record) => {
      const memberId = record.member.id;
      
      if (!memberMap.has(memberId)) {
        // Initialize member record
        memberMap.set(memberId, {
          id: memberId,
          erpId: record.erpId,
          member: {
            id: memberId,
            name: record.member.name,
            department: record.member.department
          },
          totalSavingsAmount: Number(record.totalSavingsAmount || 0),
          totalSharesAmount: record.shares?.[0]?.totalSharesAmount ? Number(record.shares[0].totalSharesAmount) : 0,
          totalGrossAmount: Number(record.totalGrossAmount || 0),
          lastDeposit: record.lastDeposit,
          status: record.status,
          lastTransaction: record.transactions?.[0] || null
        });
      } else {
        // This shouldn't happen with properly accumulated data, but just in case
        const existingRecord = memberMap.get(memberId);
        
        // Take the record with the latest lastDeposit as the most current
        if (new Date(record.lastDeposit) > new Date(existingRecord.lastDeposit)) {
          existingRecord.totalSavingsAmount = Number(record.totalSavingsAmount || 0);
          existingRecord.totalSharesAmount = record.shares?.[0]?.totalSharesAmount ? Number(record.shares[0].totalSharesAmount) : 0;
          existingRecord.totalGrossAmount = Number(record.totalGrossAmount || 0);
          existingRecord.lastDeposit = record.lastDeposit;
          existingRecord.lastTransaction = record.transactions?.[0] || null;
        }
      }
    });
    
    return Array.from(memberMap.values());
  };

  // 2. Use this in your component before rendering
  const memberCentricData = useMemo(() => {
    return allSavings?.data ? aggregateMemberData(allSavings.data) : [];
  }, [allSavings?.data]);

  return (
    <Box sx={{ maxWidth: '100%', pt: 2, pb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight={600}>
          Savings Management
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <PermissionGate permissions={['UPLOAD_SAVINGS']} module={Module.SAVINGS} approvalLevel={2}>
            <Button 
              onClick={() => setIsUploadModalOpen(true)}
              variant="outlined"
              startIcon={<FileUploadIcon />}
            >
              Upload Savings
            </Button>
          </PermissionGate>
          
          <PermissionGate permissions={['UPLOAD_SAVINGS']} module={Module.SAVINGS} approvalLevel={2}>
            <Button
              onClick={() => window.open('/api/savings/backup', '_blank')}
              variant="outlined"
              startIcon={<DownloadIcon />}
            >
              Export Data
            </Button>
          </PermissionGate>
        </Box>
      </Box>
      
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Savings
              </Typography>
              <Typography variant="h5" component="div" fontWeight={600}>
                {isLoadingSummary ? (
                  <CircularProgress size={24} />
                ) : (
                  formatCurrency(savingsSummary.totalAmount)
                )}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Combined savings balance
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Members
              </Typography>
              <Typography variant="h5" component="div" fontWeight={600}>
                {isLoading ? <CircularProgress size={24} /> : memberSummary?.meta?.total}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                With active savings
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Average Savings
              </Typography>
              <Typography variant="h5" component="div" fontWeight={600}>
                {isLoadingSummary ? (
                  <CircularProgress size={24} />
                ) : (
                  formatCurrency(savingsSummary.monthlyTarget)
                )}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Per member
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Last Updated
              </Typography>
              <Typography variant="h5" component="div" fontWeight={600}>
                {isLoading ? <CircularProgress size={24} /> : savingsSummary.lastUpdate}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Most recent transaction
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="savings tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="All Savings" />
          <Tab label="Monthly Savings" />
          <Tab label="Withdrawals" />
        </Tabs>
      </Paper>
      
      {activeTab === 0 && (
        <Paper sx={{ p: 2 }}>
          <DataTable
            columns={memberSavingsColumns}
            data={memberSummary?.data || []}
            pagination={{
              pageIndex: currentPage - 1,
              pageSize: pageSize,
              pageCount: memberSummary?.meta?.totalPages || 1,
              totalRecords: memberSummary?.meta?.total || 0,
            }}
            onPageChange={(newPage) => setCurrentPage(newPage + 1)}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
            loading={isLoadingMemberSummary}
            error={memberSummaryError ? memberSummaryError.message : undefined}
            enableFiltering={true}
          />
        </Paper>
      )}
      
      {activeTab === 1 && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <TextField
              select
              label="Month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(Number(e.target.value))}
              sx={{ width: { xs: '100%', sm: 150 } }}
              size="small"
              SelectProps={{
                native: true,
              }}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <option key={month} value={month}>
                  {new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </TextField>
            
            <TextField
              select
              label="Year"
              value={filterYear}
              onChange={(e) => setFilterYear(Number(e.target.value))}
              sx={{ width: { xs: '100%', sm: 120 } }}
              size="small"
              SelectProps={{
                native: true,
              }}
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </TextField>
          </Box>
          
          {isLoadingMonthly ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (!monthlySavings?.data || monthlySavings.data.length === 0) ? (
            <Alert severity="info">
              No monthly savings records available for {new Date(2000, filterMonth - 1, 1).toLocaleString('default', { month: 'long' })} {filterYear}
            </Alert>
          ) : (
            <DataTable
              columns={monthlySavingsColumns}
              data={monthlySavings?.data || []}
              loading={isLoadingMonthly}
              pagination={{
                pageIndex: monthlySavingsPage - 1,
                pageSize: monthlySavingsPageSize,
                pageCount: monthlySavings?.meta?.totalPages || 1,
                totalRecords: monthlySavings?.meta?.total || 0,
              }}
              onPageChange={(newPage) => {
                setMonthlySavingsPage(newPage + 1); // Fixed: Don't add 1, let the hook handle that
              }}
              onPageSizeChange={(newSize) => {
                setMonthlySavingsPageSize(newSize);
                setMonthlySavingsPage(0); // Reset to first page when changing page size
                // This part is correct
              }}
            />
          )}
        </Paper>
      )}
      
      {activeTab === 2 && (
        <Box>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <TextField
                placeholder="Search withdrawals..."
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: { xs: '100%', sm: 250 } }}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel id="withdrawal-status-filter-label">Status</InputLabel>
                  <Select
                    labelId="withdrawal-status-filter-label"
                    id="withdrawal-status-filter"
                    value={withdrawalStatusFilter}
                    label="Status"
                    onChange={(e) => setWithdrawalStatusFilter(e.target.value)}
                  >
                    <MenuItem value="">All Status</MenuItem>
                    <MenuItem value="PENDING">Pending</MenuItem>
                    <MenuItem value="IN_REVIEW">In Review</MenuItem>
                    <MenuItem value="APPROVED">Approved</MenuItem>
                    <MenuItem value="REJECTED">Rejected</MenuItem>
                    <MenuItem value="COMPLETED">Completed</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
            
            <DataTable
              columns={withdrawalsColumns}
              data={withdrawalRequests?.data?.data || []}
              pagination={{
                pageIndex: withdrawalCurrentPage - 1,
                pageSize: withdrawalPageSize,
                pageCount: withdrawalRequests?.data?.meta?.totalPages || 1,
                totalRecords: withdrawalRequests?.data?.meta?.total || 0,
              }}
              onPageChange={(page) => setWithdrawalCurrentPage(page + 1)}
              onPageSizeChange={setWithdrawalPageSize}
              loading={isLoadingWithdrawals}
              error={withdrawalRequests?.error ? 'Failed to load withdrawal requests' : undefined}
              noDataMessage="No withdrawal requests found"
            />
          </Paper>
        </Box>
      )}
      
      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Savings Data"
      >
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            const fileInput = e.currentTarget.elements.namedItem('file') as HTMLInputElement;
            if (fileInput && fileInput.files && fileInput.files[0]) {
              handleFileUpload(fileInput.files[0]);
            } else {
              toast.error('Please select a file to upload');
            }
          }}
          className="space-y-4"
        >
          <div>
            <Typography variant="body2" color="text.secondary" paragraph>
              Upload an Excel file containing savings records. The file should include member IDs, amounts, and transaction dates.
            </Typography>
            
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>File Format Requirements:</Typography>
            <ul className="list-disc pl-5 text-sm text-gray-600 mb-4">
              <li>Excel (.xlsx) or CSV format</li>
              <li>Required columns: erpId, grossAmount, month, year</li>
              <li>Maximum file size: 5MB</li>
            </ul>
            
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select File
            </label>
            <input
              type="file"
              name="file"
              accept=".xlsx,.xls,.csv"
              className="mt-1 block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-primary-50 file:text-primary-700
                hover:file:bg-primary-100"
            />
          </div>
          
          {savingsUploadMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {(savingsUploadMutation.error as any)?.message || 
               'Error uploading file. Please check format and try again.'}
            </Alert>
          )}
          
          <div className="flex justify-end gap-2">
            <Button 
              variant="outlined" 
              onClick={() => setIsUploadModalOpen(false)}
              disabled={savingsUploadMutation.isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              isLoading={savingsUploadMutation.isLoading}
              disabled={savingsUploadMutation.isLoading}
            >
              {savingsUploadMutation.isLoading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </form>
      </Modal>
      
      {/* Savings Record Detail Modal */}
      <Modal
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title="Savings Record Details"
      >
        {selectedRecord && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Member</h4>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedRecord.member?.fullName || 
                   selectedRecord.member?.name || 
                   selectedRecord.memberName || 'N/A'}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Amount</h4>
                <p className="mt-1 text-sm text-gray-900">
                  {formatCurrency(
                    Number(selectedRecord.principalAmount || 
                     selectedRecord.balance || 
                     selectedRecord.amount || 0)
                  )}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Type</h4>
                <p className="mt-1 text-sm text-gray-900">{selectedRecord.type || 'SAVINGS'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Date</h4>
                <p className="mt-1 text-sm text-gray-900">
                  {formatDate(selectedRecord.date || selectedRecord.createdAt)}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Reference</h4>
                <p className="mt-1 text-sm text-gray-900">{selectedRecord.reference || 'N/A'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">ERP ID</h4>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedRecord.erpId || selectedRecord.member?.erpId || 'N/A'}
                </p>
              </div>
            </div>
            
            {selectedRecord.transactions && selectedRecord.transactions.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2">Related Transactions</Typography>
                <Box sx={{ mt: 1 }}>
                  {selectedRecord.transactions.map((tx: any, idx: number) => (
                    <Box key={tx.id || idx} sx={{ mb: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                      <Typography variant="caption" display="block">
                        {tx.transactionType || tx.type}: {formatCurrency(Number(tx.amount))}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(tx.createdAt || tx.date)} - {tx.description || 'No description'}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </>
            )}
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Record ID: <span className="font-mono">{selectedRecord.id?.substring(0, 8) || 'N/A'}</span>
              </Typography>
              
              <div className="flex justify-end gap-2">
                <Button variant="outlined" onClick={() => setSelectedRecord(null)}>Close</Button>
              </div>
            </Box>
          </div>
        )}
      </Modal>
      
      {/* Withdrawal Request Detail Modal */}
      <Modal
        isOpen={isViewWithdrawalModalOpen}
        onClose={() => {
          setIsViewWithdrawalModalOpen(false);
          setSelectedWithdrawal(null);
          setWithdrawalActionNotes('');
          setWithdrawalAction('');
        }}
        title="Withdrawal Request Details"
        maxWidth="md"
      >
        {selectedWithdrawal && (
          <div className="space-y-4">
            <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">Member</Typography>
                  <Typography variant="body1">
                    {selectedWithdrawal.biodata?.fullName || 
                     selectedWithdrawal.member?.fullName ||
                     selectedWithdrawal.member?.name || 'N/A'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">ERP ID</Typography>
                  <Typography variant="body1">
                    {selectedWithdrawal.biodata?.erpId || 
                     selectedWithdrawal.member?.erpId ||
                     selectedWithdrawal.erpId || 'N/A'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">Amount</Typography>
                  <Typography variant="body1" fontWeight={700}>
                    {formatCurrency(
                      Number(selectedWithdrawal.rawAmount || selectedWithdrawal.amount || 0)
                    )}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                  <Chip 
                    label={selectedWithdrawal.status}
                    color={
                      selectedWithdrawal.status === 'APPROVED' ? 'success' :
                      selectedWithdrawal.status === 'REJECTED' ? 'error' :
                      selectedWithdrawal.status === 'COMPLETED' ? 'success' : 'warning'
                    }
                    size="small"
                    sx={{ fontSize: '0.75rem' }}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" color="text.secondary">Reason</Typography>
                  <Typography variant="body2">
                    {selectedWithdrawal.content?.reason || 
                     selectedWithdrawal.reason ||
                     'No reason provided'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
            
            {selectedWithdrawal.approvalSteps && selectedWithdrawal.approvalSteps.length > 0 && (
              <>
                <Typography variant="subtitle1" sx={{ mt: 3 }}>Approval Workflow</Typography>
                <Box sx={{ ml: 1 }}>
                  {selectedWithdrawal.approvalSteps.map((step: any, idx: number) => (
                    <Box 
                      key={idx} 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        mb: 1,
                        p: 1,
                        borderLeft: '2px solid',
                        borderColor: 
                          step.status === 'APPROVED' ? 'success.main' :
                          step.status === 'REJECTED' ? 'error.main' :
                          step.status === 'PENDING' ? 'warning.main' : 'divider',
                        pl: 2
                      }}
                    >
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle2">
                          Level {step.level}: {step.approverRole}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {step.status} 
                          {step.updatedAt && step.status !== 'PENDING' && 
                            ` • ${formatDate(step.updatedAt)}`}
                        </Typography>
                        {step.comments && (
                          <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                            "{step.comments}"
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </>
            )}
            
            <PermissionGate permissions={['APPROVE_WITHDRAWAL']} module={Module.SAVINGS} approvalLevel={2}>
              {selectedWithdrawal.status === 'PENDING' || 
               selectedWithdrawal.status === 'IN_REVIEW' || 
               selectedWithdrawal.status === 'REVIEWED' ? (
                <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="subtitle1">Process Request</Typography>
                  <TextField
                    fullWidth
                    label="Notes"
                    multiline
                    rows={3}
                    value={withdrawalActionNotes}
                    onChange={(e) => setWithdrawalActionNotes(e.target.value)}
                    placeholder="Enter notes for this action (optional)"
                    sx={{ mt: 2, mb: 2 }}
                  />
                  
                  <Stack direction="row" spacing={2} justifyContent="flex-end">
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleWithdrawalAction('REJECTED')}
                      disabled={withdrawalProcessMutation.isLoading}
                    >
                      Reject
                    </Button>
                    
                    {/* Show appropriate action buttons based on status */}
                    {selectedWithdrawal.status === 'PENDING' && (
                      <Button
                        variant="contained"
                        onClick={() => handleWithdrawalAction('APPROVED')}
                        disabled={withdrawalProcessMutation.isLoading}
                      >
                        Approve
                      </Button>
                    )}
                    
                    {selectedWithdrawal.status === 'APPROVED' && (
                      <Button
                        variant="contained"
                        onClick={() => handleWithdrawalAction('PROCESSING')}
                        disabled={withdrawalProcessMutation.isLoading}
                      >
                        Process Withdrawal
                      </Button>
                    )}
                  </Stack>
                </Box>
              ) : (
                <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Alert severity={selectedWithdrawal.status === 'REJECTED' ? 'error' : 'info'}>
                    This request is in {selectedWithdrawal.status.toLowerCase()} status and cannot be modified.
                  </Alert>
                </Box>
              )}
            </PermissionGate>
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="outlined" 
                onClick={() => {
                  setIsViewWithdrawalModalOpen(false);
                  setSelectedWithdrawal(null);
                }}
              >
                Close
              </Button>
            </Box>
          </div>
        )}
      </Modal>
    </Box>
  );
}