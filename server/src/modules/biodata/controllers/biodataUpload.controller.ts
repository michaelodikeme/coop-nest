import { Request, Response, NextFunction } from 'express';
import { BiodataUploadService } from '../services/biodataUpload.service';
import { ApiResponse } from '../../../utils/apiResponse';
import { ApiError } from '../../../utils/apiError';
import path from 'path';
import fs from 'fs';

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
  file?: Express.Multer.File;
}

export class BiodataUploadController {
  private uploadService: BiodataUploadService;

  constructor() {
    this.uploadService = new BiodataUploadService();
  }

  async uploadBiodata(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {

    //   if (!req.file) {
    //     throw new Error('No file uploaded');
    // }
      const uploaderId = req.user.id;
      const uploaderLevel = req.user.approvalLevel || 0;
      const file = req.file;

      if (!file) {
        return ApiResponse.badRequest(res, 'No file uploaded');
      }
      
      // Read the file from disk
      const fileBuffer = fs.readFileSync(file.path);
      const fileType = file.mimetype;

      const uploadResponse = await this.uploadService.uploadBiodata(
        { 
          file: fileBuffer, 
          uploaderId,
          fileType: fileType 
        },
        uploaderLevel
      );

      // Clean up uploaded file
      fs.unlinkSync(file.path);

      return ApiResponse.success(res, 'Biodata upload request created successfully', uploadResponse);
    } catch (error) {
      next(error);
    }
  }

  async checkUploadStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { requestId } = req.params;
      const status = await this.uploadService.checkUploadStatus(requestId);
      return ApiResponse.success(res, 'Upload status retrieved successfully', status);
    } catch (error) {
      if (error instanceof ApiError) {
        return ApiResponse.badRequest(res, error.message);
      }
      next(error);
    }
  }

  async cancelUpload(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { requestId } = req.params;
      const uploaderId = req.user.id;
      await this.uploadService.cancelUpload(requestId, uploaderId);
      return ApiResponse.success(res, 'Upload cancelled successfully');
    } catch (error) {
      if (error instanceof ApiError) {
        return ApiResponse.badRequest(res, error.message);
      }
      next(error);
    }
  }
}