import { Request, Response, NextFunction } from 'express';
import { RequestType, RequestStatus } from '@prisma/client';
import { ApiError } from '../../../utils/apiError';

export const validateCreateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const { biodataId, userId, type, details } = req.body;

  try {
    if (!biodataId || !userId || !type || !details) {
      throw new ApiError('Missing required fields', 400);
    }

    if (!Object.values(RequestType).includes(type)) {
      throw new ApiError('Invalid request type', 400);
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const validateUpdateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const { status, adminNotes } = req.body;

  try {
    if (!status) {
      throw new ApiError('Status is required', 400);
    }

    if (!Object.values(RequestStatus).includes(status)) {
      throw new ApiError('Invalid request status', 400);
    }

    if (adminNotes && typeof adminNotes !== 'string') {
      throw new ApiError('Admin notes must be a string', 400);
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const validateRequestQuery = (req: Request, res: Response, next: NextFunction): void => {
  const { type, status, page, limit } = req.query;

  try {
    if (type && !Object.values(RequestType).includes(type as RequestType)) {
      throw new ApiError('Invalid request type filter', 400);
    }

    if (status && !Object.values(RequestStatus).includes(status as RequestStatus)) {
      throw new ApiError('Invalid request status filter', 400);
    }

    if (page && isNaN(Number(page))) {
      throw new ApiError('Page must be a number', 400);
    }

    if (limit && isNaN(Number(limit))) {
      throw new ApiError('Limit must be a number', 400);
    }

    next();
  } catch (error) {
    next(error);
  }
};