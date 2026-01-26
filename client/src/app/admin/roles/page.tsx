"use client"

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '@/components/organisms/DataTable';
import { Button } from '@/components/atoms/Button';
import { Modal } from '@/components/molecules/Modal';
import { Alert } from '@/components/atoms/Alert';
import PermissionGate from '@/components/atoms/PermissionGate';
import { roleService } from '@/lib/api/services/roleService';
import { DataTableColumn } from '@/components/organisms/DataTable';
import type { Role } from '@/types/role.types';
import CreateRoleForm from '@/components/features/admin/roles/CreateRoleForm';
import EditRoleForm from '@/components/features/admin/roles/EditRoleForm';
import { toast } from 'react-hot-toast';

// System roles that cannot be deleted
const SYSTEM_ROLES = ['SUPER_ADMIN', 'CHAIRMAN', 'TREASURER', 'ADMIN', 'MEMBER'];

const RoleBadge = ({ canApprove }: { canApprove: boolean }) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      canApprove ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
    }`}
  >
    {canApprove ? 'Can Approve' : 'No Approval'}
  </span>
);

const SystemBadge = ({ isSystem }: { isSystem: boolean }) =>
  isSystem ? (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
      System Role
    </span>
  ) : null;

export default function RolesPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [viewDetailsRole, setViewDetailsRole] = useState<Role | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const { data: roles, isLoading, error } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: () => roleService.getAllRoles(),
  });

  // Filter roles based on search query
  const filteredRoles = useMemo(() => {
    if (!roles) return [];
    if (!searchQuery.trim()) return roles;

    const query = searchQuery.toLowerCase().trim();
    return roles.filter((role) => {
      const name = role.name?.toLowerCase() || '';
      const description = role.description?.toLowerCase() || '';

      return name.includes(query) || description.includes(query);
    });
  }, [roles, searchQuery]);

  const deleteMutation = useMutation({
    mutationFn: (roleId: string) => roleService.deleteRole(roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role deleted successfully');
      setRoleToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete role');
    },
  });

  const columns: DataTableColumn<Role>[] = [
    {
      id: 'name',
      label: 'Role Name',
      accessor: 'name' as keyof Role,
      Cell: ({ value, row }: { value: string; row: { original: Role } }) => {
        const isSystem = SYSTEM_ROLES.includes(value);
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium">{value}</span>
            {isSystem && <SystemBadge isSystem={true} />}
          </div>
        );
      },
    },
    {
      id: 'description',
      label: 'Description',
      accessor: 'description' as keyof Role,
      Cell: ({ value }: { value: string }) => (
        <span className="text-gray-600">{value || 'No description'}</span>
      ),
    },
    {
      id: 'approvalLevel',
      label: 'Approval Level',
      accessor: 'approvalLevel' as keyof Role,
      Cell: ({ value }: { value: number }) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Level {value}
        </span>
      ),
    },
    {
      id: 'canApprove',
      label: 'Approval Authority',
      accessor: 'canApprove' as keyof Role,
      Cell: ({ value }: { value: boolean }) => <RoleBadge canApprove={value} />,
    },
    {
      id: 'permissions',
      label: 'Permissions',
      accessor: 'permissions' as keyof Role,
      Cell: ({ value }: { value: string[] }) => (
        <span className="text-sm text-gray-600">{value?.length || 0} permissions</span>
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      accessor: 'id' as keyof Role,
      Cell: ({ row }: { row: { original: Role } }) => {
        const isSystem = SYSTEM_ROLES.includes(row.original.name);
        return (
          <div className="flex flex-wrap gap-2">
            <Button
              size="small"
              variant="outlined"
              onClick={() => setViewDetailsRole(row.original)}
            >
              View
            </Button>
            <PermissionGate permissions={['MANAGE_ROLES']}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setSelectedRole(row.original)}
              >
                Edit
              </Button>
              <Button
                size="small"
                variant="contained"
                color="error"
                onClick={() => setRoleToDelete(row.original)}
                disabled={isSystem}
              >
                Delete
              </Button>
            </PermissionGate>
          </div>
        );
      },
    },
  ];

  if (error) {
    return (
      <Alert
        variant="error"
        title="Error"
        message="Failed to load roles. Please try again later."
      />
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Roles & Permissions</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage roles and their permissions across the system
          </p>
        </div>
        <PermissionGate permissions={['MANAGE_ROLES']}>
          <Button onClick={() => setIsCreateModalOpen(true)} className="w-full sm:w-auto">
            Create Role
          </Button>
        </PermissionGate>
      </div>

      {/* Search Input */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Search by role name or description..."
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
            Found {filteredRoles.length} role{filteredRoles.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <DataTable columns={columns} data={filteredRoles} enableFiltering />
      </div>

      {/* Create Role Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Role"
        maxWidth="lg"
      >
        <CreateRoleForm
          onSuccess={() => {
            setIsCreateModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['roles'] });
          }}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>

      {/* Edit Role Modal */}
      <Modal
        isOpen={!!selectedRole}
        onClose={() => setSelectedRole(null)}
        title="Edit Role"
        maxWidth="lg"
      >
        {selectedRole && (
          <EditRoleForm
            role={selectedRole}
            onSuccess={() => {
              setSelectedRole(null);
              queryClient.invalidateQueries({ queryKey: ['roles'] });
            }}
            onCancel={() => setSelectedRole(null)}
          />
        )}
      </Modal>

      {/* View Role Details Modal */}
      <Modal
        isOpen={!!viewDetailsRole}
        onClose={() => setViewDetailsRole(null)}
        title="Role Details"
        maxWidth="lg"
      >
        {viewDetailsRole && (
          <div className="space-y-6">
            {/* Role Information */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Role Name</p>
                  <p className="text-sm font-medium text-gray-900">{viewDetailsRole.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Approval Level</p>
                  <p className="text-sm font-medium text-gray-900">
                    Level {viewDetailsRole.approvalLevel}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Can Approve</p>
                  <p className="text-sm font-medium text-gray-900">
                    {viewDetailsRole.canApprove ? 'Yes' : 'No'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Created</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(viewDetailsRole.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {viewDetailsRole.description && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Description</p>
                  <p className="text-sm text-gray-900 mt-1">{viewDetailsRole.description}</p>
                </div>
              )}
            </div>

            {/* Module Access */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Module Access</h3>
              <div className="flex flex-wrap gap-2">
                {viewDetailsRole.moduleAccess?.map((module) => (
                  <span
                    key={module}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {module}
                  </span>
                ))}
              </div>
            </div>

            {/* Permissions */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                Permissions ({viewDetailsRole.permissions?.length || 0})
              </h3>
              <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                <div className="divide-y divide-gray-200">
                  {viewDetailsRole.permissions?.map((permission) => (
                    <div key={permission} className="px-4 py-2 text-sm text-gray-700">
                      {permission}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button variant="outlined" onClick={() => setViewDetailsRole(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!roleToDelete}
        onClose={() => setRoleToDelete(null)}
        title="Confirm Deletion"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete the role <strong>{roleToDelete?.name}</strong>?
          </p>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  This action cannot be undone. Users with this role will need to be reassigned.
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Button
              variant="outlined"
              onClick={() => setRoleToDelete(null)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => roleToDelete && deleteMutation.mutate(roleToDelete.id)}
              disabled={deleteMutation.isPending}
              className="w-full sm:w-auto"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Role'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
