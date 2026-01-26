'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { DataTable, DataTableColumn } from '@/components/organisms/DataTable';
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

export default async function MemberBankAccountsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const memberId = resolvedParams.id;

  return <MemberBankAccountsPageClient memberId={memberId} />;
}

function MemberBankAccountsPageClient({ memberId }: { memberId: string }) {
  const router = useRouter();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [error, setError] = useState<string>();

  const { data: member, isLoading: isFetchingMember } = useQuery<Member>({
    queryKey: ['member', memberId],
    queryFn: async () => {
      const response = await apiService.get<{ data: Member }>(`/biodata/${memberId}`);
      return (response as { data: Member }).data;
    },
  });
  const { mutate: addAccount, isPending: isAdding } = useMutation({
    mutationFn: async (data: Omit<BankAccount, 'id' | 'isVerified'>) => {
      const response = await apiService.post<{ data: BankAccount }>(`/biodata/${memberId}/accounts`, data);
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
  const columns: DataTableColumn<BankAccount>[] = [
    {
      id: 'accountNumber',
      label: 'Account Number',
      accessor: 'accountNumber',
    },
    {
      id: 'bankName',
      label: 'Bank',
      accessor: 'bankName',
    },
    {
      id: 'accountType',
      label: 'Type',
      accessor: 'accountType',
    },
    {
      id: 'isVerified',
      label: 'Status',
      accessor: 'isVerified',
      Cell: ({ value }: { value: any }) => <VerificationStatusBadge isVerified={value} />,
    },
    {
      id: 'isPrimary',
      label: 'Primary',
      accessor: 'isPrimary',
      Cell: ({ value }: { value: any }) => (value ? '✓' : '-'),
      align: 'center',
    },
    {
      id: 'id',
      label: 'Actions',
      accessor: 'id',
      Cell: ({ row }: { row: { original: BankAccount } }) => (
        <div className="flex space-x-2">
          <PermissionGate permissions={['VERIFY_ACCOUNTS']} approvalLevel={2}>
            <Button
              size="small"
              variant={row.original.isVerified ? 'outlined' : 'contained'}
              onClick={() =>
                updateAccount({
                  id: row.original.id,
                  isVerified: !row.original.isVerified,
                })
              }
            >
              {row.original.isVerified ? 'Unverify' : 'Verify'}
            </Button>
          </PermissionGate>
          <Button
            size="small"
            variant="outlined"
            onClick={() => setSelectedAccount(row.original)}
          >
            Edit
          </Button>
        </div>
      ),
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
                variant="outlined"
                onClick={() => router.push(`/admin/members/${memberId}/edit`)}
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
              data={[]}
              enableFiltering
              noDataMessage="No bank accounts found. Bank account management will be implemented in a future update."
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
