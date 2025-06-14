import { ApiError } from '../../../utils/apiError';

/**
 * Standardized error codes for transaction-related errors
 */
export enum TransactionErrorCodes {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PROCESSING_ERROR = 'PROCESSING_ERROR',
  TRANSACTION_NOT_FOUND = 'TRANSACTION_NOT_FOUND',
  INVALID_STATUS = 'INVALID_STATUS',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  ENTITY_NOT_FOUND = 'ENTITY_NOT_FOUND',
  TRANSACTION_ALREADY_REVERSED = 'TRANSACTION_ALREADY_REVERSED',
  UNAUTHORIZED_ACTION = 'UNAUTHORIZED_ACTION',
  DATABASE_ERROR = "DATABASE_ERROR",
}

/**
 * Transaction-specific error class
 * Extends the ApiError base class for consistency
 */
export class TransactionError extends ApiError {
  code: TransactionErrorCodes;
  
  /**
   * Create a new transaction error
   * @param message Error message
   * @param code Specific error code from TransactionErrorCodes
   * @param statusCode HTTP status code
   * @param originalError Original error if wrapping another error
   */
  constructor(
    message: string,
    code: TransactionErrorCodes,
    statusCode: number = 400,
    originalError?: Error
  ) {
    // Format errors array from original error if present
    const errors = originalError 
      ? [{ message: originalError.message, stack: originalError.stack }] 
      : undefined;
      
    // Add code to context
    const context = { 
      code,
      ...(originalError && { originalError: originalError.message })
    };
    
    super(message, statusCode, errors, context);
    
    this.code = code;
    this.name = 'TransactionError';
  }
  
  /**
   * Create a validation error
   * @param message Error message
   * @param details Validation details
   * @returns TransactionError
   */
  static validationError(message: string, details?: Record<string, string[]>): TransactionError {
    const error = new TransactionError(
      message,
      TransactionErrorCodes.VALIDATION_ERROR,
      400
    );
    
    if (details) {
      error.errors = Object.entries(details).map(([field, messages]) => ({
        field,
        messages,
        code: 'validation_error'
      }));
    }
    
    return error;
  }
  
  /**
   * Create a not found error
   * @param id ID that wasn't found
   * @param entityType Type of entity that wasn't found
   * @returns TransactionError
   */
  static notFound(id: string, entityType: string = 'Transaction'): TransactionError {
    return new TransactionError(
      `${entityType} not found with ID: ${id}`,
      TransactionErrorCodes.TRANSACTION_NOT_FOUND,
      404
    );
  }
}