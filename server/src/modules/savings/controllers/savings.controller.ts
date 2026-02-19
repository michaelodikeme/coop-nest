import { Request, Response, NextFunction } from 'express';
import { TransactionType } from '@prisma/client';
import { SavingsService } from '../services/savings.service';
import { SavingsUploadService } from '../services/upload.service';
import { SavingsBackupService } from '../services/backup.service';
import { generateSavingsStatementPdf } from '../services/pdf.service';
import { StatementService } from '../services/pdf/statement.service';
import { ApiResponse } from '../../../utils/apiResponse';
import { AuthenticatedRequest } from '../../../types/express';
import { createSavingsSchema, listSavingsQuerySchema, transactionQuerySchema, withdrawalRequestSchema, monthlySavingsParamsSchema } from '../validations/savings.validation';
import { ValidationError } from '../../../utils/apiError';
import path from 'path';
import fs from 'fs';
import { IMonthlySavingsInput, ISavingsStatementParams } from '../interfaces/savings.interface';

export class SavingsController {
  private savingsService: SavingsService;
  private statementService: StatementService;

  constructor() {
    this.savingsService = new SavingsService();
    this.statementService = new StatementService();
  }

  getAllSavings = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filter = listSavingsQuerySchema.parse(req.query);
      const result = await this.savingsService.getAllSavings(filter);
      ApiResponse.success(res, 'Savings records retrieved successfully', result);
    } catch (error) {
        next(error);
    }
  };

  createMonthlySavings = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedData = createSavingsSchema.parse(req.body) as IMonthlySavingsInput;
      const result = await this.savingsService.createMonthlySavings(validatedData);
      ApiResponse.success(res, 'Monthly savings entry created successfully', result);
    } catch (error) {
        next(error);
    }
  };

  getSavingsStatement = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const queryParams = monthlySavingsParamsSchema.parse({
        year: parseInt(req.query.year as string),
        month: parseInt(req.query.month as string),
        erpId: req.params.erpId,
      }) as ISavingsStatementParams;

      // Ensure user can only access their own data unless they're admin
      if (!req.user?.isAdmin && req.user?.erpId !== queryParams.erpId) {
        throw new Error('Unauthorized access');
      }

      const statement = await this.savingsService.getSavingsStatement(queryParams);
      ApiResponse.success(res, 'Savings statement retrieved successfully', statement);
    } catch (error) {
        next(error);
    }
  };
  
  uploadBulkSavings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let filePath: string | undefined;
    
    try {
      if (!req.file) {
        throw new Error('No file uploaded');
      }

      filePath = req.file.path;
      const fileBuffer = fs.readFileSync(filePath);
      const fileType = req.file.mimetype;

      let results;
      if (fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        results = await SavingsUploadService.processExcelFile(fileBuffer);
      } else if (fileType === 'text/csv') {
        results = await SavingsUploadService.processCsvFile(fileBuffer);
      } else {
        throw new Error('Invalid file type. Please upload an Excel (.xlsx) or CSV file');
      }

      // Clean up uploaded file
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      ApiResponse.success(res, 'Bulk savings upload completed', {
        totalSheets: results.totalSheets,
        totalProcessed: results.totalSuccessful + results.totalFailed,
        successful: results.totalSuccessful,
        failed: results.totalFailed,
        details: results.sheetResults.map(sheet => ({
          sheet: sheet.sheetName,
          processed: sheet.successful + sheet.failed,
          successful: sheet.successful,
          failed: sheet.failed,
          errors: sheet.errors
        }))
      });
    } catch (error) {
      // Ensure file cleanup on error
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      next(error);
    }
  };

  backupSavings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filepath = await SavingsBackupService.exportSavingsToExcel();
      res.download(filepath, path.basename(filepath), (err) => {
        if (err) {
          next(err);
        }
        fs.unlink(filepath, (unlinkErr) => {
          if (unlinkErr) console.error('Error deleting backup file:', unlinkErr);
        });
      });
    } catch (error) {
      next(error);
    }
  };

  getMemberSavings = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const biodataId = req.user?.biodataId;
      
      if (!biodataId) {
        throw new Error('User biodata not found. Please complete your profile.');
      }

      const { year, month, page, limit } = req.query;

      const queryParams = {
        year: year ? parseInt(year as string) : undefined,
        month: month ? parseInt(month as string) : undefined,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined
      };

      const savings = await this.savingsService.getMemberSavings(biodataId, queryParams);
      ApiResponse.success(res, 'Member savings retrieved successfully', savings);
    } catch (error) {
      next(error);
    }
  };

  getSavingsSummary = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const biodataId = req.user?.biodataId;
      if (!biodataId) {
        throw new Error('User biodata not found');
      }

      const summary = await this.savingsService.getSavingsSummary(biodataId);
      ApiResponse.success(res, 'Savings summary retrieved successfully', summary);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get aggregated savings summary for all members with pagination
   * GET /api/savings/members-summary
   */
  getMembersSummary = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { 
        page, 
        limit, 
        search,
        department,
        sortBy,
        sortOrder,
        status
      } = req.query;

      const params = {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        search: search as string,
        department: department as string,
        sortBy: sortBy as string,
        sortOrder: (sortOrder as 'asc' | 'desc'),
        status: status as any
      };

      const membersSummary = await this.savingsService.getMembersSummary(params);
      ApiResponse.success(res, 'Members savings summary retrieved successfully', membersSummary);
    } catch (error) {
      next(error);
    }
  };

  getTransactionHistory = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit, startDate, endDate, type } = req.query;
      
      const biodataId = req.user?.isAdmin && req.query.biodataId 
        ? (req.query.biodataId as string) 
        : req.user?.biodataId ?? undefined;

      if (!biodataId && !req.user?.isAdmin) {
        throw new Error('User biodata not found');
      }

      const params = {
        biodataId,
        savingsId: req.params.savingsId,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        type: type as TransactionType | undefined
      };

      const transactions = await this.savingsService.getTransactionHistory(params);
      ApiResponse.success(res, 'Transaction history retrieved successfully', transactions);
    } catch (error) {
      next(error);
    }
  };

  getAdminOverview = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const overview = await this.savingsService.getAdminOverview();
      ApiResponse.success(res, 'Admin savings overview retrieved successfully', overview);
    } catch (error) {
      next(error);
    }
  };

  getSavingsStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { year } = req.params;
      
      const biodataId = req.user?.isAdmin && req.query.biodataId 
        ? (req.query.biodataId as string) 
        : req.user?.biodataId ?? undefined;

      if (!year || isNaN(parseInt(year))) {
        throw new Error('Year is required and must be a number');
      }

      const stats = await this.savingsService.getSavingsStats(parseInt(year), biodataId);
      ApiResponse.success(res, 'Savings stats retrieved successfully', stats);
    } catch (error) {
      next(error);
    }
  };

  getMonthlySavings = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { year, month } = req.params;
      
      const biodataId = req.user?.isAdmin && req.query.biodataId 
        ? (req.query.biodataId as string) 
        : req.user?.biodataId || undefined;

      const savings = await this.savingsService.getMonthlySavings(
        parseInt(year),
        parseInt(month),
        biodataId
      );
      
      ApiResponse.success(res, 'Monthly savings retrieved successfully', savings);
    } catch (error) {
      next(error);
    }
  };

  downloadSavingsStatement = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { erpId } = req.params;
      const { startDate, endDate } = req.query;
      
      if (!req.user?.isAdmin && req.user?.erpId !== erpId) {
        throw new Error('Unauthorized access');
      }

      const statement = await this.savingsService.getSavingsStatement({ erpId, year: new Date().getFullYear(), month: new Date().getMonth() + 1 });
      const dateRange = startDate && endDate ? { startDate: startDate as string, endDate: endDate as string } : undefined;
      
      const pdfPath = await this.statementService.generateStatement(statement, dateRange);
      
      res.download(pdfPath, `savings_statement_${erpId}.pdf`, (err) => {
        if (fs.existsSync(pdfPath)) {
          fs.unlinkSync(pdfPath);
        }
        
        if (err) {
          next(err);
        }
      });
    } catch (error) {
      next(error);
    }
  };
}

