import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';
import { ValidationError } from '../utils/apiError';

export const validateRequest = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      });
      next();
    } catch (error: any) {
      if (error.errors) {
        const validationErrors: Record<string, string[]> = {};
        error.errors.forEach((err: any) => {
          const path = err.path.join('.');
          if (!validationErrors[path]) {
            validationErrors[path] = [];
          }
          validationErrors[path].push(err.message);
        });
        next(new ValidationError('Validation failed', validationErrors));
      } else {
        next(error);
      }
    }
  };
};