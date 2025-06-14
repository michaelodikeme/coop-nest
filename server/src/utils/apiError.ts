import { ZodError } from 'zod';

export class ApiError extends Error {
  statusCode: number;
  errors?: any[];
  context?: Record<string, any>;

  constructor(
    message: string, 
    statusCode: number = 500, 
    errors?: any[],
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.context = context;

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      status: 'error',
      statusCode: this.statusCode,
      message: this.message,
      ...(this.errors && { errors: this.errors }),
      ...(this.context && { context: this.context })
    };
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, validationErrors: Record<string, string[]>) {
    const formattedErrors = Object.entries(validationErrors).map(([field, messages]) => ({
      field,
      messages,
      code: 'validation_error'
    }));

    super(
      message,
      400,
      formattedErrors
    );
    this.name = 'ValidationError';
  }
}
