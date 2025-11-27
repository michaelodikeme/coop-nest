"use client"

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { roleService } from '@/lib/api/services/roleService';
import { Button } from '@/components/atoms/Button';
import PermissionSelector from '@/components/molecules/PermissionSelector';
import { toast } from 'react-hot-toast';
import { getAllModules } from '@/lib/constants/permissions';
import type { Role, UpdateRoleInput } from '@/types/role.types';

interface EditRoleFormProps {
  role: Role;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData extends UpdateRoleInput {}

// System roles that cannot be modified
const SYSTEM_ROLES = ['SUPER_ADMIN', 'CHAIRMAN', 'TREASURER', 'ADMIN', 'MEMBER'];

export default function EditRoleForm({ role, onSuccess, onCancel }: EditRoleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const availableModules = getAllModules();
  const isSystemRole = SYSTEM_ROLES.includes(role.name);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      description: role.description || '',
      permissions: role.permissions || [],
      approvalLevel: role.approvalLevel || 0,
      canApprove: role.canApprove || false,
      moduleAccess: role.moduleAccess || [],
    },
  });

  const selectedPermissions = watch('permissions');
  const canApprove = watch('canApprove');

  useEffect(() => {
    // Pre-populate form with existing role data
    setValue('description', role.description || '');
    setValue('permissions', role.permissions || []);
    setValue('approvalLevel', role.approvalLevel || 0);
    setValue('canApprove', role.canApprove || false);
    setValue('moduleAccess', role.moduleAccess || []);
  }, [role, setValue]);

  const updateRoleMutation = useMutation({
    mutationFn: (data: UpdateRoleInput) => roleService.updateRole(role.id, data),
    onSuccess: () => {
      toast.success('Role updated successfully');
      setIsSubmitting(false);
      onSuccess();
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update role';
      toast.error(message);
      setIsSubmitting(false);
    },
  });

  const onSubmit = async (data: FormData) => {
    if (data.permissions && data.permissions.length === 0) {
      toast.error('Please select at least one permission');
      return;
    }

    if (data.moduleAccess && data.moduleAccess.length === 0) {
      toast.error('Please select at least one module');
      return;
    }

    try {
      setIsSubmitting(true);
      updateRoleMutation.mutate(data);
    } catch (error) {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 text-grey-700 p-8">
      {/* System Role Warning */}
      {isSystemRole && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 text-grey-700">
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
              <p className="text-sm text-yellow-700 font-medium">
                Warning: This is a system role
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                System roles are protected and cannot be modified. This form is read-only.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Role Information Display */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Role Name</p>
          <p className="text-sm font-medium text-gray-900">{role.name}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Created</p>
          <p className="text-sm font-medium text-gray-900">
            {new Date(role.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          id="description"
          {...register('description')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 text-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="Describe the role's purpose and responsibilities"
          disabled={isSystemRole}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      {/* Approval Level and Can Approve */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
        <div>
          <label htmlFor="approvalLevel" className="block text-sm font-medium text-gray-700 mb-2">
            Approval Level <span className="text-red-500">*</span>
          </label>
          <select
            id="approvalLevel"
            {...register('approvalLevel', {
              required: 'Approval level is required',
              valueAsNumber: true,
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            disabled={isSystemRole}
          >
            <option value={0}>Level 0 - Basic Access</option>
            <option value={1}>Level 1 - Staff/Officer</option>
            <option value={2}>Level 2 - Manager</option>
            <option value={3}>Level 3 - Executive</option>
            <option value={4}>Level 4 - Senior Executive</option>
            <option value={5}>Level 5 - Top Management</option>
          </select>
          {errors.approvalLevel && (
            <p className="mt-1 text-sm text-red-600">{errors.approvalLevel.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Higher levels have more authority in approval workflows
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Approval Authority
          </label>
          <div className="flex items-center h-10">
            <input
              id="canApprove"
              type="checkbox"
              {...register('canApprove')}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
              disabled={isSystemRole}
            />
            <label htmlFor="canApprove" className="ml-2 text-sm text-gray-700">
              Can approve requests
            </label>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {canApprove
              ? 'This role can approve requests at its level'
              : 'This role cannot approve requests'}
          </p>
        </div>
      </div>

      {/* Module Access */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Module Access <span className="text-red-500">*</span>
        </label>
        <div className="border border-gray-300 rounded-md p-4 max-h-48 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {availableModules.map((module) => (
              <label
                key={module}
                className={`flex items-center space-x-2 ${
                  isSystemRole ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                }`}
              >
                <input
                  type="checkbox"
                  value={module}
                  {...register('moduleAccess', {
                    required: 'Select at least one module',
                  })}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
                  disabled={isSystemRole}
                />
                <span className="text-sm text-gray-700">{module}</span>
              </label>
            ))}
          </div>
        </div>
        {errors.moduleAccess && (
          <p className="mt-1 text-sm text-red-600">{errors.moduleAccess.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">Select which modules this role can access</p>
      </div>

      {/* Permissions */}
      <div className="text-gray-700">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Permissions <span className="text-red-500">*</span>
        </label>
        <Controller
          name="permissions"
          control={control}
          rules={{
            validate: (value) =>
              (value && value.length > 0) || 'Select at least one permission',
          }}
          render={({ field }) => (
            <PermissionSelector
              selectedPermissions={field.value || []}
              onChange={field.onChange}
              error={errors.permissions?.message}
              disabled={isSystemRole}
            />
          )}
        />
        <p className="mt-2 text-sm text-gray-600">
          Currently selected: {selectedPermissions?.length || 0} permission
          {selectedPermissions?.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Information Alert */}
      {!isSystemRole && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Changes to this role will affect all users who have been assigned this role.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-4 border-t">
        <Button
          type="button"
          variant="outlined"
          onClick={onCancel}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting || isSystemRole}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? 'Updating...' : 'Update Role'}
        </Button>
      </div>
    </form>
  );
}
