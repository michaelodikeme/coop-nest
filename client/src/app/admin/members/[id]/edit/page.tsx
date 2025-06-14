'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { MemberForm } from '@/components/organisms/admin/members/forms/MemberForm';
import { Button } from '@/components/atoms/Button';
import type { Member, MemberFormData } from '@/types/member.types';
import { apiService } from '@/lib/api/apiService';
import PermissionGate from '@/components/atoms/PermissionGate';

export default function MemberEditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const { data: member, isLoading: isFetching } = useQuery<Member>({
    queryKey: ['member', params.id],
    queryFn: async () => {
      const response = await apiService.get<{ data: Member }>(`/biodata/${params.id}`);
      return response.data;
    },
  });

  const { mutate, isPending: isUpdating } = useMutation({
    mutationFn: async (data: MemberFormData) => {
      const response = await apiService.put<{ data: Member }>(`/biodata/${params.id}`, data);
      return response.data;
    },
    onSuccess: () => {
      router.push('/admin/members');
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleSubmit = (data: MemberFormData) => {
    setError(undefined);
    mutate(data);
  };

  if (isFetching || !member) {
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

  const initialData: MemberFormData = {
    erpId: member.erpId,
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email,
    phone: member.phone,
    dateOfBirth: member.dateOfBirth,
    gender: member.gender,
    address: member.address,
    department: member.department,
    position: member.position,
    employmentDate: member.employmentDate,
    nextOfKin: member.nextOfKin,
  };

  return (
      <PermissionGate
        permissions={['EDIT_MEMBERS']}
        fallback={
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Access Denied
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                You don't have permission to edit member information.
              </p>
            </div>
          </div>
        }
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Edit Member Profile
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Update member information and details.
              </p>
            </div>
            <div className="space-x-4">
              <Button
                variant="outlined"
                onClick={() => router.push('/admin/members')}
              >
                Cancel
              </Button>
              <PermissionGate permissions={['MANAGE_ACCOUNTS']}>
                <Button
                  variant="outlined"
                  onClick={() => router.push(`/admin/members/${params.id}/accounts`)}
                >
                  Manage Bank Accounts
                </Button>
              </PermissionGate>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <MemberForm
                onSubmit={handleSubmit}
                isLoading={isUpdating}
                error={error}
                initialData={initialData}
              />
            </div>
          </div>
        </div>
      </PermissionGate>
  );
}
