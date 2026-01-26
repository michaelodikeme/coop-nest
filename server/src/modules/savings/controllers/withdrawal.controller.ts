import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../../../utils/apiResponse';
import { ApiError } from '../../../utils/apiError';
import { AuthenticatedRequest } from '../../../types/express';
import SavingsWithdrawalService from '../services/withdrawal.service';
import { SavingsError } from '../errors/savings.error';
import {
    createWithdrawalSchema,
    updateWithdrawalSchema,
    withdrawalQuerySchema
} from '../validations/withdrawal.validation';
import { z } from 'zod';
import logger from '../../../utils/logger';
import { WithdrawalRequestInput } from '../interfaces/withdrawal.interface';

export class WithdrawalController {
    /**
     * Create a new withdrawal request
     * @route POST /api/savings/withdrawal
     */
    public async createWithdrawalRequest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {

            // Get biodataId and erpId from logged in user
            const { biodataId, erpId } = req.user;

            if (!biodataId || !erpId) {
                throw new ApiError('User profile is incomplete', 400);
            }

            // Validate input
            const validatedData = createWithdrawalSchema.parse({
                ...req.body,
                biodataId,
                erpId
            }) as WithdrawalRequestInput;

            // Member can only withdraw from their own account
            if (req.user.biodataId !== validatedData.biodataId && !req.user.isAdmin) {
                throw new ApiError('You can only request withdrawals from your own account', 403);
            }

            const result = await SavingsWithdrawalService.createWithdrawalRequest({
                ...validatedData,
                userId: req.user.id // User ID from authentication
            });
            
            ApiResponse.created(res, 'Withdrawal request submitted successfully', result);
        } catch (error) {
            logger.error('Error creating withdrawal request:', error);
            
            if (error instanceof z.ZodError) {
                next(new ApiError('Validation error', 400, error.errors));
            } else if (error instanceof SavingsError) {
                next(new ApiError(error.message, error.statusCode));
            } else {
                next(error);
            }
        }
    }
    
    /**
     * Update withdrawal request status
     * @route PATCH /api/savings/withdrawal/:id/status
     */
    public async updateWithdrawalStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const validatedData = updateWithdrawalSchema.parse(req.body);
            
            const result = await SavingsWithdrawalService.updateWithdrawalStatus({
                withdrawalId: id,
                status: validatedData.status,
                notes: validatedData.notes,
                updatedBy: req.user.id // User making the update
            });
            
            ApiResponse.success(res, 'Withdrawal request status updated successfully', result);
        } catch (error) {
            logger.error('Error updating withdrawal status:', error);
            
            if (error instanceof z.ZodError) {
                next(new ApiError('Validation error', 400, error.errors));
            } else if (error instanceof SavingsError) {
                next(new ApiError(error.message, error.statusCode));
            } else {
                next(error);
            }
        }
    }
    
    /**
     * Get all withdrawal requests with filtering
     * @route GET /api/savings/withdrawal
     */
    public async getWithdrawalRequests(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const query = withdrawalQuerySchema.parse(req.query);
            
            // Convert date strings to Date objects
            const params: any = {
                ...query
            };
            
            if (query.startDate) {
                params.startDate = new Date(query.startDate);
            }
            
            if (query.endDate) {
                params.endDate = new Date(query.endDate);
            }
            
            // Regular members can only see their own requests
            if (!req.user.isAdmin && req.user.biodataId) {
                params.biodataId = req.user.biodataId;
            }
            
            const result = await SavingsWithdrawalService.getWithdrawalRequests(params);
            
            ApiResponse.success(res, 'Withdrawal requests retrieved successfully', result);
        } catch (error) {
            logger.error('Error fetching withdrawal requests:', error);
            
            if (error instanceof z.ZodError) {
                next(new ApiError('Validation error', 400, error.errors));
            } else if (error instanceof SavingsError) {
                next(new ApiError(error.message, error.statusCode));
            } else {
                next(error);
            }
        }
    }
    
    /**
     * Get withdrawal request by ID
     * @route GET /api/savings/withdrawal/:id
     */
    public async getWithdrawalRequestById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            
            const result = await SavingsWithdrawalService.getWithdrawalRequestById(id);
            
            // Regular members can only see their own requests
            if (!req.user.isAdmin && req.user.biodataId !== result.member?.id) {
                throw new ApiError('You are not authorized to view this withdrawal request', 403);
            }
            
            ApiResponse.success(res, 'Withdrawal request retrieved successfully', result);
        } catch (error) {
            logger.error('Error fetching withdrawal request details:', error);
            
            if (error instanceof SavingsError) {
                next(new ApiError(error.message, error.statusCode));
            } else {
                next(error);
            }
        }
    }
    
    /**
     * Get withdrawal statistics
     * @route GET /api/savings/withdrawal/stats
     */
    public async getWithdrawalStatistics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const filters: any = {};
            
            // Parse date filters
            if (req.query.startDate) {
                filters.startDate = new Date(req.query.startDate as string);
            }
            
            if (req.query.endDate) {
                filters.endDate = new Date(req.query.endDate as string);
            }
            
            // Regular members can only see their own statistics
            if (!req.user.isAdmin && req.user.biodataId) {
                filters.biodataId = req.user.biodataId;
            }
            
            const result = await SavingsWithdrawalService.getWithdrawalStatistics(filters);
            
            ApiResponse.success(res, 'Withdrawal statistics retrieved successfully', result);
        } catch (error) {
            logger.error('Error fetching withdrawal statistics:', error);
            
            if (error instanceof SavingsError) {
                next(new ApiError(error.message, error.statusCode));
            } else {
                next(error);
            }
        }
    }
}

export default new WithdrawalController();