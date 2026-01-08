import { Request, Response, NextFunction } from 'express';
import { AccountService } from '../services/account.service';
import { createAccountSchema, updateAccountSchema, verifyAccountSchema, processRequestSchema } from '../validations/account.validation';
import { ApiResponse } from '../../../utils/apiResponse';
import logger from '../../../utils/logger';
import { IAccountQueryFilters, ICreateAccountInput, IUpdateAccountInput, IAccountVerificationInput } from '../interfaces/account.interface';
import { ZodError } from 'zod';
import { prisma } from '../../../utils/prisma';

// Extend Express Request with custom properties
declare module 'express-serve-static-core' {
  interface Request {
    user: {
      approvalLevel: number;
      id: string;
      biodataId: string;
      role: {
        name: string;
        isAdmin: boolean;
      };
    };
  }
}

export class AccountController {
  private accountService: AccountService;

  constructor() {
    this.accountService = new AccountService();
  }

  createAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData: ICreateAccountInput = {
        ...createAccountSchema.parse(req).body,
        biodataId: req.user.biodataId
      };

      const account = await this.accountService.createAccount(validatedData);
      return ApiResponse.created(res, 'Account registration initiated successfully', account);
    } catch (error: unknown) {
      logger.error('Error in createAccount:', error);
      if (error instanceof ZodError) {
        return ApiResponse.badRequest(res, `Invalid input data: ${error.errors[0]?.message || ''}`);
      }
      next(error);;
    }
  };

  getAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const account = await this.accountService.getAccountById(id);
      
      if (!account) {
        return ApiResponse.notFound(res, 'Account not found');
      }

      // Check if user has access to this account
      if (account.biodataId !== req.user.biodataId && 
          !req.user.role.isAdmin) {
        return ApiResponse.forbidden(res, 'You do not have permission to view this account');
      }

      return ApiResponse.success(res, 'Account retrieved successfully', account);
    } catch (error) {
      logger.error('Error in getAccount:', error);
      next(error);;
    }
  };

  getAccounts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters: IAccountQueryFilters = req.user.role.isAdmin
        ? req.query as IAccountQueryFilters
        : { ...req.query, biodataId: req.user.biodataId };

      const accounts = await this.accountService.getAccounts(filters);
      return ApiResponse.success(res, 'Accounts retrieved successfully', accounts);
    } catch (error) {
      logger.error('Error in getAccounts:', error);
      next(error);;
    }
  };

  getMyAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accounts = await this.accountService.getAccounts({
        biodataId: req.user.biodataId
      });

      if (!accounts.length) {
        return ApiResponse.notFound(res, 'No account found');
      }

      return ApiResponse.success(res, 'Account retrieved successfully', accounts[0]);
    } catch (error) {
      logger.error('Error in getMyAccount:', error);
      next(error);;
    }
  };

  requestAccountUpdate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = updateAccountSchema.parse(req);
      const validatedData: IUpdateAccountInput = validated.body;
      
      const request = await this.accountService.requestAccountUpdate(validated.params.id, validatedData);
      return ApiResponse.success(res, 'Account update request submitted successfully', request);
    } catch (error: unknown) {
      logger.error('Error in requestAccountUpdate:', error);
      if (error instanceof ZodError) {
        return ApiResponse.badRequest(res, `Invalid input data: ${error.errors[0]?.message || ''}`);
      }
      next(error);;
    }
  };

  processAccountUpdateRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = processRequestSchema.parse(req);
      const { requestId } = validated.params;
      const { approved, notes } = validated.body;

      const request = await prisma.request.findUnique({
        where: { id: requestId },
        include: { approvalSteps: true }
      });

      if (!request) {
        return ApiResponse.notFound(res, 'Request not found');
      }

      const currentStep = request.approvalSteps.find((step: { status: string; approverRole: string }) => 
        step.status === 'PENDING' && 
        req.user.role.name === step.approverRole
      );

      if (!currentStep) {
        return ApiResponse.forbidden(res, 'You do not have permission to process this request');
      }

      const account = await this.accountService.processAccountUpdateRequest(requestId, approved, notes);
      return ApiResponse.success(
        res, 
        approved ? 'Account update request approved' : 'Account update request rejected',
        account
      );
    } catch (error: unknown) {
      logger.error('Error in processAccountUpdateRequest:', error);
      if (error instanceof ZodError) {
        return ApiResponse.badRequest(res, `Invalid input data: ${error.errors[0]?.message || ''}`);
      }
      next(error);;
    }
  };

  verifyAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = verifyAccountSchema.parse(req);
      const validatedData: IAccountVerificationInput = validated.body;
      
      const result = await this.accountService.verifyAccount(validatedData);
      
      if (!result.success) {
        return ApiResponse.badRequest(res, result.message || 'Account verification failed');
      }

      return ApiResponse.success(res, 'Account verified successfully', result);
    } catch (error: unknown) {
      logger.error('Error in verifyAccount:', error);
      if (error instanceof ZodError) {
        return ApiResponse.badRequest(res, `Invalid input data: ${error.errors[0]?.message || ''}`);
      }
      next(error);;
    }
  };
}

export const accountController = new AccountController();