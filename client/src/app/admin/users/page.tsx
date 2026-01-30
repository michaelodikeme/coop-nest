"use client"

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '@/components/organisms/DataTable';
import { Button } from '@/components/atoms/Button';
import { Modal } from '@/components/molecules/Modal';
import { Alert } from '@/components/atoms/Alert';
import PermissionGate from '@/components/atoms/PermissionGate';
import { userService } from '@/lib/api/services/userService';
import { DataTableColumn } from '@/components/organisms/DataTable';
import type { User } from '@/types/user.types';
import type { RoleAssignment } from '@/types/auth.types';
import CreateUserForm from '@/components/features/admin/users/CreateUserForm';
import EditUserForm from '@/components/features/admin/users/EditUserForm';
import { toast } from 'react-hot-toast';

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
  const [userToDeactivate, setUserToDeactivate] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const { data: users, isLoading, error } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => userService.getUsers(),
  });

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (!searchQuery.trim()) return users;

    const query = searchQuery.toLowerCase().trim();
    return users.filter((user) => {
      const username = user.username?.toLowerCase() || '';
      const fullName = user.biodata?.fullName?.toLowerCase() || '';
      const firstName = user.biodata?.firstName?.toLowerCase() || '';
      const lastName = user.biodata?.lastName?.toLowerCase() || '';

      return (
        username.includes(query) ||
        fullName.includes(query) ||
        firstName.includes(query) ||
        lastName.includes(query)
      );
    });
  }, [users, searchQuery]);

  const deactivateMutation = useMutation({
    mutationFn: (userId: string) => userService.deactivateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deactivated successfully');
      setUserToDeactivate(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to deactivate user');
    },
  });

  const columns: DataTableColumn<User>[] = [
    {
      id: 'username',
      label: 'Username',
      accessor: 'username' as keyof User,
    },
    {
      id: 'fullName',
      label: 'Full Name',
      accessor: 'biodata' as keyof User,
      Cell: ({ value }: { value: any }) => (
        <span>{value?.fullName || 'N/A'}</span>
      ),
    },
    {
      id: 'role',
      label: 'Role',
      accessor: 'roleAssignment' as keyof User,
      Cell: ({ value }: { value: RoleAssignment }) => {
        const primaryRole = value?.role;
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {primaryRole?.name || 'No Role'}
          </span>
        );
      },
    },
    {
      id: 'status',
      label: 'Status',
      accessor: 'isActive' as keyof User,
      Cell: ({ value }: { value: boolean }) => (
        <UserStatusBadge isActive={value} />
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      accessor: 'id' as keyof User,
      Cell: ({ row }: { row: { original: User } }) => (
        <div className="flex flex-wrap gap-2">
          <Button
            size="small"
            variant="outlined"
            onClick={() => setSelectedUser(row.original)}
          >
            Edit
          </Button>
          <PermissionGate permissions={['MANAGE_ROLES']}>
            <Button
              size="small"
              variant="contained"
              color="error"
              onClick={() => setUserToDeactivate(row.original)}
              disabled={!row.original.isActive}
            >
              Deactivate
            </Button>
          </PermissionGate>
        </div>
      ),
    },
  ];

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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
        <PermissionGate permissions={['MANAGE_ROLES']}>
          <Button onClick={() => setIsCreateModalOpen(true)} className="w-full sm:w-auto">
            Create User
          </Button>
        </PermissionGate>
      </div>

      {/* Search Input */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Search by username or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 pr-4 text-sm text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="mt-2 text-sm text-gray-600">
            Found {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredUsers}
          enableFiltering
        />
      </div>

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New User"
      >
        <CreateUserForm
          onSuccess={() => {
            setIsCreateModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['users'] });
          }}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title="Edit User"
      >
        {selectedUser && (
          <EditUserForm
            user={selectedUser}
            onSuccess={() => {
              setSelectedUser(null);
              queryClient.invalidateQueries({ queryKey: ['users'] });
            }}
            onCancel={() => setSelectedUser(null)}
          />
        )}
      </Modal>

      {/* Deactivate Confirmation Modal */}
      <Modal
        isOpen={!!userToDeactivate}
        onClose={() => setUserToDeactivate(null)}
        title="Confirm Deactivation"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to deactivate <strong>{userToDeactivate?.username}</strong>?
            This will revoke their access to the system.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Button
              variant="outlined"
              onClick={() => setUserToDeactivate(null)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => userToDeactivate && deactivateMutation.mutate(userToDeactivate.id)}
              disabled={deactivateMutation.isPending}
              className="w-full sm:w-auto"
            >
              {deactivateMutation.isPending ? 'Deactivating...' : 'Deactivate'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
