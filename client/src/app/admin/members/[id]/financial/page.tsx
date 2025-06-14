'use client';

import { useState } from 'react';
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

  // Fetch savings data
  const { data: savingsData, isLoading: isSavingsLoading } = useQuery({
    queryKey: ['member-savings', memberId, savingsPage, pageSize],
    queryFn: () => savingsService.getMemberSavings(memberId, savingsPage, pageSize),
    enabled: !!memberId && tabIndex === 0,
  });

  // Fetch loans data
  const { data: loansData, isLoading: isLoansLoading } = useQuery({
    queryKey: ['member-loans', memberId, loansPage, pageSize],
    queryFn: () => memberService.getMemberLoans(memberId, loansPage, pageSize),
    enabled: !!memberId && tabIndex === 1,
  });

  // Fetch shares data
  const { data: sharesData, isLoading: isSharesLoading } = useQuery({
    queryKey: ['member-shares', memberId, sharesPage, pageSize],
    queryFn: () => apiService.get(`/savings?biodataId=${memberId}&type=SHARE&page=${sharesPage}&limit=${pageSize}`),
    enabled: !!memberId && tabIndex === 2,
  });

  // Fetch transactions data
  const { data: transactionsData, isLoading: isTransactionsLoading } = useQuery({
    queryKey: ['member-transactions', memberId, transactionsPage, pageSize],
    queryFn: () => apiService.get(`/transactions/member/${memberId}?page=${transactionsPage}&limit=${pageSize}`),
    enabled: !!memberId && tabIndex === 3,
  });

  // Fetch financial summary
  const { data: financialSummary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['member-financial-summary', memberId],
    queryFn: () => memberService.getMemberFinancialSummary(memberId),
    enabled: !!memberId,
  });

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  // Prepare columns for each data type
  const savingsColumns: DataTableColumn<SavingsRecord>[] = [
    {
      Header: 'Date',
      accessor: 'createdAt',
      Cell: ({ value }) => new Date(value).toLocaleDateString(),
    },
    {
      Header: 'Type',
      accessor: 'type',
    },
    {
      Header: 'Amount',
      accessor: 'amount',
      Cell: ({ value }) => formatCurrency(value),
    },
    {
      Header: 'Reference',
      accessor: 'reference',
    },
    {
      Header: 'Status',
      accessor: 'status',
      Cell: ({ value }) => (
        <Chip 
          label={value || 'COMPLETED'} 
          color={value === 'COMPLETED' ? 'success' : 'default'}
          size="small"
        />
      ),
    },
  ];

  const loansColumns: DataTableColumn<Loan>[] = [
    {
      Header: 'Loan ID',
      accessor: 'id',
      Cell: ({ value }) => value.substring(0, 8),
    },
    {
      Header: 'Type',
      accessor: 'loanTypeName',
    },
    {
      Header: 'Amount',
      accessor: 'principalAmount',
      Cell: ({ value }) => formatCurrency(value),
    },
    {
      Header: 'Status',
      accessor: 'status',
      Cell: ({ value }) => (
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
      Header: 'Date',
      accessor: 'createdAt',
      Cell: ({ value }) => new Date(value).toLocaleDateString(),
    },
    {
      Header: 'Actions',
      accessor: 'id',
      Cell: ({ value }) => (
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

  const sharesColumns: DataTableColumn<any>[] = [
    {
      Header: 'Date',
      accessor: 'createdAt',
      Cell: ({ value }) => new Date(value).toLocaleDateString(),
    },
    {
      Header: 'Quantity',
      accessor: 'quantity',
      Cell: ({ value }) => value || 1,
    },
    {
      Header: 'Value per Share',
      accessor: 'shareValue',
      Cell: ({ value }) => formatCurrency(value || 5000),
    },
    {
      Header: 'Total Value',
      accessor: 'amount',
      Cell: ({ value }) => formatCurrency(value),
    },
    {
      Header: 'Reference',
      accessor: 'reference',
    },
  ];

  const transactionsColumns: DataTableColumn<Transaction>[] = [
    {
      Header: 'Date',
      accessor: 'createdAt',
      Cell: ({ value }) => new Date(value).toLocaleDateString(),
    },
    {
      Header: 'Type',
      accessor: 'type',
      Cell: ({ value }) => (
        <Chip 
          label={value} 
          color={
            value === 'DEPOSIT' ? 'success' :
            value === 'WITHDRAWAL' ? 'warning' :
            value === 'LOAN_REPAYMENT' ? 'info' :
            'default'
          }
          size="small"
        />
      ),
    },
    {
      Header: 'Amount',
      accessor: 'amount',
      Cell: ({ value }) => formatCurrency(value),
    },
    {
      Header: 'Reference',
      accessor: 'reference',
    },
    {
      Header: 'Status',
      accessor: 'status',
      Cell: ({ value }) => (
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
          src={member.profileImage}
        >
          {member.fullName?.charAt(0) || 'M'}
        </Avatar>
        <Box>
          <Typography variant="h4" component="h1" fontWeight={600}>
            {member.fullName}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            ERP ID: {member.erpId} | Member Since: {new Date(member.joinedDate).toLocaleDateString()}
          </Typography>
        </Box>
      </Box>

      {/* Financial Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
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
        
        <Grid item xs={12} sm={6} md={3}>
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
        
        <Grid item xs={12} sm={6} md={3}>
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
        
        <Grid item xs={12} sm={6} md={3}>
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
                totalRecords: savingsData?.meta?.totalCount || 0,
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
              data={loansData?.data || []}
              pagination={{
                pageIndex: loansPage - 1,
                pageSize: pageSize,
                pageCount: loansData?.meta?.totalPages || 1,
                totalRecords: loansData?.meta?.totalCount || 0,
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
              data={sharesData?.data || []}
              pagination={{
                pageIndex: sharesPage - 1,
                pageSize: pageSize,
                pageCount: sharesData?.meta?.totalPages || 1,
                totalRecords: sharesData?.meta?.totalCount || 0,
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
              data={transactionsData?.data || []}
              pagination={{
                pageIndex: transactionsPage - 1,
                pageSize: pageSize,
                pageCount: transactionsData?.meta?.totalPages || 1,
                totalRecords: transactionsData?.meta?.totalCount || 0,
              }}
              onPageChange={(newPage) => setTransactionsPage(newPage + 1)}
              loading={isTransactionsLoading}
              noDataMessage="No transactions found"
            />
          </PermissionGate>
        </TabPanel>
      </Paper>
    </Box>
  );
}