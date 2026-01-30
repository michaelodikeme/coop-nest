'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  Button, 
  Avatar,
  Divider,
  TextField,
  CircularProgress
} from '@mui/material';
import { apiService } from '@/lib/api/apiService';
import { useAuth } from '@/lib/api/contexts/AuthContext';
import { Alert } from '@/components/atoms/Alert';

export default function AdminProfilePage() {
  const { user, refreshUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  const [error, setError] = useState<string | null>(null);
  
  // Fetch user data
  const { data: userData, isLoading, refetch } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      const response = await apiService.get(`/users/${user?.id}/profile`) as any;
      return response.data;
    }
  });

  // Update form data when userData changes
  useEffect(() => {
    if (userData) {
      setFormData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        phone: userData.phone || ''
      });
    }
  }, [userData]);
  
  // Update profile mutation
  const { mutate: updateProfile, isPending } = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiService.put(`/users/${user?.id}/profile`, data) as any;
      return response.data;
    },
    onSuccess: () => {
      setIsEditing(false);
      setError(null);
      refetch();
      refreshUserProfile(); // Update user context
    },
    onError: (err: Error) => {
      setError(err.message);
    }
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(formData);
  };
  
  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data to original values
    if (userData) {
      setFormData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        phone: userData.phone || ''
      });
    }
    setError(null);
  };
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ maxWidth: '100%', width: '100%' }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3 
        }}>
          <Typography variant="h5" component="h1">
            My Profile
          </Typography>
          
          {!isEditing ? (
            <Button 
              variant="contained" 
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </Button>
          ) : (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button 
                variant="outlined" 
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button 
                variant="contained"
                onClick={handleSubmit}
                disabled={isPending}
              >
                {isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          )}
        </Box>
        
        {error && (
          <Alert variant="error" title="Error" message={error} className="mb-3" />
        )}
        
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              p: 3
            }}>
              <Avatar
                sx={{ width: 120, height: 120, mb: 2 }}
                src={userData?.profilePhoto || undefined}
              >
                {user?.username?.[0]?.toUpperCase()}
              </Avatar>
              
              <Typography variant="h6" sx={{ mt: 1 }}>
                {userData?.firstName} {userData?.lastName}
              </Typography>
              
              <Typography variant="body2" color="text.secondary">
                {user?.role?.name || 'Admin'}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Username: {user?.username}
              </Typography>
            </Box>
          </Grid>
          
          <Grid size={{ xs: 12, md: 8 }}>
            <Box component="form">
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="First Name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Last Name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    fullWidth
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Account Information
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Username"
                      value={user?.username || ''}
                      disabled
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Role"
                      value={user?.role?.name || 'Admin'}
                      disabled
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Box sx={{ mt: 2 }}>
                      <Button variant="outlined" size="small">
                        Change Password
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}