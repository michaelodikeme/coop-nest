'use client';

import { useState } from 'react';
import { Box, Button, CircularProgress, TextField, Typography, Alert, Paper, FormControlLabel, Switch, Grid } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService, SystemSettingsData } from '@/lib/api/services/settingsService';

interface SystemSettingsFormProps {
  initialData?: SystemSettingsData;
  isLoading?: boolean;
}

export function SystemSettingsForm({ initialData, isLoading = false }: SystemSettingsFormProps) {
  const defaultData: SystemSettingsData = {
    organizationName: '',
    organizationShortName: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    logoUrl: '',
    websiteUrl: '',
    enableMemberRegistration: true,
    enablePublicWebsite: true,
  };

  const [formData, setFormData] = useState<SystemSettingsData>(initialData || defaultData);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { mutate: updateSystemSettings, isPending } = useMutation({
    mutationFn: async (data: SystemSettingsData) => {
      return await settingsService.updateSystemSettings(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'system'] });
      setError(null);
    },
    onError: (error: any) => {
      setError(error?.message || 'Failed to update system settings. Please try again.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSystemSettings(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Organization Information
        </Typography>
          <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              name="organizationName"
              label="Organization Name"
              value={formData.organizationName}
              onChange={handleChange}
              fullWidth
              required
              margin="normal"
            />
          </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              name="organizationShortName"
              label="Short Name"
              value={formData.organizationShortName}
              onChange={handleChange}
              fullWidth
              required
              margin="normal"
            />
          </Grid>
          
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              name="contactEmail"
              label="Contact Email"
              type="email"
              value={formData.contactEmail}
              onChange={handleChange}
              fullWidth
              required
              margin="normal"
            />
          </Grid>
          
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              name="contactPhone"
              label="Contact Phone"
              value={formData.contactPhone}
              onChange={handleChange}
              fullWidth
              required
              margin="normal"
            />
          </Grid>
            <Grid size={12}>
            <TextField
              name="address"
              label="Address"
              value={formData.address}
              onChange={handleChange}
              fullWidth
              multiline
              rows={2}
              margin="normal"
            />
          </Grid>
          
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              name="logoUrl"
              label="Logo URL"
              value={formData.logoUrl}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
          </Grid>
          
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              name="websiteUrl"
              label="Website URL"
              value={formData.websiteUrl}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
          </Grid>
        </Grid>
      </Paper>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          System Features
        </Typography>
        
        <FormControlLabel
          control={
            <Switch
              checked={formData.enableMemberRegistration}
              onChange={handleChange}
              name="enableMemberRegistration"
              color="primary"
            />
          }
          label="Enable Member Registration"
        />
        
        <Box sx={{ mt: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.enablePublicWebsite}
                onChange={handleChange}
                name="enablePublicWebsite"
                color="primary"
              />
            }
            label="Enable Public Website"
          />
        </Box>
      </Paper>
      
      <Button
        type="submit"
        variant="contained"
        disabled={isPending}
        sx={{ mt: 2 }}
      >
        {isPending ? <CircularProgress size={24} /> : 'Update System Settings'}
      </Button>
    </Box>
  );
}
