import { useState } from 'react';
import { useAuth } from '@/lib/api/contexts/AuthContext';
import { useDispatch } from '@/lib/hooks/redux/useStore';
import { setError } from '@/lib/hooks/redux/store/slices/authSlice';
import { addToast } from '@/lib/hooks/redux/store/slices/uiSlice';

interface UseAuthenticationReturn {
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook for handling authentication operations
 */
export function useAuthentication(): UseAuthenticationReturn {
  const { login: authLogin, logout: authLogout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setLocalError] = useState<string | null>(null);
  const dispatch = useDispatch();

  /**
   * Login with username and password
   */
  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setLocalError(null);
    dispatch(setError(null));

    try {
      await authLogin(username, password);
      dispatch(addToast({
        message: 'Login successful!',
        type: 'success',
      }));
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed. Please try again.';
      setLocalError(errorMessage);
      dispatch(setError(errorMessage));
      dispatch(addToast({
        message: errorMessage,
        type: 'error',
      }));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout current user
   */
  const logout = async () => {
    setIsLoading(true);
    try {
      await authLogout();
      dispatch(addToast({
        message: 'You have been logged out.',
        type: 'info',
      }));
    } catch (err: any) {
      const errorMessage = err.message || 'Logout failed. Please try again.';
      setLocalError(errorMessage);
      dispatch(addToast({
        message: errorMessage,
        type: 'error',
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    login,
    logout,
    isLoading,
    error,
  };
}
