import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../config/redis';
import { ApiError } from '../utils/apiError';
import logger from '../utils/logger';

interface RateLimitOptions {
  windowMs: number;     // Time window in milliseconds
  max: number;          // Maximum requests in window
  message?: string;     // Error message
  keyGenerator?: (req: Request) => string; // Function to generate key
}

export const createRateLimiter = (options: RateLimitOptions) => {
  const {
    windowMs = 60 * 1000, // Default: 1 minute
    max = 5,              // Default: 5 requests per minute
    message = 'Too many requests from this IP, please try again later',
    keyGenerator = (req: Request) => `ratelimit:${req.ip}`
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = keyGenerator(req);
      
      // Get current count
      const current = await redisClient.get(key);
      const count = current ? parseInt(current) : 0;
      
      if (count >= max) {
        throw new ApiError(message, 429);
      }
      
      // First request in window
      if (count === 0) {
        await redisClient.setex(key, Math.floor(windowMs / 1000), '1');
      } else {
        // Increment count
        await redisClient.incr(key);
      }
      
      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - count - 1));
      
      next();
    } catch (error) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({
          status: 'error',
          message: error.message
        });
      }
      next(error);
    }
  };
};

// Authentication rate limiter - stricter limits
export const authRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,  // 5 minutes
  max: 10,                  // 10 requests per 5 minutes
  message: 'Too many login attempts, please try again later',
  keyGenerator: (req: Request) => `ratelimit:auth:${req.ip}`
});

// General API rate limiter - more lenient
export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,      // 1 minute
  max: 60,                  // 60 requests per minute
  message: 'Too many requests, please try again later'
});

// IMPORTANT: Comment out the following line for development
// export const authRateLimiter = (req: Request, res: Response, next: NextFunction) => next();