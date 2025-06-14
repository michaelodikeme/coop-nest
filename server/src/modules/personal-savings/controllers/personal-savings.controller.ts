import { Request, Response, NextFunction } from 'express';
import { PersonalSavingsService } from '../services/personal-savings.service';
import { ApiError } from '../../../utils/apiError';
import logger from '../../../utils/logger';
import { 
    createPersonalSavingsSchema, 
    depositSchema, 
    withdrawalSchema, 
    listPersonalSavingsQuerySchema,
    getByIdSchema,
    transactionHistorySchema
} from '../validations/personal-savings.validation';

export class PersonalSavingsController {
    private service: PersonalSavingsService;

    constructor() {
        this.service = new PersonalSavingsService();
    }
    
    /**
     * Get all personal savings plans with filtering
     * Implements automatic filtering based on user role
     */
    getAllPersonalSavings = async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Validate query params
            const queryParams = listPersonalSavingsQuerySchema.parse(req.query);
            
            // Get user ID and roles from authenticated user
            const { id: userId, roles } = req.user;
            const isAdmin = roles.some(role => ['ADMIN', 'TREASURER', 'CHAIRMAN', 'SUPER_ADMIN'].includes(role.name));
            
            // Get plans with automatic filtering based on user role
            const result = await this.service.getAllPersonalSavings(queryParams, userId, isAdmin);
            
            return res.status(200).json({
                success: true,
                message: 'Personal savings plans retrieved successfully',
                ...result
            });
        } catch (error) {
            logger.error('Controller error getting personal savings plans:', error);
            if (error instanceof ApiError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }
            next(error); // Pass error to next middleware for centralized error handling
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve personal savings plans'
            });
        }
    }
    
    /**
     * Get personal savings plan by ID
     */
    getPersonalSavingsById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Validate params
            const { id } = getByIdSchema.parse(req.params);
            
            // Get user ID and roles from authenticated user
            const { id: userId, roles } = req.user;
            const isAdmin = roles.some(role => ['ADMIN', 'TREASURER', 'CHAIRMAN', 'SUPER_ADMIN'].includes(role.name));
            
            // Get plan with ownership validation
            const result = await this.service.getPersonalSavingsById(id, userId, isAdmin);
            
            return res.status(200).json({
                success: true,
                message: 'Personal savings plan retrieved successfully',
                data: result
            });
        } catch (error) {
            logger.error('Controller error getting personal savings plan:', error);
            if (error instanceof ApiError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }
            next(error); // Pass error to next middleware for centralized error handling
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve personal savings plan'
            });
        }
    }

    /**
     * Process deposit to personal savings
     */
    processDeposit = async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Validate params and body
            const { id } = getByIdSchema.parse(req.params);
            const { amount, description } = depositSchema.parse(req.body);
            
            // Get user ID from authenticated user
            const { id: userId } = req.user;
            
            // Process deposit
            const result = await this.service.processDeposit(id, amount, userId, description);
            
            return res.status(200).json({
                success: true,
                message: 'Deposit processed successfully',
                data: result
            });
        } catch (error) {
            logger.error('Controller error processing deposit:', error);
            if (error instanceof ApiError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }
            next(error); // Pass error to next middleware for centralized error handling
            return res.status(500).json({
                success: false,
                message: 'Failed to process deposit'
            });
        }
    }

    /**
     * Request withdrawal from personal savings
     */
    requestWithdrawal = async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Validate params and body
            const { id } = getByIdSchema.parse(req.params);
            const { amount, reason } = withdrawalSchema.parse(req.body);
            
            // Get user ID from authenticated user
            const { id: userId } = req.user;
            
            // Request withdrawal
            const result = await this.service.requestWithdrawal(id, amount, userId, reason);
            
            return res.status(200).json({
                success: true,
                message: 'Withdrawal request submitted successfully',
                data: result
            });
        } catch (error) {
            logger.error('Controller error requesting withdrawal:', error);
            if (error instanceof ApiError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }
            next(error); // Pass error to next middleware for centralized error handling
            return res.status(500).json({
                success: false,
                message: 'Failed to submit withdrawal request'
            });
        }
    }
    
    /**
     * Get transaction history with ownership validation
     */
    getTransactionHistory = async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Validate params and query
            const { id } = getByIdSchema.parse(req.params);
            const queryParams = transactionHistorySchema.parse(req.query);
            
            // Get user ID and roles from authenticated user
            const { id: userId, roles } = req.user;
            const isAdmin = roles.some(role => ['ADMIN', 'TREASURER', 'CHAIRMAN', 'SUPER_ADMIN'].includes(role.name));
            
            // Get transaction history with ownership validation
            const result = await this.service.getTransactionHistory(id, queryParams, userId, isAdmin);
            
            return res.status(200).json({
                success: true,
                message: 'Transaction history retrieved successfully',
                ...result
            });
        } catch (error) {
            logger.error('Controller error getting transaction history:', { error });
            if (error instanceof ApiError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }
            next(error); // Pass error to next middleware for centralized error handling
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve transaction history'
            });
        }
    }    /**
     * Get balance history for charts with ownership validation
     */
    getBalanceHistory = async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Validate params
            const { id } = getByIdSchema.parse(req.params);
            const { startDate, endDate } = req.query as { startDate?: string, endDate?: string };
            
            // Get user ID and roles from authenticated user
            const { id: userId, roles } = req.user;
            const isAdmin = roles.some(role => ['ADMIN', 'TREASURER', 'CHAIRMAN', 'SUPER_ADMIN'].includes(role.name));
            
            // Get balance history with ownership validation
            const result = await this.service.getBalanceHistory(id, startDate, endDate, userId, isAdmin);
            
            return res.status(200).json({
                success: true,
                message: 'Balance history retrieved successfully',
                data: result
            });
        } catch (error) {
            logger.error('Controller error getting balance history:', { error });
            if (error instanceof ApiError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }
            next(error); // Pass error to next middleware for centralized error handling
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve balance history'
            });
        }
    }

    /**
     * Close personal savings plan
     */
    closePlan = async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Validate params
            const { id } = getByIdSchema.parse(req.params);
            
            // Get user ID from authenticated user
            const { id: userId } = req.user;
            
            // Close plan
            const result = await this.service.closePlan(id, userId);
            
            return res.status(200).json({
                success: true,
                message: 'Personal savings plan closed successfully',
                data: result
            });
        } catch (error) {
            logger.error('Controller error closing personal savings plan:', { error });
            if (error instanceof ApiError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }
            next(error); // Pass error to next middleware for centralized error handling
            return res.status(500).json({
                success: false,
                message: 'Failed to close personal savings plan'
            });
        }
    }    
    
    /**
     * Get member summary with ownership validation
     */
    getMemberSummary = async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Get erpId from params
            const { erpId } = req.params;
            
            if (!erpId) {
                throw new ApiError('ERP ID is required', 400);
            }
            
            // Get user ID and roles from authenticated user
            const { id: userId, roles } = req.user;
            const isAdmin = roles.some(role => ['ADMIN', 'TREASURER', 'CHAIRMAN', 'SUPER_ADMIN'].includes(role.name));
            
            // Get member summary with ownership validation
            const result = await this.service.getMemberSummary(erpId, userId, isAdmin);
            
            return res.status(200).json({
                success: true,
                message: 'Member savings summary retrieved successfully',
                data: result
            });
        } catch (error) {
            logger.error('Controller error getting member savings summary:', { error });
            if (error instanceof ApiError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }
            next(error); // Pass error to next middleware for centralized error handling
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve member savings summary'
            });
        }
    }

    /**
     * Get admin dashboard data for personal savings
     */
    getAdminDashboard = async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Get user ID from authenticated user
            const { id: userId } = req.user;
            
            // Get dashboard data
            const result = await this.service.getAdminDashboardData(userId);
            
            return res.status(200).json({
                success: true,
                message: 'Admin dashboard data retrieved successfully',
                data: result
            });
        } catch (error) {
            logger.error('Controller error getting admin dashboard data:', error);
            if (error instanceof ApiError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }
            next(error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve admin dashboard data'
            });
        }
    }    
    
    /**
     * Request creation of a new personal savings plan
     * This initiates the approval workflow for creating a personal savings plan
     */
    requestPersonalSavingsCreation = async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Validate request body
            const validData = createPersonalSavingsSchema.parse(req.body);
            
            // Get user ID from authenticated user
            const { id: userId } = req.user;
            
            // Request personal savings plan creation
            const result = await this.service.requestPersonalSavingsCreation({
                erpId: validData.erpId,
                planTypeId: req.body.planTypeId,
                planName: validData.planName,
                targetAmount: validData.targetAmount,
                userId,
                notes: req.body.notes
            });
            
            return res.status(201).json({
                success: true,
                message: 'Personal savings plan creation request submitted successfully',
                data: result
            });
        } catch (error) {
            logger.error('Controller error requesting personal savings plan creation:', error);
            if (error instanceof ApiError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }
            next(error);
            return res.status(500).json({
                success: false,
                message: 'Failed to submit personal savings plan creation request'
            });
        }
    }

    /**
     * Get all available personal savings plan types
     */
    getPersonalSavingsPlans = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const planTypes = await this.service.getPersonalSavingsPlans();
            
            return res.status(200).json({
                success: true,
                message: 'Personal savings plan types retrieved successfully',
                data: planTypes
            });
        } catch (error) {
            logger.error('Controller error getting personal savings plan types:', error);
            if (error instanceof ApiError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }
            next(error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve personal savings plan types'
            });
        }
    }
}