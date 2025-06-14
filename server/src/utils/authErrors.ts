import { Response } from 'express';

// Define consistent error types for authentication failures
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

// Interface for standardized error responses
interface AuthErrorResponse {
  status: 'error';
  code: AuthErrorType;
  message: string;
  details?: Record<string, any>;
}

// Central function to handle authentication errors
export const sendAuthError = (
  res: Response,
  type: AuthErrorType,
  statusCode = 401,
  details?: Record<string, any>
) => {
  const errorMessages: Record<AuthErrorType, string> = {
    [AuthErrorType.INVALID_CREDENTIALS]: 'The provided credentials are incorrect',
    [AuthErrorType.TOKEN_EXPIRED]: 'Your authentication token has expired',
    [AuthErrorType.TOKEN_INVALID]: 'Invalid authentication token',
    [AuthErrorType.TOKEN_MISSING]: 'Authentication token is required',
    [AuthErrorType.TOKEN_REVOKED]: 'Authentication token has been revoked',
    [AuthErrorType.SESSION_EXPIRED]: 'Your session has expired, please login again',
    [AuthErrorType.SESSION_INVALID]: 'Invalid session',
    [AuthErrorType.PERMISSION_DENIED]: 'You do not have permission to perform this action',
    [AuthErrorType.ACCOUNT_LOCKED]: 'Your account has been temporarily locked',
    [AuthErrorType.ACCOUNT_DISABLED]: 'Your account has been disabled',
    [AuthErrorType.RATE_LIMITED]: 'Too many attempts, please try again later',
    [AuthErrorType.CSRF_MISSING]: 'CSRF token is required',
    [AuthErrorType.CSRF_INVALID]: 'Invalid CSRF token',
  };

  const response: AuthErrorResponse = {
    status: 'error',
    code: type,
    message: errorMessages[type]
  };

  if (details) {
    response.details = details;
  }

  return res.status(statusCode).json(response);
};