'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, Divider, Grid, Typography, Box, Alert } from '@mui/material';
import { MemberForm } from '@/components/organisms/admin/members/forms/MemberForm';
import type { MemberFormData } from '@/types/member.types';
import PermissionGate from '@/components/atoms/PermissionGate';
import { Button } from '@/components/atoms/Button';
import { useCreateMember } from '@/lib/hooks/admin/useMembers';
import { Module } from '@/types/permissions.types';

export default function MemberRegistrationPage() {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const { mutate, isPending } = useCreateMember();

  const handleSubmit = (data: MemberFormData) => {
    setError(undefined);
    console.log('Submitting data:', data);
    mutate(data, {
      onError: (err: Error) => {
        console.error('Registration error:', err);
        
        // Check if error response contains validation errors
        try {
          // Response might be embedded in error.message as a JSON string
          const errorData = JSON.parse(err.message);
          if (errorData.validationErrors) {
            // Pass the entire error object as a JSON string to be parsed by the form
            setError(JSON.stringify(errorData));
          } else {
            // Regular error message
            setError(err.message);
          }
        } catch {
          // If parsing fails, just use the error message directly
          setError(err.message);
        }
      },
      onSuccess: () => {
        router.push('/admin/members');
      }
    });
  };

  const handleCancel = () => {
    router.push('/admin/members');
  };

  return (
    <PermissionGate
      permissions={['CREATE_MEMBERS']}
      module={Module.USER}
      approvalLevel={1}
      fallback={<AccessDenied />}
    >
      <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4, mb: 4 }}>
        <Card elevation={3} sx={{ borderRadius: 3, bgcolor: '#f9fafb' }}>
          <CardHeader
            title={
              <Typography variant="h4" fontWeight={700} color="primary.main">
                Register New Member
              </Typography>
            }
            subheader={
              <Typography variant="subtitle1" color="text.secondary">
                Fill in the details below to register a new cooperative member.
              </Typography>
            }
            sx={{ pb: 0, pt: 3, px: 3 }}
          />
          <CardContent sx={{ pt: 2 }}>
            <MemberForm
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isLoading={isPending}
              error={error}
            />
            
            {error && !error.includes("validationErrors") && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </CardContent>
        </Card>
      </Box>
    </PermissionGate>
  );
}

function AccessDenied() {
  return (
    <Box sx={{ maxWidth: 500, mx: 'auto', mt: 8 }}>
      <Card elevation={2}>
        <CardContent>
          <Typography variant="h6" color="error" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You don't have permission to register new members.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
