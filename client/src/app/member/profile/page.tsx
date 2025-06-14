'use client';

import { useState, useEffect } from 'react';
import { useMemberProfile } from '@/lib/hooks/member/useMemberProfile';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { memberService } from '@/lib/api';
import PermissionGate from '@/components/atoms/PermissionGate';
import MemberLayout from '@/components/templates/member/MemberLayout';
import { Biodata, MembershipStatus } from '@/types/member.types';
import { 
  Box, 
  Grid,
  Paper,
  Typography,
  Avatar,
  Button,
  Divider,
  Stack,
  Tab,
  Tabs,
  CircularProgress,
  Alert,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip
} from '@mui/material';
import { 
  Edit as EditIcon,
  PhotoCamera as PhotoCameraIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Check as CheckIcon,
  Pending as PendingIcon
} from '@mui/icons-material';
import { formatDate } from '@/utils/formatting/format';
import type { Member } from '@/types/member.types';
import React from 'react';
import { MemberStatusBadge } from '@/components/atoms/MemberStatusBadge';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
      sx={{ py: 3 }}
    >
      {value === index && children}
    </Box>
  )
}

// DO NOT wrap with MemberLayout or PermissionGate here
export default function ProfilePage() {
  const { 
    profile: biodata, 
    biodataId,
    rawData,
    isLoading: biodataLoading, 
    error: biodataError,
    updateProfile
  } = useMemberProfile();
  
  const { mutate: updateProfileMutation, isPending: isUpdating } = updateProfile;
  
  console.log('Profile Page - biodata:', biodata);
  console.log('Profile Page - biodataId:', biodataId);
  console.log('Profile Page - rawData:', rawData);

  const [activeTab, setActiveTab] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<Biodata | undefined>(undefined);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  // Update editData when biodata changes
  React.useEffect(() => {
    if (biodata) {
      setEditData(biodata as Biodata);
    }
  }, [biodata]);

  // Edit biodata mutation - use the updateProfile mutation from the hook
  const handleSave = () => {
    if (editData) {
      const updateFields: Partial<Biodata> = {
        firstName: editData.firstName,
        lastName: editData.lastName,
        emailAddress: editData.emailAddress,
        phoneNumber: editData.phoneNumber,
        residentialAddress: editData.residentialAddress,
        department: editData.department,
        nextOfKin: editData.nextOfKin,
        relationshipOfNextOfKin: editData.relationshipOfNextOfKin,
        nextOfKinPhoneNumber: editData.nextOfKinPhoneNumber,
        nextOfKinEmailAddress: editData.nextOfKinEmailAddress
      };
      updateProfileMutation(updateFields, {
        onSuccess: () => setEditMode(false)
      });
    }
  };

  // Photo upload mutation
  const { mutate: profilePhoto, isPending: isUploading } = useMutation({
    mutationFn: (file: File) => {
      if (!biodataId) {
        throw new Error("Cannot upload photo: No biodata ID available");
      }
      return memberService.uploadProfilePhoto(biodataId, file);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-profile'] });
      setShowPhotoUpload(false);
      setSelectedFile(null);
    },
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleEdit = () => {
    setEditData(biodata as Biodata);
    setEditMode(true);
  };

  const handleCancel = () => {
    setEditData(biodata as Biodata);
    setEditMode(false);
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handlePhotoSave = () => {
    if (selectedFile) {
      profilePhoto(selectedFile);
    }
  };

  const handleFieldChange = (field: keyof Biodata) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editData) {
      setEditData({
        ...editData,
        [field]: e.target.value
      });
    }
  };

  if (biodataLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (biodataError) {
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        Error loading profile data. Please refresh the page.
      </Alert>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        minHeight: '100vh',
        bgcolor: 'background.default',
        py: { xs: 2, md: 6 },
      }}
    >
        {/* Profile Header */}
        <Paper
          elevation={2}
          sx={{
            p: { xs: 2, md: 3 },
            mb: 3,
            position: 'relative',
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'center', sm: 'flex-start' },
            gap: 3,
          }}
        >
          <Box sx={{ position: 'relative', mr: { sm: 3 } }}>
            <Avatar
              src={biodata?.profilePhoto || undefined}
              sx={{ width: 120, height: 120 }}
            />
            <IconButton
              sx={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                backgroundColor: 'background.paper',
              }}
              onClick={() => setShowPhotoUpload(true)}
            >
              <PhotoCameraIcon />
            </IconButton>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" sx={{ wordBreak: 'break-word' }}>
              {biodata?.fullName || `${biodata?.firstName} ${biodata?.lastName}`}
            </Typography>
            <Typography color="text.secondary" gutterBottom>
              {biodata?.department} • Staff No: {biodata?.staffNo}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Status:
              </Typography>
              <MemberStatusBadge
                status={String(biodata?.membershipStatus ?? '')}
                type="membership"
              />
            </Stack>
          </Box>
          <Box sx={{ alignSelf: { xs: 'center', sm: 'flex-start' } }}>
            {!editMode ? (
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleEdit}
              >
                Edit Profile
              </Button>
            ) : (
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={isUpdating}
                >
                  Save
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
              </Stack>
            )}
          </Box>
        </Paper>

        {/* Profile Content */}
        <Paper elevation={3} sx={{ mb: 3, p: { xs: 1.5, md: 2 } }}>
          <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="Personal Information" />
            <Tab label="Employment Details" />
            <Tab label="Next of Kin" />
            <Tab label="Bank Details" />
          </Tabs>

          {/* Personal Information Tab */}
          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={3}>
              <Grid columnSpacing={{ xs: '12', sm: '6' }}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={editMode ? editData?.firstName : biodata?.firstName}
                  onChange={handleFieldChange('firstName')}
                  disabled={!editMode}
                />
              </Grid>
              <Grid columnSpacing={{ xs: '12', sm: '6' }}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={editMode ? editData?.lastName : biodata?.lastName}
                  onChange={handleFieldChange('lastName')}
                  disabled={!editMode}
                />
              </Grid>
              <Grid columnSpacing={{ xs: '12', sm: '6' }}>
                <TextField
                  fullWidth
                  label="Email Address"
                  value={editMode ? editData?.emailAddress : biodata?.emailAddress}
                  onChange={handleFieldChange('emailAddress')}
                  disabled={!editMode}
                />
              </Grid>
              <Grid columnSpacing={{ xs: '12', sm: '6' }}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={editMode ? editData?.phoneNumber : biodata?.phoneNumber}
                  onChange={handleFieldChange('phoneNumber')}
                  disabled={!editMode}
                />
              </Grid>
              <Grid columnSpacing={{ xs: '12' }}>
                <TextField
                  fullWidth
                  label="Residential Address"
                  value={editMode ? editData?.residentialAddress : biodata?.residentialAddress}
                  onChange={handleFieldChange('residentialAddress')}
                  disabled={!editMode}
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* Employment Details Tab */}
          <TabPanel value={activeTab} index={1}>
            <Grid container spacing={3}>
              <Grid columnSpacing={{ xs: '12', sm: '6' }}>
                <TextField
                  fullWidth
                  label="ERP ID"
                  value={biodata?.erpId}
                  disabled
                />
              </Grid>
              <Grid columnSpacing={{ xs: '12', sm: '6' }}>
                <TextField
                  fullWidth
                  label="IPPIS ID"
                  value={biodata?.ippisId}
                  disabled
                />
              </Grid>
              <Grid columnSpacing={{ xs: '12', sm: '6' }}>
                <TextField
                  fullWidth
                  label="Department"
                  value={editMode ? editData?.department : biodata?.department}
                  onChange={handleFieldChange('department')}
                  disabled={!editMode}
                />
              </Grid>
              <Grid columnSpacing={{ xs: '12', sm: '6' }}>
                <TextField
                  fullWidth
                  label="Staff Number"
                  value={editMode ? editData?.staffNo : biodata?.staffNo}
                  onChange={handleFieldChange('staffNo')}
                  disabled
                />
              </Grid>
              <Grid columnSpacing={{ xs: '12', sm: '6' }}>
                <TextField
                  fullWidth
                  label="Date of Employment"
                  type="date"
                  value={editMode ? editData?.dateOfEmployment : biodata?.dateOfEmployment}
                  onChange={handleFieldChange('dateOfEmployment')}
                  disabled
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* Next of Kin Tab */}
          <TabPanel value={activeTab} index={2}>
            <Grid container spacing={3}>
              <Grid columnSpacing={{ xs: '12', sm: '6' }}>
                <TextField
                  fullWidth
                  label="Next of Kin Name"
                  value={editMode ? editData?.nextOfKin : biodata?.nextOfKin}
                  onChange={handleFieldChange('nextOfKin')}
                  disabled={!editMode}
                />
              </Grid>
              <Grid columnSpacing={{ xs: '12', sm: '6' }}>
                <TextField
                  fullWidth
                  label="Relationship"
                  value={editMode ? editData?.relationshipOfNextOfKin : biodata?.relationshipOfNextOfKin}
                  onChange={handleFieldChange('relationshipOfNextOfKin')}
                  disabled={!editMode}
                />
              </Grid>
              <Grid columnSpacing={{ xs: '12', sm: '6' }}>
                <TextField
                  fullWidth
                  label="Next of Kin Phone"
                  value={editMode ? editData?.nextOfKinPhoneNumber : biodata?.nextOfKinPhoneNumber}
                  onChange={handleFieldChange('nextOfKinPhoneNumber')}
                  disabled={!editMode}
                />
              </Grid>
              <Grid columnSpacing={{ xs: '12', sm: '6' }}>
                <TextField
                  fullWidth
                  label="Next of Kin Email"
                  value={editMode ? editData?.nextOfKinEmailAddress : biodata?.nextOfKinEmailAddress}
                  onChange={handleFieldChange('nextOfKinEmailAddress')}
                  disabled={!editMode}
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* Bank Details Tab */}
          <TabPanel value={activeTab} index={3}>
            <Grid container spacing={3}>
              <Grid columnSpacing={{ xs: '12', sm: '6' }}>
                <TextField
                  fullWidth
                  label="Bank Name"
                  value={biodata?.accountInfo?.bank?.name}
                  disabled
                />
              </Grid>
              <Grid columnSpacing={{ xs: '12', sm: '6' }}>
                <TextField
                  fullWidth
                  label="Account Number"
                  value={biodata?.accountInfo?.bankAccountNumber}
                  disabled
                />
              </Grid>
              <Grid columnSpacing={{ xs: '12', sm: '6' }}>
                <TextField
                  fullWidth
                  label="Account Name"
                  value={biodata?.accountInfo?.accountHolderName}
                  disabled
                />
              </Grid>
              <Grid columnSpacing={{ xs: '12', sm: '6' }}>
                <TextField
                  fullWidth
                  label="Bank Verification No. (BVN)"
                  value={biodata?.accountInfo?.bvn}
                  disabled
                />
              </Grid>
            </Grid>
          </TabPanel>
        </Paper>
      
      {/* Photo Upload Dialog */}
      <Dialog open={showPhotoUpload} onClose={() => setShowPhotoUpload(false)}>
        <DialogTitle>Update Profile Photo</DialogTitle>
        <DialogContent>
          <Box sx={{ p: 2 }}>
            <input
              accept="image/*"
              type="file"
              onChange={handlePhotoUpload}
              style={{ display: 'none' }}
              id="photo-upload"
            />
            <label htmlFor="photo-upload">
              <Button variant="outlined" component="span">
                Choose Photo
              </Button>
            </label>
            {selectedFile && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Selected: {selectedFile.name}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPhotoUpload(false)}>Cancel</Button>
          <Button 
            onClick={handlePhotoSave}
            disabled={!selectedFile || isUploading}
            variant="contained"
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
