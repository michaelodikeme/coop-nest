'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { DataTable, DataTableColumn } from '@/components/organisms/DataTable';
import { Column } from 'react-table';
import { Button } from '@/components/atoms/Button';
import { Modal } from '@/components/molecules/Modal';
import { BankAccountForm } from '@/components/organisms/admin/members/forms/BankAccountForm';
import type { Member } from '@/types/member.types';
import type { BankAccount } from '@/types/account.types';
import { apiService } from '@/lib/api/apiService';
import PermissionGate from '@/components/atoms/PermissionGate';

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

export default function MemberBankAccountsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [error, setError] = useState<string>();

  const { data: member, isLoading: isFetchingMember } = useQuery<Member>({
    queryKey: ['member', params.id],
    queryFn: async () => {
      const response = await apiService.get<{ data: Member }>(`/biodata/${params.id}`);
      return (response as { data: Member }).data;
    },
  });
  const { mutate: addAccount, isPending: isAdding } = useMutation({
    mutationFn: async (data: Omit<BankAccount, 'id' | 'isVerified'>) => {
      const response = await apiService.post<{ data: BankAccount }>(`/biodata/${params.id}/accounts`, data);
      return (response as { data: BankAccount }).data;
    },
    onSuccess: () => {
      setIsAddModalOpen(false);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const { mutate: updateAccount, isPending: isUpdating } = useMutation({
    mutationFn: async (data: Partial<BankAccount> & { id: string }) => {
      const response = await apiService.put<{ data: BankAccount }>(`/accounts/${data.id}`, data);
      return (response as { data: BankAccount }).data;
    },
    onSuccess: () => {
      setSelectedAccount(null);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });
  const columns: Column<BankAccount>[] = [
    {
      Header: 'Account Number',
      accessor: 'accountNumber',
      filterable: true,
    },
    {
      Header: 'Bank',
      accessor: 'bankName',
      filterable: true,
    },
    {
      Header: 'Type',
      accessor: 'accountType',
      filterable: true,
    },
    {
      Header: 'Status',
      accessor: 'isVerified',
      Cell: ({ value }) => <VerificationStatusBadge isVerified={value} />,
      filterable: false,
    },
    {
      Header: 'Primary',
      accessor: 'isPrimary',
      Cell: ({ value }) => (value ? '✓' : '-'),
      filterable: false,
      align: 'center',
    },
    {
      Header: 'Actions',
      accessor: 'id',
      Cell: ({ row: { original } }) => (
        <div className="flex space-x-2">
          <PermissionGate permissions={['VERIFY_ACCOUNTS']} approvalLevel={2}>
            <Button
              size="small"
              variant={original.isVerified ? 'outlined' : 'contained'}
              onClick={() =>
                updateAccount({
                  id: original.id,
                  isVerified: !original.isVerified,
                })
              }
            >
              {original.isVerified ? 'Unverify' : 'Verify'}
            </Button>
          </PermissionGate>
          <Button
            size="small"
            variant="outlined"
            onClick={() => setSelectedAccount(original)}
          >
            Edit
          </Button>
        </div>
      ),
      filterable: false,
      align: 'right',
    },
  ];

  if (isFetchingMember || !member) {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
    );
  }

  return (
      <PermissionGate
        permissions={['MANAGE_ACCOUNTS']}
        fallback={
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Access Denied
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                You don't have permission to manage bank accounts.
              </p>
            </div>
          </div>
        }
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="sm:flex sm:items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Bank Accounts
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage bank accounts for {member.firstName} {member.lastName}
              </p>
            </div>
            <div className="mt-4 sm:mt-0 space-x-3">
              <Button
                variant="outline"
                onClick={() => router.push(`/admin/members/${params.id}/edit`)}
              >
                Back to Profile
              </Button>
              <Button onClick={() => setIsAddModalOpen(true)}>
                Add Account
              </Button>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg">
            <DataTable
              columns={columns}
              data={member.bankAccounts}
              pagination
              filtering
            />
          </div>

          <Modal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            title="Add New Bank Account"
          >
            <BankAccountForm
              onSubmit={addAccount}
              isLoading={isAdding}
              error={error}
            />
          </Modal>

          <Modal
            isOpen={!!selectedAccount}
            onClose={() => setSelectedAccount(null)}
            title="Edit Bank Account"
          >
            {selectedAccount && (
              <BankAccountForm
                onSubmit={(data) =>
                  updateAccount({ ...data, id: selectedAccount.id })
                }
                isLoading={isUpdating}
                error={error}
                initialData={selectedAccount}
              />
            )}
          </Modal>
        </div>
      </PermissionGate>
  );
}
