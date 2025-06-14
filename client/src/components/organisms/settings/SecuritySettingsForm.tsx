'use client';

import { useState } from 'react';
import { Box, Button, CircularProgress, TextField, Typography, Alert, Paper, FormControlLabel, Switch, Grid, MenuItem, InputAdornment } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService, SecuritySettingsData } from '@/lib/api/services/settingsService';

interface SecuritySettingsFormProps {
  initialData?: SecuritySettingsData;
  isLoading?: boolean;
}

const timeoutUnits = [
  {
    value: 'minutes',
    label: 'Minutes',
  },
  {
    value: 'hours',
    label: 'Hours',
  },
  {
    value: 'days',
    label: 'Days',
  },
];

export function SecuritySettingsForm({ initialData, isLoading = false }: SecuritySettingsFormProps) {
  const defaultData: SecuritySettingsData = {
    passwordMinLength: 8,
    passwordRequiresLowercase: true,
    passwordRequiresUppercase: true,
    passwordRequiresNumbers: true,
    passwordRequiresSymbols: false,
    mfaEnabled: false,
    sessionTimeout: 30,
    sessionTimeoutUnit: 'minutes',
    loginAttempts: 5,
    lockoutDuration: 15,
  };

  const [formData, setFormData] = useState<SecuritySettingsData>(initialData || defaultData);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { mutate: updateSecuritySettings, isPending } = useMutation({
    mutationFn: async (data: SecuritySettingsData) => {
      return await settingsService.updateSecuritySettings(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'security'] });
      setError(null);
    },
    onError: (error: any) => {
      setError(error?.message || 'Failed to update security settings. Please try again.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSecuritySettings(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
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
          Password Policy
        </Typography>
          <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              name="passwordMinLength"
              label="Minimum Password Length"
              type="number"
              value={formData.passwordMinLength}
              onChange={handleChange}
              fullWidth
              required
              margin="normal"
              inputProps={{ min: 6 }}
            />
          </Grid>
          
          <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex', alignItems: 'center' }}>
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.passwordRequiresLowercase}
                    onChange={handleChange}
                    name="passwordRequiresLowercase"
                    color="primary"
                  />
                }
                label="Require Lowercase Letters"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.passwordRequiresUppercase}
                    onChange={handleChange}
                    name="passwordRequiresUppercase"
                    color="primary"
                  />
                }
                label="Require Uppercase Letters"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.passwordRequiresNumbers}
                    onChange={handleChange}
                    name="passwordRequiresNumbers"
                    color="primary"
                  />
                }
                label="Require Numbers"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.passwordRequiresSymbols}
                    onChange={handleChange}
                    name="passwordRequiresSymbols"
                    color="primary"
                  />
                }
                label="Require Special Characters"
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Authentication
        </Typography>
        
        <FormControlLabel
          control={
            <Switch
              checked={formData.mfaEnabled}
              onChange={handleChange}
              name="mfaEnabled"
              color="primary"
            />
          }
          label="Enable Multi-Factor Authentication (MFA)"
        />
          <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              name="loginAttempts"
              label="Failed Login Attempts Before Lockout"
              type="number"
              value={formData.loginAttempts}
              onChange={handleChange}
              fullWidth
              margin="normal"
              inputProps={{ min: 1 }}
            />
          </Grid>
          
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              name="lockoutDuration"
              label="Account Lockout Duration"
              type="number"
              value={formData.lockoutDuration}
              onChange={handleChange}
              fullWidth
              margin="normal"
              InputProps={{
                endAdornment: <InputAdornment position="end">minutes</InputAdornment>,
              }}
              inputProps={{ min: 1 }}
            />
          </Grid>
        </Grid>
      </Paper>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Session Management
        </Typography>
          <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              name="sessionTimeout"
              label="Session Timeout"
              type="number"
              value={formData.sessionTimeout}
              onChange={handleChange}
              fullWidth
              margin="normal"
              inputProps={{ min: 1 }}
            />
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              name="sessionTimeoutUnit"
              label="Timeout Unit"
              value={formData.sessionTimeoutUnit}
              onChange={handleChange}
              fullWidth
              margin="normal"
            >
              {timeoutUnits.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Paper>
      
      <Button
        type="submit"
        variant="contained"
        disabled={isPending}
        sx={{ mt: 2 }}
      >
        {isPending ? <CircularProgress size={24} /> : 'Update Security Settings'}
      </Button>
    </Box>
  );
}
