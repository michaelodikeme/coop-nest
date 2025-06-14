'use client';

import { useState } from 'react';
import { Box, Button, CircularProgress, Typography, Alert, Paper, Grid, FormControlLabel, Switch, FormGroup, Divider } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService, NotificationSettingsData } from '@/lib/api/services/settingsService';

interface NotificationSettingsFormProps {
  initialData?: NotificationSettingsData;
  isLoading?: boolean;
}

export function NotificationSettingsForm({ initialData, isLoading = false }: NotificationSettingsFormProps) {
  const defaultData: NotificationSettingsData = {
    enableEmailNotifications: true,
    enableSmsNotifications: false,
    enablePushNotifications: false,
    notifyOnNewMembers: true,
    notifyOnLoanRequests: true,
    notifyOnLoanApprovals: true,
    notifyOnDepositConfirmations: true,
    dailyDigest: false,
    weeklyReport: true,
    monthlyStatement: true,
  };

  const [formData, setFormData] = useState<NotificationSettingsData>(initialData || defaultData);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { mutate: updateNotificationSettings, isPending } = useMutation({
    mutationFn: async (data: NotificationSettingsData) => {
      return await settingsService.updateNotificationSettings(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'notifications'] });
      setError(null);
    },
    onError: (error: any) => {
      setError(error?.message || 'Failed to update notification settings. Please try again.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateNotificationSettings(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
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
          Notification Channels
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Configure which channels are used to send notifications
        </Typography>
        
        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={formData.enableEmailNotifications}
                onChange={handleChange}
                name="enableEmailNotifications"
                color="primary"
              />
            }
            label="Email Notifications"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={formData.enableSmsNotifications}
                onChange={handleChange}
                name="enableSmsNotifications"
                color="primary"
              />
            }
            label="SMS Notifications"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={formData.enablePushNotifications}
                onChange={handleChange}
                name="enablePushNotifications"
                color="primary"
              />
            }
            label="Push Notifications"
          />
        </FormGroup>
      </Paper>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Event Notifications
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Configure which events trigger notifications
        </Typography>
          <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.notifyOnNewMembers}
                    onChange={handleChange}
                    name="notifyOnNewMembers"
                    color="primary"
                  />
                }
                label="New Member Registrations"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.notifyOnLoanRequests}
                    onChange={handleChange}
                    name="notifyOnLoanRequests"
                    color="primary"
                  />
                }
                label="Loan Requests"
              />
            </FormGroup>
          </Grid>
          
          <Grid size={{ xs: 12, md: 6 }}>
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.notifyOnLoanApprovals}
                    onChange={handleChange}
                    name="notifyOnLoanApprovals"
                    color="primary"
                  />
                }
                label="Loan Approvals"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.notifyOnDepositConfirmations}
                    onChange={handleChange}
                    name="notifyOnDepositConfirmations"
                    color="primary"
                  />
                }
                label="Deposit Confirmations"
              />
            </FormGroup>
          </Grid>
        </Grid>
      </Paper>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Reports and Summaries
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Configure automated reports and summaries
        </Typography>
        
        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={formData.dailyDigest}
                onChange={handleChange}
                name="dailyDigest"
                color="primary"
              />
            }
            label="Daily Activity Digest"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={formData.weeklyReport}
                onChange={handleChange}
                name="weeklyReport"
                color="primary"
              />
            }
            label="Weekly Summary Report"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={formData.monthlyStatement}
                onChange={handleChange}
                name="monthlyStatement"
                color="primary"
              />
            }
            label="Monthly Financial Statement"
          />
        </FormGroup>
      </Paper>
      
      <Button
        type="submit"
        variant="contained"
        disabled={isPending}
        sx={{ mt: 2 }}
      >
        {isPending ? <CircularProgress size={24} /> : 'Update Notification Settings'}
      </Button>
    </Box>
  );
}
