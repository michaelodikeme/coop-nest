import { Response, NextFunction } from 'express';
import { TransactionService } from '../services/transaction.service';
import { TransactionQueryService } from '../services/transaction-query.service';
import { TransactionReportingService } from '../services/transaction-reporting.service';
import { ApiResponse } from '../../../utils/apiResponse';
import logger from '../../../utils/logger';
import { AuthenticatedRequest } from '../../../types/express';
import { z } from 'zod';
import { isUUID } from 'validator';
import {
  createTransactionSchema,
  batchTransactionSchema,
  updateTransactionStatusSchema,
  reverseTransactionSchema,
  transactionQuerySchema,
  reportQuerySchema,
  transactionModuleSchema
} from '../validations/transaction.validation';

export class TransactionController {
  private transactionService: TransactionService;
  private queryService: TransactionQueryService;
  private reportingService: TransactionReportingService;
  
  constructor() {
    this.transactionService = new TransactionService();
    this.queryService = new TransactionQueryService();
    this.reportingService = new TransactionReportingService();
  }
  
  /**
   * Create a new transaction
   * @route POST /api/transactions
   * @access Admin, Treasurer, Chairman, Super_Admin
   */
  public createTransaction = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      
      // Validate with Zod - ApiError utility will handle any ZodError
      const transactionData = await createTransactionSchema.parseAsync({
        ...req.body,
        initiatedBy: userId
      });
      
      const transaction = await this.transactionService.createTransaction(transactionData);
      
      return ApiResponse.created(
        res, 
        'Transaction created successfully', 
        transaction
      );
    } catch (error) {
      logger.error('Transaction creation error:', error);
      next(error);
    }
  };
  
  /**
   * Create multiple transactions in batch
   * @route POST /api/transactions/batch
   * @access Admin, Treasurer, Chairman, Super_Admin
   */
  public createBatchTransactions = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      
      // Map transactions to include initiatedBy
      const modifiedBody = {
        ...req.body,
        transactions: Array.isArray(req.body.transactions) 
          ? req.body.transactions.map((tx: any) => ({
              ...tx,
              initiatedBy: userId
            }))
          : []
      };
      
      // Validate with Zod - ApiError utility will handle any ZodError
      const batchData = await batchTransactionSchema.parseAsync(modifiedBody);
      
      const result = await this.transactionService.createBatchTransactions(
        batchData.transactions,
        batchData.processAsUnit
      );
      
      return ApiResponse.created(
        res, 
        `Successfully created ${result.length} transactions`, 
        result
      );
    } catch (error) {
      logger.error('Batch transaction creation error:', error);
      next(error);
    }
  };
  
  /**
   * Get transaction by ID
   * @route GET /api/transactions/:id
   * @access Admin, Treasurer, Chairman, Super_Admin, Member (own transactions)
   */
  public getTransaction = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      
      // Validate UUID format
      if (!isUUID(id)) {
        return ApiResponse.badRequest(res, 'Invalid transaction ID format');
      }
      
      const transaction = await this.queryService.getTransactionById(id);
      
      // Handle permissions - members can only view their own transactions
      if (!req.user!.isAdmin && transaction?.initiatedBy !== req.user!.id) {
        return ApiResponse.forbidden(res, 'You do not have permission to view this transaction');
      }
      
      if (!transaction) {
        return ApiResponse.notFound(res, `Transaction with ID ${id} not found`);
      }
      
      return ApiResponse.success(
        res, 
        'Transaction retrieved successfully', 
        transaction
      );
    } catch (error) {
      logger.error(`Error getting transaction ${req.params.id}:`, error);
      next(error);
    }
  };
  
  /**
   * Update transaction status
   * @route PATCH /api/transactions/:id/status
   * @access Admin, Treasurer, Chairman, Super_Admin
   */
  public updateTransactionStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      
      // Validate UUID format
      if (!isUUID(id)) {
        return ApiResponse.badRequest(res, 'Invalid transaction ID format');
      }
      
      // Validate with Zod - ApiError utility will handle any ZodError
      const updateData = await updateTransactionStatusSchema.parseAsync({
        ...req.body,
        approvedBy: req.user!.id
      });
      
      const transaction = await this.transactionService.updateTransactionStatus(
        id, 
        updateData.status, 
        updateData.approvedBy,
        updateData.notes
      );
      
      return ApiResponse.success(
        res, 
        `Transaction status updated to ${updateData.status}`, 
        transaction
      );
    } catch (error) {
      logger.error(`Error updating transaction status ${req.params.id}:`, error);
      next(error);
    }
  };
  
  /**
   * Reverse a transaction
   * @route POST /api/transactions/:id/reverse
   * @access Admin, Treasurer, Chairman
   */
  public reverseTransaction = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      
      // Validate UUID format
      if (!isUUID(id)) {
        return ApiResponse.badRequest(res, 'Invalid transaction ID format');
      }
      
      // Validate with Zod - ApiError utility will handle any ZodError
      const reverseData = await reverseTransactionSchema.parseAsync(req.body);
      const userId = req.user!.id;
      
      const transaction = await this.transactionService.reverseTransaction(
        id, 
        reverseData.reason, 
        userId
      );
      
      return ApiResponse.success(
        res, 
        'Transaction successfully reversed', 
        transaction
      );
    } catch (error) {
      logger.error(`Error reversing transaction ${req.params.id}:`, error);
      next(error);
    }
  };
  
  /**
   * Search transactions with filters
   * @route GET /api/transactions/search
   * @access Admin, Treasurer, Chairman, Super_Admin
   */
  public searchTransactions = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Validate with Zod - ApiError utility will handle any ZodError
      const filters = await transactionQuerySchema.parseAsync(req.query);
      
      const transactions = await this.queryService.searchTransactions({
        ...filters,
        approvedBy: undefined,
        minAmount: undefined,
        maxAmount: undefined
      });
      
      return ApiResponse.success(
        res, 
        `Retrieved ${transactions.data.length} of ${transactions.total} transactions`, 
        transactions
      );
    } catch (error) {
      logger.error('Error searching transactions:', error);
      next(error);
    }
  };
  
  /**
   * Get transaction summary statistics
   * @route GET /api/transactions/summary
   * @access Admin, Treasurer, Chairman, Super_Admin
   */
  public getTransactionSummary = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Use reportQuerySchema for filter validation
      const filters = await reportQuerySchema.parseAsync({
        module: req.query.module,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        // Include format and groupBy from reportQuerySchema
        format: req.query.format,
        groupBy: req.query.groupBy
      });

      const summary = await this.reportingService.getTransactionSummary({
        ...filters,
        approvedBy: undefined,
        minAmount: undefined,
        maxAmount: undefined
      });
      
      return ApiResponse.success(
        res, 
        'Transaction summary retrieved successfully', 
        summary
      );
    } catch (error) {
      logger.error('Error getting transaction summary:', error);
      next(error);
    }
  };
  
  /**
   * Get transactions related to an entity
   * @route GET /api/transactions/entity/:entityType/:entityId
   * @access Admin, Treasurer, Chairman, Super_Admin, Member (own entities)
   */
  public getEntityTransactions = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { entityType, entityId } = req.params;
      
      // Validate entityType format
      if (!['SAVINGS', 'LOAN', 'SHARES', 'BIODATA'].includes(entityType)) {
        return ApiResponse.badRequest(res, 'Invalid entity type');
      }
      
      // Validate UUID format
      if (!isUUID(entityId)) {
        return ApiResponse.badRequest(res, 'Invalid entity ID format');
      }
      
      // Validate pagination params - ApiError utility will handle any ZodError
      const paginationParsed = await z.object({
        page: z.coerce.number().int().positive().optional().default(1),
        limit: z.coerce.number().int().positive().max(100).optional().default(20)
      }).parseAsync(req.query);

      const pagination = {
        page: paginationParsed.page || 1,
        limit: paginationParsed.limit || 20
      };

      // For member access control
      if (!req.user!.isAdmin) {
        // Check if this entity belongs to the current user
        const hasAccess = await this.queryService.userHasAccessToEntity(
          req.user!.id,
          entityType,
          entityId
        );

        if (!hasAccess) {
          return ApiResponse.forbidden(res, 'You do not have permission to view these transactions');
        }
      }

      const transactions = await this.queryService.getTransactionsByEntity(
        entityType,
        entityId,
        pagination
      );
      
      return ApiResponse.success(
        res, 
        `Retrieved ${transactions.data.length} transactions for ${entityType}`, 
        transactions
      );
    } catch (error) {
      logger.error(`Error getting entity transactions:`, error);
      next(error);
    }
  };
  
  /**
   * Generate transaction report
   * @route GET /api/transactions/reports
   * @access Admin, Treasurer, Chairman, Super_Admin
   */
  public generateReport = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Validate with Zod - ApiError utility will handle any ZodError
      const reportOptions = await reportQuerySchema.parseAsync(req.query);
      
      // Ensure required fields have default values if not present
      const reportFilters = {
        ...reportOptions,
        approvedBy: reportOptions.approvedBy || null,
        minAmount: reportOptions.minAmount || 0,
        maxAmount: reportOptions.maxAmount || Number.MAX_SAFE_INTEGER // Add default for required maxAmount
      };
      
      const report = await this.reportingService.generateTransactionReport(reportFilters);
      
      // If format is specified, generate downloadable file
      if (reportOptions.format && reportOptions.format !== 'json') {
        // In production, generate and send file for download
        return ApiResponse.success(
          res,
          `Report generated in ${reportOptions.format} format`,
          report
        );
      }
      
      return ApiResponse.success(
        res, 
        'Transaction report generated successfully', 
        report
      );
    } catch (error) {
      logger.error('Error generating report:', error);
      next(error);
    }
  };

  /**
   * Get user's transaction history
   * @route GET /api/transactions/user/:userId?
   * @access Admin (any user), Member (self only)
   */
  public getUserTransactions = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const requestedUserId = req.params.userId || req.user!.id;
      
      // Validate if the ID is a valid UUID
      
      if (!isUUID(requestedUserId)) {
        return ApiResponse.badRequest(res, 'Invalid user ID format');
      }
      
      // Members can only access their own transactions
      if (!req.user!.isAdmin && requestedUserId !== req.user!.id) {
        return ApiResponse.forbidden(res, 'You do not have permission to view these transactions');
      }
      
      // Validate pagination params - ApiError utility will handle any ZodError
      const paginationParsed = await z.object({
        page: z.coerce.number().int().positive().optional().default(1),
        limit: z.coerce.number().int().positive().max(100).optional().default(20)
      }).parseAsync(req.query);

      const pagination = {
        page: paginationParsed.page || 1,
        limit: paginationParsed.limit || 20
      };

      const transactions = await this.queryService.getTransactionsByUser(
        requestedUserId,
        pagination
      );
      
      return ApiResponse.success(
        res, 
        'User transactions retrieved successfully', 
        transactions
      );
    } catch (error) {
      logger.error('Error getting user transactions:', error);
      next(error);
    }
  };
  
  /**
   * Get transaction count by status
   * @route GET /api/transactions/counts
   * @access Admin, Treasurer, Chairman
   */
  public getTransactionCounts = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Simple validation for module parameter - ApiError utility will handle any ZodError
      const module = req.query.module 
        ? await transactionModuleSchema.parseAsync(req.query.module)
        : undefined;
      
      const counts = await this.queryService.getTransactionCountsByStatus(module);
      
      return ApiResponse.success(
        res,
        'Transaction counts retrieved successfully',
        counts
      );
    } catch (error) {
      logger.error('Error getting transaction counts:', error);
      next(error);
    }
  };

  /**
   * Get all transactions (admin only)
   * @route GET /api/transactions/all
   * @access Admin
   */
  public getAllTransactions = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Validate pagination params
      const pagination = await z.object({
        page: z.coerce.number().int().positive().optional().default(1),
        limit: z.coerce.number().int().positive().max(9000).optional().default(20)
      }).parseAsync(req.query);

      // Optionally support sorting
      const sort = typeof req.query.sort === 'string' ? req.query.sort : 'createdAt:desc';

      // Only admins can access all transactions
      if (!req.user?.isAdmin) {
        return ApiResponse.forbidden(res, 'You do not have permission to view all transactions');
      }

      const transactions = await this.queryService.getAllTransactions({
        ...pagination,
        sort,
      });

      return ApiResponse.success(
        res,
        `Retrieved ${transactions.data.length} of ${transactions.total} transactions`,
        transactions
      );
    } catch (error) {
      logger.error('Error getting all transactions:', error);
      next(error);
    }
  };
}

export default new TransactionController();
