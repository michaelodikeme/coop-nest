'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Box, Typography, Paper, Grid, Card, CardContent, Button, 
  Chip, TextField, FormControl, InputLabel, Select, MenuItem,
  Badge, LinearProgress, InputAdornment, IconButton, Tooltip,
  Stack
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ViewListIcon from '@mui/icons-material/ViewList';
import QueryBuilderIcon from '@mui/icons-material/QueryBuilder';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import CancelIcon from '@mui/icons-material/Cancel';
import { formatCurrency } from '@/utils/formatting/format';
import { useApprovals } from '@/lib/hooks/admin/useApprovals';
import { useAuth } from '@/lib/api/contexts/AuthContext';
import { DataTable, DataTableColumn } from '@/components/organisms/DataTable';
import { Request, ApiResponse, PaginatedResponse } from '@/types/request.types';

export default function LoanApprovalsPage() {
  const [page, setPage] = useState(0); // Use 0-indexed for MUI TablePagination
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  
  const { user, hasPermission, checkApprovalLevel } = useAuth();
  const { data: approvalsResponse, isLoading, error, refetch } = useApprovals(
    'LOAN_APPLICATION', // Loan requests only
    page + 1, // Convert to 1-indexed for API
    pageSize,
    statusFilter,
    searchTerm
  );
  
  // Safely access the nested data structure from useApprovals hook
  // The hook returns { data: [...], meta: { total, page, limit, totalPages } }
  const approvals = approvalsResponse as { data: Request[]; meta: { total: number; page: number; limit: number; totalPages: number } } | undefined;
  const meta = approvals?.meta || { total: 0, page: 1, limit: 10, totalPages: 0 };
  const requests = Array.isArray(approvals?.data) ? approvals.data : [];
  console.log('LoanApprovalPage Approvals data structure:', approvals);
  console.log('Meta data:', meta);
  console.log('Requests array:', requests);
  console.log('Requests length:', requests.length);

  const router = useRouter();
  
  // Enhanced getUserApprovalFilter function to include DISBURSED status
  const getUserApprovalFilter = () => {
    // Admin (Level 1) sees PENDING loans for initial review
    if (checkApprovalLevel(1) && hasPermission('REVIEW_LOAN_APPLICATIONS')) {
      return 'PENDING';
    }
    // Treasurer (Level 2) sees IN_REVIEW loans for financial review
    else if (checkApprovalLevel(2) && hasPermission('REVIEW_LOAN')) {
      return 'IN_REVIEW';
    }
    // Chairman (Level 3) sees REVIEWED loans for final approval
    else if (checkApprovalLevel(3) && hasPermission('APPROVE_LOANS')) {
      return 'REVIEWED';
    }
    // Treasurer (Level 2) also sees APPROVED loans for disbursement
    else if (checkApprovalLevel(2) && hasPermission('DISBURSE_LOAN')) {
      return 'APPROVED';
    }
    // Default to showing all
    return undefined;
  };
  
  // Function to get color based on status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'IN_REVIEW': return 'info';
      case 'REVIEWED': return 'secondary';
      case 'APPROVED': return 'success';
      case 'DISBURSED': return 'primary';
      case 'ACTIVE': return 'info';
      case 'COMPLETED': return 'default';
      case 'REJECTED': return 'error';
      default: return 'default';
    }
  };
  
  // Filter loans based on user role if no explicit filter is set
  const effectiveFilter = statusFilter || getUserApprovalFilter();
  
  // Format date with time
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  
  // Fix 3: Updated countStatus function with better error handling
  const countStatus = (status: string): number => {
    if (!Array.isArray(requests)) {
      console.warn('Requests is not an array:', requests);
      return 0;
    }
    
    const count = requests.filter((item: any) => {
      // Add validation to ensure item has status property
      if (!item || typeof item.status !== 'string') {
        console.warn('Invalid item in requests array:', item);
        return false;
      }
      return item.status === status;
    }).length;
    
    console.log(`Count for status ${status}:`, count);
    return count;
  };

  // Update the countStatus function to use the typed requests array
  // const countStatus = (status: string): number => {
  //   return Array.isArray(requests) 
  //     ? requests.filter((item: Request) => item.status === status).length 
  //     : 0;
  // };
// Fix 4: Enhanced statistics calculation with debugging
  const statistics = {
    pending: countStatus('PENDING'),
    inReview: countStatus('IN_REVIEW'),
    reviewed: countStatus('REVIEWED'),
    approved: countStatus('APPROVED'),
    disbursed: countStatus('DISBURSED'),
    active: countStatus('ACTIVE'),
    completed: countStatus('COMPLETED'),
    rejected: countStatus('REJECTED'),
    total: requests.length // Add total for validation
  };

  console.log('All statuses in requests:', requests.map(r => r?.status));
  console.log('Statistics calculated:', statistics);

  // const statistics = {
  //   pending: countStatus('PENDING'),
  //   inReview: countStatus('IN_REVIEW'),
  //   reviewed: countStatus('REVIEWED'),
  //   approved: countStatus('APPROVED'),
  //   disbursed: countStatus('DISBURSED'),
  //   active: countStatus('ACTIVE'),
  //   completed: countStatus('COMPLETED'),
  //   rejected: countStatus('REJECTED')
  // };
  
  console.log('Statistics:', statistics);
  // Get button text based on status and user role
  const getActionButtonText = (status: string) => {
    if (status === 'PENDING' && checkApprovalLevel(1)) return 'Review';
    if (status === 'IN_REVIEW' && checkApprovalLevel(2)) return 'Review';
    if (status === 'REVIEWED' && checkApprovalLevel(3)) return 'Approve';
    if (status === 'APPROVED' && checkApprovalLevel(2)) return 'Disburse';
    if (status === 'DISBURSED' || status === 'ACTIVE' || status === 'COMPLETED') return 'View Details';
    return 'View';
  };
  
  // Customize button color based on action
  const getActionButtonColor = (status: string) => {
    if (status === 'APPROVED' && checkApprovalLevel(2)) return 'success';
    if (status === 'REVIEWED' && checkApprovalLevel(3)) return 'secondary';
    if (status === 'IN_REVIEW' && checkApprovalLevel(2)) return 'info';
    if (status === 'PENDING' && checkApprovalLevel(1)) return 'warning';
    if (status === 'DISBURSED') return 'primary';
    if (status === 'ACTIVE') return 'info';
    return 'primary';
  };
  
  // Check if user has permission to take action on this status
  const canTakeAction = (status: string) => {
    if (status === 'PENDING' && checkApprovalLevel(1) && hasPermission('REVIEW_LOAN_APPLICATIONS')) return true;
    if (status === 'IN_REVIEW' && checkApprovalLevel(2) && hasPermission('REVIEW_LOAN')) return true;
    if (status === 'REVIEWED' && checkApprovalLevel(3) && hasPermission('APPROVE_LOANS')) return true;
    if (status === 'APPROVED' && checkApprovalLevel(2) && hasPermission('DISBURSE_LOAN')) return true;
    // No actions needed for DISBURSED, ACTIVE, or COMPLETED loans - they're read only
    return false;
  };
  
  // Get status with priority indicator
  const getStatusWithPriority = (status: string, priority: string = 'MEDIUM') => {
    return (
      <Stack direction="row" spacing={1} alignItems="center">
        <Chip 
          label={status} 
          color={getStatusColor(status)}
          size="small"
          sx={{ 
            fontWeight: 500,
            minWidth: 80,
            borderRadius: '4px' 
          }}
        />
        {priority === 'HIGH' && (
          <Chip 
            label="Priority" 
            color="error" 
            size="small" 
            variant="outlined" 
            sx={{ height: 20, fontSize: '0.7rem' }} 
          />
        )}
      </Stack>
    );
  };

  const columns: DataTableColumn<any>[] = [
    {
      id: 'member',
      label: 'Member',
      accessor: (row: any) => row.metadata?.member?.fullName || 'N/A',
      minWidth: 200,
      filterable: true,
      Cell: ({ value, row }: { value: string, row: any }) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box 
            sx={{ 
              width: 32, 
              height: 32, 
              borderRadius: '50%', 
              bgcolor: stringToColor(value),
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              mr: 1.5
            }}
          >
            {getInitials(value)}
          </Box>
          <Box>
            <Typography variant="body2" fontWeight={500}>
              {value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {row.metadata?.member?.erpId || ''}
            </Typography>
          </Box>
        </Box>
      )
    },
    {
      id: 'loanType',
      label: 'Loan Type',
      accessor: (row: any) => row.metadata?.loanType?.name || 'Standard Loan',
      minWidth: 150,
      filterable: true,
      Cell: ({ value }: { value: string }) => (
        <Chip
          label={value}
          size="small"
          variant="outlined"
          sx={{
            bgcolor: alpha(getLoanTypeColor(value), 0.1),
            color: getLoanTypeColor(value),
            borderColor: getLoanTypeColor(value),
            fontWeight: 500
          }}
        />
      )
    },
    {
      id: 'amount',
      label: 'Amount',
      accessor: (row: any) => parseFloat(row.content?.amount || 0),
      minWidth: 130,
      align: "right" as const,
      format: (value: number) => formatCurrency(value),
      Cell: ({ value }: { value: number }) => (
        <Typography 
          variant="body2" 
          fontWeight={600} 
          sx={{ 
            color: value > 500000 ? 'warning.dark' : 'text.primary'
          }}
        >
          {formatCurrency(value)}
        </Typography>
      )
    },
    {
      id: 'status',
      label: 'Status',
      accessor: (row: any) => row.status,
      minWidth: 140,
      filterable: true,
      Cell: ({ value, row }: { value: string, row: any }) => 
        getStatusWithPriority(value, row.priority)
    },
    {
  id: 'created',
  label: 'Created',
  // The accessor extracts the value from the row
  accessor: (row: any) => row.createdAt, 
  minWidth: 150,
  // Use 'value' which is the result of the accessor above
  Cell: ({ value }: { value: string }) => {
    if (!value) {
      return (
        <Typography variant="body2" color="text.secondary">
          N/A
        </Typography>
      );
    }

    const date = new Date(value);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return (
        <Typography variant="body2" color="error">
          Invalid Date
        </Typography>
      );
    }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <Typography variant="body2" fontWeight={500}>
          {date.toLocaleDateString()}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Typography>
      </Box>
    );
  }
},
    {
      id: 'actions',
      label: 'Actions',
      accessor: (row: any) => row.id,
      align: "center",
      filterable: false,
      sortable: false,
      minWidth: 120,
      Cell: ({ value, row }: { value: string, row: any }) => (
        <Button
          size="small"
          variant="contained"
          color={getActionButtonColor(row.status)}
          onClick={() => router.push(`/admin/approvals/loans/${value}`)}
          disabled={row.status === 'REJECTED'} // Only reject status is not clickable
          sx={{ 
            minWidth: 100,
            fontWeight: 500
          }}
        >
          {getActionButtonText(row.status)}
        </Button>
      ),
    },
  ];
  
  // Helper functions
  function stringToColor(string: string): string {
    let hash = 0;
    let i;
    
    for (i = 0; i < string.length; i += 1) {
      hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    let color = '#';
    
    for (i = 0; i < 3; i += 1) {
      const value = (hash >> (i * 8)) & 0xff;
      color += `00${value.toString(16)}`.slice(-2);
    }
    
    return color;
  }
  
  function getInitials(name: string): string {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }
  
  function getLoanTypeColor(loanType: string): string {
    if (loanType.toLowerCase().includes('soft')) return '#0288d1';
    if (loanType.toLowerCase().includes('1 year plus')) return '#d32f2f';
    if (loanType.toLowerCase().includes('emergency')) return '#ed6c02';
    return '#2e7d32';
  }
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={600}>Loan Status</Typography>
          <Typography variant="body1" color="text.secondary" mt={0.5}>
            Review and manage loan applications requiring your approval
          </Typography>
        </Box>
        
        <Box>
          <Tooltip title="Refresh data">
            <IconButton onClick={() => refetch()} disabled={isLoading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title={viewMode === 'list' ? 'Grid view' : 'List view'}>
            <IconButton onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}>
              {viewMode === 'list' ? <DashboardIcon /> : <ViewListIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {/* Statistics cards - updated to include DISBURSED status */}
      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card 
            sx={{ 
              position: 'relative',
              overflow: 'hidden',
              borderLeft: '4px solid',
              borderLeftColor: 'warning.main'
            }}
            elevation={1}
          >
            <Box 
              sx={{ 
                position: 'absolute',
                top: -10,
                right: -10,
                width: 100,
                height: 100,
                borderRadius: '50%',
                bgcolor: 'warning.light',
                opacity: 0.2,
                zIndex: 0
              }} 
            />
            <CardContent>
              <Box position="relative" zIndex={1}>
                <Box display="flex" alignItems="center" mb={1}>
                  <QueryBuilderIcon sx={{ color: 'warning.main', mr: 1 }} />
                  <Typography variant="h6" color="warning.main" fontWeight={600}>Pending</Typography>
                </Box>
                <Typography variant="h4" fontWeight={700}>
                  {statistics.pending}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Awaiting initial review
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card 
            sx={{ 
              position: 'relative',
              overflow: 'hidden',
              borderLeft: '4px solid',
              borderLeftColor: 'info.main'
            }}
            elevation={1}
          >
            <Box 
              sx={{ 
                position: 'absolute',
                top: -10,
                right: -10,
                width: 100,
                height: 100,
                borderRadius: '50%',
                bgcolor: 'info.light',
                opacity: 0.2,
                zIndex: 0
              }} 
            />
            <CardContent>
              <Box position="relative" zIndex={1}>
                <Box display="flex" alignItems="center" mb={1}>
                  <AttachMoneyIcon sx={{ color: 'info.main', mr: 1 }} />
                  <Typography variant="h6" color="info.main" fontWeight={600}>In Review</Typography>
                </Box>
                <Typography variant="h4" fontWeight={700}>
                  {statistics.inReview}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Treasurer review
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card 
            sx={{ 
              position: 'relative',
              overflow: 'hidden',
              borderLeft: '4px solid',
              borderLeftColor: 'secondary.main'
            }}
            elevation={1}
          >
            <Box 
              sx={{ 
                position: 'absolute',
                top: -10,
                right: -10,
                width: 100,
                height: 100,
                borderRadius: '50%',
                bgcolor: 'secondary.light',
                opacity: 0.2,
                zIndex: 0
              }} 
            />
            <CardContent>
              <Box position="relative" zIndex={1}>
                <Box display="flex" alignItems="center" mb={1}>
                  <QueryBuilderIcon sx={{ color: 'secondary.main', mr: 1 }} />
                  <Typography variant="h6" color="secondary.main" fontWeight={600}>Reviewed</Typography>
                </Box>
                <Typography variant="h4" fontWeight={700}>
                  {statistics.reviewed}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Awaiting Chairman approval
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card 
            sx={{ 
              position: 'relative',
              overflow: 'hidden',
              borderLeft: '4px solid',
              borderLeftColor: 'success.main'
            }}
            elevation={1}
          >
            <Box 
              sx={{ 
                position: 'absolute',
                top: -10,
                right: -10,
                width: 100,
                height: 100,
                borderRadius: '50%',
                bgcolor: 'success.light',
                opacity: 0.2,
                zIndex: 0
              }} 
            />
            <CardContent>
              <Box position="relative" zIndex={1}>
                <Box display="flex" alignItems="center" mb={1}>
                  <CheckCircleIcon sx={{ color: 'success.main', mr: 1 }} />
                  <Typography variant="h6" color="success.main" fontWeight={600}>Approved</Typography>
                </Box>
                <Typography variant="h4" fontWeight={700}>
                  {statistics.approved}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Ready for disbursement
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card 
            sx={{ 
              position: 'relative',
              overflow: 'hidden',
              borderLeft: '4px solid',
              borderLeftColor: 'primary.main'
            }}
            elevation={1}
          >
            <Box 
              sx={{ 
                position: 'absolute',
                top: -10,
                right: -10,
                width: 100,
                height: 100,
                borderRadius: '50%',
                bgcolor: 'primary.light',
                opacity: 0.2,
                zIndex: 0
              }} 
            />
            <CardContent>
              <Box position="relative" zIndex={1}>
                <Box display="flex" alignItems="center" mb={1}>
                  <LocalAtmIcon sx={{ color: 'primary.main', mr: 1 }} />
                  <Typography variant="h6" color="primary.main" fontWeight={600}>Disbursed</Typography>
                </Box>
                <Typography variant="h4" fontWeight={700}>
                  {statistics.disbursed || statistics.completed || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Funds released
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card 
            sx={{ 
              position: 'relative',
              overflow: 'hidden',
              borderLeft: '4px solid',
              borderLeftColor: 'error.main'
            }}
            elevation={1}
          >
            <Box 
              sx={{ 
                position: 'absolute',
                top: -10,
                right: -10,
                width: 100,
                height: 100,
                borderRadius: '50%',
                bgcolor: 'error.light',
                opacity: 0.2,
                zIndex: 0
              }} 
            />
            <CardContent>
              <Box position="relative" zIndex={1}>
                <Box display="flex" alignItems="center" mb={1}>
                  <CancelIcon sx={{ color: 'error.main', mr: 1 }} />
                  <Typography variant="h6" color="error.main" fontWeight={600}>Rejected</Typography>
                </Box>
                <Typography variant="h4" fontWeight={700}>
                  {statistics.rejected}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Application denied
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Filter controls */}
      <Box 
        mb={3} 
        sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 2,
          p: 2,
          bgcolor: 'background.paper',
          borderRadius: 1,
          boxShadow: 1
        }}
      >
        <TextField
          placeholder="Search by member name or ID..."
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ width: 300, flexGrow: { xs: 1, md: 0 } }}
        />
        
        <FormControl size="small" sx={{ minWidth: 200, flexGrow: { xs: 1, md: 0 } }}>
          <InputLabel id="status-filter-label">Status Filter</InputLabel>
          <Select
            labelId="status-filter-label"
            id="status-filter"
            value={statusFilter || ''}
            onChange={(e) => setStatusFilter(e.target.value === '' ? undefined : e.target.value)}
            label="Status Filter"
            startAdornment={
              <InputAdornment position="start">
                <FilterListIcon fontSize="small" />
              </InputAdornment>
            }
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="PENDING">
              <Badge 
                badgeContent={statistics.pending} 
                color="warning" 
                sx={{ '& .MuiBadge-badge': { right: -20 } }}
              >
                Pending
              </Badge>
            </MenuItem>
            <MenuItem value="IN_REVIEW">
              <Badge 
                badgeContent={statistics.inReview} 
                color="info" 
                sx={{ '& .MuiBadge-badge': { right: -20 } }}
              >
                In Review
              </Badge>
            </MenuItem>
            <MenuItem value="REVIEWED">
              <Badge 
                badgeContent={statistics.reviewed} 
                color="secondary" 
                sx={{ '& .MuiBadge-badge': { right: -20 } }}
              >
                Reviewed
              </Badge>
            </MenuItem>
            <MenuItem value="APPROVED">
              <Badge 
                badgeContent={statistics.approved} 
                color="success" 
                sx={{ '& .MuiBadge-badge': { right: -20 } }}
              >
                Approved
              </Badge>
            </MenuItem>
            <MenuItem value="DISBURSED">
              <Badge
                badgeContent={statistics.disbursed}
                color="primary"
                sx={{ '& .MuiBadge-badge': { right: -20 } }}
              >
                Disbursed
              </Badge>
            </MenuItem>
            <MenuItem value="ACTIVE">
              <Badge
                badgeContent={statistics.active}
                color="info"
                sx={{ '& .MuiBadge-badge': { right: -20 } }}
              >
                Active
              </Badge>
            </MenuItem>
            <MenuItem value="COMPLETED">
              <Badge 
                badgeContent={statistics.completed} 
                color="default" 
                sx={{ '& .MuiBadge-badge': { right: -20 } }}
              >
                Completed
              </Badge>
            </MenuItem>
            <MenuItem value="REJECTED">
              <Badge 
                badgeContent={statistics.rejected} 
                color="error" 
                sx={{ '& .MuiBadge-badge': { right: -20 } }}
              >
                Rejected
              </Badge>
            </MenuItem>
          </Select>
        </FormControl>
        
        <Box sx={{ flexGrow: 1 }} />
        
        {effectiveFilter && (
          <Chip 
            label={`Filtered: ${effectiveFilter}`} 
            color="primary" 
            variant="outlined" 
            size="small" 
            onDelete={() => setStatusFilter(undefined)} 
          />
        )}
      </Box>
      
      {/* Data table with loading indicator */}
      <Box position="relative" sx={{ mb: 4 }}>
        {isLoading && (
          <LinearProgress 
            sx={{ 
              position: 'absolute', 
              top: -2, 
              left: 0, 
              right: 0, 
              zIndex: 1 
            }} 
          />
        )}
        
        <Paper elevation={2} sx={{ borderRadius: 1, overflow: 'hidden' }}>
          <Box 
            sx={{ 
              p: 2, 
              borderBottom: '1px solid', 
              borderColor: 'divider',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05)
            }}
          >
            <Typography variant="h6" fontWeight={600} color="primary">
              Loan Applications
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {meta.total || 0} total applications
            </Typography>
          </Box>
          
          <DataTable
            columns={columns}
            data={requests}
            pagination={{
              pageIndex: page,
              pageSize,
              pageCount: meta.totalPages || 0,
              totalRecords: meta.totalPages || 0,
            }}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            loading={isLoading}
            error={error?.message}
            headerBackgroundColor={alpha('#f5f7fa', 0.6)}
            enableFiltering={true}
            noDataMessage="No loan applications found matching your criteria"
            onRowClick={(row) => router.push(`/admin/approvals/loans/${row.id}`)}
          />
        </Paper>
      </Box>
    </Box>
  );
}