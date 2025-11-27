import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ApiResponse } from '../../../utils/apiResponse';
import { ApiError } from '../../../utils/apiError';
import { AuthenticatedRequest } from '../../../types/express';
import RequestService from '../services/request.service';
import { RequestError } from '../errors/request.error';
import { 
    createRequestSchema, 
    updateRequestStatusSchema, 
    requestQuerySchema,
    requestIdSchema 
} from '../validations/request.validation';
import logger from '../../../utils/logger';

export class RequestController {
    /**
     * Create a new request
     * @route POST /api/requests
     */
    public async createRequest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const validatedData = createRequestSchema.parse(req.body);
            
            const result = await RequestService.createRequest({
                ...validatedData,
                userId: req.user.id // Add user ID from auth
            });
            
            ApiResponse.created(res, 'Request created successfully', result);
        } catch (error) {
            logger.error('Error creating request:', error);
            
            if (error instanceof z.ZodError) {
                next(new ApiError('Validation error', 400, error.errors));
            } else if (error instanceof RequestError) {
                next(new ApiError(error.message, error.statusCode));
            } else {
                next(error);
            }
        }
    }

    /**
     * Get all requests with filtering
     * @route GET /api/requests
     */
    public async getAllRequests(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const query = requestQuerySchema.parse(req.query);
            
            // Convert date strings to Date objects if they exist
            const params = {
                ...query,
                startDate: query.startDate,
                endDate: query.endDate
            };
            
            const result = await RequestService.getAllRequests(params);
            
            ApiResponse.success(res, 'Requests retrieved successfully', result);
        } catch (error) {
            logger.error('Error fetching requests:', error);
            
            if (error instanceof z.ZodError) {
                next(new ApiError('Validation error', 400, error.errors));
            } else if (error instanceof RequestError) {
                next(new ApiError(error.message, error.statusCode));
            } else {
                next(error);
            }
        }
    }

    /**
     * Get requests for the authenticated user
     * @route GET /api/requests/user
     */
    public async getUserRequests(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const query = requestQuerySchema.parse(req.query);
            
            // Convert date strings to Date objects if they exist
            const params = {
                ...query,
                startDate: query.startDate,
                endDate: query.endDate
            };
            
            const result = await RequestService.getUserRequests(req.user.id, params);
            
            ApiResponse.success(res, 'User requests retrieved successfully', result);
        } catch (error) {
            logger.error('Error fetching user requests:', error);
            
            if (error instanceof z.ZodError) {
                next(new ApiError('Validation error', 400, error.errors));
            } else if (error instanceof RequestError) {
                next(new ApiError(error.message, error.statusCode));
            } else {
                next(error);
            }
        }
    }

    /**
     * Get a single request by ID
     * @route GET /api/requests/:id
     */
    public async getRequestById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { id } = requestIdSchema.parse(req.params);
            
            const result = await RequestService.getRequestById(id);
            
            // Check if user is authorized to view this request
            const isOwnRequest = req.user.id === result.initiatorId;
            const isAdmin = req.user.role.isAdmin;
            
            if (!isOwnRequest && !isAdmin) {
                throw new ApiError('Unauthorized to view this request', 403);
            }
            
            ApiResponse.success(res, 'Request retrieved successfully', result);
        } catch (error) {
            logger.error('Error fetching request by ID:', error);
            
            if (error instanceof z.ZodError) {
                next(new ApiError('Validation error', 400, error.errors));
            } else if (error instanceof RequestError) {
                next(new ApiError(error.message, error.statusCode));
            } else {
                next(error);
            }
        }
    }

    /**
     * Update a request's status
     * @route PUT /api/requests/:id
     */
    public async updateRequestStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { id } = requestIdSchema.parse(req.params);
            const validatedData = updateRequestStatusSchema.parse(req.body);
            
            const result = await RequestService.updateRequestStatus({
                requestId: id,
                status: validatedData.status,
                notes: validatedData.notes,
                updatedBy: req.user.id
            });
            
            ApiResponse.success(res, 'Request updated successfully', result);
        } catch (error) {
            logger.error('Error updating request status:', error);
            
            if (error instanceof z.ZodError) {
                next(new ApiError('Validation error', 400, error.errors));
            } else if (error instanceof RequestError) {
                next(new ApiError(error.message, error.statusCode));
            } else {
                next(error);
            }
        }
    }

    /**
     * Delete (cancel) a request
     * @route DELETE /api/requests/:id
     */
    public async deleteRequest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { id } = requestIdSchema.parse(req.params);
            
            await RequestService.deleteRequest(id, req.user.id);
            
            ApiResponse.success(res, 'Request deleted successfully');
        } catch (error) {
            logger.error('Error deleting request:', error);
            
            if (error instanceof z.ZodError) {
                next(new ApiError('Validation error', 400, error.errors));
            } else if (error instanceof RequestError) {
                next(new ApiError(error.message, error.statusCode));
            } else {
                next(error);
            }
        }
    }

    /**
     * Get count of pending requests
     * @route GET /api/requests/pending-count
     */
    public async getPendingRequestCount(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            // Determine if we should filter by user or role
            const userId = req.user.isAdmin ? undefined : req.user.id;
            const role = req.user.role ? req.user.role.name : undefined;
            
            const count = await RequestService.getPendingRequestCount(userId, role);
            
            ApiResponse.success(res, 'Pending request count retrieved successfully', { count });
        } catch (error) {
            logger.error('Error fetching pending request count:', error);
            
            if (error instanceof RequestError) {
                next(new ApiError(error.message, error.statusCode));
            } else {
                next(error);
            }
        }
    }

    /**
     * Get request statistics
     * @route GET /api/requests/statistics
     */
    public async getRequestStatistics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { startDate, endDate, biodataId } = req.query;
            
            const filters = {
                startDate: startDate ? new Date(startDate as string) : undefined,
                endDate: endDate ? new Date(endDate as string) : undefined,
                biodataId: biodataId as string | undefined
            };
            
            const statistics = await RequestService.getRequestStatistics(filters);
            
            ApiResponse.success(res, 'Request statistics retrieved successfully', statistics);
        } catch (error) {
            logger.error('Error fetching request statistics:', error);
            
            if (error instanceof RequestError) {
                next(new ApiError(error.message, error.statusCode));
            } else {
                next(error);
            }
        }
    }
}

export default new RequestController();