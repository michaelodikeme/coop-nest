import { Request, Response, NextFunction } from 'express';
import rateLimit, { Options } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redisClient from '../config/redis';
import logger from '../utils/logger';
import { AuthenticatedRequest } from '../types/express';

// Request fingerprinting function
const getRequestFingerprint = (req: Request): string => {
  const authReq = req as AuthenticatedRequest;
  // Skip rate limiting for admin operations with SUPER_ADMIN role
  if (req.path.includes('/auth') && authReq.user?.role.name === 'SUPER_ADMIN') {
    return `superadmin-${authReq.user.id}`;
  }
  return `${req.ip}-${req.headers['user-agent'] || ''}`;
};

// Common rate limit configuration
const commonConfig: Partial<Options> = {
  windowMs: 5 * 60 * 1000, // 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: async (...args: [command: string, ...commandArgs: string[]]) => redisClient.call(args[0], ...args.slice(1)) as Promise<any>,
    prefix: 'rate-limit:',
    // Configure Redis store options without blockDuration
    resetExpiryOnChange: true
  }),
  keyGenerator: getRequestFingerprint,
  skip: (req: Request) => {
    // Skip rate limiting for admin operations if user is SUPER_ADMIN
    const authReq = req as AuthenticatedRequest;
    return req.path.includes('/auth') && authReq.user?.role.name === 'SUPER_ADMIN';
  },
  handler: (req: Request, res: Response) => {
    logger.warn(`Rate limit exceeded for ${getRequestFingerprint(req as AuthenticatedRequest)}`);
    res.status(429).json({
      error: 'Too many requests',
      details: 'Please try again later'
    });
  }
};

// Security headers middleware (separate from rate limiting)
export const securityHeaders = (_req: Request, res: Response, next: NextFunction) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block'
  });
  next();
};

// Configure rate limiting for verification endpoints with higher limits for admin routes
export const verificationRateLimiter = rateLimit({
  ...commonConfig,
  max: (req: Request) => {
    // No limit for SUPER_ADMIN on admin routes
    const authReq = req as AuthenticatedRequest;
    if (req.path.includes('/auth') && authReq.user?.role.name === 'SUPER_ADMIN') {
      return 0; // Disable rate limiting
    }
    return req.headers.authorization ? 10 : 5; // Normal limits
  },
  message: 'Too many verification attempts, please try again after 15 minutes'
});
// Login rate limiter with role-based exceptions
export const loginRateLimiter = rateLimit({
  ...commonConfig,
  max: (req: Request) => {
    const authReq = req as AuthenticatedRequest;
    const exemptRoles = [
      'SUPER_ADMIN',
      'ADMIN',
      'TREASURER',
      'CHAIRMAN'
    ];

    // Check if request is from an exempt role
    if (req.path.includes('/auth') && (
      exemptRoles.includes(req.body?.role) ||
      exemptRoles.includes(authReq.user?.role?.name)
    )) {
      return 0; // Disable rate limiting for exempt roles
    }

    // Default limits for other users
    return req.headers.authorization ? 10 : 5;
  },
  message: 'Too many failed login attempts, please try again after 15 minutes'
});

export const tokenValidationRateLimiter = rateLimit({
  ...commonConfig,
  max: (req: Request) => {
    if (req.path.includes('/admin')) {
      return 100; // Higher limit for admin operations
    }
    return req.headers.authorization ? 20 : 10; // Normal limits
  },
  message: 'Too many token validation attempts, please try again after 15 minutes'
});

