import { Response } from 'express';

interface ApiError {
  message: string;
  errors?: any[];
  statusCode: number;
}

interface ApiResponseData {
  success: boolean;
  status: string;
  message: string;
  data?: any;
  errors?: any[];
  code?: number;
}

export class ApiResponse {
  static send(res: Response, data: ApiResponseData): void {
    res.status(data.code || 200).json(data);
  }

  static success(res: Response, message: string, data?: any): void {
    this.send(res, {
      success: true,
      status: 'success',
      message,
      data,
      code: 200
    });
  }

  static created(res: Response, message: string, data?: any): void {
    this.send(res, {
      success: true,
      status: 'success',
      message,
      data,
      code: 201
    });
  }

  static error(res: Response, error: ApiError): void {
    const response = {
      success: false,
      status: 'error',
      message: error.message,
      code: error.statusCode,
      ...(error.errors && {
        validationErrors: error.errors
      })
    };

    res.status(error.statusCode).json(response);
  }

  static badRequest(res: Response, message: string, errors?: any[]): void {
    this.send(res, {
      success: false,
      status: 'error',
      message,
      errors,
      code: 400
    });
  }

  static notFound(res: Response, message: string): void {
    this.send(res, {
      success: false,
      status: 'error',
      message,
      code: 404
    });
  }

  static unauthorized(res: Response, message: string): void {
    this.send(res, {
      success: false,
      status: 'error',
      message,
      code: 401
    });
  }

  static forbidden(res: Response, message: string): void {
    this.send(res, {
      success: false,
      status: 'error',
      message,
      code: 403
    });
  }
}