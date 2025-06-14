import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';
import logger from '../utils/logger';
import { ZodError } from 'zod';

class ValidationError extends ApiError {
  constructor(errors: any) {
    super('Validation error', 400, errors);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error with clean format
  logger.error('Error occurred:', {
    type: err.constructor.name,
    message: err.message,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    const validationError = new ValidationError(err.errors);
    return ApiResponse.error(res, validationError);
  }

  // Handle API Errors
  if (err instanceof ApiError) {
    return ApiResponse.error(res, err);
  }

  // Handle Prisma Errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const apiError = new ApiError(
      'Database operation failed',
      400,
      undefined,
      { code: (err as any).code }
    );
    return ApiResponse.error(res, apiError);
  }

  // Handle JWT Errors
  if (err.name === 'JsonWebTokenError') {
    const apiError = new ApiError('Invalid token', 401);
    return ApiResponse.error(res, apiError);
  }

  if (err.name === 'TokenExpiredError') {
    const apiError = new ApiError('Token expired', 401);
    return ApiResponse.error(res, apiError);
  }

  // Handle unknown errors
  const apiError = new ApiError(
    process.env.NODE_ENV === 'development'
      ? err.message
      : 'Internal server error',
    500
  );
  return ApiResponse.error(res, apiError);
};