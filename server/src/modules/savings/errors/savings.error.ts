export enum SavingsErrorCodes {
    // General errors
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    PROCESSING_ERROR = 'PROCESSING_ERROR',
    FETCH_ERROR = 'FETCH_ERROR',
    
    // Withdrawal specific errors
    INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
    WITHDRAWAL_LIMIT_EXCEEDED = 'WITHDRAWAL_LIMIT_EXCEEDED',
    ACTIVE_LOAN_EXISTS = 'ACTIVE_LOAN_EXISTS',
    REQUEST_CREATION_FAILED = 'REQUEST_CREATION_FAILED',
    REQUEST_NOT_FOUND = 'REQUEST_NOT_FOUND',
    STATUS_UPDATE_FAILED = 'STATUS_UPDATE_FAILED',
    INVALID_STATUS_TRANSITION = 'INVALID_STATUS_TRANSITION',
    
    // Member errors
    MEMBER_NOT_FOUND = 'MEMBER_NOT_FOUND',
}

export class SavingsError extends Error {
    code: SavingsErrorCodes;
    statusCode: number;
    context?: any;
    
    constructor(
        code: SavingsErrorCodes,
        message: string,
        statusCode: number = 500,
        context?: any
    ) {
        super(message);
        this.name = 'SavingsError';
        this.code = code;
        this.statusCode = statusCode;
        this.context = context;
        
        Error.captureStackTrace(this, this.constructor);
    }
}