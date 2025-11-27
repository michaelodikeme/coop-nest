import { Request, Response, NextFunction } from 'express';
import { AdminService } from "../services/admin.service";
import { AdminVerificationService } from "../services/adminVerification.service";
import { AuthRequest } from "../interfaces/admin.interface";
import { ApiError } from '../../../utils/apiError';
import { 
  createAdminProfileSchema, 
  verifyAdminProfileSchema, 
  verifyAdminOtpSchema, 
  createAdminUserSchema,
  processAdminProfileSchema,
  adminActionSchema
} from "../validations/admin.validations";

export class AdminController {
  private adminService: AdminService;
  private verificationService: AdminVerificationService;
  
  constructor() {
    this.adminService = new AdminService();
    this.verificationService = new AdminVerificationService();
  }
  
  async createAdminProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Only TREASURER and above can create admin profiles
      if (!['CHAIRMAN', 'TREASURER', 'SUPER_ADMIN'].includes(req.user.role.name)
      ) {
        throw new ApiError('Unauthorized to create admin profiles', 403);
      }
      
      const validatedData = createAdminProfileSchema.parse(req.body);
      const result = await this.adminService.createAdminProfile(validatedData, req.user.id);
      
      res.status(201).json({
        status: 'success',
        data: result
      });
    } catch (error: unknown) {
      next(error);
    }
  }
  
  async verifyAdminProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = verifyAdminProfileSchema.parse(req.body);
      const result = await this.verificationService.verifyAdminProfile(validatedData);
      
      if (result.status === 'pending') {
        res.clearCookie('adminProfileId');
        res.cookie('verificationPhone', validatedData.phoneNumber, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 10 * 60 * 1000 // 10 minutes
        });
      }
      res.json({
        status: 'success',
        data: result
      });
    } catch (error: unknown) {
      next(error);
    }
  }
  
  async verifyAdminOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const phoneNumber = req.cookies.verificationPhone;
      if (!phoneNumber) {
        throw new ApiError('Admin profile verification required', 400);
      }

      const validatedData = verifyAdminOtpSchema.parse({
        ...req.body,
        phoneNumber
      });

      const result = await this.verificationService.verifyAdminOtp(
        validatedData.phoneNumber,
        validatedData.otp
      );
      
      if (result.status === 'success') {
        res.clearCookie('verificationPhone');
        // Set the cookie with the admin profile ID
        res.cookie('adminProfileId', result.adminProfileId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 10 * 60 * 1000 // 10 minutes
        });
      }
      res.json({
        status: 'success',
        data: result
      });
    } catch (error: unknown) {
      next(error);
    }
  }
  
  async createAdminUser(req: Request, res: Response, next: NextFunction) {
    try {
      const adminProfileId = req.cookies.adminProfileId;
      
      if (!adminProfileId) {
        throw new ApiError('Admin profile verification required', 400);
      }
      
      const userData = {
        ...req.body,
        adminProfileId
      };
      
      const validatedData = createAdminUserSchema.parse(userData);
      const result = await this.adminService.createAdminUser(validatedData);
      
      // Clear the cookie after successful user creation
      res.clearCookie('adminProfileId');
      
      res.status(201).json({
        status: 'success',
        data: result
      });
    } catch (error: unknown) {
      next(error);
    }
  }
  
  
  // Add new controller method for processing Admin account creation requests
  async processAdminProfileRequest(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { requestId } = req.params;
      
      // Check if user has permission to approve accounts
      if (!req.user.permissions?.includes('APPROVE_ACCOUNTS')) {
        throw new ApiError('Unauthorized to approve Admin account creation', 403);
      }
      
      const validatedData = processAdminProfileSchema.parse(req.body);
      const result = await this.adminService.processAdminProfileRequest(
        requestId,
        validatedData.status,
        req.user.id,
        validatedData.comment
      );
      
      res.json({
        status: 'success',
        data: result
      });
    } catch (error: unknown) {
      next(error);
    }
  }
  
  async suspendAdminUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Check if user has permission to suspend accounts
      const approverLevel = req.user.approvalLevel || 0

      // Check for required approval level
      if (approverLevel < 2) {
        throw new ApiError('Insufficient permissions to suspend admin users', 403);
      }

      const { userId } = req.params;
      const validatedData = adminActionSchema.parse(req.body);
      
      const result = await this.adminService.suspendAdminUser(
        userId,
        validatedData.reason,
        req.user.id
      );

      res.json({
        status: 'success',
        data: result
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  async reactivateAdminUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Check if user has permission to suspend accounts
      const approverLevel = req.user.approvalLevel || 0

      // Check for required approval level
      if (approverLevel < 2) {
        throw new ApiError('Insufficient permissions to reactivate admin users', 403);
      }

      const { userId } = req.params;
      const validatedData = adminActionSchema.parse(req.body);
      
      const result = await this.adminService.reactivateAdminUser(
        userId,
        req.user.id,
        validatedData.comment || 'No comment provided'
      );

      res.json({
        status: 'success',
        data: result
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  async softDeleteAdminUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Check if user has permission to suspend accounts
      const approverLevel = req.user.approvalLevel || 0

      // Check for required approval level
      if (approverLevel < 2) {
        throw new ApiError('Insufficient permissions to delete admin users', 403);
      }

      const { userId } = req.params;
      const validatedData = adminActionSchema.parse(req.body);
      
      const result = await this.adminService.softDeleteAdminUser(
        userId,
        req.user.id,
        validatedData.reason
      );

      res.json({
        status: 'success',
        data: result
      });
    } catch (error: unknown) {
      next(error);
    }
  }
}