"use client";

import { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  CardHeader,
  Tabs,
  Tab,
  Button,
  Chip
} from '@mui/material';
import { DataTable } from '@/components/organisms/DataTable';
import { useAdminPersonalSavingsPlans, useAdminPersonalSavingsDashboard } from '@/lib/hooks/admin/useAdminPersonalSavings';
import { formatCurrency } from '@/utils/formatting/format';
import { PersonalSavingsResponse, PersonalSavingsStatus } from '@/types/personal-savings.types';
import Link from 'next/link';
import { Add as AddIcon, ArrowForward as ArrowForwardIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import React from 'react';

const PersonalSavingsAdminPage = () => {
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [status, setStatus] = useState<string>('ACTIVE');
  const [tabValue, setTabValue] = useState<number>(0);
  const router = useRouter();

  // Fetch dashboard data
  const {
    data: dashboardData,
    isLoading: isDashboardLoading
  } = useAdminPersonalSavingsDashboard();

  const summaryData = dashboardData;

  // Fetch plans with current filters
  const { 
    data: plansData, 
    isLoading: isPlansLoading, 
    error: plansError 
  } = useAdminPersonalSavingsPlans({
    page: page + 1, // API expects 1-indexed pages
    limit: pageSize,
    status: status === 'ALL' ? undefined : status,
  });

  const columns = [
    {
      id: 'erpId',
      label: 'ERP ID',
      accessor: (row: any) => {
        // More robust way to access erpId that handles different data structures
        if (row.erpId) return row.erpId;
        if (row.member?.erpId) return row.member.erpId;
        return 'N/A';
      },
      align: 'left' as const,
      Cell: ({ value }: { value: string }) => {
        // Don't render a link for N/A values
        if (value === 'N/A') {
          return <Typography variant="body2">{value}</Typography>;
        }
        
        return (
          <Link href={`/admin/members/${value}`}>
            <Typography variant="body2" color="primary">
              {value}
            </Typography>
          </Link>
        );
      }
    },
    {
      id: 'member',
      label: 'Member',
      accessor: (row: any) => row.member?.name || 'N/A',
      align: 'left' as const,
    },
    {
      id: 'planName',
      label: 'Plan Name',
      accessor: (row: PersonalSavingsResponse) => row.planName,
      align: 'left' as const,
    },
    {
      id: 'currentBalance',
      label: 'Current Balance',
      accessor: (row: PersonalSavingsResponse) => row.currentBalance,
      align: 'right' as const,
      format: (value: number) => formatCurrency(value),
    },
    {
      id: 'targetAmount',
      label: 'Target',
      accessor: (row: PersonalSavingsResponse) => row.targetAmount,
      align: 'right' as const,
      format: (value: number | null) => value ? formatCurrency(value) : 'N/A',
    },
    {
      id: 'status',
      label: 'Status',
      accessor: (row: PersonalSavingsResponse) => row.status,
      align: 'center' as const,
      Cell: ({ value, row }: { value: PersonalSavingsStatus, row: { original: PersonalSavingsResponse } }) => {
        // Check if this is a pending request with a requestId
        if (row.original.requestId) {
          // Get the request status (may be different than plan status)
          const requestStatus = row.original.requestStatus || 'PENDING';
          
          // Map request status to display information
          switch (requestStatus) {
            case 'PENDING':
              return <Chip label="Pending Approval" color="warning" size="small" />;
            case 'IN_REVIEW':
              return <Chip label="In Review" color="info" size="small" />;
            case 'REVIEWED':
              return <Chip label="Reviewed" color="secondary" size="small" />;
            case 'APPROVED':
              return <Chip label="Approved" color="success" size="small" />;
            case 'REJECTED':
              return <Chip label="Rejected" color="error" size="small" />;
            default:
              return <Chip label={requestStatus} color="default" size="small" />;
          }
        }
        
        // Regular plan status display (for non-requests)
        let color = '';
        switch (value) {
          case PersonalSavingsStatus.ACTIVE:
            color = 'success.main';
            break;
          case PersonalSavingsStatus.CLOSED:
            color = 'text.disabled';
            break;
          case PersonalSavingsStatus.PENDING:
            color = 'primary.main';
            break;
          case PersonalSavingsStatus.SUSPENDED:
            color = 'warning.main';
            break;
          default:
            color = 'info.main';
        }

        return (
          <Typography variant="body2" sx={{ color }}>
            {value}
          </Typography>
        );
      }
    },
    {
      id: 'actions',
      label: 'Actions',
      accessor: (row: PersonalSavingsResponse) => row.id,
      align: 'right' as const,
      Cell: ({ value, row }: { value: string, row: { original: PersonalSavingsResponse } }) => {
        // Check if it's a pending request (has a requestId and is pending)
        const isPendingRequest = row.original.requestId && 
          (row.original.status === PersonalSavingsStatus.PENDING);
        
        return (
          <Button
            variant="outlined"
            size="small"
            color={isPendingRequest ? "primary" : "inherit"}
            endIcon={<ArrowForwardIcon />}
            onClick={() => {
              if (isPendingRequest && row.original.requestId) {
                // For pending requests, route to the request details page
                router.push(`/admin/approvals/personal-savings/${row.original.requestId}`);
              } else {
                // For active/other plans, route to the plan details page
                router.push(`/admin/financial/personal-savings/${value}`);
              }
            }}
          >
            {isPendingRequest ? "View Request" : "View Plan"}
          </Button>
        );
      }
    }
  ];

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setPage(0); // Reset to first page when switching tabs
    switch(newValue) {
      case 0:
        setStatus('ACTIVE');
        break;
      case 1:
        setStatus('PENDING');
        break;
      case 2:
        setStatus('CLOSED');
        break;
      case 3:
        setStatus('ALL');
        break;
      default:
        setStatus('ACTIVE');
    }
  };

  // Inside your component, add this effect to log the data structure
  React.useEffect(() => {
    if (plansData?.data && plansData.data.length > 0) {
      console.log('Sample personal savings plan data structure:', plansData.data[0]);
    }
  }, [plansData?.data]);

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Personal Savings Management
      </Typography>

      {/* Dashboard Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div" color="text.secondary" gutterBottom>
                Active Plans
              </Typography>
              <Typography variant="h4" component="div">
                {isDashboardLoading ? '...' : summaryData?.activePlansCount || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div" color="text.secondary" gutterBottom>
                Total Savings
              </Typography>
              <Typography variant="h4" component="div">
                {isDashboardLoading ? '...' : 
                  formatCurrency(summaryData?.totalSavingsAmount || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div" color="text.secondary" gutterBottom>
                Total Withdrawals
              </Typography>
              <Typography variant="h4" component="div">
                {isDashboardLoading ? '...' : 
                  formatCurrency(summaryData?.totalWithdrawalAmount || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div" color="text.secondary" gutterBottom>
                Pending Requests
              </Typography>
              <Typography variant="h4" component="div">
                {isDashboardLoading ? '...' : 
                  (summaryData?.pendingCreationRequests || 0) + 
                  (summaryData?.pendingWithdrawalRequests || 0)}
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Link href="/admin/approvals/personal-savings">
                  <Button size="small" endIcon={<ArrowForwardIcon />}>
                    View requests
                  </Button>
                </Link>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Plans List */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Active" />
            <Tab label="Pending" />
            <Tab label="Closed" />
            <Tab label="All" />
          </Tabs>
        </Box>
        
        <DataTable
          columns={columns}
          data={plansData?.data || []}
          loading={isPlansLoading}
          error={plansError?.message}
          pagination={{
            pageIndex: page,
            pageSize: pageSize,
            pageCount: plansData?.meta?.totalPages || 0,
            totalRecords: plansData?.meta?.total || 0
          }}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          enableFiltering={false}
          headerBackgroundColor={theme => theme.palette.mode === 'dark' ? '#333' : '#f5f5f5'}
          onRowClick={(row) => {
            // Check if it's a pending request (has requestId but no id)
            if (row.requestId && !row.id) {
              router.push(`/admin/approvals/personal-savings/${row.requestId}`);
            } else if (row.id) {
              router.push(`/admin/financial/personal-savings/${row.id}`);
            }
          }}
          noDataMessage="No personal savings plans found"
        />
      </Paper>

      {/* Recent Transactions */}
      {dashboardData?.recentTransactions && dashboardData.recentTransactions.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" component="h2" gutterBottom>
            Recent Transactions
          </Typography>
          
          {/* Show recent transactions here */}
          {/* You could use another DataTable here or create a simpler transaction list */}
        </Paper>
      )}
    </Box>
  );
};

export default PersonalSavingsAdminPage;
