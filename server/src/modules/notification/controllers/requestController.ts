import { Request, Response } from 'express';
import { RequestService } from '../services/requestService';
import { CreateRequestDTO, UpdateRequestDTO, FilterOptions } from '../types/request.types';
import { RequestError, requestErrorCodes } from '../../../middlewares/errorHandlers/requestErrorHandler';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../../../types/express';

const prisma = new PrismaClient();
const requestService = new RequestService();

export class RequestController {
  async createRequest(req: AuthenticatedRequest, res: Response) {
    try {
      const { biodataId } = req.body;
      const userId = req.user?.userId;
      
      if (!userId) {
        throw new RequestError(requestErrorCodes.UNAUTHORIZED_REQUEST, 'User not authenticated', 401);
      }

      // Verify biodata approval and verification status
      const biodata = await prisma.biodata.findUnique({
        where: { id: biodataId }
      });

      if (!biodata) {
        throw new RequestError(requestErrorCodes.UNAUTHORIZED_REQUEST, 'Invalid biodata ID', 400);
      }

      // For requests other than biodata approval, check if biodata is approved and verified
      if (req.path !== '/biodata-approval' && !biodata.isApproved) {
        throw new RequestError(requestErrorCodes.BIODATA_NOT_APPROVED, 'Biodata must be approved before making requests');
      }

      if (req.path !== '/biodata-approval' && !biodata.isVerified) {
        throw new RequestError(requestErrorCodes.BIODATA_NOT_VERIFIED, 'Biodata must be verified before making requests');
      }

      // Determine request type based on endpoint
      let type;
      switch (req.path) {
        case '/biodata-approval':
          type = 'BIODATA_APPROVAL';
          break;
        case '/loan-application':
          type = 'LOAN_APPLICATION';
          break;
        case '/savings-withdrawal':
          type = 'SAVINGS_WITHDRAWAL';
          break;
        case '/share-transfer':
        case '/share-withdrawal':
          type = 'SHARE_WITHDRAWAL';
          break;
        default:
          throw new RequestError(requestErrorCodes.INVALID_REQUEST_TYPE, 'Invalid request type');
      }

      // Check for duplicate pending requests of the same type
      const existingRequest = await prisma.request.findFirst({
        where: {
          userId,
          type: type as any,
          status: 'PENDING'
        }
      });

      if (existingRequest) {
        throw new RequestError(requestErrorCodes.DUPLICATE_REQUEST, 'A similar request is already pending');
      }

      const requestData: CreateRequestDTO = {
        biodataId,
        userId,
        type: type as any,
        details: req.body
      };

      const request = await requestService.createRequest(requestData);
      res.status(201).json(request);
    } catch (error) {
      if (error instanceof RequestError) {
        res.status(error.status).json({ error: { code: error.code, message: error.message } });
      } else {
        console.error('Error creating request:', error);
        res.status(500).json({ error: 'Failed to create request' });
      }
    }
  }

  async updateRequest(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const adminId = req.user?.userId;
      
      if (!adminId) {
        throw new RequestError(requestErrorCodes.UNAUTHORIZED_REQUEST, 'Admin not authenticated', 401);
      }

      const updateData: UpdateRequestDTO = {
        status: req.body.status,
        adminNotes: req.body.adminNotes
      };

      // Check if request exists and hasn't been processed
      const existingRequest = await prisma.request.findUnique({
        where: { id }
      });

      if (!existingRequest) {
        throw new RequestError(requestErrorCodes.REQUEST_NOT_FOUND, 'Request not found');
      }

      if (existingRequest.status !== 'PENDING') {
        throw new RequestError(requestErrorCodes.REQUEST_ALREADY_PROCESSED, 'This request has already been processed');
      }

      const request = await requestService.updateRequest(id, updateData, adminId);
      res.json(request);
    } catch (error) {
      if (error instanceof RequestError) {
        res.status(error.status).json({ error: { code: error.code, message: error.message } });
      } else {
        console.error('Error updating request:', error);
        res.status(500).json({ error: 'Failed to update request' });
      }
    }
  }

  async getRequest(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const request = await requestService.getRequestById(id);
      
      if (!request) {
        throw new RequestError(requestErrorCodes.REQUEST_NOT_FOUND, 'Request not found');
      }
      
      res.json(request);
    } catch (error) {
      if (error instanceof RequestError) {
        res.status(error.status).json({ error: { code: error.code, message: error.message } });
      } else {
        console.error('Error getting request:', error);
        res.status(500).json({ error: 'Failed to get request' });
      }
    }
  }

  async getRequests(req: Request, res: Response) {
    try {
      const filters: FilterOptions = {
        type: req.query.type as any,
        status: req.query.status as any,
        biodataId: req.query.biodataId as string,
        userId: req.query.userId as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc'
      };

      const result = await requestService.getRequests(filters);
      res.json(result);
    } catch (error) {
      console.error('Error getting requests:', error);
      res.status(500).json({ error: 'Failed to get requests' });
    }
  }

  async getUserRequests(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        throw new RequestError(requestErrorCodes.UNAUTHORIZED_REQUEST, 'User not authenticated', 401);
      }

      const requests = await requestService.getUserRequests(userId);
      res.json(requests);
    } catch (error) {
      if (error instanceof RequestError) {
        res.status(error.status).json({ error: { code: error.code, message: error.message } });
      } else {
        console.error('Error getting user requests:', error);
        res.status(500).json({ error: 'Failed to get user requests' });
      }
    }
  }

  async getPendingCount(req: Request, res: Response) {
    try {
      const count = await requestService.getPendingRequestCount();
      res.json({ count });
    } catch (error) {
      console.error('Error getting pending count:', error);
      res.status(500).json({ error: 'Failed to get pending request count' });
    }
  }

  async deleteRequest(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Check if request exists and is pending
      const existingRequest = await prisma.request.findUnique({
        where: { id }
      });

      if (!existingRequest) {
        throw new RequestError(requestErrorCodes.REQUEST_NOT_FOUND, 'Request not found');
      }

      if (existingRequest.status !== 'PENDING') {
        throw new RequestError(requestErrorCodes.REQUEST_ALREADY_PROCESSED, 'Cannot delete processed request');
      }

      await requestService.deleteRequest(id);
      res.status(204).send();
    } catch (error) {
      if (error instanceof RequestError) {
        res.status(error.status).json({ error: { code: error.code, message: error.message } });
      } else {
        console.error('Error deleting request:', error);
        res.status(500).json({ error: 'Failed to delete request' });
      }
    }
  }
}