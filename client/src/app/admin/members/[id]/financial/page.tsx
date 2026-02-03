'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip,
  Avatar,
  CircularProgress,
  Alert
} from '@mui/material';
import { DataTable, DataTableColumn } from '@/components/organisms/DataTable';
import { Button } from '@/components/atoms/Button';
import PermissionGate from '@/components/atoms/PermissionGate';
import { formatCurrency } from '@/utils/formatting/format';
import { memberService } from '@/lib/api/services/memberService';
import { loanService } from '@/lib/api/services/loanService';
import { savingsService } from '@/lib/api/services/savingsService';
import { apiService } from '@/lib/api/apiService';
import { Module } from '@/types/permissions.types';
import { Loan } from '@/types/loan.types';
import { SavingsRecord } from '@/types/financial.types';
import { Transaction } from '@/types/transaction.types';

// Tab interface
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`financial-tabpanel-${index}`}
      aria-labelledby={`financial-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function MemberFinancialPage() {
  const params = useParams();
  const router = useRouter();
  const memberId = params?.id as string;
  const [tabIndex, setTabIndex] = useState(0);
  
  // Pagination states
  const [savingsPage, setSavingsPage] = useState(1);
  const [loansPage, setLoansPage] = useState(1);
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [sharesPage, setSharesPage] = useState(1);
  const pageSize = 10;
  
  // Fetch member data
  const { data: member, isLoading: isMemberLoading, error: memberError } = useQuery({
    queryKey: ['member', memberId],
    queryFn: () => memberService.getBiodataById(memberId),
    enabled: !!memberId,
  });

  // Get the member's erpId for filtering (available after member loads)
  const memberErpId = member?.erpId;

  // Fetch savings data - use erpId for filtering
  const { data: savingsData, isLoading: isSavingsLoading } = useQuery({
    queryKey: ['member-savings', memberErpId, savingsPage, pageSize],
    queryFn: () => savingsService.getAllSavings(savingsPage, pageSize, { erpId: memberErpId }),
    enabled: !!memberErpId && tabIndex === 0,
  });

  // Fetch loans data - use erpId for filtering
  const { data: loansData, isLoading: isLoansLoading } = useQuery<any>({
    queryKey: ['member-loans', memberErpId, loansPage, pageSize],
    queryFn: () => apiService.get(`/loans?erpId=${memberErpId}&page=${loansPage}&limit=${pageSize}`),
    enabled: !!memberErpId && tabIndex === 1,
  });

  // Fetch shares data - shares are embedded in savings records, so fetch savings with erpId
  const { data: sharesData, isLoading: isSharesLoading } = useQuery<any>({
    queryKey: ['member-shares', memberErpId, sharesPage, pageSize],
    queryFn: () => apiService.get(`/savings?erpId=${memberErpId}&page=${sharesPage}&limit=${pageSize}`),
    enabled: !!memberErpId && tabIndex === 2,
  });

  // Note: Transactions are extracted from savings records, not from a separate endpoint

  // Compute financial summary from savings data
  const financialSummary = useMemo(() => {
    if (!savingsData?.data || savingsData.data.length === 0) {
      return { totalSavings: 0, outstandingLoans: 0, sharesValue: 0, netPosition: 0 };
    }

    // Get the latest savings record (most recent month/year)
    const latestSavings = savingsData.data[0];
    const totalSavings = Number(latestSavings?.totalSavingsAmount || latestSavings?.balance || 0);
    // Shares is an array in the response - get from first item
    const sharesValue = Number(latestSavings?.shares?.[0]?.totalSharesAmount || 0);

    // Get outstanding loans from loans data if available
    const loansArray = loansData?.data?.data || [];
    const outstandingLoans = loansArray.reduce((sum: number, loan: any) => {
      if (loan.status === 'ACTIVE' || loan.status === 'DISBURSED') {
        return sum + Number(loan.remainingBalance || 0);
      }
      return sum;
    }, 0) || 0;

    const netPosition = totalSavings + sharesValue - outstandingLoans;

    return { totalSavings, outstandingLoans, sharesValue, netPosition };
  }, [savingsData, loansData]);

  const isSummaryLoading = isSavingsLoading || isLoansLoading;

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  // Prepare columns for each data type
  const savingsColumns: DataTableColumn<SavingsRecord>[] = [
    {
      id: 'period',
      label: 'Period',
      accessor: (row: any) => `${row.month}/${row.year}`,
      Cell: ({ row }: { row: any }) => {
        const month = row.original?.month;
        const year = row.original?.year;
        if (month && year) {
          const date = new Date(year, month - 1);
          return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }
        return '-';
      },
    },
    {
      id: 'balance',
      label: 'Monthly Amount',
      accessor: (row: any) => row.balance || 0,
      Cell: ({ value }: { value: any }) => formatCurrency(value),
    },
    {
      id: 'totalSavingsAmount',
      label: 'Total Savings',
      accessor: (row: any) => row.totalSavingsAmount || 0,
      Cell: ({ value }: { value: any }) => formatCurrency(value),
    },
    {
      id: 'status',
      label: 'Status',
      accessor: 'status',
      Cell: ({ value }: { value: any }) => (
        <Chip
          label={value || 'ACTIVE'}
          color={value === 'ACTIVE' ? 'success' : 'default'}
          size="small"
        />
      ),
    },
  ];

  const loansColumns: DataTableColumn<Loan>[] = [
    {
      id: 'id',
      label: 'Loan ID',
      accessor: 'id',
      Cell: ({ value }: { value: any }) => value.substring(0, 8),
    },
    {
      id: 'loanTypeName',
      label: 'Type',
      accessor: (row: any) => row.loanTypeName || row.loanType?.name || row.loanType || '-',
    },
    {
      id: 'principalAmount',
      label: 'Amount',
      accessor: 'principalAmount',
      Cell: ({ value }: { value: any }) => formatCurrency(value),
    },
    {
      id: 'status',
      label: 'Status',
      accessor: 'status',
      Cell: ({ value }: { value: any }) => (
        <Chip
          label={value}
          color={
            value === 'ACTIVE' ? 'primary' :
            value === 'COMPLETED' ? 'success' :
            value === 'DEFAULTED' ? 'error' :
            value === 'APPROVED' ? 'info' :
            value === 'PENDING' ? 'warning' :
            'default'
          }
          size="small"
        />
      ),
    },
    {
      id: 'createdAt',
      label: 'Date',
      accessor: 'createdAt',
      Cell: ({ value }: { value: any }) => new Date(value).toLocaleDateString(),
    },
    {
      id: 'actions',
      label: 'Actions',
      accessor: 'id',
      Cell: ({ value }: { value: any }) => (
        <PermissionGate permissions={['VIEW_LOANS']} module={Module.LOAN}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => router.push(`/admin/financial/loans/${value}`)}
          >
            View
          </Button>
        </PermissionGate>
      ),
    },
  ];

  // Shares columns - shares are embedded in savings records
  const sharesColumns: DataTableColumn<any>[] = [
    {
      id: 'period',
      label: 'Period',
      accessor: (row: any) => `${row.month}/${row.year}`,
      Cell: ({ row }: { row: any }) => {
        const month = row.original?.month;
        const year = row.original?.year;
        if (month && year) {
          const date = new Date(year, month - 1);
          return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }
        return '-';
      },
    },
    {
      id: 'monthlyAmount',
      label: 'Monthly Amount',
      accessor: (row: any) => row.shares?.[0]?.monthlyAmount || 0,
      Cell: ({ value }: { value: any }) => formatCurrency(value),
    },
    {
      id: 'totalSharesAmount',
      label: 'Total Shares Value',
      accessor: (row: any) => row.shares?.[0]?.totalSharesAmount || 0,
      Cell: ({ value }: { value: any }) => formatCurrency(value),
    },
    {
      id: 'status',
      label: 'Status',
      accessor: 'status',
      Cell: ({ value }: { value: any }) => (
        <Chip
          label={value || 'ACTIVE'}
          color={value === 'ACTIVE' ? 'success' : 'default'}
          size="small"
        />
      ),
    },
  ];

  // Extract all transactions from savings records for the transactions tab
  const allTransactions = useMemo(() => {
    if (!savingsData?.data) return [];
    return savingsData.data.flatMap((savings: any) =>
      (savings.transactions || []).map((tx: any) => ({
        ...tx,
        savingsPeriod: `${savings.month}/${savings.year}`,
      }))
    ).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [savingsData]);

  const transactionsColumns: DataTableColumn<Transaction>[] = [
    {
      id: 'createdAt',
      label: 'Date',
      accessor: 'createdAt',
      Cell: ({ value }: { value: any }) => value ? new Date(value).toLocaleDateString() : '-',
    },
    {
      id: 'transactionType',
      label: 'Type',
      accessor: 'transactionType',
      Cell: ({ value }: { value: any }) => (
        <Chip
          label={value?.replace(/_/g, ' ') || 'TRANSACTION'}
          color={
            value?.includes('DEPOSIT') || value?.includes('CREDIT') ? 'success' :
            value?.includes('WITHDRAWAL') || value?.includes('DEBIT') ? 'warning' :
            value?.includes('SHARES') ? 'info' :
            'default'
          }
          size="small"
        />
      ),
    },
    {
      id: 'amount',
      label: 'Amount',
      accessor: 'amount',
      Cell: ({ value }: { value: any }) => formatCurrency(value),
    },
    {
      id: 'description',
      label: 'Description',
      accessor: 'description',
      Cell: ({ value }: { value: any }) => value || '-',
    },
    {
      id: 'status',
      label: 'Status',
      accessor: 'status',
      Cell: ({ value }: { value: any }) => (
        <Chip
          label={value}
          color={
            value === 'COMPLETED' ? 'success' :
            value === 'PENDING' ? 'warning' :
            value === 'FAILED' ? 'error' :
            'default'
          }
          size="small"
        />
      ),
    },
  ];
  
  if (isMemberLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (memberError || !member) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Failed to load member details. Please try again later.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '100%', pt: 2, pb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Avatar
          sx={{ width: 64, height: 64, mr: 2 }}
          src={member.profilePhoto || undefined}
        >
          {member.fullName?.charAt(0) || 'M'}
        </Avatar>
        <Box>
          <Typography variant="h4" component="h1" fontWeight={600}>
            {member.fullName}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            ERP ID: {member.erpId} | Member Since: {new Date(member.createdAt).toLocaleDateString()}
          </Typography>
        </Box>
      </Box>

      {/* Financial Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Savings
              </Typography>
              <Typography variant="h5" component="div" fontWeight={600}>
                {isSummaryLoading ? <CircularProgress size={20} /> : formatCurrency(financialSummary?.totalSavings || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Current Loans
              </Typography>
              <Typography variant="h5" component="div" fontWeight={600}>
                {isSummaryLoading ? <CircularProgress size={20} /> : formatCurrency(financialSummary?.outstandingLoans || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Shares Value
              </Typography>
              <Typography variant="h5" component="div" fontWeight={600}>
                {isSummaryLoading ? <CircularProgress size={20} /> : formatCurrency(financialSummary?.sharesValue || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Net Position
              </Typography>
              <Typography variant="h5" component="div" fontWeight={600} color={
                (financialSummary?.netPosition || 0) >= 0 ? 'success.main' : 'error.main'
              }>
                {isSummaryLoading ? <CircularProgress size={20} /> : formatCurrency(financialSummary?.netPosition || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs for different financial data */}
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabIndex}
          onChange={handleTabChange}
          aria-label="Member financial tabs"
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Savings" />
          <Tab label="Loans" />
          <Tab label="Shares" />
          <Tab label="Transactions" />
        </Tabs>

        {/* Savings Tab */}
        <TabPanel value={tabIndex} index={0}>
          <PermissionGate permissions={['VIEW_SAVINGS']} module={Module.SAVINGS}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <PermissionGate permissions={['CREATE_SAVINGS']} module={Module.SAVINGS} approvalLevel={2}>
                <Button 
                  onClick={() => router.push(`/admin/financial/savings/new?memberId=${memberId}`)}
                >
                  Add Savings Entry
                </Button>
              </PermissionGate>
            </Box>

            <DataTable
              columns={savingsColumns}
              data={savingsData?.data || []}
              pagination={{
                pageIndex: savingsPage - 1,
                pageSize: pageSize,
                pageCount: savingsData?.meta?.totalPages || 1,
                totalRecords: savingsData?.meta?.total || 0,
              }}
              onPageChange={(newPage) => setSavingsPage(newPage + 1)}
              loading={isSavingsLoading}
              noDataMessage="No savings records found"
            />
          </PermissionGate>
        </TabPanel>

        {/* Loans Tab */}
        <TabPanel value={tabIndex} index={1}>
          <PermissionGate permissions={['VIEW_LOANS']} module={Module.LOAN}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <PermissionGate permissions={['CREATE_LOANS']} module={Module.LOAN} approvalLevel={2}>
                <Button 
                  onClick={() => router.push(`/admin/financial/loans/new?memberId=${memberId}`)}
                >
                  Create New Loan
                </Button>
              </PermissionGate>
            </Box>

            <DataTable
              columns={loansColumns}
              data={loansData?.data?.data || []}
              pagination={{
                pageIndex: loansPage - 1,
                pageSize: pageSize,
                pageCount: loansData?.data?.meta?.totalPages || 1,
                totalRecords: loansData?.data?.meta?.total || 0,
              }}
              onPageChange={(newPage) => setLoansPage(newPage + 1)}
              loading={isLoansLoading}
              noDataMessage="No loans found"
            />
          </PermissionGate>
        </TabPanel>

        {/* Shares Tab */}
        <TabPanel value={tabIndex} index={2}>
          <PermissionGate permissions={['VIEW_SHARES']} module={Module.SHARES}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <PermissionGate permissions={['ISSUE_SHARES']} module={Module.SHARES} approvalLevel={2}>
                <Button 
                  onClick={() => router.push(`/admin/financial/shares/issue?memberId=${memberId}`)}
                >
                  Issue Shares
                </Button>
              </PermissionGate>
            </Box>

            <DataTable
              columns={sharesColumns}
              data={sharesData?.data?.data || []}
              pagination={{
                pageIndex: sharesPage - 1,
                pageSize: pageSize,
                pageCount: sharesData?.data?.meta?.totalPages || 1,
                totalRecords: sharesData?.data?.meta?.total || 0,
              }}
              onPageChange={(newPage) => setSharesPage(newPage + 1)}
              loading={isSharesLoading}
              noDataMessage="No shares found"
            />
          </PermissionGate>
        </TabPanel>

        {/* Transactions Tab */}
        <TabPanel value={tabIndex} index={3}>
          <PermissionGate permissions={['VIEW_TRANSACTIONS']} module={Module.TRANSACTION}>
            <DataTable
              columns={transactionsColumns}
              data={allTransactions.slice((transactionsPage - 1) * pageSize, transactionsPage * pageSize)}
              pagination={{
                pageIndex: transactionsPage - 1,
                pageSize: pageSize,
                pageCount: Math.ceil(allTransactions.length / pageSize) || 1,
                totalRecords: allTransactions.length,
              }}
              onPageChange={(newPage) => setTransactionsPage(newPage + 1)}
              loading={isSavingsLoading}
              noDataMessage="No transactions found"
            />
          </PermissionGate>
        </TabPanel>
      </Paper>
    </Box>
  );
}