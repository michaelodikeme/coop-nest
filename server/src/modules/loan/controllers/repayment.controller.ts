import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../../types/express';
import { RepaymentService } from '../services/repayment.service';
import { BulkRepaymentService } from '../utils/bulk-repayment.util';
import { LoanRepaymentUploadService } from '../services/loan-repayment-upload.service';
import { ApiResponse } from '../../../utils/apiResponse';
import { ApiError } from '../../../utils/apiError';
import { repaymentSchema } from '../validations/repayment.validation';
import { LoanRepaymentData } from '../interfaces/repayment.interface';
import * as fs from 'fs/promises';

export class RepaymentController {
    private repaymentService: RepaymentService;
    
    constructor() {
        this.repaymentService = new RepaymentService();
    }
    
    async processRepayment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const validatedData = await repaymentSchema.parseAsync({
                ...req.body,
                uploadedBy: req.user.id
            }) as LoanRepaymentData;

            const result = await this.repaymentService.processLoanRepayment(validatedData);
            return ApiResponse.success(res, 'Repayment processed successfully', result);
        } catch (error) {
            next(error);
        }
    }
    
    async processBulkRepayments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            if (!req.file) {
                throw new ApiError('No file uploaded', 400);
            }

            // Log file details for debugging
            console.log('Uploaded file:', {
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                bufferExists: !!req.file.buffer,
                bufferLength: req.file.buffer ? req.file.buffer.length : 0
            });

            const result = await this.repaymentService.processBulkRepayments(
                req.file,
                req.user.id
            );

            return ApiResponse.success(res, 'Bulk repayment processed successfully', result);
        } catch (error) {
            next(error);
        }
    }

    async uploadBulkLoanRepayments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        let filePath: string | undefined;

        try {
            // 1. Validate file exists
            const file = req.file;
            if (!file) {
                throw new ApiError('No file uploaded', 400);
            }

            filePath = file.path;

            // 2. Get uploaded user ID from request
            const uploadedBy = req.user.id;

            // 3. Read file buffer
            const fileBuffer = await fs.readFile(file.path);

            if (!fileBuffer || fileBuffer.length === 0) {
                throw new ApiError('Failed to read file or file is empty', 400);
            }

            // 4. Route to appropriate processor based on file type
            let results;

            if (file.mimetype.includes('spreadsheet') || file.mimetype.includes('excel')) {
                results = await LoanRepaymentUploadService.processExcelFile(fileBuffer, uploadedBy);
            } else if (file.mimetype.includes('csv')) {
                results = await LoanRepaymentUploadService.processCsvFile(fileBuffer, uploadedBy);
            } else {
                throw new ApiError(
                    'Invalid file format. Only Excel (.xlsx, .xls) and CSV files are supported.',
                    400
                );
            }

            // 5. Return results
            return ApiResponse.success(
                res,
                `Loan repayments processed: ${results.totalSuccessful} successful, ${results.totalFailed} failed`,
                results
            );

        } catch (error) {
            next(error);
        } finally {
            // 6. Cleanup: Delete uploaded file
            if (filePath) {
                try {
                    await fs.unlink(filePath);
                } catch (cleanupError) {
                    console.error('Failed to delete uploaded file:', cleanupError);
                }
            }
        }
    }
    
    async downloadRepaymentTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { month, year } = req.query;
            
            try {
                // Using the XLSX method to get a buffer instead of a stream
                const buffer = await this.repaymentService.generateRepaymentTemplateXLSX(
                    month ? parseInt(month as string) : undefined,
                    year ? parseInt(year as string) : undefined
                );
                
                res.setHeader(
                    'Content-Type',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                );
                res.setHeader(
                    'Content-Disposition',
                    'attachment; filename=repayment_template.xlsx'
                );
                
                // Send the buffer directly instead of using a stream
                res.send(buffer);
            } catch (error: unknown) {
                const streamError = error as Error;
                console.error('Error generating Excel template:', streamError);
                throw new ApiError(
                    'Error generating repayment template: ' + (streamError.message || 'Unknown error'),
                    500
                );
            }
        } catch (error) {
            next(error);
        }
    }
    
    async downloadMonthlyRepaymentTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { month, year } = req.query;
            
            try {
                const buffer = await this.repaymentService.generateMonthlyRepaymentTemplateByType(
                    month ? parseInt(month as string) : undefined,
                    year ? parseInt(year as string) : undefined
                );
                
                const currentDate = new Date();
                const targetMonth = month ? parseInt(month as string) : currentDate.getMonth() + 1;
                const targetYear = year ? parseInt(year as string) : currentDate.getFullYear();
                
                res.setHeader(
                    'Content-Type',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                );
                res.setHeader(
                    'Content-Disposition',
                    `attachment; filename=monthly_repayment_${targetMonth}_${targetYear}.xlsx`
                );
                
                // Send the buffer directly
                res.send(buffer);
            } catch (error: unknown) {
                const streamError = error as Error;
                console.error('Error generating monthly template:', streamError);
                throw new ApiError(
                    'Error generating monthly repayment template: ' + (streamError.message || 'Unknown error'),
                    500
                );
            }
        } catch (error) {
            next(error);
        }
    }
    
    async getRepaymentHistory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { loanId } = req.params;
            const history = await this.repaymentService.getRepaymentHistory(loanId);
            return ApiResponse.success(res, 'Repayment history retrieved', history);
        } catch (error) {
            next(error);
        }
    }
    
    async getOutstandingLoans(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const loans = await this.repaymentService.getOutstandingLoans();
            return ApiResponse.success(res, 'Outstanding loans retrieved', loans);
        } catch (error) {
            next(error);
        }
    }
    
    async getMemberRepaymentHistory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { erpId } = req.params;
            const history = await this.repaymentService.getMemberRepaymentHistory(erpId);
            return ApiResponse.success(res, 'Member repayment history retrieved', history);
        } catch (error) {
            next(error);
        }
    }
    
    async getLoanAgingReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const report = await this.repaymentService.generateAgingReport();
            return ApiResponse.success(res, 'Loan aging report generated successfully', report);
        } catch (error) {
            next(error);
        }
    }
    
    async checkOverduePayments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const count = await this.repaymentService.checkAndUpdateOverduePayments();
            return ApiResponse.success(res, `Updated ${count} overdue payments`);
        } catch (error) {
            next(error);
        }
    }
    
    async getMonthlyRepaymentReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { month, year } = req.query;
            
            const currentDate = new Date();
            const targetMonth = month ? parseInt(month as string) : currentDate.getMonth() + 1;
            const targetYear = year ? parseInt(year as string) : currentDate.getFullYear();
            
            const report = await this.repaymentService.generateMonthlyRepaymentReport(
                targetMonth, 
                targetYear
            );
            
            return ApiResponse.success(
                res, 
                `Repayment report for ${targetMonth}/${targetYear} generated successfully`, 
                report
            );
        } catch (error) {
            next(error);
        }
    }
}

export default new RepaymentController();
