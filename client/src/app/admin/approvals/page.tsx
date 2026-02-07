'use client';

import { useState } from 'react';
import { useApprovals } from '@/lib/hooks/admin/useApprovals';
import { useAuth } from '@/lib/api/contexts/AuthContext';
import { Box, Typography, Paper, Tabs, Tab, Chip, Card, CardContent, Grid } from '@mui/material';
import { DataTable } from '@/components/organisms/DataTable';
import { Button } from '@/components/atoms/Button';
import { useRouter } from 'next/navigation';
import AssignmentIcon from '@mui/icons-material/Assignment';
import MoneyIcon from '@mui/icons-material/Money';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { formatCurrency } from '@/utils/formatting/format';

export default function ApprovalsPage() {
  const [requestType, setRequestType] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  const { data: approvals, isLoading, error } = useApprovals(requestType, page, pageSize);
  const router = useRouter();
  const { user } = useAuth();
  
  const handleTabChange = (_: React.SyntheticEvent, newValue: string | undefined) => {
    setRequestType(newValue);
    setPage(1); // Reset to first page when changing tabs
  };
  
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
  
  // Function to render request type specific details
  const renderRequestDetails = (row: any) => {
    switch (row.type) {
      case 'LOAN_APPLICATION':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <MoneyIcon sx={{ mr: 1, fontSize: 18, color: 'primary.main' }} />
            <Typography variant="body2">
              {formatCurrency(row.content?.amount || 0)} - {row.content?.loanType || 'Loan'}
            </Typography>
          </Box>
        );
      case 'SAVINGS_WITHDRAWAL':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AccountBalanceWalletIcon sx={{ mr: 1, fontSize: 18, color: 'primary.main' }} />
            <Typography variant="body2">
              Regular Savings Withdrawal - {formatCurrency(row.content?.amount || 0)}
            </Typography>
          </Box>
        );
      case 'PERSONAL_SAVINGS_CREATION':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AccountBalanceWalletIcon sx={{ mr: 1, fontSize: 18, color: 'primary.main' }} />
            <Typography variant="body2">
              Personal Savings Request
            </Typography>
          </Box>
        );
      case 'PERSONAL_SAVINGS_WITHDRAWAL':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AccountBalanceWalletIcon sx={{ mr: 1, fontSize: 18, color: 'primary.main' }} />
            <Typography variant="body2">
              Personal Savings Withdrawal - {formatCurrency(row.content?.amount || 0)}
            </Typography>
          </Box>
        );
      case 'BIODATA_APPROVAL':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PersonAddIcon sx={{ mr: 1, fontSize: 18, color: 'primary.main' }} />
            <Typography variant="body2">
              Biodata Approval - {row.biodata?.fullName || 'New Member'}
            </Typography>
          </Box>
        );
      case 'ACCOUNT_CREATION':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AssignmentIcon sx={{ mr: 1, fontSize: 18, color: 'primary.main' }} />
            <Typography variant="body2">
              New Member Registration - {row.biodata?.fullName || 'New Member'}
            </Typography>
          </Box>
        );
      case 'ACCOUNT_UPDATE':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PersonAddIcon sx={{ mr: 1, fontSize: 18, color: 'primary.main' }} />
            <Typography variant="body2">
              Acount Update
            </Typography>
          </Box>
        );
      default:
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AssignmentIcon sx={{ mr: 1, fontSize: 18, color: 'primary.main' }} />
            <Typography variant="body2">
              {row.type.replace(/_/g, ' ')}
            </Typography>
          </Box>
        );
    }
  };

  const columns = [
    {
      id: 'request',
      label: 'Request',
      accessor: (row: any) => renderRequestDetails(row),
    },
    {
      id: 'member',
      label: 'Member',
      accessor: (row: any) => row.biodata?.fullName || row.metadata?.member?.fullName || 'N/A',
    },
    {
      id: 'status',
      label: 'Status',
      accessor: (row: any) => (
        <Chip 
          label={row.status} 
          color={getStatusColor(row.status)}
          size="small"
        />
      ),
    },
    {
      id: 'requestedAt',
      label: 'Requested At',
      accessor: (row: any) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      id: 'priority',
      label: 'Priority',
      accessor: (row: any) => (
        <Chip 
          label={row.priority || 'NORMAL'} 
          color={row.priority === 'HIGH' ? 'error' : row.priority === 'MEDIUM' ? 'warning' : 'default'}
          size="small"
        />
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      accessor: (row: any) => (
        <Button
          size="small"
          variant="contained"
          color="primary"
          onClick={() => handleViewRequest(row)}
        >
          View
        </Button>
      ),
    },
  ];
  
  const handleViewRequest = (row: any) => {
    // Route based on request type
    switch (row.type) {
      case 'LOAN_APPLICATION':
        router.push(`/admin/approvals/loans/${row.id}`);
        break;
      case 'SAVINGS_WITHDRAWAL':
        router.push(`/admin/approvals/withdrawals/${row.id}`);
        break;
      case 'BIODATA_APPROVAL':
      case 'ACCOUNT_CREATION':
      case 'ACCOUNT_UPDATE':
        router.push(`/admin/approvals/members/${row.id}`);
        break;
      case 'PERSONAL_SAVINGS_CREATION':
      case 'PERSONAL_SAVINGS_WITHDRAWAL':
        router.push(`/admin/approvals/personal-savings/${row.id}`);
        break;
      default:
        // Generic request view - fallback to members route since most requests are member-related
        router.push(`/admin/approvals/members/${row.id}`);
    }
  };
  
  // Quick stats for approval summary
  // Debug the structure first
  console.log('ApprovalsPage Approvals data structure:', approvals);

  // Handle nested data structure properly
  const approvalList = Array.isArray(approvals) 
    ? approvals 
    : Array.isArray(approvals?.data) 
      ? approvals.data 
      : approvals?.data || [];

  console.log('Approval List:', approvalList);

  // Now safely use filter on the array
  const approvalSummary = {
    pending: Array.isArray(approvalList) 
      ? approvalList.filter((r: any) => r.status === 'PENDING').length 
      : 0,
    inReview: Array.isArray(approvalList) 
      ? approvalList.filter((r: any) => r.status === 'IN_REVIEW').length 
      : 0,
    reviewed: Array.isArray(approvalList) 
      ? approvalList.filter((r: any) => r.status === 'REVIEWED').length 
      : 0,
    highPriority: Array.isArray(approvalList) 
      ? approvalList.filter((r: any) => r.priority === 'HIGH').length 
      : 0,
  };
  
  return (
    <Box>
      <Typography variant="h4" fontWeight={600} mb={3}>Approval Dashboard</Typography>
      
      {/* Quick stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Typography color="text.secondary" variant="subtitle2" gutterBottom>
                Pending Approvals
              </Typography>
              <Typography variant="h5" fontWeight={600} color="primary.main">
                {approvalSummary.pending}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Typography color="text.secondary" variant="subtitle2" gutterBottom>
                In Review
              </Typography>
              <Typography variant="h5" fontWeight={600} color="info.main">
                {approvalSummary.inReview}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Typography color="text.secondary" variant="subtitle2" gutterBottom>
                Reviewed
              </Typography>
              <Typography variant="h5" fontWeight={600} color="secondary.main">
                {approvalSummary.reviewed}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Typography color="text.secondary" variant="subtitle2" gutterBottom>
                High Priority
              </Typography>
              <Typography variant="h5" fontWeight={600} color="error.main">
                {approvalSummary.highPriority}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={requestType} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab label="All Requests" value={undefined} />
          <Tab label="Loans" value="LOAN_APPLICATION" />
          <Tab label="Member Registration" value="BIODATA_UPDATE" />
          <Tab label="Withdrawals" value="SAVINGS_WITHDRAWAL" />
        </Tabs>
      </Paper>
      
      <Paper sx={{ p: 0 }}>
        <DataTable
          columns={columns}
          data={approvals?.data || []}
          pagination={{
            pageIndex: page - 1,
            pageSize,
            pageCount: approvals?.meta?.totalPages || 0,
            totalRecords: approvals?.meta?.total || 0,
          }}
          onPageChange={(p) => setPage(p + 1)}
          onPageSizeChange={setPageSize}
          loading={isLoading}
          error={error?.message}
        />
      </Paper>
    </Box>
  );
}