/**
 * Authentication storage helpers for managing authentication tokens
 */

import Cookies from 'js-cookie';
import { AuthTokens } from '@/types/auth.types';
import jwt from 'jsonwebtoken';

export const AUTH_STORAGE_KEY = 'coop_auth_tokens';

/**
 * Enhanced AuthTokens interface with JTI tracking
 */
export interface EnhancedAuthTokens extends AuthTokens {
  accessTokenJti?: string;
  refreshTokenJti?: string;
  sessionId?: string;
  tokenExpiry?: Date; // Add this field to track expiration
}

/**
 * Stores authentication tokens in localStorage and sets a secure cookie for the access token
 */
export function setStoredAuthTokens(tokens: EnhancedAuthTokens): void {
  // Store access token info in localStorage
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
    accessToken: tokens.accessToken,
    expiresIn: tokens.expiresIn,
    tokenExpiry: tokens.expiresIn ? new Date(Date.now() + tokens.expiresIn * 1000) : undefined,
    sessionId: tokens.sessionId,
  }));

  // Store access token in regular cookie for easy access
  Cookies.set('auth_token', tokens.accessToken, {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: tokens.expiresIn ? new Date(Date.now() + tokens.expiresIn * 1000) : undefined,
  });

  // Remove refresh token from localStorage
  localStorage.removeItem('refresh_token');

  console.log('Stored auth tokens with expiry calculation');
}

/**
 * Retrieves authentication tokens from localStorage
 */
export function getStoredAuthTokens(): EnhancedAuthTokens | null {
  if (typeof window === 'undefined') return null;

  const stored = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!stored) return null;

  try {
    const tokens = JSON.parse(stored);
    // console.log('Retrieved stored tokens:', tokens);

    // Validate token structure
    if (!tokens.accessToken || !tokens.tokenExpiry || !tokens.expiresIn || !tokens.sessionId) {
      throw new Error('Invalid token structure');
    }

    // FIX: Pass only the accessToken string
    if (!isTokenValid(tokens.accessToken)) {
      throw new Error('Access token is invalid');
    }

    return tokens;
  } catch (error) {
    console.error('Failed to retrieve stored tokens:', error);
    return null;
  }
}

/**
 * Removes authentication tokens from localStorage and cookies
 */
export function clearAuthTokens(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem('has_refresh_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('auth_session_id');
  
  // Clear cookies
  Cookies.remove('auth_token');
  
  // For HTTP-only cookies, we would need to call an API endpoint to clear them
  // This is a placeholder
  // authService.clearHttpOnlyCookies();
}

/**
 * Extract token payload data including JTI and sessionId
 */
export function extractTokenData(token: string): { 
  exp: number; 
  jti?: string;
  sessionId?: string;
  userId?: string;
  role?: any;
  roleAssignments?: any[];
} {
  try {
    const payload = jwt.decode(token) as any;
    if (!payload) throw new Error('Failed to decode token');
    
    return {
      exp: payload.exp || 0,
      jti: payload.jti,
      sessionId: payload.sessionId,
      userId: payload.userId,
      role: payload.role,
      roleAssignments: payload.roleAssignments,
    };
  } catch (error) {
    console.error('Failed to extract token data:', error);
    return { exp: 0 };
  }
}

/**
 * Checks if the stored access token is structurally valid (decodable)
 */
export function isTokenValid(token: string): boolean {
  try {
    const decoded: any = jwt.decode(token);
    return !!decoded;
  } catch (error) {
    console.error('Invalid token:', error);
    return false;
  }
}

/**
 * Checks if the token is expiring soon
 */
export function isTokenExpiringSoon(bufferSeconds = 30): boolean {
  const tokens = getStoredAuthTokens();
  if (!tokens?.tokenExpiry) return true;
  
  const expiryDate = new Date(tokens.tokenExpiry);
  // Add a buffer to refresh before expiry
  return new Date() >= new Date(expiryDate.getTime() - bufferSeconds * 1000);
}
