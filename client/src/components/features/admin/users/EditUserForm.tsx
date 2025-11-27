"use client"

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { userService } from '@/lib/api/services/userService';
import { Button } from '@/components/atoms/Button';
import { toast } from 'react-hot-toast';
import type { User } from '@/types/user.types';

interface EditUserFormProps {
  user: User;
  onSuccess: () => void;
  onCancel: () => void;
}

interface EditUserFormData {
  roleId: string;
}

export default function EditUserForm({ user, onSuccess, onCancel }: EditUserFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentRole = user.role;

  console.log("currentRole", currentRole)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<EditUserFormData>({
    defaultValues: {
      roleId: currentRole?.id || '',
    },
  });

  // Fetch available roles
  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => userService.getAllRoles(),
  });

  useEffect(() => {
    if (currentRole?.id) {
      setValue('roleId', currentRole.id);
    }
  }, [currentRole, setValue]);

  const changeRoleMutation = useMutation({
    mutationFn: (roleId: string) => userService.changeUserRole(user.id, roleId),
    onSuccess: () => {
      toast.success('User role updated successfully');
      setIsSubmitting(false);
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update user role');
      setIsSubmitting(false);
    },
  });

  const onSubmit = async (data: EditUserFormData) => {
    if (data.roleId === currentRole?.id) {
      toast('No changes made');
      return;
    }

    try {
      setIsSubmitting(true);
      changeRoleMutation.mutate(data.roleId);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update user');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
      {/* User Information Display */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Username</p>
            <p className="text-sm font-medium text-gray-900">{user.username}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Full Name</p>
            <p className="text-sm font-medium text-gray-900">{user.biodata?.fullName || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Current Role</p>
            <p className="text-sm font-medium text-blue-600">{currentRole?.name || 'No Role'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
            <p className={`text-sm font-medium ${user.isActive ? 'text-green-600' : 'text-red-600'}`}>
              {user.isActive ? 'Active' : 'Inactive'}
            </p>
          </div>
        </div>
      </div>

      {/* Role Selection */}
      <div>
        <label htmlFor="roleId" className="block text-sm font-medium text-gray-700 mb-2">
          Change Role <span className="text-red-500">*</span>
        </label>
        <select
          id="roleId"
          {...register('roleId', { required: 'Role is required' })}
          className="w-full px-3 py-2 border border-gray-300 text-black rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          disabled={rolesLoading || !user.isActive}
        >
          <option value="">Select a role</option>
          {roles?.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name} - {role.description}
            </option>
          ))}
        </select>
        {errors.roleId && (
          <p className="mt-1 text-sm text-red-600">{errors.roleId.message}</p>
        )}
        {!user.isActive && (
          <p className="mt-1 text-sm text-yellow-600">
            Cannot change role for inactive users
          </p>
        )}
      </div>

      {/* User Details */}
      {user.biodata && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Additional Information</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">ERP ID</p>
              <p className="font-medium">{user.biodata.erpId || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500">Department</p>
              <p className="font-medium">{user.biodata.department || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500">Email</p>
              <p className="font-medium">{user.biodata.emailAddress || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500">Phone</p>
              <p className="font-medium">{user.biodata.phoneNumber || 'N/A'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Information Note */}
      {currentRole && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Changing the user's role will update their permissions immediately.
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
          disabled={isSubmitting || rolesLoading || !user.isActive}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? 'Updating...' : 'Update Role'}
        </Button>
      </div>
    </form>
  );
}
