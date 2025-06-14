import { Request, Response, NextFunction } from 'express';
import { RequestType, RequestStatus } from '@prisma/client';
import { RequestError, requestErrorCodes } from '../../../middlewares/errorHandlers/requestErrorHandler';

export const validateCreateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const { biodataId, userId, type, details } = req.body;

  try {
    if (!biodataId || !userId || !type || !details) {
      throw new RequestError(
        requestErrorCodes.INVALID_REQUEST_TYPE,
        'Missing required fields',
        400
      );
    }

    if (!Object.values(RequestType).includes(type)) {
      throw new RequestError(
        requestErrorCodes.INVALID_REQUEST_TYPE,
        'Invalid request type',
        400
      );
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
      throw new RequestError(
        requestErrorCodes.INVALID_REQUEST_STATUS,
        'Status is required',
        400
      );
    }

    if (!Object.values(RequestStatus).includes(status)) {
      throw new RequestError(
        requestErrorCodes.INVALID_REQUEST_STATUS,
        'Invalid request status',
        400
      );
    }

    if (adminNotes && typeof adminNotes !== 'string') {
      throw new RequestError(
        requestErrorCodes.INVALID_REQUEST_TYPE,
        'Admin notes must be a string',
        400
      );
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
      throw new RequestError(
        requestErrorCodes.INVALID_REQUEST_TYPE,
        'Invalid request type filter',
        400
      );
    }

    if (status && !Object.values(RequestStatus).includes(status as RequestStatus)) {
      throw new RequestError(
        requestErrorCodes.INVALID_REQUEST_STATUS,
        'Invalid request status filter',
        400
      );
    }

    if (page && isNaN(Number(page))) {
      throw new RequestError(
        requestErrorCodes.INVALID_REQUEST_TYPE,
        'Page must be a number',
        400
      );
    }

    if (limit && isNaN(Number(limit))) {
      throw new RequestError(
        requestErrorCodes.INVALID_REQUEST_TYPE,
        'Limit must be a number',
        400
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};