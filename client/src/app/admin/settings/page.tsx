'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Typography, Paper, Box, Tabs, Tab, Divider, Alert } from '@mui/material';
import { TabPanel } from '@/components/atoms/TabPanel';
import PermissionGate from '@/components/atoms/PermissionGate';
import { SystemSettingsForm } from '@/components/organisms/settings/SystemSettingsForm';
import { SecuritySettingsForm } from '@/components/organisms/settings/SecuritySettingsForm';
import { NotificationSettingsForm } from '@/components/organisms/settings/NotificationSettingsForm';
import { SharesSettingsForm } from '@/components/organisms/settings/SharesSettingsForm';
import { AdvancedSettingsForm } from '@/components/organisms/settings/AdvancedSettingsForm';
import { settingsService } from '@/lib/api/services/settingsService';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState(0);
  
  // Fetch general settings
  const { data: settings, isLoading: isLoadingSettings, error: settingsError } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      return await settingsService.getAllSettings();
    }
  });
  
  // TODO: Implement shares amount settings when backend is ready
  // const { data: sharesSettings, isLoading: isLoadingShares, error: sharesError } = useQuery({
  //   queryKey: ['settings', 'shares'],
  //   queryFn: async () => {
  //     return await savingsService.getShareAmount();
  //   }
  // });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
    // Check for errors
  const error = settingsError;
  if (error) {
    return (
      <Box sx={{ maxWidth: '100%', width: '100%' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load settings. Please try again later.
        </Alert>
      </Box>
    );
  }
  
  // Check if loading
  const isLoading = isLoadingSettings;
  
  return (
    <Box sx={{ maxWidth: '100%', width: '100%' }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 2 
        }}>
          <Box>
            <Typography variant="h5" component="h1" gutterBottom>
              System Settings
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Configure system settings and preferences
            </Typography>
          </Box>
        </Box>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="settings tabs">
            <Tab label="General" />
            <Tab label="Security" />
            <Tab label="Notifications" />
            <Tab label="Shares" />
            <Tab label="Advanced" />
          </Tabs>
        </Box>
        
        <TabPanel value={activeTab} index={0}>
          <PermissionGate permissions={['settings:edit']} approvalLevel={3}>
            <SystemSettingsForm 
              initialData={settings?.general}
              isLoading={isLoading}
            />
          </PermissionGate>
        </TabPanel>
        
        <TabPanel value={activeTab} index={1}>
          <PermissionGate permissions={['settings:security']} approvalLevel={3}>
            <SecuritySettingsForm
              initialData={settings?.security}
              isLoading={isLoading}
            />
          </PermissionGate>
        </TabPanel>
        
        <TabPanel value={activeTab} index={2}>
          <PermissionGate permissions={['settings:notifications']} approvalLevel={2}>
            <NotificationSettingsForm
              initialData={settings?.notifications}
              isLoading={isLoading}
            />
          </PermissionGate>
        </TabPanel>
          <TabPanel value={activeTab} index={3}>
          <PermissionGate permissions={['settings:shares']} approvalLevel={2}>
            <SharesSettingsForm
              initialData={undefined}
              isLoading={false}
            />
          </PermissionGate>
        </TabPanel>
          <TabPanel value={activeTab} index={4}>
          <PermissionGate permissions={['settings:advanced']} approvalLevel={3}>
            <AdvancedSettingsForm
              initialData={settings?.advanced}
              isLoading={isLoading}
            />
          </PermissionGate>
        </TabPanel>
      </Paper>
    </Box>
  );
}