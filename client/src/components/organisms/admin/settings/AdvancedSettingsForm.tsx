'use client';

import { useState } from 'react';
import { Box, Button, CircularProgress, TextField, Typography, Alert, Paper, FormControlLabel, Switch, Grid, MenuItem } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService, AdvancedSettingsData } from '@/lib/api/services/settingsService';

interface AdvancedSettingsFormProps {
  initialData?: AdvancedSettingsData;
  isLoading?: boolean;
}

const logLevels = [
  { value: 'error', label: 'Error' },
  { value: 'warn', label: 'Warning' },
  { value: 'info', label: 'Info' },
  { value: 'debug', label: 'Debug' },
  { value: 'trace', label: 'Trace' },
];

const backupOptions = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export function AdvancedSettingsForm({ initialData, isLoading = false }: AdvancedSettingsFormProps) {
  const defaultData: AdvancedSettingsData = {
    maintenanceMode: false,
    debugMode: false,
    logLevel: 'info',
    apiTimeout: 30,
    cacheExpiration: 60,
    maxUploadSize: 10,
    backupFrequency: 'weekly',
    allowDataExport: true,
    enableApiLogs: false,
  };

  const [formData, setFormData] = useState<AdvancedSettingsData>(initialData || defaultData);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { mutate: updateAdvancedSettings, isPending } = useMutation({
    mutationFn: async (data: AdvancedSettingsData) => {
      return await settingsService.updateAdvancedSettings(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'advanced'] });
      setError(null);
    },
    onError: (error: any) => {
      setError(error?.message || 'Failed to update advanced settings. Please try again.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateAdvancedSettings(formData);
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
          System Mode
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Configure system operational modes
        </Typography>
        
        <Grid container spacing={3}>
          <Grid size={12}>
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.maintenanceMode}
                    onChange={handleChange}
                    name="maintenanceMode"
                    color="primary"
                  />
                }
                label="Maintenance Mode"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                When enabled, only administrators can access the system
              </Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.debugMode}
                    onChange={handleChange}
                    name="debugMode"
                    color="primary"
                  />
                }
                label="Debug Mode"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                Enable extended debugging information
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          System Configuration
        </Typography>
        
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              select
              name="logLevel"
              label="Log Level"
              value={formData.logLevel}
              onChange={handleChange}
              fullWidth
              margin="normal"
            >
              {logLevels.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              name="apiTimeout"
              label="API Timeout"
              type="number"
              value={formData.apiTimeout}
              onChange={handleChange}
              fullWidth
              margin="normal"
              InputProps={{
                endAdornment: <Box component="span" sx={{ ml: 1 }}>seconds</Box>,
              }}
              inputProps={{ min: 5, max: 120 }}
            />
          </Grid>
          
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              name="cacheExpiration"
              label="Cache Expiration"
              type="number"
              value={formData.cacheExpiration}
              onChange={handleChange}
              fullWidth
              margin="normal"
              InputProps={{
                endAdornment: <Box component="span" sx={{ ml: 1 }}>minutes</Box>,
              }}
              inputProps={{ min: 1 }}
            />
          </Grid>
          
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              name="maxUploadSize"
              label="Maximum Upload Size"
              type="number"
              value={formData.maxUploadSize}
              onChange={handleChange}
              fullWidth
              margin="normal"
              InputProps={{
                endAdornment: <Box component="span" sx={{ ml: 1 }}>MB</Box>,
              }}
              inputProps={{ min: 1, max: 100 }}
            />
          </Grid>
        </Grid>
      </Paper>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Data Management
        </Typography>
        
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              select
              name="backupFrequency"
              label="Backup Frequency"
              value={formData.backupFrequency}
              onChange={handleChange}
              fullWidth
              margin="normal"
            >
              {backupOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ mt: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.allowDataExport}
                    onChange={handleChange}
                    name="allowDataExport"
                    color="primary"
                  />
                }
                label="Allow Data Export"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.enableApiLogs}
                    onChange={handleChange}
                    name="enableApiLogs"
                    color="primary"
                  />
                }
                label="Enable API Logging"
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      <Button
        type="submit"
        variant="contained"
        disabled={isPending}
        sx={{ mt: 2 }}
      >
        {isPending ? <CircularProgress size={24} /> : 'Update Advanced Settings'}
      </Button>
    </Box>
  );
}
