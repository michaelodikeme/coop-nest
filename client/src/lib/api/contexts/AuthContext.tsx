'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authApi as authService } from '@/lib/api/services/authService';
import { 
  getStoredAuthTokens, 
  setStoredAuthTokens, 
  clearAuthTokens, 
  isTokenValid,
  extractTokenData,
  isTokenExpiringSoon 
} from '@/lib/api/auth/authStorage';
import axios, { AxiosError } from 'axios';
import { useDispatch } from 'react-redux';
import { setCredentials, logout as logoutAction } from '@/lib/hooks/redux/store/slices/authSlice';
import { AuthTokens, Session } from '@/types/auth.types';
import { isAdminUser, isMemberUser, formatUserData } from '../../utils/roleUtils';
import type { User } from '@/types/user.types';
import type { RoleAssignment } from '@/types/auth.types';
import { tokenRefreshService, MIN_REFRESH_INTERVAL_MS } from '@/lib/services/tokenRefreshService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isInitializing: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: (options?: { 
    invalidateAll?: boolean,
    redirectToLogin?: boolean,
    reason?: string
  }) => Promise<void>;
  hasPermission: (permission: string | string[]) => boolean;
  hasModuleAccess: (moduleName: string) => boolean;
  checkApprovalLevel: (requiredLevel: number) => boolean;
  refreshUserProfile: () => Promise<User>;
  handleAuthRedirect: (currentPath?: string) => void;
  // Session management
  userSessions: Session[];
  currentSession: Session | null;
  getActiveSessions: () => Promise<Session[]>;
  invalidateSession: (sessionId: string) => Promise<void>;
  isCurrentSession: (sessionId: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null); // Add error state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userSessions, setUserSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const router = useRouter();
  const dispatch = useDispatch();

  // Debug function for auth issues
  const debugAuth = (message: string, data?: any) => {
    if (process.env.NODE_ENV !== 'production') {
      console.group(`🔐 Auth Debug: ${message}`);
      if (data) console.log(data);
      console.groupEnd();
    }
  };

  // Get active sessions
  const getActiveSessions = useCallback(async () => {
    if (!isAuthenticated) return [];
    
    try {
      // Now authService.getActiveSessions() always returns a Session[] array
      const sessions = await authService.getActiveSessions();
      // console.log('Sessions response:', sessions);
      
      // Set sessions directly since we've already handled extraction in the service
      setUserSessions(sessions);
      
      // Identify current session using sessionId from the token
      const tokens = getStoredAuthTokens();
      const tokenData = tokens?.accessToken ? extractTokenData(tokens.accessToken) : null;
      
      if (tokenData?.sessionId && sessions.length > 0) {
        // First try to find session by direct ID comparison
        let current = sessions.find(s => s.id === tokenData.sessionId);
        
        // If not found, try extracting sessionId from token
        if (!current) {
          current = sessions.find(s => {
            try {
              // Extract sessionId from the token in the session
              const sessionTokenData = extractTokenData(s.token);
              return sessionTokenData.sessionId === tokenData.sessionId;
            } catch (e) {
              return false;
            }
          });
        }
        
        setCurrentSession(current || null);
      } else {
        setCurrentSession(null);
      }
      
      return sessions;
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      return [];
    }
  }, [isAuthenticated]);

  // Check if session ID matches the current session
  const isCurrentSession = useCallback(async (sessionId: string): Promise<boolean> => {
    const tokens = getStoredAuthTokens();
    const tokenData = tokens?.accessToken ? extractTokenData(tokens.accessToken) : null;

    if (tokenData?.sessionId !== sessionId) return false;

    return await validateSession(sessionId);
  }, []);

  // Default route based on user role - improved with clearer role determination
  const getDefaultRoute = (user: User | null): string => {

    console.log("user from  get default", user)
    if (!user) return '/auth/login';
    
    // Check for admin role first
    if (isAdminUser(user)) {
      // console.log('User is admin, default route is admin dashboard');
      return '/admin/dashboard';
    } 
    
    // Check for member role
    if (isMemberUser(user)) {
      // console.log('User is member, default route is member dashboard');
      return '/member/dashboard';
    }
    
    // No recognized role
    console.warn('User has no recognized role, defaulting to login');
    return '/auth/login';
  };

  // Centralized function to handle auth-based redirects
  const handleAuthRedirect = useCallback((currentPath: string = window?.location?.pathname) => {
    // console.log('Handling auth redirect from path:', currentPath, 'Auth state:', { 
    //   isAuthenticated, 
    //   isAdmin: user ? isAdminUser(user) : false,
    //   isMember: user ? isMemberUser(user) : false,
    // });
    
    // Don't redirect during auth processes or for certain paths
    if (isLoading || isInitializing) {
      console.log('Skipping redirect - auth is still loading');
      return;
    }

    // For auth pages, handle differently
    if (currentPath.startsWith('/auth/')) {
      if (isAuthenticated) {
        // If already authenticated, redirect based on role
        if (isAdminUser(user)) {
          // console.log('Redirecting authenticated admin from auth page to admin dashboard');
          router.replace('/admin/dashboard');
        } else if (isMemberUser(user)) {
          // If user is a member, redirect to member dashboard
          // console.log('Redirecting authenticated member from auth page to member dashboard');
          router.replace('/member/dashboard');
        } else {
          // User is authenticated but doesn't have a recognized role
          console.warn('User is authenticated but has no recognized role');
          router.replace('/auth/login');
        }
      }
      // If not authenticated, stay on auth page
      return;
    }
    
    // For admin pages
    if (currentPath.startsWith('/admin/')) {
      if (!isAuthenticated) {
        // console.log('Redirecting unauthenticated user from admin page to login');
        router.replace('/auth/login');
        return;
      } else if (!isAdminUser(user)) {
        // console.log('Redirecting non-admin user from admin page to member dashboard');
        router.replace('/member/dashboard');
        return;
      }
      // Admin user on admin page - no redirect needed
      return;
    }
    
    // For member pages
    if (currentPath.startsWith('/member/')) {
      if (!isAuthenticated) {
        console.log('Redirecting unauthenticated user from member page to login');
        router.replace('/auth/login');
        return;
      } else if (isAdminUser(user) && !isMemberUser(user)) {
        console.log('Redirecting admin-only user from member page to admin dashboard');
        router.replace('/admin/dashboard');
        return;
      }
      // Member or admin with member role on member page - no redirect needed
      return;
    }
    
    // For root or dashboard paths, redirect based on role
    // if (currentPath === '/' || currentPath === '/dashboard') {
    //   if (!isAuthenticated) {
    //     console.log('Redirecting unauthenticated user from root/dashboard to login');
    //     router.replace('/auth/login');
    //   } else if (isAdminUser(user)) {
    //     console.log('Redirecting admin from root/dashboard to admin dashboard');
    //     router.replace('/admin/dashboard');
    //   } else if (isMemberUser(user)) {
    //     // If user is a member, redirect to member dashboard
    //     console.log('Redirecting member from root/dashboard to member dashboard');
    //     router.replace('/member/dashboard');
    //   } else {
    //     console.log('User has no recognized role, redirecting to login');
    //     router.replace('/auth/login');
    //   }
    //   return;
    // }
  }, [isAuthenticated, isLoading, isInitializing, user, router]);

  // Refresh user profile data
  const refreshUserProfile = useCallback(async (): Promise<User> => {
    try {
      // console.log('Refreshing user profile');
      const response: any = await authService.getCurrentUser();
      // console.log('Fetched user profile:', response);
      
      // Extract user data from the nested response structure
      const userData = response.data || response;
      
      // console.log('Extracted user data:', userData);
      
      // Verify that the user object has an ID before proceeding
      if (!userData.id) {
        // console.error('API returned user data without ID:', userData);
        throw new Error('Invalid user data structure');
      }
      
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      throw error;
    }
  }, []);
  
  // IMPORTANT: Define logout BEFORE any functions that depend on it
  // Define logout first before any functions that depend on it
  const logout = useCallback(async (options: { 
    invalidateAll?: boolean,
    redirectToLogin?: boolean,
    reason?: string
  } = {}) => {
    const { invalidateAll = false, redirectToLogin = true, reason = '' } = options;
    
    try {
      setIsLoading(true);
      
      // Get current token info before logout
      const tokens = getStoredAuthTokens();
      
      if (invalidateAll) {
        // Invalidate all user sessions
        console.log('Logging out all sessions');
        await authService.logoutAllSessions();
      } else {
        // Standard logout for current session only
        console.log('Logging out current session');
        await authService.logout();
      }
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      clearAuthTokens();
      setUser(null);
      setIsAuthenticated(false);
      setUserSessions([]);
      setCurrentSession(null);
      dispatch(logoutAction());
      
      if (redirectToLogin) {
        const redirectUrl = reason ? `/auth/login?reason=${reason}` : '/auth/login';
        router.replace(redirectUrl);
      }
      
      setIsLoading(false);
    }
  }, [router, dispatch]);  // Remove getActiveSessions from dependencies to avoid circular dependency

  // Then define invalidateSession which depends on logout
  const invalidateSession = useCallback(async (sessionId: string) => {
    try {
      await authService.invalidateSession(sessionId);
      setUserSessions(prev => prev.filter(s => s.id !== sessionId));
      
      // If current session was invalidated, log out
      if (await isCurrentSession(sessionId)) {
        await logout({
          redirectToLogin: true,
          reason: 'session_terminated'
        });
      }
      
      return;
    } catch (error) {
      console.error('Failed to invalidate session:', error);
      throw error;
    }
  }, [isCurrentSession, logout]);

  // AFTER logout is defined, update validateAndRefreshToken
  const validateAndRefreshToken = useCallback(async () => {
    try {
      const tokens = getStoredAuthTokens();
      if (!tokens?.accessToken) {
        clearAuthTokens();
        setUser(null);
        setIsAuthenticated(false);
        return { success: false, reason: 'no_token' };
      }

      // Check if token is decodable
      if (!isTokenValid(tokens.accessToken)) {
        clearAuthTokens();
        setUser(null);
        setIsAuthenticated(false);
        return { success: false, reason: 'invalid_token' };
      }

      // If token is expiring soon, try to refresh
      if (isTokenExpiringSoon()) {
        const refreshSuccess = await tokenRefreshService.refreshToken();
        if (!refreshSuccess) {
          clearAuthTokens();
          setUser(null);
          setIsAuthenticated(false);
          return { success: false, reason: 'refresh_failed' };
        }
      }

      // Fetch user profile
      try {
        const rawUserData = await refreshUserProfile();
        const tokenData = extractTokenData(tokens.accessToken);

        // Only compare IDs if both are present
        if (tokenData.userId && rawUserData.id && rawUserData.id !== tokenData.userId) {
          clearAuthTokens();
          setUser(null);
          setIsAuthenticated(false);
          return { success: false, reason: 'user_id_mismatch' };
        }

        const userData = formatUserData(rawUserData);
        setUser(userData);
        setIsAuthenticated(true);
        dispatch(setCredentials({ user: userData, tokens }));

        await getActiveSessions();

        return { success: true, user: userData };
      } catch (profileError) {
        console.error('Profile refresh failed:', profileError);
        clearAuthTokens();
        setUser(null);
        setIsAuthenticated(false);
        return { success: false, reason: 'profile_fetch_error' };
      }
    } catch (error) {
      console.error('Token validation failed:', error);
      clearAuthTokens();
      setUser(null);
      setIsAuthenticated(false);
      return { success: false, reason: 'unexpected_error' };
    }
  }, [dispatch, refreshUserProfile, getActiveSessions]);
    // Add an effect to start/stop the refresh cycle based on authentication state
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      const tokens = getStoredAuthTokens();
      const now = Date.now();
      const loginTime = tokens?.lastLoginTime || now;
      
      // If this is a new session or we don't have a lastLoginTime, set it
      if (!tokens?.lastLoginTime && tokens?.accessToken) {
        setStoredAuthTokens({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken || '',
          expiresIn: tokens.expiresIn || 0,
          sessionId: tokens.sessionId,
          lastLoginTime: now
        });
      }
      
      // Only start refresh cycle after the minimum interval
      const timeSinceLogin = now - loginTime;
      const startRefreshDelay = Math.max(0, MIN_REFRESH_INTERVAL_MS - timeSinceLogin);
      
      setTimeout(() => {
        tokenRefreshService.startRefreshCycle();
      }, startRefreshDelay);
    } else {
      // Stop refresh cycle when user is not authenticated
      tokenRefreshService.stopRefreshCycle();
    }
    
    // Clean up on component unmount
    return () => {
      tokenRefreshService.stopRefreshCycle();
    };
  }, [isAuthenticated, isLoading]);
  
  // Initialize auth state once on mount
  useEffect(() => {
    const initAuth = async () => {
      setIsInitializing(true);
      try {
        // console.log('Initializing auth state');
        const validationResult = await validateAndRefreshToken();
        
        if (!validationResult.success) {
          console.log(`Token validation failed: ${validationResult.reason}`);
          setUser(null);
          setIsAuthenticated(false);
          clearAuthTokens();
        } else {
          // console.log('Auth initialized successfully');
          
          // Secondary validation - verify user permissions match expected format
          if (validationResult.user) {
            // Confirm user object has expected structure
            const validationIssues = validateUserObject(validationResult.user);
            
            if (validationIssues.length > 0) {
              console.error('Secondary validation failed:', validationIssues);
              // Token appears valid but user data is malformed - force re-login
              await logout({ 
                redirectToLogin: true, 
                reason: 'invalid_user_data'
              });
              return;
            }
            
            // Extra check: verify permissions are properly extracted
            if (!validationResult.user.role.permissions || validationResult.user.role.permissions.length === 0) {
              console.warn('User has no permissions, this might cause issues with protected resources');
            }
            
            // Set user only after validation checks
            setUser(validationResult.user);
          }
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        clearAuthTokens();
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
        setIsInitializing(false);
      }
    };

    initAuth();
  }, [validateAndRefreshToken, logout]);
  
  // Handle redirects when auth state changes
  useEffect(() => {
    if (!isInitializing) {
      handleAuthRedirect();
    }
  }, [isAuthenticated, user, isInitializing, handleAuthRedirect]);
  
  /**
   * Login function to authenticate user with username and password
   * @param username - The username of the user
   * @param password - The password of the user
   * @return Promise<void>
   */
  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authService.login(username, password);
      // console.log('Raw login response:', JSON.stringify(response, null, 2));
      const userData = response.data.user;
      const session = response.data.session;

      const formattedUser = formatUserData(userData);

      // Extract tokens from session
      const accessToken = session?.token;
      const refreshToken = session?.refreshToken; // If your backend provides this
      const expiresIn = session?.expiresIn || 3600; // Or whatever your backend provides

      if (!accessToken) {
        throw new Error('No access token returned from login');
      }

      const tokenData = extractTokenData(accessToken);
      const loginTime = Date.now();

      setStoredAuthTokens({
        accessToken,
        refreshToken: refreshToken || '',
        expiresIn,
        sessionId: tokenData.sessionId,
        lastLoginTime: loginTime,
      });

      // ✅ FIX: Retrieve tokens from storage after storing
      const tokens = getStoredAuthTokens() ?? { accessToken: '', refreshToken: '', expiresIn: 0 };

      setUser(formattedUser);
      setIsAuthenticated(true);
      dispatch(setCredentials({ user: formattedUser, tokens }));

      // Fetch sessions after successful login
      await getActiveSessions();

      // Use default route based on user role
      const defaultRoute = getDefaultRoute(formattedUser);
      console.log(`Login successful, redirecting to: ${defaultRoute}`, {
        isAdmin: isAdminUser(formattedUser),
        isMember: isMemberUser(formattedUser)
      });
      router.replace(defaultRoute);
    } catch (error) {
      console.error('Login error details:', error);
      const errorMessage = handleLoginError(error);
      setError(errorMessage); // Set the error message to state
      handleLoginError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Implement hasPermission function
  const hasPermission = useCallback((permission: string | string[]): boolean => {
    // If not authenticated, no permissions
    if (!user || !isAuthenticated) return false;
    
    // If no permission specified or empty array, return true
    if (!permission || (Array.isArray(permission) && permission.length === 0)) return true;
    
    // Extract all permissions from user object (already processed during formatUserData)
    const userPermissions = user.role.permissions || [];
    
    // Check for permissions
    if (typeof permission === 'string') {
      return userPermissions.includes(permission);
    } else {
      // Check if user has ANY of the specified permissions
      return permission.some(p => userPermissions.includes(p));
    }
  }, [user, isAuthenticated]);

  // Implement hasModuleAccess function
  const hasModuleAccess = useCallback((moduleName: string): boolean => {
    // If not authenticated, no access
    if (!user || !isAuthenticated) return false;
    
    // Check if user has the module in their modules array
    const userModules = user.role.moduleAccess || [];
    return userModules.includes(moduleName);
  }, [user, isAuthenticated]);

  // Implement checkApprovalLevel function
  const checkApprovalLevel = useCallback((requiredLevel: number): boolean => {
    // If not authenticated, no approval level
    if (!user || !isAuthenticated) return false;
    
    // Check if user's approval level is high enough
    const userApprovalLevel = user.role.approvalLevel || 0;
    return userApprovalLevel >= requiredLevel;
  }, [user, isAuthenticated]);

  // Implement ensureValidAuth function
  const ensureValidAuth = useCallback(async (): Promise<boolean> => {
    try {
      const tokens = getStoredAuthTokens();
      
      // If no tokens, authentication is invalid
      if (!tokens?.accessToken) {
        setUser(null);
        setIsAuthenticated(false);
        return false;
      }
      
      // Check if token is valid
      if (!isTokenValid(tokens.accessToken)) {
        // If token is invalid, try to refresh it
        try {
          const refreshSuccess = await tokenRefreshService.refreshToken();
          if (!refreshSuccess) {
            // If refresh fails, clear authentication
            clearAuthTokens();
            setUser(null);
            setIsAuthenticated(false);
            return false;
          }
        } catch (error) {
          console.error('Token refresh failed during auth validation:', error);
          clearAuthTokens();
          setUser(null);
          setIsAuthenticated(false);
          return false;
        }
      }
      
      // If we don't have user data yet, fetch it
      if (!user) {
        try {
          const userData = await refreshUserProfile();
          const formattedUser = formatUserData(userData);
          setUser(formattedUser);
          setIsAuthenticated(true);
          dispatch(setCredentials({ user: formattedUser, tokens }));
          return true;
        } catch (error) {
          console.error('Failed to fetch user data during auth validation:', error);
          clearAuthTokens();
          setUser(null);
          setIsAuthenticated(false);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error ensuring valid authentication:', error);
      clearAuthTokens();
      setUser(null);
      setIsAuthenticated(false);
      return false;
    }
  }, [user, refreshUserProfile, dispatch]);

  const value = {
    user,
    isLoading,
    isInitializing,
    isAuthenticated,
    login,
    logout,
    hasPermission,
    hasModuleAccess,
    checkApprovalLevel,
    refreshUserProfile,
    handleAuthRedirect,
    userSessions,
    currentSession,
    getActiveSessions,
    invalidateSession,
    isCurrentSession,
    ensureValidAuth,
    error, // Expose the error state
    setError, // Optionally expose setError if needed
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Fix formatUserData function which has critical issues

// function formatUserData(userData: any): User {
//   // First, ensure we have a valid user data object
//   if (!userData || typeof userData !== 'object') {
//     console.error('Invalid user data provided to formatUserData:', userData);
//     throw new Error('Invalid user data structure');
//   }
  
//   console.log('Raw user data being formatted:', {
//     id: userData.id,
//     username: userData.username,
//     roleAssignments: userData.roleAssignments,
//     isMember: userData.isMember
//   });

//   // Ensure role assignments are properly processed
//   const formattedUser: User = {
//     id: userData.id,
//     username: userData.username || '',
//     email: userData.email || '',

//     // Correctly handle role property
//     role: userData.role || null,

//     // Extract permissions from roleAssignments
//     permissions: [],

//     // Extract approval level
//     approvalLevel: userData.approvalLevel || 0,

//     // Copy modules
//     modules: userData.modules || [],

//     // Extract biodata information
//     biodataId: userData.biodataId || userData.biodata?.id || '',
//     biodata: userData.biodata || null,

//     // IMPORTANT: Set member flag explicitly with fallback checks
//     // This is the critical fix - we need to ensure member status is correctly detected
//     isMember: userData.isMember === true ||
//       !!(userData.roleAssignments as RoleAssignment[])?.some((r: RoleAssignment) => r.isActive !== false && // consider active if not explicitly false
//         (r.role?.name === 'MEMBER' ||
//           r.role?.name?.toUpperCase() === 'MEMBER' ||
//           r.role?.name?.includes('MEMBER'))
//       ),

//     isActive: userData.isActive !== false, // assume active unless explicitly false


//     // Set the full roleAssignments array with safety check
//     roleAssignments: Array.isArray(userData.roleAssignments) ? userData.roleAssignments : [],

//     // Add session information 
//     session: userData.session || null,

//     // Add other required fields
//     createdAt: userData.createdAt,
//     updatedAt: userData.updatedAt,
//     adminProfile: userData.adminProfile || null,
//     data: userData.data || null
//   };
  
//   // Extract and flatten permissions from all roleAssignments
//   if (Array.isArray(userData.roleAssignments)) {
//     const allPermissions = new Set<string>();
    
//     userData.roleAssignments.forEach((assignment: any) => {
//       // More permissive check for active status - consider active unless explicitly false
//       if (assignment.isActive !== false && assignment.role) {
//         // Process permissions
//         if (Array.isArray(assignment.role.permissions)) {
//           assignment.role.permissions.forEach((permission: string | {name: string}) => {
//             // Handle both string permissions and permission objects
//             if (typeof permission === 'string') {
//               allPermissions.add(permission);
//             } else if (permission && typeof permission === 'object' && permission.name) {
//               allPermissions.add(permission.name);
//             }
//           });
//         }
//       }
//     });
    
//     formattedUser.permissions = Array.from(allPermissions);
//   }
  
//   // Also extract modules from roleAssignments if not set directly
//   if ((!formattedUser.modules || formattedUser.modules.length === 0) && Array.isArray(userData.roleAssignments)) {
//     const allModules = new Set<string>();
    
//     userData.roleAssignments.forEach((assignment: any) => {
//       if (assignment.isActive !== false && assignment.role && Array.isArray(assignment.role.moduleAccess)) {
//         assignment.role.moduleAccess.forEach((module: string | {name: string, access: boolean}) => {
//           if (typeof module === 'string') {
//             allModules.add(module);
//           } else if (module && typeof module === 'object' && module.name && module.access) {
//             allModules.add(module.name);
//           }
//         });
//       }
//     });
    
//     formattedUser.modules = Array.from(allModules);
//   }
  
//   // Debug formatted user to check role information
//   console.log('Formatted user with roles:', {
//     username: formattedUser.username,
//     isMember: formattedUser.isMember,
//     isAdmin: isAdminUser(formattedUser),
//     roleAssignments: (formattedUser.roleAssignments || []).map(r => ({
//       isActive: r.isActive,
//       roleName: r.role?.name
//     })),
//     permissions: formattedUser.permissions?.length || 0
//   });

//   return formattedUser;
// }

export enum AuthErrorCode {
  INVALID_TOKEN = 'invalid_token',
  TOKEN_EXPIRED = 'token_expired',
  SESSION_REVOKED = 'session_revoked',
  PERMISSION_DENIED = 'permission_denied',
}

// export function handleLoginError(error: unknown): string {
//   if (error instanceof AxiosError) {
//     switch (error.response?.data?.code) {
//       case AuthErrorCode.INVALID_TOKEN:
//         return 'Invalid token provided.';
//       case AuthErrorCode.TOKEN_EXPIRED:
//         return 'Your session has expired. Please log in again.';
//       case AuthErrorCode.SESSION_REVOKED:
//         return 'Your session has been revoked.';
//       case AuthErrorCode.PERMISSION_DENIED:
//         return 'You do not have permission to access this resource.';
//       default:
//         return 'An unknown error occurred.';
//     }
//   }

//   return 'An error occurred during login.';
// }
  export function handleLoginError(error: unknown): string {
      if (error instanceof AxiosError) {
          switch (error.response?.data?.code) {
              case AuthErrorCode.INVALID_TOKEN:
                  return 'Invalid token provided.';
              case AuthErrorCode.TOKEN_EXPIRED:
                  return 'Your session has expired. Please log in again.';
              case AuthErrorCode.SESSION_REVOKED:
                  return 'Your session has been revoked.';
              case AuthErrorCode.PERMISSION_DENIED:
                  return 'You do not have permission to access this resource.';
              default:
                  return error.response?.data?.message || 'An unknown error occurred.';
          }
      }
      return 'An error occurred during login.';
  }
  
// Helper function to validate user object structure
function validateUserObject(user: User): string[] {
  const issues: string[] = [];

  // Check required properties
  if (!user.id) issues.push('Missing user ID');
  if (!user.username) issues.push('Missing username');

  // Role assignment validation - check for single roleAssignment object
  if (!user.roleAssignment) {
    console.warn('User has no role assignment');
  } else if (typeof user.roleAssignment !== 'object') {
    issues.push('roleAssignment is not an object');
  } else {
    // Validate that the role assignment has a valid role
    if (!user.roleAssignment.role) {
      issues.push('User has no valid role');
    }
  }

  // Be permissive with permissions - not all roles need permissions
  if (user.role.permissions && !Array.isArray(user.role.permissions)) {
    issues.push('permissions is not an array');
  }

  // Be permissive with modules - not all roles need module access
  if (user.role.moduleAccess && !Array.isArray(user.role.moduleAccess)) {
    issues.push('modules is not an array');
  }

  // More permissive role checks - don't require perfect consistency
  const hasMemberRoleAssignment = user.roleAssignment?.role?.name === 'MEMBER' ||
    user.roleAssignment?.role?.name?.includes('MEMBER');

  // Only check consistency if there are explicit contradictions
  if (user.isMember === false && hasMemberRoleAssignment) {
    issues.push('isMember flag contradicts role assignment');
  }

  // Don't enforce approval level for non-admin users

  return issues;
}

// Validate session function - checks if a session is active by ID
export async function validateSession(sessionId: string): Promise<boolean> {
  try {
    const sessions = await authService.getActiveSessions();
    return sessions.some(session => session.id === sessionId && session.isActive);
  } catch (error) {
    console.error('Failed to validate session:', error);
    return false;
  }
}


