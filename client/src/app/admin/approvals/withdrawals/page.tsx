'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWithdrawalRequestApprovals } from '@/lib/hooks/admin/useAdminFinancial';
import { 
  Box, 
  Typography, 
  Paper, 
  Chip, 
  Button,
  TextField, 
  InputAdornment,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import { DataTable } from '@/components/organisms/DataTable';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { formatCurrency } from '@/utils/formatting/format';
import { useToast } from '@/components/molecules/Toast';

export default function WithdrawalApprovalsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  const { data: approvals, isLoading, error } = useWithdrawalRequestApprovals(
    'SAVINGS_WITHDRAWAL',
    page,
    pageSize,
    statusFilter,
    searchTerm || undefined
  );
  
  const router = useRouter();
  const toast = useToast();
  
  const columns = [
    {
      id: 'member',
      label: 'Member',
      accessor: (row: any) => row.biodata?.fullName || row.memberName || '',
      Cell: ({ value, row }: { value: any; row: any }) => (
        <Box>
          <Typography variant="body2" fontWeight={500}>{value}</Typography>
          <Typography variant="caption" color="text.secondary">{row.original.biodata?.erpId || row.original.memberNumber || ''}</Typography>
        </Box>
      ),
    },
    {
      id: 'amount',
      label: 'Amount',
      accessor: (row: any) => row.content?.amount || 0,
      Cell: ({ value }: { value: any }) => formatCurrency(Number(value))
    },
    {
      id: 'status',
      label: 'Status',
      accessor: (row: any) => row.status,
      Cell: ({ value }: { value: any }) => (
        <Chip
          label={value}
          size="small"
          color={
            value === 'PENDING' ? 'warning' :
            value === 'IN_REVIEW' ? 'info' :
            value === 'REVIEWED' ? 'info' :
            value === 'APPROVED' ? 'success' :
            value === 'REJECTED' ? 'error' :
            value === 'COMPLETED' ? 'success' : 'default'
          }
        />
      )
    },
    {
      id: 'nextApprovalLevel',
      label: 'Approval Level',
      accessor: (row: any) => row.nextApprovalLevel,
      Cell: ({ value }: { value: any }) => (
        <Chip
          label={`Level ${value}`}
          size="small"
          variant="outlined"
        />
      )
    },
    {
      id: 'requestedAt',
      label: 'Requested At',
      accessor: (row: any) => row.createdAt,
      Cell: ({ value }: { value: any }) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, opacity: 0.7 }} />
          <Typography variant="body2">{new Date(value).toLocaleDateString()}</Typography>
        </Box>
      )
    },
    {
      id: 'actions',
      label: 'Actions',
      accessor: (row: any) => row.id,
      Cell: ({ value }: { value: any }) => (
        <Button
          size="small"
          variant="contained"
          onClick={() => router.push(`/admin/approvals/withdrawals/${value}`)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <Box>
      <Typography variant="h4" fontWeight={600} mb={3}>Withdrawal Approvals</Typography>
      
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search by member name"
            variant="outlined"
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
            sx={{ flexGrow: 1, minWidth: '200px' }}
          />
          
          <FormControl size="small" sx={{ width: '180px' }}>
            <InputLabel id="status-filter-label">Status</InputLabel>
            <Select
              labelId="status-filter-label"
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
              startAdornment={
                <InputAdornment position="start">
                  <FilterListIcon fontSize="small" />
                </InputAdornment>
              }
            >
              <MenuItem value="ALL">All Statuses</MenuItem>
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="IN_REVIEW">In Review</MenuItem>
              <MenuItem value="REVIEWED">Reviewed</MenuItem>
              <MenuItem value="APPROVED">Approved</MenuItem>
              <MenuItem value="REJECTED">Rejected</MenuItem>
              <MenuItem value="COMPLETED">Completed</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>
      
      {/* Data table */}
      <Paper sx={{ p: 0 }}>
        <DataTable
          columns={columns}
          data={approvals?.data || []}
          loading={isLoading}
          pagination={{
            pageCount: approvals?.meta?.totalPages || 0,
            pageIndex: page - 1,
            pageSize,
          }}
          onPageChange={(p) => setPage(p + 1)}
          onPageSizeChange={setPageSize}
        />
      </Paper>
      
      {/* Error handling */}
      {error && (
        <Box mt={2} p={2} bgcolor="error.light" borderRadius={1}>
          <Typography color="error">
            Error loading withdrawal approvals: {error.message || 'Unknown error'}
          </Typography>
        </Box>
      )}
    </Box>
  );
}