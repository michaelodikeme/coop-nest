import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState } from '@/types/auth.types';
import { User } from '@/types/user.types';

const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: User;
        tokens: { 
          accessToken: string; 
          refreshToken: string; 
          expiresIn: number 
        };
      }>
    ) => {
      const { user, tokens } = action.payload;
      state.user = user;
      state.tokens = tokens;
      state.isAuthenticated = true;
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    logout: (state) => {
      state.user = null;
      state.tokens = null;
      state.isAuthenticated = false;
      state.error = null;
    },
  },
});

export const { setCredentials, updateUser, setLoading, setError, logout } = authSlice.actions;
export default authSlice.reducer;
