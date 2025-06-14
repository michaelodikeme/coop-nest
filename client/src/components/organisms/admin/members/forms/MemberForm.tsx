import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { memberFormSchema } from '@/validations/memberSchema';
import type { MemberFormData } from '@/types/member.types';
import { Button } from '@/components/atoms/Button';
import { Alert } from '@/components/atoms/Alert';
import {
  Grid,
  Paper,
  Typography,
  Divider,
  TextField,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import WorkIcon from '@mui/icons-material/Work';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import HomeIcon from '@mui/icons-material/Home';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

interface MemberFormProps {
  onSubmit: (data: MemberFormData) => void;
  onCancel: () => void; // Add onCancel prop for handling navigation
  isLoading?: boolean;
  error?: string;
  initialData?: Partial<MemberFormData>;
}

// Type for backend validation errors
interface ValidationErrorItem {
  code: string;
  message: string;
  path: string[];
  // Other properties might be present but we're focused on these
}

interface ValidationErrorResponse {
  success: boolean;
  status: string;
  message: string;
  code: number;
  validationErrors?: ValidationErrorItem[];
}

const genderOptions = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
];

export const MemberForm: React.FC<MemberFormProps> = ({
  onSubmit,
  onCancel,
  isLoading,
  error,
  initialData,
}) => {
  // Store backend validation errors
  const [backendErrors, setBackendErrors] = useState<Record<string, string>>({});
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: setFormError,
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: initialData,
    mode: 'onBlur', // Validate on blur for better UX
  });

  // Process backend errors whenever the error prop changes
  useEffect(() => {
    if (error) {
      try {
        // Try to parse the error as JSON
        const errorObj = JSON.parse(error);
        if (errorObj.validationErrors && Array.isArray(errorObj.validationErrors)) {
          // Map backend validation errors to form fields
          const newErrors: Record<string, string> = {};
          errorObj.validationErrors.forEach((err: ValidationErrorItem) => {
            if (err.path && err.path.length > 0) {
              const fieldName = err.path[0];
              newErrors[fieldName] = err.message;
              
              // Also set the error in react-hook-form
              setFormError(fieldName as any, { 
                type: 'server', 
                message: err.message 
              });
            }
          });
          setBackendErrors(newErrors);
        }
      } catch (e) {
        // If it's not JSON or doesn't have the expected structure,
        // just show the raw error message
        console.log('Error parsing backend error:', e);
      }
    } else {
      // Clear backend errors when error prop is cleared
      setBackendErrors({});
    }
  }, [error, setFormError]);

  // Get field error message, prioritizing backend errors over form validation errors
  const getFieldError = (fieldName: string) => {
    return backendErrors[fieldName] || errors[fieldName as keyof typeof errors]?.message;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {error && !Object.keys(backendErrors).length && (
        <Alert variant="error" title="Error" message={error} />
      )}

      {/* Personal Info */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: '#f5f7fa' }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <PersonIcon sx={{ mr: 1, color: 'primary.main' }} /> Personal Information
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="ERP ID"
              fullWidth
              required
              {...register('erpId')}
              error={!!getFieldError('erpId')}
              helperText={getFieldError('erpId') || 'Required unique identifier'}
              InputProps={{
                startAdornment: <InputAdornment position="start">#</InputAdornment>,
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="IPPIS ID" 
              fullWidth
              required
              {...register('ippisId')}
              error={!!getFieldError('ippisId')}
              helperText={getFieldError('ippisId') || 'Required unique identifier'}
              InputProps={{
                startAdornment: <InputAdornment position="start">#</InputAdornment>,
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="First Name"
              fullWidth
              required
              {...register('firstName')}
              error={!!getFieldError('firstName')}
              helperText={getFieldError('firstName') || 'At least 2 characters'}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Middle Name"
              fullWidth
              {...register('middleName')}
              error={!!getFieldError('middleName')}
              helperText={getFieldError('middleName') || 'Optional'}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Last Name"
              fullWidth
              required
              {...register('lastName')}
              error={!!getFieldError('lastName')}
              helperText={getFieldError('lastName') || 'At least 2 characters'}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Email"
              fullWidth
              required
              type="email"
              {...register('emailAddress')}
              error={!!getFieldError('emailAddress')}
              helperText={getFieldError('emailAddress') || 'Valid email required'}
              InputProps={{
                startAdornment: <InputAdornment position="start"><EmailIcon /></InputAdornment>,
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Phone"
              fullWidth
              required
              placeholder="+2348012345678"
              {...register('phoneNumber')}
              error={!!getFieldError('phoneNumber')}
              helperText={getFieldError('phoneNumber') || 'Valid Nigerian format e.g. +2348012345678'}
              InputProps={{
                startAdornment: <InputAdornment position="start"><PhoneIcon /></InputAdornment>,
              }}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Residential Address"
              fullWidth
              required
              multiline
              minRows={2}
              {...register('residentialAddress')}
              error={!!getFieldError('residentialAddress')}
              helperText={getFieldError('residentialAddress') || 'At least 5 characters'}
              InputProps={{
                startAdornment: <InputAdornment position="start"><HomeIcon /></InputAdornment>,
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Employment Info */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: '#f5f7fa' }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <WorkIcon sx={{ mr: 1, color: 'primary.main' }} /> Employment Information
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Staff Number"
              fullWidth
              required
              {...register('staffNo')}
              error={!!getFieldError('staffNo')}
              helperText={getFieldError('staffNo') || 'Required unique identifier'}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Department"
              fullWidth
              required
              defaultValue=""
              {...register('department')}
              error={!!getFieldError('department')}
              helperText={getFieldError('department')}
            >
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Employment Date"
              type="date"
              fullWidth
              required
              {...register('dateOfEmployment')}
              error={!!getFieldError('dateOfEmployment')}
              helperText={getFieldError('dateOfEmployment') || 'Format: YYYY-MM-DD'}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><CalendarMonthIcon /></InputAdornment>,
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Next of Kin */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: '#f5f7fa' }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FamilyRestroomIcon sx={{ mr: 1, color: 'primary.main' }} /> Next of Kin Details
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Full Name"
              fullWidth
              required
              {...register('nextOfKin')}
              error={!!getFieldError('nextOfKin')}
              helperText={getFieldError('nextOfKin') || 'Full name of next of kin'}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Relationship"
              fullWidth
              required
              placeholder="e.g., Spouse, Parent, Child"
              {...register('relationshipOfNextOfKin')}
              error={!!getFieldError('relationshipOfNextOfKin')}
              helperText={getFieldError('relationshipOfNextOfKin') || 'e.g., Spouse, Parent, Child'}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Phone"
              fullWidth
              required
              placeholder="+2348012345678"
              {...register('nextOfKinPhoneNumber')}
              error={!!getFieldError('nextOfKinPhoneNumber')}
              helperText={getFieldError('nextOfKinPhoneNumber') || 'Valid Nigerian format required'}
              InputProps={{
                startAdornment: <InputAdornment position="start"><PhoneIcon /></InputAdornment>,
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Email"
              fullWidth
              required
              {...register('nextOfKinEmailAddress')}
              error={!!getFieldError('nextOfKinEmailAddress')}
              helperText={getFieldError('nextOfKinEmailAddress') || 'Valid email required'}
              InputProps={{
                startAdornment: <InputAdornment position="start"><EmailIcon /></InputAdornment>,
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Submit and Cancel Buttons */}
      <Grid container spacing={2} justifyContent="flex-end">
        <Grid>
          <Button
            variant="outlined"
            color="secondary"
            onClick={onCancel} // Use the provided onCancel handler
            sx={{ mr: 2 }}
            type="button" // Important: type="button" prevents form submission
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            type="submit"
            disabled={isLoading}
            sx={{ minWidth: 140, fontWeight: 600, fontSize: '1rem' }}
          >
            {isLoading ? 'Saving...' : 'Save Member'}
          </Button>
        </Grid>
      </Grid>
    </form>
  );
};
