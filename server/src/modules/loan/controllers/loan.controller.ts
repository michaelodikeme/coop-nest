import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../../types/express';
import { LoanService } from '../services/loan.service';
import { CalculatorService } from '../services/calculator.service';
import { EligibilityService } from '../services/eligibility.service';
import { ApiResponse } from '../../../utils/apiResponse';
import { ApiError } from '../../../utils/apiError';
import { LoanStatus } from '@prisma/client';
import { 
    loanApplicationSchema, 
    loanStatusUpdateSchema, 
    loanCalculationSchema, 
    loanEligibilitySchema
} from '../validations/loan.validation';
import logger from '../../../utils/logger';

export class LoanController {
    private loanService: LoanService;
    private calculatorService: CalculatorService;
    private eligibilityService: EligibilityService;

    constructor() {
        this.loanService = new LoanService();
        this.calculatorService = new CalculatorService();
        this.eligibilityService = new EligibilityService();
    }

    // Get all loan types
    async getLoanTypes(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const loanTypes = await this.loanService.getAllLoanTypes();
            return ApiResponse.success(res, 'Loan types retrieved successfully', loanTypes);
        } catch (error) {
            next(error);
        }
    }

    // Check loan eligibility
    async checkEligibility(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            // Ensure biodataId is present in the request
            const biodataId = req.user?.biodataId;
            if (!biodataId) {
                throw new ApiError('Biodata ID is required', 400);
            }
            const validatedData = await loanEligibilitySchema.parseAsync(req.body);
            const eligibility = await this.eligibilityService.checkLoanEligibility(
                biodataId,
                validatedData.loanTypeId,
            );

            return ApiResponse.success(res, 'Eligibility check completed', eligibility);
        } catch (error) {
            next(error);
        }
    }

    // Calculate loan details
    async calculateLoan(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const validatedData = await loanCalculationSchema.parseAsync(req.body);
            
            const calculation = await this.calculatorService.calculateLoan(
                validatedData.loanTypeId,
                validatedData.amount,
                validatedData.tenure,
                req.user.biodataId
            );

            return ApiResponse.success(res, 'Loan calculation completed', calculation);
        } catch (error) {
            next(error);
        }
    }

    // Apply for loan
    async applyForLoan(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            console.log("got here first", req.user)
            // Get biodataId and erpId from logged in user
            const { biodataId, erpId } = req.user;
            
            console.log("got here second")
            if (!biodataId || !erpId) {
                throw new ApiError('User profile is incomplete', 400);
            }


            console.log("got here thrid")
            const validatedData = await loanApplicationSchema.parseAsync({
                ...req.body,
                biodataId,  // Add from logged in user
                erpId,      // Add from logged in user
                userId: req.user.id
            });

            console.log("got here fourth")
            // Fetch loan type details
            const loanType = await this.loanService.getLoanTypeById(validatedData.loanTypeId);
            if (!loanType) {
                throw new ApiError('Loan type not found', 404);
            }

            console.log("got here fifth")

            const loanApplicationData = {
                ...validatedData,
                loanTypeName: loanType.name,
                loanTypeDescription: loanType.description,
                loanTypeInterestRate: loanType.interestRate.toNumber()
            };

            console.log("got here sixth")

            const loan = await this.loanService.applyForLoan(loanApplicationData);
            return ApiResponse.created(res, 'Loan application submitted successfully', loan);
        } catch (error) {
            next(error);
        }
    }

    // Get member loans
    async getMemberLoans(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            // Use proper parameter extraction from URL or authenticated user
            const biodataId = req.params.biodataId || req.user?.biodataId;
            
            if (!biodataId) {
                throw new ApiError('Biodata ID is required', 400);
            }
            
            logger.debug(`Fetching loans for member: ${biodataId}`);
            
            const loans = await this.loanService.getMemberLoans(biodataId);
            
            return ApiResponse.success(
                res, 
                `Retrieved ${loans.length} loan(s) for member`, 
                loans
            );
        } catch (error) {
            next(error);
        }
    }

    // Get loan details
    async getLoanDetails(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const loan = await this.loanService.getLoanDetails(id);
            
            if (!loan) {
                throw new ApiError('Loan not found', 404);
            }

            return ApiResponse.success(res, 'Loan details retrieved successfully', loan);
        } catch (error) {
            next(error);
        }
    }

    // Update loan status
    async updateLoanStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const validatedData = await loanStatusUpdateSchema.parseAsync(req.body);
            
            // Add user info to track who made the status change
            const statusUpdate = {
                ...validatedData,
                updatedBy: req.user.id,
                approvalLevel: req.user.approvalLevel
            };

            const loan = await this.loanService.updateLoanStatus(
                id, 
                statusUpdate.status,
                statusUpdate.notes,
                statusUpdate.updatedBy
            );

            return ApiResponse.success(
                res, 
                `Loan status updated to ${validatedData.status}`, 
                loan
            );
        } catch (error) {
            next(error);
        }
    }

    // Get loans summary statistics
    async getLoansSummary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            // Get date range filters from query params if provided
            const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
            const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
            
            const summaryData = await this.loanService.getLoansSummary(startDate, endDate);
            return ApiResponse.success(res, 'Loan summary statistics retrieved successfully', summaryData);
        } catch (error) {
            next(error);
        }
    }

    // Get all loans with filtering
    async getAllLoans(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const filters = {
                page: req.query.page ? Number(req.query.page) : undefined,
                limit: req.query.limit ? Number(req.query.limit) : undefined,
                status: req.query.status as LoanStatus | LoanStatus[] | undefined,
                loanTypeId: req.query.loanTypeId as string | undefined,
                erpId: req.query.erpId as string | undefined,
                startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
                endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
                sortBy: req.query.sortBy as string | undefined,
                sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
                biodataId: req.query.biodataId as string | undefined,
                minAmount: req.query.minAmount ? Number(req.query.minAmount) : undefined,
                maxAmount: req.query.maxAmount ? Number(req.query.maxAmount) : undefined
            };

            const result = await this.loanService.getAllLoans(filters);
            return ApiResponse.success(res, 'Loans retrieved successfully', result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get enhanced loan summary with optional trends
     * GET /api/loans/summary/enhanced
     */
    async getEnhancedLoansSummary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { 
                startDate, 
                endDate, 
                includeTrends = 'false',
                includeMonthlyBreakdown = 'true'
            } = req.query;

            // Parse and validate date parameters
            let parsedStartDate: Date | undefined;
            let parsedEndDate: Date | undefined;

            if (startDate) {
                parsedStartDate = new Date(startDate as string);
                if (isNaN(parsedStartDate.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid start date format. Use ISO 8601 format (YYYY-MM-DD)'
                    });
                }
            }

            if (endDate) {
                parsedEndDate = new Date(endDate as string);
                if (isNaN(parsedEndDate.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid end date format. Use ISO 8601 format (YYYY-MM-DD)'
                    });
                }
            }

            // Validate date range
            if (parsedStartDate && parsedEndDate && parsedStartDate > parsedEndDate) {
                return res.status(400).json({
                    success: false,
                    message: 'Start date cannot be after end date'
                });
            }

            // Parse includeMonthlyBreakdown parameter
            const shouldIncludeMonthlyBreakdown = includeMonthlyBreakdown === 'true' || includeMonthlyBreakdown === '1';
            const shouldIncludeTrends = includeTrends === 'true' || includeTrends === '1';

            const summary = await this.loanService.getEnhancedLoansSummary(
                parsedStartDate,
                parsedEndDate,
                shouldIncludeTrends,
                shouldIncludeMonthlyBreakdown
            );

            return res.status(200).json({
                success: true,
                status: "success",
                message: 'Loan stats retrieved successfully',
                data: summary,
                code: 200
            });
        } catch (error) {
            logger.error('Error getting enhanced loan summary:', error);
            if (error instanceof ApiError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }
            next(error);
        }
    }
}

export default new LoanController();
