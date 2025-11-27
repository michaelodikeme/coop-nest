'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { AuthApiService } from '@/lib/api/services/authService';
const authApi = new AuthApiService();

interface BiodataVerificationFormProps {
  onStepComplete: () => void;
}

export default function BiodataVerificationForm({ onStepComplete }: BiodataVerificationFormProps) {
  const [step, setStep] = useState<'verify' | 'validate'>('verify');
  const [formData, setFormData] = useState({
    // erpId: '',
    phoneNumber: '',
    verificationCode: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authApi.verifyBiodata(formData.phoneNumber);
      setStep('validate');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Validating OTP...');
      const result = await authApi.validateOTP(formData.verificationCode);
      console.log('OTP validation successful:', result);
      console.log('Redirecting to /auth/create-account...');
      router.push('/auth/create-account');
      console.log('Router.push called');
    } catch (err: any) {
      console.error('OTP validation failed:', err);
      setError(err.response?.data?.message || 'Invalid verification code.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'validate') {
    return (
      <Box component="form" onSubmit={handleValidate} noValidate>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <TextField
          margin="normal"
          required
          fullWidth
          name="verificationCode"
          label="Verification Code"
          type="text"
          id="verificationCode"
          value={formData.verificationCode}
          onChange={handleChange}
          disabled={loading}
        />
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Verify Code'}
        </Button>
        <Button
          fullWidth
          variant="text"
          onClick={() => setStep('verify')}
          disabled={loading}
        >
          Back to Previous Step
        </Button>
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleVerify} noValidate>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <TextField
        margin="normal"
        required
        fullWidth
        name="phoneNumber"
        label="Phone Number"
        type="tel"
        id="phoneNumber"
        value={formData.phoneNumber}
        onChange={handleChange}
        disabled={loading}
      />
      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2 }}
        disabled={loading}
      >
        {loading ? <CircularProgress size={24} /> : 'Send Verification Code'}
      </Button>
      <Button
        fullWidth
        variant="text"
        onClick={() => router.push('/auth/login')}
        disabled={loading}
      >
        Back to Login
      </Button>
    </Box>
  );
}