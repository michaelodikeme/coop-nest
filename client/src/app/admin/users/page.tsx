"use client"

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/organisms/DataTable';
import { Button } from '@/components/atoms/Button';
import { Modal } from '@/components/molecules/Modal';
import { Alert } from '@/components/atoms/Alert';
import PermissionGate from '@/components/atoms/PermissionGate';
import { apiService } from '@/lib/api/apiService';
import { DataTableColumn } from '@/components/organisms/DataTable';
import type { User } from '@/types/user.types';
import type { Role } from '@/types/auth.types';

const UserStatusBadge = ({ isActive }: { isActive: boolean }) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      isActive
        ? 'bg-green-100 text-green-800'
        : 'bg-red-100 text-red-800'
    }`}
  >
    {isActive ? 'Active' : 'Inactive'}
  </span>
);

export default function UsersPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const { data: users, isLoading, error } = useQuery<User[]>({
    queryKey: ['users'],    queryFn: async () => {      const response = await apiService.get<{ data: User[] }>('/users');
      return response.data;
    },
  });

  const columns: DataTableColumn<User>[] = [
    {
      Header: 'Username',
      accessor: 'username' as keyof User,
    },
    {
      Header: 'Email',
      accessor: 'email' as keyof User,
    },
    {
      Header: 'Role',
      accessor: 'role' as keyof User,      Cell: ({ value }: { value: Role | null }) => (
        <span className="capitalize">{value?.name?.toLowerCase() || 'No Role'}</span>
      ),
    },
    {
      Header: 'Status',
      accessor: 'isActive' as keyof User,
      Cell: ({ value }: { value: boolean }) => (
        <UserStatusBadge isActive={value} />
      ),
    },
    {
      Header: 'Actions',
      accessor: 'id' as keyof User,
      Cell: ({ row }: { row: { original: User } }) => (
        <div className="flex space-x-2">
          <Button            size="small"
            variant="outlined"
            onClick={() => setSelectedUser(row.original)}
          >
            Edit
          </Button>
          <PermissionGate approvalLevel={3}>
            <Button              size="small"
              variant="contained"
              color="error"
              onClick={() => handleDeleteUser(row.original.id)}
            >
              Delete
            </Button>
          </PermissionGate>
        </div>
      ),
    },
  ];

  const handleDeleteUser = async (userId: string) => {
    // Implementation for user deletion
  };

  if (error) {
    return (
        <Alert
          variant="error"
          title="Error"
          message="Failed to load users. Please try again later."
        />
    );
  }

  return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
          <PermissionGate permissions={['MANAGE_USERS']} approvalLevel={1}>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              Create User
            </Button>
          </PermissionGate>
        </div>

        <div className="mt-8">
          <DataTable
            columns={columns}
            data={users || []}
            pagination
            filtering
          />
        </div>

        {/* Create User Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New User"
        >
          {/* Create user form would go here */}
          <div className="mt-4">Form implementation coming soon...</div>
        </Modal>

        {/* Edit User Modal */}
        <Modal
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          title="Edit User"
        >
          {/* Edit user form would go here */}
          <div className="mt-4">Form implementation coming soon...</div>
        </Modal>
      </div>
  );
}
