export enum RequestErrorCodes {
    REQUEST_NOT_FOUND = 'REQUEST_NOT_FOUND',
    INVALID_STATUS_TRANSITION = 'INVALID_STATUS_TRANSITION',
    UNAUTHORIZED_ACTION = 'UNAUTHORIZED_ACTION',
    REQUEST_CREATION_FAILED = 'REQUEST_CREATION_FAILED',
    FETCH_ERROR = 'FETCH_ERROR',
    INVALID_PARAMETERS = 'INVALID_PARAMETERS'
}

export class RequestError extends Error {
    public readonly errorCode: RequestErrorCodes;
    public readonly statusCode: number;
    public readonly context?: any;

    constructor(errorCode: RequestErrorCodes, message: string, statusCode: number = 400, context?: any) {
        super(message);
        this.name = 'RequestError';
        this.errorCode = errorCode;
        this.statusCode = statusCode;
        this.context = context;

        // Set the prototype explicitly
        Object.setPrototypeOf(this, RequestError.prototype);
    }
}