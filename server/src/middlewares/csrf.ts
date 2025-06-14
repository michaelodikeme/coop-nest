import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';
import crypto from 'crypto';
import { redisClient } from '../config/redis';

// CSRF token expiry in seconds (1 hour)
const CSRF_TOKEN_EXPIRY = 3600;

/**
 * Generate a new CSRF token and store it in Redis with the session ID
 */
export const generateCsrfToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Only generate token if user is authenticated
    if (!req.user || !req.session) {
      return next();
    }

    // Generate random token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Store token in Redis with session ID as reference
    await redisClient.setex(
      `csrf:${req.session.id}`, 
      CSRF_TOKEN_EXPIRY, 
      token
    );
    
    // Expose token in response headers
    res.setHeader('X-CSRF-Token', token);
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate CSRF token for protected routes
 * This should be applied to all non-GET/HEAD requests
 */
export const validateCsrfToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Skip validation for GET, HEAD, OPTIONS requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }
    
    // Skip if user is not authenticated
    if (!req.user || !req.session) {
      return next();
    }

    const token = req.headers['x-csrf-token'] as string;
    
    if (!token) {
      throw new ApiError('CSRF token missing', 403);
    }

    const storedToken = await redisClient.get(`csrf:${req.session.id}`);
    
    if (!storedToken || storedToken !== token) {
      throw new ApiError('Invalid CSRF token', 403);
    }

    // Token is valid, proceed
    next();
  } catch (error) {
    next(error);
  }
};