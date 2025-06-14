'use client';

import { useState } from 'react';
import { DataTable, DataTableColumn } from '@/components/organisms/DataTable';
import { Button } from '@/components/atoms/Button';
import { Alert } from '@/components/atoms/Alert';
import { Modal } from '@/components/molecules/Modal';
import { BankAccountForm } from '@/components/organisms/admin/members/forms/BankAccountForm';
import type { BankAccount } from '@/types/account.types';
import PermissionGate from '@/components/atoms/PermissionGate';
import { useAccounts } from '@/lib/hooks/member/useAccounts';
import { useMembers } from '@/lib/hooks/admin/useMembers';
import { useRouter } from 'next/navigation';
import { Box, Typography, Paper } from '@mui/material';

interface BankAccountWithOwner extends BankAccount {
  member: {
    id: string;
    firstName: string;
    lastName: string;
    erpId: string;
  };
}

const VerificationStatusBadge = ({ isVerified }: { isVerified: boolean }) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      isVerified
        ? 'bg-green-100 text-green-800'
        : 'bg-yellow-100 text-yellow-800'
    }`}
  >
    {isVerified ? 'Verified' : 'Pending'}
  </span>
);

export default function BankAccountsPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<BankAccountWithOwner | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({});
  const [errorMsg, setErrorMsg] = useState<string | undefined>();
  const router = useRouter();

  // Fetch all accounts with member info
  const {
    accounts,
    pagination,
    isLoading,
    error,
    addAccount,
    isAdding,
    updateAccount,
    isUpdating,
    setError
  } = useAccounts({
    page: currentPage,
    limit: pageSize,
    filters
  });

  // Optionally, fetch all members for filtering/search
  // const { members } = useMembers();

  const columns: DataTableColumn<BankAccountWithOwner>[] = [
    {
      label: 'Member',
      accessor: (row: BankAccountWithOwner) => <Button variant="text" onClick={() => router.push(`/admin/members/${row.member.id}`)}>
        {row.member.firstName} {row.member.lastName}
      </Button>,
      id: ''
    },
    {
      label: 'ERP ID',
      accessor: (row: BankAccountWithOwner) => row.member.erpId,
      id: ''
    },
    {
      label: 'Account Number',
      accessor: 'accountNumber',
      id: ''
    },
    {
      label: 'Bank',
      accessor: 'bankName',
      id: ''
    },
    {
      label: 'Type',
      accessor: 'accountType',
      id: ''
    },
    {
      label: 'Status',
      accessor: 'isVerified',
      Cell: ({ value }: { value: boolean; }) => (
        <VerificationStatusBadge isVerified={value} />
      ),
      id: ''
    },
    {
      label: 'Primary',
      accessor: 'isPrimary',
      Cell: ({ value }: { value: boolean }) => (
        value ? '✓' : '-'
      ),
      id: ''
    },
    {
      label: 'Actions',
      accessor: 'id',
      Cell: ({ row }: { value: any; row: BankAccountWithOwner; }) => (
        <div className="flex space-x-2">
          <PermissionGate permissions={['VERIFY_ACCOUNTS']} approvalLevel={2}>
            <Button
              size="small"
              variant={row.isVerified ? 'outlined' : 'contained'}
              onClick={() => updateAccount({
                id: row.id,
                updatedDetails: { isVerified: !row.isVerified }
              })}
            >
              {row.isVerified ? 'Unverify' : 'Verify'}
            </Button>
          </PermissionGate>
          <PermissionGate permissions={['MANAGE_ACCOUNTS']}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setSelectedAccount(row)}
            >
              Edit
            </Button>
          </PermissionGate>
        </div>
      ),
      id: ''
    },
  ];

  return (
    <Box className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <Box className="flex justify-between items-center mb-6">
        <Box>
          <Typography variant="h4" fontWeight={600}>
            Bank Accounts
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage member bank accounts and verification status.
          </Typography>
        </Box>
        <PermissionGate permissions={['MANAGE_ACCOUNTS']}>
          <Button onClick={() => setIsAddModalOpen(true)}>
            Add New Account
          </Button>
        </PermissionGate>
      </Box>
      {error && (
        <Alert
          variant="error"
          title="Error"
          message={error}
          className="mb-4"
        />
      )}
      {errorMsg && (
        <Alert
          variant="error"
          title="Error"
          message={errorMsg}
          className="mb-4"
        />
      )}
      <Paper className="bg-white shadow rounded-lg">
        <DataTable
          columns={columns as any}
          data={accounts as any[]}
          pagination={{
            pageIndex: currentPage,
            pageSize: pageSize,
            pageCount: pagination?.totalPages ?? 0,
            totalRecords: pagination?.totalItems
          }}
          loading={isLoading}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </Paper>
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setError(null);
          setErrorMsg(undefined);
        }}
        title="Add New Bank Account"
      >
        <BankAccountForm
          onSubmit={addAccount}
          isLoading={isAdding}
          error={error || errorMsg}
        />
      </Modal>
      <Modal
        isOpen={!!selectedAccount}
        onClose={() => {
          setSelectedAccount(null);
          setError(null);
          setErrorMsg(undefined);
        }}
        title="Edit Bank Account"
      >
        {selectedAccount && (
          <BankAccountForm
            onSubmit={(data) =>
              updateAccount({
                id: selectedAccount.id,
                updatedDetails: data
              })
            }
            isLoading={isUpdating}
            error={error || errorMsg}
            initialData={selectedAccount}
          />
        )}
      </Modal>
    </Box>
  );
}
