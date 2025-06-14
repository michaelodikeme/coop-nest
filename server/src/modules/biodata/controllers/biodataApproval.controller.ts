import { Request, Response, NextFunction } from 'express';
import { BiodataUploadService } from '../services/biodataUpload.service';
import { ApiResponse } from '../../../utils/apiResponse';
import { ApiError } from '../../../utils/apiError';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    biodataId: string;
    roles: Array<{
      name: string;
      isAdmin: boolean;
    }>;
    permissions?: string[];
    approvalLevel: number;
  };
  session?: {
    id: string;
  };
}

export class BiodataApprovalController {
  private uploadService: BiodataUploadService;

  constructor() {
    this.uploadService = new BiodataUploadService();
  }

  async approveBiodataUpload(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    // Ensure the request is authenticated
    try {
      const { requestId } = req.params;
      const approverId = req.user.id;
      const approverLevel = req.user.approvalLevel || 0;

      // Only Chairman (Level 3) can approve uploads
      if (approverLevel < 3) {
        return ApiResponse.forbidden(res, 'Insufficient approval level. Chairman approval required.');
      }

      await this.uploadService.approvedBiodataUpload(requestId, approverId);
      return ApiResponse.success(res, 'Biodata upload approved and processed successfully');
    } catch (error) {
      if (error instanceof ApiError) {
        return ApiResponse.badRequest(res, error.message);
      }
      next(error);
    }
  }

  async rejectBiodataUpload(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { requestId } = req.params;
      const { reason } = req.body;
      const approverId = req.user.id;
      const approverLevel = req.user.approvalLevel || 0;

      // Only Chairman (Level 3) can reject uploads
      if (approverLevel < 3) {
        return ApiResponse.forbidden(res, 'Insufficient approval level. Chairman approval required.');
      }

      await this.uploadService.rejectBiodataUpload(requestId, approverId, reason);
      return ApiResponse.success(res, 'Biodata upload rejected successfully');
    } catch (error) {
      if (error instanceof ApiError) {
        return ApiResponse.badRequest(res, error.message);
      }
      next(error);
    }
  }

  async getUploadRequests(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { status, page, limit } = req.query;
      const approverLevel = req.user.approvalLevel || 0;

      // Only users with approval rights can view requests
      if (approverLevel < 2) {
        return ApiResponse.forbidden(res, 'Insufficient privileges to view upload requests');
      }

      const requests = await this.uploadService.getUploadRequests({
        status: status as string,
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 10,
        approverLevel
      });

      return ApiResponse.success(res, 'Upload requests retrieved successfully', requests);
    } catch (error) {
      if (error instanceof ApiError) {
        return ApiResponse.badRequest(res, error.message);
      }
      next(error);
    }
  }

  async getUploadRequestDetails(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { requestId } = req.params;
      const approverLevel = req.user.approvalLevel || 0;

      // Only users with approval rights can view request details
      if (approverLevel < 2) {
        return ApiResponse.forbidden(res, 'Insufficient privileges to view request details');
      }

      const request = await this.uploadService.getUploadRequestDetails(requestId);
      return ApiResponse.success(res, 'Upload request details retrieved successfully', request);
    } catch (error) {
      if (error instanceof ApiError) {
        return ApiResponse.badRequest(res, error.message);
      }
      next(error);
    }
  }
}