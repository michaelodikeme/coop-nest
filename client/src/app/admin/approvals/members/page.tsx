'use client';

import { useState } from 'react';
import { useApprovals } from '@/lib/hooks/admin/useApprovals';
import { Box, Typography, Paper, Chip, Grid, Card, CardContent } from '@mui/material';
import { DataTable } from '@/components/organisms/DataTable';
import { Button } from '@/components/atoms/Button';
import { useRouter } from 'next/navigation';
import PermissionGate from '@/components/atoms/PermissionGate';
import { Module } from '@/types/permissions.types';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import QueryBuilderIcon from '@mui/icons-material/QueryBuilder';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

export default function MemberApprovalsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  
  // Get the data from the hook
  const { data: approvals, isLoading, error } = useApprovals(
    'ACCOUNT_CREATION',
    page,
    pageSize,
    statusFilter
  );
  
  const router = useRouter();
  
  // Function to get color based on status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'IN_REVIEW': return 'info';
      case 'REVIEWED': return 'secondary';
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'error';
      case 'COMPLETED': return 'default';
      default: return 'default';
    }
  };
  
  // Access the members directly without the nested .data
  const members = approvals?.data || [];
  const meta = approvals?.data?.meta || { totalCount: 0, totalPages: 0 };
  
  // For statistics
  const countStatus = (status: string): number => {
    return Array.isArray(members) 
    ? members.filter(item => item.status === status).length 
    : 0;
  };
  
  // Fixed statistics calculations
  const statistics = {
    pending: countStatus('PENDING'),
    inReview: countStatus('IN_REVIEW'),
    reviewed: countStatus('REVIEWED'),
    approved: countStatus('APPROVED'),
    rejected: countStatus('REJECTED'),
    completed: countStatus('COMPLETED'),
    total: Array.isArray(approvals?.data?.data) ? approvals.data.data.length : 0
  };
  
  const columns = [
    {
      id: 'erpId',
      label: 'ERP ID',
      accessor: (row: any) => row.biodata?.erpId || row.metadata?.biodata?.erpId || 'N/A',
    },
    {
      id: 'fullName',
      label: 'Name',
      accessor: (row: any) => {
        const biodata = row.biodata || row.metadata?.biodata || {};
        return `${biodata.fullName || ''} ${biodata.lastName || ''}`.trim() || 'N/A';
      },
    },
    {
      id: 'department',
      label: 'Department',
      accessor: (row: any) => row.biodata?.department || row.metadata?.biodata?.department || 'N/A',
    },
    {
      id: 'status',
      label: 'Status',
      accessor: (row: any) => row.status,
      Cell: ({ value }: { value: string }) => (
        <Chip 
        label={value} 
        color={getStatusColor(value)}
        size="small"
        />
      ),
    },
    {
      id: 'registrationDate',
      label: 'Registration Date',
      accessor: (row: any) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      id: 'actions',
      label: 'Actions',
      accessor: (row: any) => row.id,
      Cell: ({ value, row }: { value: string, row: any }) => (
        <Button
        size="small"
        variant="contained"
        color="primary"
        onClick={() => router.push(`/admin/approvals/members/${value}`)}
        >
        Review
        </Button>
      ),
    },
  ];
  
  return (
    <Box>
    <Typography variant="h4" fontWeight={600} mb={2}>Member Registration Approvals</Typography>
    <Typography variant="body1" color="text.secondary" mb={4}>
    Review and approve new member registrations.
    </Typography>
    
    {/* Statistics cards */}
    <Grid container spacing={3} mb={4}>
    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
    <Card sx={{ bgcolor: 'warning.light' }}>
    <CardContent>
    <Box display="flex" alignItems="center" mb={1}>
    <QueryBuilderIcon sx={{ color: 'warning.main', mr: 1 }} />
    <Typography variant="h6" color="warning.main">Pending</Typography>
    </Box>
    <Typography variant="h4" fontWeight={600}>
    {statistics.pending}
    </Typography>
    </CardContent>
    </Card>
    </Grid>
    
    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
    <Card sx={{ bgcolor: 'primary.light' }}>
    <CardContent>
    <Box display="flex" alignItems="center" mb={1}>
    <PersonAddIcon sx={{ color: 'primary.main', mr: 1 }} />
    <Typography variant="h6" color="primary.main">Total</Typography>
    </Box>
    <Typography variant="h4" fontWeight={600}>
    {statistics.total}
    </Typography>
    </CardContent>
    </Card>
    </Grid>
    
    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
    <Card sx={{ bgcolor: 'success.light' }}>
    <CardContent>
    <Box display="flex" alignItems="center" mb={1}>
    <CheckCircleIcon sx={{ color: 'success.main', mr: 1 }} />
    <Typography variant="h6" color="success.main">Approved</Typography>
    </Box>
    <Typography variant="h4" fontWeight={600}>
    {statistics.approved}
    </Typography>
    </CardContent>
    </Card>
    </Grid>
    
    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
    <Card sx={{ bgcolor: 'error.light' }}>
    <CardContent>
    <Box display="flex" alignItems="center" mb={1}>
    <CancelIcon sx={{ color: 'error.main', mr: 1 }} />
    <Typography variant="h6" color="error.main">Rejected</Typography>
    </Box>
    <Typography variant="h4" fontWeight={600}>
    {statistics.rejected}
    </Typography>
    </CardContent>
    </Card>
    </Grid>
    </Grid>
    
    <PermissionGate permissions={['APPROVE_MEMBERS']} module={Module.ACCOUNT} approvalLevel={2}>
    <Paper sx={{ p: 0 }}>
    <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
    <Typography variant="h6">Member Registration Requests</Typography>
    </Box>
    
    <DataTable
    columns={columns}
    data={members}
    pagination={{
      pageIndex: page - 1,
      pageSize,
      pageCount: meta.totalPages || 0,
      totalRecords: meta.totalCount || 0,
    }}
    onPageChange={(p) => setPage(p + 1)}
    onPageSizeChange={setPageSize}
    loading={isLoading}
    error={error?.message}
    />
    </Paper>
    </PermissionGate>
    </Box>
  );
}