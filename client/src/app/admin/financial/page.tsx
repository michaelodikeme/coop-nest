"use client"

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataTable, DataTableColumn } from '@/components/organisms/DataTable';
import { Button } from '@/components/atoms/Button';
import { Modal } from '@/components/molecules/Modal';
import { Alert } from '@/components/atoms/Alert';
import PermissionGate from '@/components/atoms/PermissionGate';
import { Box, Typography, CircularProgress } from '@mui/material';
import {
  BanknotesIcon,
  ArrowTrendingUpIcon,
  BuildingLibraryIcon,
  DocumentCheckIcon,
} from '@heroicons/react/24/outline';
import { apiService } from '@/lib/api/apiService';
import { loanService } from '@/lib/api/services/loanService';
import { savingsService } from '@/lib/api/services/savingsService';
import { requestService } from '@/lib/api/services/requestService';
import { formatCurrency } from '@/utils/formatting/format';
import { Module } from '@/types/permissions.types';
import { 
  useAdminSavingsSummary,
  useAdminLoansSummary
} from '@/lib/hooks/admin/useAdminFinancial';

interface Transaction {
  id: string;
  type: 'LOAN' | 'DEPOSIT' | 'WITHDRAWAL' | 'SHARE';
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  memberId: string;
  memberName: string;
  date: string;
}

function useAdminPendingApprovals() {
  return useQuery({
    queryKey: ['admin-pending-approvals'],
    queryFn: async () => {
      try {
        return await requestService.getPendingRequestCount();
      } catch (error) {
        console.error('Failed to fetch pending approvals:', error);
        throw error;
      }
    }
  });
}

function useTransactions(page = 1, limit = 10) {
  return useQuery({
    queryKey: ['transactions', page, limit],
    queryFn: async () => {
      try {
        const response = await apiService.get<Transaction[]>(`/transactions?page=${page}&limit=${limit}`);
        return response;
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
        throw error;
      }
    }
  });
}

const StatusBadge = ({ status }: { status: Transaction['status'] }) => {
  const styles = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        styles[status]
      }`}
    >
      {status}
    </span>
  );
};

const FinancialCard = ({
  title,
  value,
  trend,
  icon: Icon,
  isLoading = false,
}: {
  title: string;
  value: string;
  trend?: string;
  icon: typeof BanknotesIcon;
  isLoading?: boolean;
}) => (
  <div className="bg-white overflow-hidden shadow rounded-lg">
    <div className="p-5">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <Icon className="h-6 w-6 text-gray-400" aria-hidden="true" />
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">
              {title}
            </dt>
            <dd className="flex items-baseline">
              {isLoading ? (
                <CircularProgress size={20} />
              ) : (
                <>
                  <div className="text-2xl font-semibold text-gray-900">{value}</div>
                  {trend && (
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      {trend}
                    </div>
                  )}
                </>
              )}
            </dd>
          </dl>
        </div>
      </div>
    </div>
  </div>
);

export default function FinancialServicesPage() {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Fetch financial data using our hooks
  const { data: savingsSummary, isLoading: isLoadingSavings } = useAdminSavingsSummary();
  const { data: loansSummary, isLoading: isLoadingLoans } = useAdminLoansSummary();
  const { data: pendingApprovals, isLoading: isLoadingApprovals } = useAdminPendingApprovals();
  const { data: transactions, isLoading, error } = useTransactions(currentPage, pageSize);

  const columns: DataTableColumn<Transaction>[] = [
    {
      Header: 'Member',
      accessor: 'memberName',
      filterable: true,
    },
    {
      Header: 'Type',
      accessor: 'type',
      filterable: true,
      Cell: ({ value }) => (
        <span className="capitalize">{value.toLowerCase()}</span>
      ),
    },
    {
      Header: 'Amount',
      accessor: 'amount',
      align: 'right',
      Cell: ({ value }) => (
        <span className="font-medium">
          ${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      Header: 'Status',
      accessor: 'status',
      align: 'center',
      Cell: ({ value }) => <StatusBadge status={value} />,
      filterable: true,
    },
    {
      Header: 'Date',
      accessor: 'date',
      Cell: ({ value }) => (
        <span>{new Date(value).toLocaleDateString()}</span>
      ),
      filterable: true,
    },
    {
      Header: 'Actions',
      accessor: 'id',
      align: 'right',
      filterable: false,
      Cell: ({ row: { original } }) => (
        <PermissionGate permissions={['REVIEW_TRANSACTIONS']} approvalLevel={2}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => setSelectedTransaction(original)}
          >
            Review
          </Button>
        </PermissionGate>
      ),
    },
  ];

  if (error) {
    return (
        <Alert
          variant="error"
          title="Error"
          message="Failed to load financial data. Please try again later."
        />
    );
  }

  return (
    <Box sx={{ maxWidth: '100%', pt: 2, pb: 4 }}>
      <Typography variant="h4" component="h1" fontWeight={600} mb={4}>
        Financial Services
      </Typography>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <FinancialCard
          icon={BanknotesIcon}
          title="Total Loans Outstanding"
          value={isLoadingLoans ? "Loading..." : formatCurrency(loansSummary?.totalOutstanding || 0)}
          trend={"+12.5% from last month"}
          isLoading={isLoadingLoans}
        />
        <FinancialCard
          icon={ArrowTrendingUpIcon}
          title="Monthly Deposits"
          value={isLoadingSavings ? "Loading..." : formatCurrency(savingsSummary?.monthlyDeposits || 0)}
          trend={"+5.3% from last month"}
          isLoading={isLoadingSavings}
        />
        <FinancialCard
          icon={BuildingLibraryIcon}
          title="Total Savings"
          value={isLoadingSavings ? "Loading..." : formatCurrency(savingsSummary?.totalSavings || 0)}
          trend={"+8.2% from last month"}
          isLoading={isLoadingSavings}
        />
        <FinancialCard
          icon={DocumentCheckIcon}
          title="Pending Approvals"
          value={isLoadingApprovals ? "Loading..." : String(pendingApprovals || 0)}
          isLoading={isLoadingApprovals}
        />
      </div>

      <div className="mt-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h2 className="text-xl font-semibold text-gray-900">
              Recent Transactions
            </h2>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-2">
            <PermissionGate permissions={['MANAGE_LOANS']} module={Module.LOAN} approvalLevel={2}>
              <Button 
                variant="outlined" 
                onClick={() => window.location.href = "/admin/financial/loans/new"}
              >
                New Loan
              </Button>
            </PermissionGate>
            <PermissionGate permissions={['MANAGE_SHARES']} module={Module.SHARES} approvalLevel={2}>
              <Button 
                variant="outlined" 
                onClick={() => window.location.href = "/admin/financial/shares/issue"}
              >
                Issue Shares
              </Button>
            </PermissionGate>
          </div>
        </div>

        <div className="mt-4">
          <DataTable
            columns={columns}
            data={transactions || []}
            pagination={{
              pageIndex: currentPage - 1,
              pageSize: pageSize,
              pageCount: transactions?.meta?.totalPages || 1,
              totalRecords: transactions?.meta?.totalCount || 0,
            }}
            onPageChange={(newPage) => setCurrentPage(newPage + 1)}
            onPageSizeChange={setPageSize}
            loading={isLoading}
            filtering
          />
        </div>
      </div>

      {/* Transaction Review Modal */}
      <Modal
        isOpen={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        title="Review Transaction"
        maxWidth="lg"
      >
        {selectedTransaction && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Member</h4>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedTransaction.memberName}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Amount</h4>
                <p className="mt-1 text-sm text-gray-900">
                  ${selectedTransaction.amount.toLocaleString('en-US')}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Transaction Type</h4>
                <p className="mt-1 text-sm text-gray-900 capitalize">
                  {selectedTransaction.type.toLowerCase()}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Date</h4>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(selectedTransaction.date).toLocaleString()}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Status</h4>
                <StatusBadge status={selectedTransaction.status} />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <Button variant="outlined" onClick={() => setSelectedTransaction(null)}>
                Cancel
              </Button>
              <PermissionGate permissions={['REJECT_TRANSACTIONS']} approvalLevel={2}>
                <Button variant="contained" color="error">Reject</Button>
              </PermissionGate>
              <PermissionGate permissions={['APPROVE_TRANSACTIONS']} approvalLevel={2}>
                <Button>Approve</Button>
              </PermissionGate>
            </div>
          </div>
        )}
      </Modal>
    </Box>
  );
}
