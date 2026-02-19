import { Request, Response, NextFunction } from 'express';
import { BiodataService } from '../services/biodata.service';
import {
  createBiodataSchema,
  updateBiodataSchema,
  accountInfoSchema,
  approveBiodataSchema,
  updateMembershipStatusSchema,
  biodataQuerySchema,
} from '../validations/biodata.validation';
// import { AuthenticatedRequest } from 'types/express';
import { ApiResponse } from '../../../utils/apiResponse';
import { ApiError } from '../../../utils/apiError';
import { ZodError } from 'zod';
import { MembershipStatus } from '@prisma/client';
import { SystemSettingsService } from "../../system/services/systemSettings.service"
import { ICreateBiodataInput, ICreateAccountInfoInput } from '../interfaces/biodata.interface';

// Update AuthenticatedRequest interface to match auth middleware
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    biodataId: string;
    role: {
      name: string;
      isAdmin: boolean;
    };
    permissions?: string[];
    approvalLevel: number;
  };
  session?: {
    id: string;
  };
}

export class BiodataController {
  private biodataService: BiodataService;

  constructor() {
    this.biodataService = new BiodataService();
  }

  async createBiodata(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const validatedData = createBiodataSchema.parse(req.body) as ICreateBiodataInput;
        const biodata = await this.biodataService.createBiodata(
            validatedData,
            req.user.id,
            req.user.approvalLevel || 0
        );
        res.status(201).json(biodata);
    } catch (error) {
        next(error);
    }
  }

  // FIX: Update this method to handle public registration
  async createNewMember(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createBiodataSchema.parse(req.body) as ICreateBiodataInput

      // For public registration, use the actual system user
      const systemSettingsService = SystemSettingsService.getInstance()
      const systemUserId = await systemSettingsService.ensureSystemUser()

      // For public registration, use a system identifier instead of user ID
      const systemApprovalLevel = 0 // Public registrations start at level 0

      const biodata = await this.biodataService.createNewMember(validatedData, systemUserId, systemApprovalLevel)

      // Return success response with proper structure
      return ApiResponse.success(res, "Registration submitted successfully", {
        biodataId: biodata.biodata.id,
        requestId: biodata.requestId,
        status: "PENDING",
        message: "Your application has been submitted and is pending approval.",
      })
    } catch (error) {
      next(error)
    }
  }

  async updateBiodata(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const biodataId = req.params.id;
      const validatedData = updateBiodataSchema.parse(req.body);
      const initiatorId = req.user.id;
      const request = await this.biodataService.updateBiodata(biodataId, validatedData, initiatorId);
      res.json(request);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new ApiError('Invalid input data', 400);
      }
      next(error);
    }
  }

  async approveBiodata(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const approverId = req.user.id;
        const approverLevel = req.user.approvalLevel || 0;
        
        // Check if it's a request approval or direct biodata approval
        if (req.body.requestId) {
            const result = await this.biodataService.approveBiodataRequest({
                requestId: req.body.requestId,
                approverNotes: req.body.approverNotes
            }, approverId, approverLevel);
            
            return ApiResponse.success(res, 'Biodata request approved successfully', result);
        } else {
            const result = await this.biodataService.approveLegacyBiodata({
                biodataId: req.body.biodataId,
                approverNotes: req.body.approverNotes
            }, approverId, approverLevel);
            
            return ApiResponse.success(res, 'Legacy biodata approved successfully', result);
        }
    } catch (error) {
      next (error);
    }
  }

  async updateMembershipStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    // Endpoint to update membership status of a biodata
    try {
      const biodataId = req.params.id;
      const validatedData = updateMembershipStatusSchema.parse(req.body);
      const updaterId = req.user.id;
      
      const biodata = await this.biodataService.updateMembershipStatus(
        biodataId,
        {
          membershipStatus: validatedData.membershipStatus as MembershipStatus,
          reason: validatedData.reason as string
        },
        updaterId
      );
      
      return ApiResponse.success(res, 'Membership status updated successfully', biodata);
    } catch (error) {
      if (error instanceof ZodError) {
        return ApiResponse.badRequest(res, 'Invalid input data');
      }
      if (error instanceof ApiError) {
        return ApiResponse.badRequest(res, error.message);
      }
      next(error);
    }
  }

  async addAccountInfo(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    // Endpoint to add account information to a biodata
    try {
      const biodataId = req.params.id;
      const validatedData = accountInfoSchema.parse(req.body) as ICreateAccountInfoInput;
      const accountInfo = await this.biodataService.addAccountInfo(biodataId, validatedData);
      res.json(accountInfo);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new ApiError('Invalid input data', 400);
      }
      next(error);
    }
  }

  async getBiodata(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const filters = biodataQuerySchema.parse(req.query);
      const biodata = await this.biodataService.getBiodata({
        erpId: filters.erpId as string,
        ippisId: filters.ippisId as string,
        staffNo: filters.staffNo as string,
        department: filters.department as string,
        isVerified: filters.isVerified as boolean,
        isApproved: filters.isApproved as boolean,
        isDeleted: filters.isDeleted as boolean,
        membershipStatus: filters.membershipStatus as MembershipStatus,
        searchTerm: filters.searchTerm as string,
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
      return ApiResponse.success(res, 'Biodata retrieved successfully', biodata);
    } catch (error) {
      if (error instanceof ZodError) {
        return ApiResponse.badRequest(res, 'Invalid query parameters');
      }
      if (error instanceof ApiError) {
        return ApiResponse.badRequest(res, error.message);
      }
      next(error);
    }
  }

  async getBiodataById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;
      const biodata = await this.biodataService.getBiodataById(id);
      res.json(biodata);
    } catch (error) {
      next(error);
    }
  }

  async deleteBiodata(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;
      const biodata = await this.biodataService.deleteBiodata(id);
      res.json(biodata);
    } catch (error) {
      next(error);
    }
  }

  async getUnapprovedBiodata(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const filters = {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 10,
        department: req.query.department as string,
        searchTerm: req.query.searchTerm as string,
      };

      const result = await this.biodataService.getUnapprovedBiodata(filters);
      return ApiResponse.success(res, 'Unapproved biodata retrieved successfully', result);
    } catch (error) {
      next (error);
    }
  }

  async updateProfilePhoto(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const biodataId = req.params.id;
      const file = req.file;
      
      if (!file) {
        return ApiResponse.badRequest(res, 'No file uploaded');
      }
      
      // Security check: Ensure the user is updating their own photo or is an admin
      const isOwnProfile = req.user.biodataId === biodataId;
      const isAdmin = 
        ['ADMIN', 'TREASURER', 'CHAIRMAN', 'SUPER_ADMIN'].includes(req.user.role.name)
      ;
      
      if (!isOwnProfile && !isAdmin) {
        return ApiResponse.forbidden(res, 'You can only update your own profile photo');
      }
      
      // Create relative path for storage in DB
      const relativeFilePath = `/uploads/profile-photos/${file.filename}`;
      
      // Update the biodata
      const biodata = await this.biodataService.updateProfilePhoto(
        biodataId, 
        relativeFilePath,
        req.user.id
      );
      
      return ApiResponse.success(
        res, 
        'Profile photo updated successfully', 
        {
          id: biodata.id,
          profilePhoto: biodata.profilePhoto
        }
      );
    } catch (error) {
      next(error);
    }
  }
}