import { AuthApiService } from '@/lib/api/services/authService';
import axios, { 
  AxiosError, 
  AxiosInstance, 
  AxiosRequestConfig, 
  InternalAxiosRequestConfig 
} from 'axios';
import { 
  getStoredAuthTokens, 
  clearAuthTokens, 
  setStoredAuthTokens
} from '@/lib/api/auth/authStorage';
import type { ApiErrorResponse } from '@/types/types';
import type { HealthStatus } from '@/types/auth.types';

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean; // Add the custom property
}

// Define auth error types
export enum AuthErrorType {
  INVALID_CREDENTIALS = 'invalid_credentials',
  TOKEN_EXPIRED = 'token_expired',
  TOKEN_INVALID = 'token_invalid',
  TOKEN_MISSING = 'token_missing',
  TOKEN_REVOKED = 'token_revoked',
  SESSION_EXPIRED = 'session_expired',
  SESSION_INVALID = 'session_invalid',
  PERMISSION_DENIED = 'permission_denied',
  ACCOUNT_LOCKED = 'account_locked',
  ACCOUNT_DISABLED = 'account_disabled',
  RATE_LIMITED = 'rate_limited',
  CSRF_MISSING = 'csrf_missing',
  CSRF_INVALID = 'csrf_invalid',
}

// Add connection check function
export const checkApiConnection = async (): Promise<boolean> => {
  try {
    await axios.get(`${BASE_URL}/health`);
    return true;
  } catch (error) {
    console.error('API connection failed:', error);
    return false;
  }
};

function handleError(error: AxiosError<ApiErrorResponse>): never {
  // Keep existing error handling logic
  throw error;
}

class ApiService {
  private api: AxiosInstance;
  private static instance: ApiService;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];
  private backoffDelay: number = 0;
  private systemHealth: HealthStatus | null = null;
  private healthInterval: NodeJS.Timeout | null = null;
  public onHealthStatusChange: ((health: HealthStatus) => void) | null = null;



  private constructor() {
    this.api = axios.create({
      baseURL: BASE_URL,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
    
    this.setupInterceptors();
    this.startHealthPolling();
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private setupInterceptors() {
    this.api.interceptors.request.use(
      async (config) => {
        // Add authentication token
        const tokens = getStoredAuthTokens();
        if (tokens?.accessToken) {
          config.headers.Authorization = `Bearer ${tokens.accessToken}`;
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiErrorResponse>) => {
        const originalRequest = error.config as CustomAxiosRequestConfig; // Use the extended type

        if (!originalRequest) {
          return Promise.reject(error);
        }

        if (
          error.response?.status === 401 &&
          (
            error.response?.data?.message?.includes('expired') ||
            error.response?.data?.code === AuthErrorType.TOKEN_EXPIRED
          ) &&
          !originalRequest._retry // Access the custom property
        ) {
          originalRequest._retry = true; // Set the custom property
          this.isRefreshing = true;
          
          try {
            // Get refresh token from storage
            const tokens = getStoredAuthTokens();
            if (!tokens?.refreshToken) {
              throw new Error('No refresh token available');
            }
            
            console.log('Attempting to refresh token...');
            
            // Call the new refresh token endpoint

            const authService = new AuthApiService();
            const newTokens = await authService.refreshToken(tokens.refreshToken);
            
            console.log('Token refreshed successfully, new expiry:', 
              newTokens.expiresIn ? new Date(Date.now() + newTokens.expiresIn * 1000) : 'unknown');
            
            // Update tokens in storage with expiry calculation
            setStoredAuthTokens({
              accessToken: newTokens.accessToken,
              refreshToken: newTokens.refreshToken,
              expiresIn: newTokens.expiresIn,
              sessionId: tokens.sessionId // Preserve the session ID
            });
            
            // Update authorization header for this request
            originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
            
            // Notify all waiting requests that we have a new token
            this.refreshSubscribers.forEach(callback => callback(newTokens.accessToken));
            this.refreshSubscribers = [];
            
            // Retry the original request with the new token
            return this.api(originalRequest);
          } catch (refreshError) {
            // If refresh fails, clear auth and redirect to login
            console.error('Token refresh failed:', refreshError);
            clearAuthTokens();
            
            // Redirect to login page with reason
            if (typeof window !== 'undefined') {
              window.location.href = '/auth/login?reason=session_expired';
            }
            
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }
        
        // For other errors, just reject the promise
        return Promise.reject(error);
      }
    );
  }

  private handleAuthError(error: any) {
    if (error.response?.data?.code) {
      const errorCode = error.response.data.code;
      
      switch (errorCode) {
        case AuthErrorType.TOKEN_EXPIRED:
        case AuthErrorType.TOKEN_INVALID:
        case AuthErrorType.TOKEN_REVOKED:
        case AuthErrorType.SESSION_EXPIRED:
          // Clear tokens and redirect to login
          clearAuthTokens();
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login?reason=session_expired';
          }
          break;
          
        case AuthErrorType.RATE_LIMITED:
          // Show rate limit message and implement exponential backoff
          this.backoffDelay = this.backoffDelay ? Math.min(this.backoffDelay * 2, 30000) : 1000;
          setTimeout(() => { this.backoffDelay = 0; }, 60000);
          break;
          
        case AuthErrorType.PERMISSION_DENIED:
          // Redirect to permission denied page
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/permission-denied';
          }
          break;
      }
    }
    
    return Promise.reject(error);
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.api.get<T>(url, config);
      
      // Normalize response handling - some endpoints return { data, status, ... }
      // while others return data directly
      if (response.data && typeof response.data === 'object' && 'data' in response.data && 'status' in response.data) {
        // This is a wrapped API response
        // console.log(`API GET ${url} returned wrapped response:`, response.data);
        return response.data;
      } else {
        console.log(`API GET ${url} returned direct data:`, response.data);
        return response.data;
      }
    } catch (error) {
      return handleError(error as AxiosError<ApiErrorResponse>);
    }
  }

  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.api.post<T>(url, data, config);
      
      // Normalize response handling - some endpoints return { data, status, ... }
      // while others return data directly
      if (response.data && typeof response.data === 'object' && 'data' in response.data && 'status' in response.data) {
        // This is a wrapped API response
        console.log(`API POST ${url} returned wrapped response:`, response.data);
        return response.data;
      } else {
        console.log(`API POST ${url} returned direct data:`, response.data);
        return response.data;
      }
    } catch (error) {
      return handleError(error as AxiosError<ApiErrorResponse>);
    }
  }

  public async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.api.put<T>(url, data, config);
      
      // Normalize response handling - some endpoints return { data, status, ... }
      // while others return data directly
      if (response.data && typeof response.data === 'object' && 'data' in response.data && 'status' in response.data) {
        // This is a wrapped API response
        console.log(`API PUT ${url} returned wrapped response:`, response.data);
        return response.data;
      } else {
        console.log(`API PUT ${url} returned direct data:`, response.data);
        return response.data;
      }
    } catch (error) {
      return handleError(error as AxiosError<ApiErrorResponse>);
    }
  }

  public async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.api.patch<T>(url, data, config);
      
      // Normalize response handling - some endpoints return { data, status, ... }
      // while others return data directly
      if (response.data && typeof response.data === 'object' && 'data' in response.data && 'status' in response.data) {
        // This is a wrapped API response
        console.log(`API PATCH ${url} returned wrapped response:`, response.data);
        return response.data;
      } else {
        console.log(`API PATCH ${url} returned direct data:`, response.data);
        return response.data;
      }
    } catch (error) {
      return handleError(error as AxiosError<ApiErrorResponse>);
    }
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.api.delete<T>(url, config);
      
      // Normalize response handling - some endpoints return { data, status, ... }
      // while others return data directly
      if (response.data && typeof response.data === 'object' && 'data' in response.data && 'status' in response.data) {
        // This is a wrapped API response
        console.log(`API DELETE ${url} returned wrapped response:`, response.data);
        return response.data;
      } else {
        console.log(`API DELETE ${url} returned direct data:`, response.data);
        return response.data;
      }
    } catch (error) {
      return handleError(error as AxiosError<ApiErrorResponse>);
    }
  }

  public async upload<T>(url: string, file: File, onProgress?: (progress: number) => void): Promise<T> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await this.api.post<T>(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted);
          }
        },
      });
      
      return response.data;
    } catch (error) {
      return handleError(error as AxiosError<ApiErrorResponse>);
    }
  }

  public async checkHealth(): Promise<HealthStatus> {
    try {
      const response = await axios.get<HealthStatus>(`${BASE_URL}/health`);
      return response.data;
    } catch (error) {
      return {
        status: 'unhealthy',
        redis: false,
        database: false,
        timestamp: new Date()
      };
    }
  }

  private startHealthPolling(intervalMs = 30000) {
    if (typeof window === 'undefined') return;
    
    this.healthInterval = setInterval(async () => {
      try {
        const health = await this.checkHealth();
        this.systemHealth = health;
        
        if (health.status !== 'healthy') {
          console.warn('Backend system health degraded:', health);
          if (this.onHealthStatusChange) {
            this.onHealthStatusChange(health);
          }
        }
      } catch (error) {
        console.error('Health check failed:', error);
      }
    }, intervalMs);
  }

  public cleanup() {
    if (this.healthInterval) {
      clearInterval(this.healthInterval);
    }
  }
}

// Export the ApiService singleton instance
export const apiService = ApiService.getInstance();
