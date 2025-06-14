'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/api/contexts/AuthContext';
import { handleLoginError } from '@/lib/api/contexts/AuthContext';
import { useSearchParams } from 'next/navigation';
import {
  Box,
  TextField,
  Button,
  Alert,
  Link as MuiLink,
  CircularProgress,
} from '@mui/material';
import Link from 'next/link';
import { useTheme, alpha } from '@mui/material/styles';

interface LoginFormProps {
  initialError?: string | null;
}

export default function LoginForm({ initialError }: LoginFormProps) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState(initialError || '');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const theme = useTheme();

  // Show success message if coming from registration
  const registered = searchParams.get('registered') === 'true';
  const reset = searchParams.get('reset') === 'success';
  // Update error when initialError changes
  useEffect(() => {
    if (initialError) {
      setError(initialError);
    }
  }, [initialError]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      setError('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await login(formData.username, formData.password);
    } catch (err: any) {
      console.error('Login error:', err);
      // const errorMessage = handleLoginError(err)
      // setError(errorMessage)
      setError(
        err.response?.data?.message || 
        err.message || 
        'Login failed. Please check your credentials and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      {registered && (
        <Alert 
          severity="success" 
          sx={{ 
            mb: 2,
            borderRadius: 2,
            backgroundColor: alpha(theme.palette.success.main, 0.1),
            '& .MuiAlert-icon': {
              color: theme.palette.success.main
            }
          }}
        >
          Registration successful! Please login with your credentials.
        </Alert>
      )}

      {reset && (
        <Alert 
          severity="success" 
          sx={{ 
            mb: 2,
            borderRadius: 2,
            backgroundColor: alpha(theme.palette.success.main, 0.1),
            '& .MuiAlert-icon': {
              color: theme.palette.success.main
            }
          }}
        >
          Password reset successful! Please login with your new password.
        </Alert>
      )}

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 2,
            borderRadius: 2,
            backgroundColor: alpha(theme.palette.error.main, 0.1),
            '& .MuiAlert-icon': {
              color: theme.palette.error.main
            }
          }}
        >
          {error}
        </Alert>
      )}

      {error && (
                <Alert 
                    severity="error" 
                    sx={{ 
                        mb: 2,
                        borderRadius: 2,
                        backgroundColor: alpha(theme.palette.error.main, 0.1),
                        '& .MuiAlert-icon': {
                            color: theme.palette.error.main
                        }
                    }}
                >
                    {error}
                </Alert>
            )}

      <TextField
        margin="normal"
        required
        fullWidth
        id="username"
        label="Username"
        name="username"
        autoComplete="username"
        autoFocus
        value={formData.username}
        onChange={handleChange}
        disabled={isLoading}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            backgroundColor: 'background.paper',
            '&:hover': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'primary.main',
              },
            },
          },
        }}
      />

      <TextField
        margin="normal"
        required
        fullWidth
        name="password"
        label="Password"
        type="password"
        id="password"
        autoComplete="current-password"
        value={formData.password}
        onChange={handleChange}
        disabled={isLoading}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            backgroundColor: 'background.paper',
            '&:hover': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'primary.main',
              },
            },
          },
        }}
      />

      <Button
        type="submit"
        fullWidth
        variant="contained"
        disabled={isLoading}
        sx={{ 
          mt: 3, 
          mb: 2,
          py: 1.5,
          borderRadius: 2,
          textTransform: 'none',
          fontSize: '1rem',
          fontWeight: 600,
          boxShadow: '0 4px 14px 0 rgba(0,0,0,0.1)',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 6px 20px 0 rgba(0,0,0,0.15)'
          }
        }}
      >
        {isLoading ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          'Sign In'
        )}
      </Button>

      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1
        }}
      >
        <MuiLink 
          component={Link} 
          href="/auth/forgot-password"
          sx={{ 
            textDecoration: 'none',
            color: 'primary.main',
            fontSize: '0.875rem',
            transition: 'color 0.2s ease-in-out',
            '&:hover': {
              color: 'primary.dark'
            }
          }}
        >
          Forgot password?
        </MuiLink>
        <MuiLink 
          component={Link} 
          href="/auth/verify"
          sx={{ 
            textDecoration: 'none',
            color: 'primary.main',
            fontSize: '0.875rem',
            transition: 'color 0.2s ease-in-out',
            '&:hover': {
              color: 'primary.dark'
            }
          }}
        >
          Existing member? <br> 
          </br>Verify your account
        </MuiLink>
      </Box>
    </Box>
  );
}