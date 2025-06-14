import { PrismaClient, PaymentStatus, UploadStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { ApiError } from '../../../utils/apiError';
import { LoanNotificationService } from '../services/notification.service';
import * as Excel from 'exceljs';
import { RepaymentEntryInput } from '../validations/repayment.validation';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface RepaymentError {
  row: number;
  erpId: string;
  error: string;
}

export class BulkRepaymentService {
  /**
   * Process bulk repayment upload file
   */
  static async processBulkUpload(
    file: Express.Multer.File,
    uploadedBy: string
  ) {
    // Save file to storage first
    const storagePath = await this.saveFileToStorage(file);
    
    const workbook = new Excel.Workbook();
    // Load from storage instead of buffer
    await workbook.xlsx.readFile(storagePath);
    
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      throw new ApiError('Invalid worksheet', 400);
    }

    const errors: RepaymentError[] = [];
    const validRepayments: RepaymentEntryInput[] = [];
    let totalAmount = new Decimal(0);
    
    // Create upload record
    const upload = await prisma.bulkRepaymentUpload.create({
      data: {
        uploadedBy,
        fileName: file.originalname,
        totalAmount: new Decimal(0),
        totalCount: 0,
        status: UploadStatus.PROCESSING
      }
    });

    try {
      // Process each row
      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header

        try {
          const repayment: RepaymentEntryInput = {
            loanId: '', // This will be set later when processing the repayment
            erpId: row.getCell(1).value?.toString() || '',
            repaymentMonth: parseInt(row.getCell(3).value?.toString() || ''),
            repaymentYear: parseInt(row.getCell(4).value?.toString() || ''),
            uploadedAmount: new Decimal(row.getCell(5).value?.toString() || '0'),
            uploadedBy: uploadedBy,
            description: row.getCell(6).value?.toString()
          };

          // Validate repayment data
          if (!repayment.erpId.match(/^ERP\d+$/)) {
            throw new Error('Invalid ERP ID format');
          }
          if (repayment.repaymentMonth < 1 || repayment.repaymentMonth > 12) {
            throw new Error('Invalid month');
          }
          if (repayment.repaymentYear < 2020 || repayment.repaymentYear > new Date().getFullYear() + 1) {
            throw new Error('Invalid year');
          }
          if (repayment.uploadedAmount.isNaN() || repayment.uploadedAmount.lte(0)) {
            throw new Error('Invalid amount');
          }

          validRepayments.push(repayment);
          totalAmount = totalAmount.add(repayment.uploadedAmount);

        } catch (error: any) {
          errors.push({
            row: rowNumber,
            erpId: row.getCell(1).value?.toString() || 'Unknown',
            error: error.message
          });
        }
      });

      // Process valid repayments in batches
      const batchSize = 50;
      for (let i = 0; i < validRepayments.length; i += batchSize) {
        const batch = validRepayments.slice(i, i + batchSize);
        await Promise.all(
          batch.map(repayment => 
            this.processRepaymentEntry(repayment, upload.id, uploadedBy)
          )
        );
      }

      // Update upload record with final status
      await prisma.bulkRepaymentUpload.update({
        where: { id: upload.id },
        data: {
          totalAmount,
          totalCount: validRepayments.length + errors.length,
          errorCount: errors.length,
          successCount: validRepayments.length,
          errorDetails: JSON.parse(JSON.stringify(errors)),
          status: errors.length === 0 ? UploadStatus.COMPLETED : UploadStatus.PARTIALLY_COMPLETED
        }
      });

      // Notify admin of processing results
      if (errors.length > 0) {
        await LoanNotificationService.notifyBulkUploadFailure(
          upload.id,
          uploadedBy,
          errors.length,
          errors
        );
      }

      return {
        uploadId: upload.id,
        totalProcessed: validRepayments.length,
        errorCount: errors.length,
        totalAmount: totalAmount.toString(),
        errors
      };

    } catch (error) {
      // Mark upload as failed if there's an error during processing
      await prisma.bulkRepaymentUpload.update({
        where: { id: upload.id },
        data: {
          status: UploadStatus.FAILED,
          errorDetails: [{
            error: error instanceof Error ? error.message : 'Unknown error during processing'
          }]
        }
      });
      throw error;
    }
  }

  private static async saveFileToStorage(file: Express.Multer.File): Promise<string> {
    const storagePath = path.join(process.env.UPLOAD_DIR || 'uploads', `${Date.now()}-${file.originalname}`);
    await fs.promises.writeFile(storagePath, file.buffer);
    return storagePath;
  }

  /**
   * Process individual repayment entry
   */
  private static async processRepaymentEntry(
    repayment: RepaymentEntryInput,
    uploadBatchId: string,
    uploadedBy: string
  ) {
    return await prisma.$transaction(async (tx) => {
      // Get active loan for member with its payment schedules
      const loan = await tx.loan.findFirst({
        where: {
          erpId: repayment.erpId,
          status: 'ACTIVE'
        },
        include: {
          paymentSchedules: {
            where: {
              status: {
                in: ['PENDING', 'PARTIAL']
              }
            },
            orderBy: {
              dueDate: 'asc'
            }
          }
        }
      });

      if (!loan) {
        throw new ApiError(`No active loan found for ERP ID: ${repayment.erpId}`, 400);
      }

      // Check for existing repayment
      const existingRepayment = await tx.loanRepayment.findUnique({
        where: {
          loanId_repaymentMonth_repaymentYear: {
            loanId: loan.id,
            repaymentMonth: repayment.repaymentMonth,
            repaymentYear: repayment.repaymentYear
          }
        }
      });

      if (existingRepayment) {
        throw new ApiError(
          `Repayment for ${repayment.repaymentMonth}/${repayment.repaymentYear} already exists for ERP ID: ${repayment.erpId}`,
          400
        );
      }

      // Find matching schedule entry
      const scheduleEntry = loan.paymentSchedules.find(schedule => {
        const scheduleDate = new Date(schedule.dueDate);
        return scheduleDate.getMonth() + 1 === repayment.repaymentMonth &&
               scheduleDate.getFullYear() === repayment.repaymentYear;
      });

      if (!scheduleEntry) {
        throw new ApiError(
          `No matching payment schedule found for ${repayment.repaymentMonth}/${repayment.repaymentYear}`,
          400
        );
      }

      const amount = new Decimal(repayment.uploadedAmount);
      
      // Create repayment record
      const repaymentRecord = await tx.loanRepayment.create({
        data: {
          loanId: loan.id,
          amount,
          repaymentDate: new Date(),
          uploadedBy,
          uploadBatchId,
          repaymentMonth: repayment.repaymentMonth,
          repaymentYear: repayment.repaymentYear,
          scheduleId: scheduleEntry.id
        }
      });

      // Update schedule entry
      const newPaidAmount = scheduleEntry.paidAmount.add(amount);
      const isFullyPaid = newPaidAmount.gte(scheduleEntry.expectedAmount);
      
      await tx.loanSchedule.update({
        where: { id: scheduleEntry.id },
        data: {
          paidAmount: newPaidAmount,
          status: isFullyPaid ? PaymentStatus.PAID : PaymentStatus.PARTIAL,
          actualPaymentDate: new Date()
        }
      });

      // Update loan totals
      const newPaidTotal = loan.paidAmount.add(amount);
      const newBalance = loan.totalAmount.sub(newPaidTotal);
      const isLoanCompleted = newBalance.lte(0);

      await tx.loan.update({
        where: { id: loan.id },
        data: {
          paidAmount: newPaidTotal,
          remainingBalance: newBalance,
          lastPaymentDate: new Date(),
          status: isLoanCompleted ? 'COMPLETED' : 'ACTIVE'
        }
      });

      // Send notification
      await LoanNotificationService.notifyRepaymentProcessed(
        loan.id,
        loan.memberId,
        amount.toNumber(),
        newBalance.toNumber()
      );

      return repaymentRecord;
    });
  }

  /**
   * Get bulk upload status and details
   */
  static async getBulkUploadStatus(uploadId: string) {
    const upload = await prisma.bulkRepaymentUpload.findUnique({
      where: { id: uploadId },
      include: {
        repayments: {
          include: {
            loan: true
          }
        }
      }
    });

    if (!upload) {
      throw new ApiError('Upload not found', 404);
    }

    return upload;
  }

  /**
   * List bulk uploads with pagination
   */
  static async listBulkUploads(page: number = 1, limit: number = 10) {
    const [total, uploads] = await Promise.all([
      prisma.bulkRepaymentUpload.count(),
      prisma.bulkRepaymentUpload.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          uploadDate: 'desc'
        },
        include: {
          uploader: {
            select: {
              username: true
            }
          }
        }
      })
    ]);

    return {
      data: uploads,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    };
  }
}
