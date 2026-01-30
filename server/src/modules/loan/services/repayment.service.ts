import { determineBaseType } from '../../transaction/utils/transaction.utils';
import { PrismaClient, Loan, LoanStatus, TransactionType, PaymentStatus, UploadStatus, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import * as XLSX from 'xlsx'; // Add this import
import { ApiError } from '../../../utils/apiError';
import logger from '../../../utils/logger';
import { 
    LoanRepaymentData, 
    RepaymentResult, 
    RepaymentValidationResult,
    MonthlyRepaymentSummary, 
    LoanTypeSummary 
} from '../interfaces/repayment.interface';
import { prisma } from '../../../utils/prisma';

// Add total row
interface Schedule {
    paidAmount?: Decimal;
}


interface Schedule {
    status: 'PARTIAL' | 'PENDING';
}

interface MonthlyReport {
    totalDue: number;
    totalAmount: string;
    schedules: Schedule[];
}

interface LoanSchedule {
    loan: {
        loanType: {
            name: string;
        };
    };
    paidAmount?: Decimal;
    status: string;
}

// Define row type
interface RepaymentRow {
    'ERP_ID*'?: string;
    'LOAN_ID*'?: string;
    'SCHEDULE_ID*'?: string;
    'PAYMENT_MONTH*'?: number;
    'PAYMENT_YEAR*'?: number;
    'PAYMENT_AMOUNT*'?: number | string;
    'PAYMENT_DATE*'?: string | number;
}

export class RepaymentService {
    
    constructor() {
        
    }
    
    async processLoanRepayment(repaymentData: LoanRepaymentData): Promise<RepaymentResult> {
        // Process in transaction
        return await prisma.$transaction(async (tx) => {
            return await this.processLoanRepaymentInTransaction(tx, repaymentData);
        });
    }

    // FIX #6: Internal method that accepts transaction for bulk processing
    private async processLoanRepaymentInTransaction(tx: any, repaymentData: LoanRepaymentData): Promise<RepaymentResult> {
        // 1. Find and validate loan
        const loan = await this.findAndValidateLoan(tx, repaymentData);

        // 2. Find matching schedule if scheduleId provided
        let targetSchedule = null;
        if (repaymentData.scheduleId) {
            targetSchedule = await this.findScheduleById(tx, repaymentData.scheduleId, loan.id);
        } else {
            // Find by month/year if no scheduleId
            targetSchedule = await this.findScheduleByDate(
                tx,
                loan.id,
                repaymentData.repaymentMonth,
                repaymentData.repaymentYear
            );
        }

        // 3. Create repayment record
        const repayment = await tx.loanRepayment.create({
            data: {
                loanId: loan.id,
                scheduleId: targetSchedule?.id,
                amount: repaymentData.uploadedAmount,
                repaymentDate: repaymentData.repaymentDate || new Date(),
                uploadedDate: new Date(),
                repaymentMonth: repaymentData.repaymentMonth,
                repaymentYear: repaymentData.repaymentYear,
                uploadedBy: repaymentData.uploadedBy,
                uploadBatchId: repaymentData.uploadBatchId,
                isReconciled: !!targetSchedule // Mark as reconciled if matched to schedule
            }
        });

        // 4. Update payment schedules (can distribute across multiple schedules)
        const schedules = loan.paymentSchedules.sort((a: { dueDate: Date }, b: { dueDate: Date }) =>
            a.dueDate.getTime() - b.dueDate.getTime()
        );

        let remainingPayment = repaymentData.uploadedAmount;
        await this.updateSchedules(tx, schedules, remainingPayment);

        // 5. Update loan status and balances
        const updatedLoan = await this.updateLoanStatus(tx, loan, repaymentData.uploadedAmount);

        // 6. Create transaction record
        await this.createTransactionRecord(
            tx,
            loan.id,
            repaymentData.uploadedAmount,
            updatedLoan.remainingBalance,
            repaymentData.uploadedBy
        );

        // 7. Return success result
        return this.buildSuccessResult(repayment, updatedLoan);
    }

// Helper methods for loan repayment processing
private async findAndValidateLoan(tx: any, data: LoanRepaymentData) {
    const loan = await tx.loan.findUnique({
        where: { 
            id: data.loanId,
            erpId: data.erpId
        },
        include: {
            repayments: true,
            paymentSchedules: {
                orderBy: { dueDate: 'asc' }
            },
            loanType: true
        }
    });
    
    if (!loan) {
        throw new ApiError('Loan not found or ERP ID mismatch', 404);
    }
    
    if (loan.status === 'COMPLETED') {
        throw new ApiError('Loan is already fully paid', 400);
    }
    
    if (!['ACTIVE', 'DISBURSED'].includes(loan.status)) {
        throw new ApiError(`Cannot process repayment for loan in ${loan.status} status`, 400);
    }
    
    return loan;
}

// FIX #4: Enhanced overpayment handling with proper detection and warning
private async updateSchedules(tx: any, schedules: any[], remainingPayment: Decimal) {
    for (const schedule of schedules) {
        if (schedule.status === 'PAID' || remainingPayment.lte(0)) continue;

        const scheduledAmount = schedule.expectedAmount;
        const previouslyPaid = schedule.paidAmount || new Decimal(0);
        const remaining = scheduledAmount.sub(previouslyPaid);

        if (remaining.gt(0)) {
            const paymentForThisSchedule = Decimal.min(remaining, remainingPayment);
            const newPaidAmount = previouslyPaid.add(paymentForThisSchedule);
            // FIX #8: Use tolerance for Decimal comparison
            const tolerance = new Decimal('0.01');
            const isFullyPaid = newPaidAmount.greaterThanOrEqualTo(scheduledAmount.sub(tolerance));

            // Update schedule
            await tx.loanSchedule.update({
                where: { id: schedule.id },
                data: {
                    paidAmount: newPaidAmount,
                    status: isFullyPaid ? 'PAID' : 'PARTIAL',
                    actualPaymentDate: new Date()
                }
            });

            remainingPayment = remainingPayment.sub(paymentForThisSchedule);
        }
    }

    // FIX #4: Check for overpayment and throw error if detected
    if (remainingPayment.gt(new Decimal('0.01'))) {
        throw new ApiError(
            `Overpayment detected: ₦${remainingPayment.toFixed(2)} exceeds all outstanding schedules. ` +
            `Please adjust the payment amount or contact administrator.`,
            400
        );
    }

    return remainingPayment;
}

async getRepaymentHistory(loanId: string) {
    if (!loanId) {
        throw new ApiError('Loan ID is required', 400);
    }
    
    const loan = await prisma.loan.findUnique({
        where: { id: loanId },
        include: {
            repayments: {
                orderBy: { repaymentDate: 'desc' }
            },
            paymentSchedules: {
                orderBy: { dueDate: 'asc' }
            }
        }
    });
    
    if (!loan) {
        throw new ApiError('Loan not found', 404);
    }
    
    return {
        loanId: loan.id,
        totalAmount: loan.totalAmount,
        paidAmount: loan.paidAmount,
        remainingBalance: loan.remainingBalance,
        status: loan.status,
        schedules: loan.paymentSchedules,
        repayments: loan.repayments
    };
}

async getOutstandingLoans() {
    return await prisma.loan.findMany({
        where: {
            status: {
                in: ['ACTIVE', 'DISBURSED']
            },
            remainingBalance: {
                gt: 0
            }
        },
        include: {
            member: true,
            loanType: true,
            paymentSchedules: {
                where: {
                    status: {
                        in: ['PENDING', 'PARTIAL', 'OVERDUE']
                    }
                }
            }
        }
    });
}

async getMemberRepaymentHistory(erpId: string) {
    const loans = await prisma.loan.findMany({
        where: {
            erpId,
            status: {
                in: ['ACTIVE', 'COMPLETED', 'DISBURSED']
            }
        },
        include: {
            repayments: {
                orderBy: {
                    repaymentDate: 'desc'
                }
            },
            loanType: true
        }
    });
    
    return loans;
}

// FIX #6: Refactored bulk repayment to use single transaction
async processBulkRepayments(file: Express.Multer.File, uploadedBy: string): Promise<any> {
    // Validate file
    if (!file || !file.buffer || file.buffer.length === 0) {
        throw new ApiError('Invalid or empty file uploaded', 400);
    }

    // Create batch upload record OUTSIDE transaction (to preserve even if transaction fails)
    const batchUpload = await prisma.bulkRepaymentUpload.create({
        data: {
            uploadedBy,
            fileName: file.originalname,
            totalAmount: new Decimal(0), // Will update after processing
            totalCount: 0,
            status: 'PROCESSING'
        }
    });

    let workbook;
    try {
        // Read Excel file
        workbook = XLSX.read(file.buffer, { type: 'buffer' });
    } catch (error) {
        console.error("Error reading Excel file:", error);

        // Update batch status to failed
        await this.updateBatchStatus(
            batchUpload.id,
            'FAILED',
            `Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`,
            undefined, 0, 0, 1,
            [{ rowNumber: 0, erpId: 'N/A', loanId: 'N/A', error: 'Invalid Excel file format', sheet: 'N/A' }]
        );

        throw new ApiError('Could not read the uploaded Excel file. Please ensure it is a valid Excel file.', 400);
    }

    // FIX #6: Process ALL repayments in a SINGLE transaction for data consistency
    return await prisma.$transaction(async (tx) => {
        const results = {
            successful: Array<{
                rowNumber: number;
                erpId: string;
                loanId: string;
                amount: string;
                sheet: string;
            }>(),
            failed: Array<{
                rowNumber: number;
                erpId: string;
                loanId: string;
                error: string;
                sheet: string;
            }>(),
            totalProcessed: 0,
            totalAmount: new Decimal(0),
            byLoanType: {} as Record<string, {
                processed: number;
                amount: Decimal;
                failed: number;
            }>
        };
        
        // Get all sheet names except 'Instructions' and 'Summary'
        const sheetNames = workbook.SheetNames.filter(
            name => !['Instructions', 'Summary'].includes(name)
        );
        
        // Process each sheet
        for (const sheetName of sheetNames) {
            // Initialize loan type stats if not exists
            if (!results.byLoanType[sheetName]) {
                results.byLoanType[sheetName] = {
                    processed: 0,
                    amount: new Decimal(0),
                    failed: 0
                };
            }
            
            const sheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(sheet);
            
            // Process each row in the sheet
            for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
                const row = rows[rowIndex] as any;
                const rowNumber = rowIndex + 2; // +2 to account for header and 0-indexing
                
                // Skip rows without ERP_ID or PAID_AMOUNT
                if (!row['ERP_ID'] || !row['PAID_AMOUNT']) continue;
                
                try {
                    // Extract data from row
                    const repaymentData = {
                        erpId: row['ERP_ID'].toString(),
                        loanId: row['LOAN_ID'].toString(),
                        scheduleId: row['SCHEDULE_ID']?.toString(),
                        repaymentMonth: Number(row['MONTH'] || new Date().getMonth() + 1),
                        repaymentYear: Number(row['YEAR'] || new Date().getFullYear()),
                        uploadedAmount: new Decimal(row['PAID_AMOUNT'].toString()),
                        uploadedBy,
                        uploadBatchId: batchUpload.id,
                        repaymentDate: this.parseExcelDate(row['PAYMENT_DATE']) || new Date()
                    };
                    
                    // Only process if there's an amount
                    if (repaymentData.uploadedAmount.gt(0)) {
                        // Validate data before processing
                        await this.validateRepaymentData(tx, repaymentData);

                        // FIX #6: Use internal method to avoid nested transactions
                        const result = await this.processLoanRepaymentInTransaction(tx, repaymentData);

                        // Track successful repayments
                        results.successful.push({
                            rowNumber,
                            erpId: repaymentData.erpId,
                            loanId: repaymentData.loanId,
                            amount: repaymentData.uploadedAmount.toString(),
                            sheet: sheetName
                        });

                        results.totalAmount = results.totalAmount.add(repaymentData.uploadedAmount);
                        results.totalProcessed++;

                        // Update loan type stats
                        results.byLoanType[sheetName].processed++;
                        results.byLoanType[sheetName].amount =
                            results.byLoanType[sheetName].amount.add(repaymentData.uploadedAmount);
                    }
                } catch (error) {
                    // Track failed repayments
                    results.failed.push({
                        rowNumber,
                        erpId: row['ERP_ID']?.toString() || 'Unknown',
                        loanId: row['LOAN_ID']?.toString() || 'Unknown',
                        error: error instanceof Error ? error.message : 'Unknown error',
                        sheet: sheetName
                    });
                    
                    // Update loan type stats
                    results.byLoanType[sheetName].failed++;
                }
            }
        }
        
        // Update batch status
        const status = results.failed.length === 0 ? 
            'COMPLETED' : 
            (results.successful.length > 0 ? 'PARTIALLY_COMPLETED' : 'FAILED');
        
        await this.updateBatchStatus(
            batchUpload.id, 
            status, 
            `Processed ${results.totalProcessed} repayments`,
            results.totalAmount,
            results.totalProcessed,
            results.successful.length,
            results.failed.length,
            results.failed
        );
        
        // Prepare summary by loan type
        const loanTypeSummary = Object.entries(results.byLoanType).map(([loanType, stats]) => ({
            loanType,
            processed: stats.processed,
            amount: stats.amount.toString(),
            failed: stats.failed
        }));
        
        return {
            batchId: batchUpload.id,
            status,
            successful: results.successful,
            failed: results.failed,
            totalProcessed: results.totalProcessed,
            totalAmount: results.totalAmount.toString(),
            byLoanType: loanTypeSummary
        };
    });
}

// Add the new method to extract data from JSON row
private extractRepaymentDataFromJson(row: any, uploadedBy: string, batchId: string): LoanRepaymentData {
    const erpId = row['ERP_ID*']?.toString();
    const loanId = row['LOAN_ID*']?.toString();
    const scheduleId = row['SCHEDULE_ID*']?.toString();
    const month = Number(row['PAYMENT_MONTH*']);
    const year = Number(row['PAYMENT_YEAR*']);
    const amount = row['PAYMENT_AMOUNT*']?.toString();
    const paymentDate = this.parseExcelDate(row['PAYMENT_DATE*']);
    
    if (!erpId || !loanId || !amount || isNaN(month) || isNaN(year)) {
        throw new ApiError('Missing required fields in row', 400);
    }
    
    return {
        erpId,
        loanId,
        scheduleId,
        repaymentMonth: month,
        repaymentYear: year,
        uploadedAmount: new Decimal(amount),
        uploadedBy,
        uploadBatchId: batchId,
        repaymentDate: paymentDate || new Date()
    };
}

// Add helper method to parse Excel dates
private parseExcelDate(excelDate: any): Date | null {
    if (!excelDate) return null;
    
    // If it's already a Date object
    if (excelDate instanceof Date) return excelDate;
    
    // If it's a string in a common date format
    if (typeof excelDate === 'string') {
        const date = new Date(excelDate);
        return isNaN(date.getTime()) ? null : date;
    }
    
    // If it's a number (Excel serialized date)
    if (typeof excelDate === 'number') {
        // Excel date serial numbers are days since 1/1/1900 (or 1/1/1904 on Mac)
        // Excel has a bug where it thinks 1900 was a leap year, so adjust for dates after 2/28/1900
        const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
        return date;
    }
    
    return null;
}

async getDueRepaymentsForMonth(month: number, year: number) {
    // Get all due repayments for the specified month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    console.log(`Fetching repayments for period: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    const schedules = await prisma.loanSchedule.findMany({
        where: {
            status: {
                in: ['PENDING', 'PARTIAL']
            },
            dueDate: {
                gte: startDate,
                lte: endDate
            },
            loan: {
                status: {
                    in: ['ACTIVE', 'DISBURSED']
                }
            }
        },
        include: {
            loan: {
                include: {
                    member: {
                        select: {
                            id: true,
                            erpId: true,
                            fullName: true,
                            department: true
                        }
                    },
                    loanType: true
                }
            }
        },
        orderBy: {
            dueDate: 'asc'
        }
    });
    
    console.log(`Found ${schedules.length} due repayments for ${month}/${year}`);
    return schedules;
}

async generateMonthlyRepaymentReport(month: number, year: number) {
    // Get all schedules for the month
    const schedules = await this.getDueRepaymentsForMonth(month, year);
    
    // Group by loan type
    type ScheduleType = Awaited<ReturnType<typeof this.getDueRepaymentsForMonth>>[0];
    const byLoanType = schedules.reduce<Record<string, ScheduleType[]>>((acc, schedule) => {
        const loanTypeName = schedule.loan.loanType.name;
        if (!acc[loanTypeName]) {
            acc[loanTypeName] = [];
        }
        acc[loanTypeName].push(schedule);
        return acc;
    }, {});
    
    // Summarize by loan type
    const summary = Object.entries(byLoanType).map(([loanType, schedules]) => {
        const totalExpected = schedules.reduce(
            (sum: Decimal, s: ScheduleType) => sum.add(s.expectedAmount), 
            new Decimal(0)
        );
        
        return {
            loanType,
            count: schedules.length,
            totalExpected: totalExpected.toString()
        };
    });
    
    return {
        month,
        year,
        totalDue: schedules.length,
        totalAmount: schedules.reduce(
            (sum: Decimal, s: ScheduleType) => sum.add(s.expectedAmount), 
            new Decimal(0)
        ).toString(),
        byLoanType: summary,
        schedules
    };
}

// Complete the findScheduleById and findScheduleByDate methods
private async findScheduleById(tx: any, scheduleId: string, loanId: string) {
    if (!scheduleId) return null;
    
    const schedule = await tx.loanSchedule.findFirst({
        where: {
            id: scheduleId,
            loanId: loanId
        }
    });
    
    if (!schedule) {
        throw new ApiError(`Schedule with ID ${scheduleId} not found for this loan`, 404);
    }
    
    return schedule;
}

private async findScheduleByDate(tx: any, loanId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const schedule = await tx.loanSchedule.findFirst({
        where: {
            loanId,
            dueDate: {
                gte: startDate,
                lte: endDate
            },
            status: {
                in: ['PENDING', 'PARTIAL']
            }
        },
        orderBy: {
            dueDate: 'asc'
        }
    });
    
    return schedule; // Can be null if no matching schedule
}

// Add missing updateLoanStatus method
private async updateLoanStatus(tx: any, loan: any, paymentAmount: Decimal) {
    // Calculate new balances
    const newPaidAmount = loan.paidAmount.add(paymentAmount);
    const newRemainingBalance = loan.totalAmount.sub(newPaidAmount);
    
    // Determine if loan is now fully paid
    const isFullyPaid = newRemainingBalance.lte(0);
    
    // Set the new status if needed
    let newStatus = loan.status as LoanStatus;
    if (isFullyPaid && loan.status !== LoanStatus.COMPLETED) {
        newStatus = LoanStatus.COMPLETED;
    } else if (loan.status === LoanStatus.DISBURSED && !isFullyPaid) {
        newStatus = LoanStatus.ACTIVE;
    }
    
    // Update loan record
    const updatedLoan = await tx.loan.update({
        where: { id: loan.id },
        data: {
            paidAmount: newPaidAmount,
            remainingBalance: newRemainingBalance,
            status: newStatus,
            lastPaymentDate: new Date(),
            completedAt: isFullyPaid ? new Date() : null,
            // Update loan status history if status changed
            ...(newStatus !== loan.status && {
                statusHistory: {
                    create: {
                        fromStatus: loan.status,
                        toStatus: newStatus,
                        changedBy: 'SYSTEM', // Using SYSTEM as this is automated
                        reason: 'Automated status update from loan repayment'
                    }
                }
            })
        }
    });
    
    // If loan was just completed, create a notification
    if (isFullyPaid && loan.status !== LoanStatus.COMPLETED) {
        try {
            // Get user ID from loan member
            const member = await tx.biodata.findUnique({
                where: { id: loan.memberId },
                include: { users: true }
            });
            
            if (member?.users?.[0]) {
                await tx.notification.create({
                    data: {
                        userId: member.users[0].id,
                        type: 'REQUEST_UPDATE',
                        title: 'Loan Fully Repaid',
                        message: `Your loan (${loan.erpId}) has been fully repaid. Congratulations!`,
                        priority: 'NORMAL',
                        metadata: {
                            loanId: loan.id,
                            loanType: loan.loanType.name,
                            totalAmount: loan.totalAmount.toString()
                        }
                    }
                });
            }
        } catch (error) {
            // Log but don't fail the transaction
            logger.error('Failed to create loan completion notification:', error);
        }
    }
    
    return updatedLoan;
}

// Add missing transaction record creation 
private async createTransactionRecord(
    tx: any,
    loanId: string,
    amount: Decimal,
    remainingBalance: Decimal,
    processedBy: string
) {
    return await tx.transaction.create({
        data: {
            transactionType: 'LOAN_REPAYMENT',
            baseType: 'CREDIT', // This is a credit to the cooperative
            module: 'LOAN',
            amount,
            balanceAfter: remainingBalance,
            status: 'COMPLETED',
            description: `Loan repayment for loan #${loanId}`,
            loanId,
            initiatedBy: processedBy,
            approvedBy: processedBy, // Auto-approved for repayments
        }
    });
}

// Add missing success result builder
private buildSuccessResult(repayment: any, loan: any): RepaymentResult {
    const paymentProgress = loan.totalAmount.gt(0) 
    ? loan.paidAmount.div(loan.totalAmount).mul(100).toNumber() 
    : 0;
    
    return {
        success: true,
        message: 'Repayment processed successfully',
        data: {
            repaymentId: repayment.id,
            amountPaid: repayment.amount.toString(),
            remainingBalance: loan.remainingBalance.toString(),
            isFullyPaid: loan.status === 'COMPLETED',
            totalRepayableAmount: loan.totalAmount.toString(),
            totalInterest: loan.interestAmount.toString(),
            paymentProgress
        }
    };
}

// Add missing validateRepaymentData method
private async validateRepaymentData(tx: any, data: LoanRepaymentData) {
    // 1. Basic data validation
    if (!data.erpId || !data.loanId || !data.uploadedAmount) {
        throw new ApiError('Missing required repayment data', 400);
    }

    if (data.uploadedAmount.lte(0)) {
        throw new ApiError('Payment amount must be greater than zero', 400);
    }

    // 2. Validate date information
    const currentDate = new Date();

    if (data.repaymentDate && data.repaymentDate > currentDate) {
        throw new ApiError('Repayment date cannot be in the future', 400);
    }

    if (!data.repaymentMonth || data.repaymentMonth < 1 || data.repaymentMonth > 12) {
        throw new ApiError('Invalid repayment month', 400);
    }

    const currentYear = currentDate.getFullYear();
    if (!data.repaymentYear || data.repaymentYear < currentYear - 5 || data.repaymentYear > currentYear + 1) {
        throw new ApiError('Invalid repayment year', 400);
    }

    // FIX #7: Validate payment date is not before loan disbursement
    const loan = await tx.loan.findUnique({
        where: { id: data.loanId },
        select: {
            disbursedAt: true,
            status: true
        }
    });

    if (loan && loan.disbursedAt && data.repaymentDate) {
        if (data.repaymentDate < loan.disbursedAt) {
            throw new ApiError(
                `Payment date (${data.repaymentDate.toISOString().split('T')[0]}) cannot be before loan disbursement date (${loan.disbursedAt.toISOString().split('T')[0]})`,
                400
            );
        }
    }

    return true;
}

// Add missing updateBatchStatus method
private async updateBatchStatus(
    batchId: string, 
    status: string, 
    message: string,
    totalAmount?: Decimal,
    totalCount?: number,
    successCount?: number,
    errorCount?: number,
    errors?: any[]
) {
    return await prisma.bulkRepaymentUpload.update({
        where: { id: batchId },
        data: {
            status: status as any,
            totalAmount: totalAmount || new Decimal(0),
            totalCount: totalCount || 0,
            successCount: successCount || 0,
            errorCount: errorCount || 0,
            metadata: {
                message,
                processedAt: new Date().toISOString()
            },
            errorDetails: errors?.length ? errors : Prisma.JsonNull,
            updatedAt: new Date()
        }
    });
}

// Check for overdue repayments and update statuses
async checkAndUpdateOverduePayments(): Promise<number> {
    const today = new Date();
    
    // Find all loans with schedules that are overdue but not marked as overdue
    const overdueSchedules = await prisma.loanSchedule.findMany({
        where: {
            status: {
                in: ['PENDING', 'PARTIAL']
            },
            dueDate: {
                lt: today
            }
        },
        include: {
            loan: true
        }
    });
    
    let updatedCount = 0;
    
    // Update all overdue schedules and set loan status to DEFAULTED if needed
    await prisma.$transaction(async (tx) => {
        for (const schedule of overdueSchedules) {
            // Calculate days overdue
            const daysOverdue = Math.floor(
                (today.getTime() - schedule.dueDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            
            // Update schedule status
            await tx.loanSchedule.update({
                where: { id: schedule.id },
                data: {
                    status: 'OVERDUE' as any
                }
            });
            
            // If overdue by more than 60 days, mark loan as defaulted
            if (daysOverdue > 60 && schedule.loan.status === 'ACTIVE') {
                await tx.loan.update({
                    where: { id: schedule.loan.id },
                    data: {
                        status: 'DEFAULTED',
                        statusHistory: {
                            create: {
                                fromStatus: schedule.loan.status,
                                toStatus: 'DEFAULTED',
                                changedBy: 'SYSTEM',
                                reason: `Payment overdue by ${daysOverdue} days`
                            }
                        }
                    }
                });
            }
            
            updatedCount++;
        }
    });
    
    return updatedCount;
}

// Generate aging report of loan repayments
async generateAgingReport(): Promise<any> {
    const today = new Date();
    
    // Define aging buckets (days)
    const buckets = [
        { name: 'Current', min: -Infinity, max: 0 },
        { name: '1-30 Days', min: 1, max: 30 },
        { name: '31-60 Days', min: 31, max: 60 },
        { name: '61-90 Days', min: 61, max: 90 },
        { name: 'Over 90 Days', min: 91, max: Infinity }
    ];
    
    // Get all active/defaulted loans with their schedules
    const loans = await prisma.loan.findMany({
        where: {
            status: {
                in: ['ACTIVE', 'DEFAULTED', 'DISBURSED']
            }
        },
        include: {
            member: true,
            loanType: true,
            paymentSchedules: {
                where: {
                    status: {
                        in: ['PENDING', 'PARTIAL', 'OVERDUE']
                    }
                }
            }
        }
    });
    
    // Initialize result structure
    const result: any = {
        summary: {
            totalLoans: loans.length,
            totalOutstanding: new Decimal(0),
            buckets: buckets.reduce((acc, bucket) => {
                acc[bucket.name] = {
                    count: 0,
                    amount: new Decimal(0)
                };
                return acc;
            }, {} as Record<string, { count: number; amount: Decimal }>)
        },
        byLoanType: {} as Record<string, any>,
        details: [] as any[]
    };
    
    // Process loans
    for (const loan of loans) {
        // Calculate total outstanding for this loan
        const loanOutstanding = loan.paymentSchedules.reduce(
            (sum, schedule) => {
                const unpaid = schedule.expectedAmount.sub(schedule.paidAmount || new Decimal(0));
                return sum.add(unpaid);
            },
            new Decimal(0)
        );
        
        // Add to total outstanding
        result.summary.totalOutstanding = result.summary.totalOutstanding.add(loanOutstanding);
        
        // Initialize loan type if not exists
        const loanTypeName = loan.loanType.name;
        if (!result.byLoanType[loanTypeName]) {
            result.byLoanType[loanTypeName] = {
                count: 0,
                totalOutstanding: new Decimal(0),
                buckets: buckets.reduce((acc, bucket) => {
                    acc[bucket.name] = {
                        count: 0,
                        amount: new Decimal(0)
                    };
                    return acc;
                }, {} as Record<string, { count: number; amount: Decimal }>)
            };
        }
        
        // Increment loan type counter
        result.byLoanType[loanTypeName].count++;
        result.byLoanType[loanTypeName].totalOutstanding = 
        result.byLoanType[loanTypeName].totalOutstanding.add(loanOutstanding);
        
        // Process each schedule
        for (const schedule of loan.paymentSchedules) {
            // Calculate days overdue (negative means not yet due)
            const daysOverdue = Math.floor(
                (today.getTime() - schedule.dueDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            
            // Find matching bucket
            const bucket = buckets.find(
                b => daysOverdue >= b.min && daysOverdue <= b.max
            );
            
            if (bucket) {
                const unpaidAmount = schedule.expectedAmount.sub(schedule.paidAmount || new Decimal(0));
                
                // Add to summary bucket
                result.summary.buckets[bucket.name].count++;
                result.summary.buckets[bucket.name].amount = 
                result.summary.buckets[bucket.name].amount.add(unpaidAmount);
                
                // Add to loan type bucket
                result.byLoanType[loanTypeName].buckets[bucket.name].count++;
                result.byLoanType[loanTypeName].buckets[bucket.name].amount = 
                result.byLoanType[loanTypeName].buckets[bucket.name].amount.add(unpaidAmount);
                
                // Add to details
                result.details.push({
                    erpId: loan.erpId,
                    memberName: loan.member.fullName,
                    department: loan.member.department,
                    loanType: loanTypeName,
                    scheduleId: schedule.id,
                    dueDate: schedule.dueDate,
                    daysOverdue,
                    expectedAmount: schedule.expectedAmount.toString(),
                    paidAmount: (schedule.paidAmount || new Decimal(0)).toString(),
                    outstandingAmount: unpaidAmount.toString(),
                    agingBucket: bucket.name
                });
            }
        }
    }
    
    // Convert Decimal objects to strings for JSON output
    result.summary.totalOutstanding = result.summary.totalOutstanding.toString();
    
    for (const bucket of Object.keys(result.summary.buckets)) {
        result.summary.buckets[bucket].amount = result.summary.buckets[bucket].amount.toString();
    }
    
    for (const loanType of Object.keys(result.byLoanType)) {
        result.byLoanType[loanType].totalOutstanding = result.byLoanType[loanType].totalOutstanding.toString();
        
        for (const bucket of Object.keys(result.byLoanType[loanType].buckets)) {
            result.byLoanType[loanType].buckets[bucket].amount = 
            result.byLoanType[loanType].buckets[bucket].amount.toString();
        }
    }
    
    return result;
}

async generateRepaymentTemplateXLSX(month?: number, year?: number): Promise<Buffer> {
    try {
        // Use current month/year if not specified
        const targetMonth = month || new Date().getMonth() + 1;
        const targetYear = year || new Date().getFullYear();
        
        // Create new workbook
        const workbook = XLSX.utils.book_new();
        
        // Get data for the template
        const dueRepayments = await this.getDueRepaymentsForMonth(targetMonth, targetYear);
        const outstandingLoans = await this.getOutstandingLoans();
        
        // Create instructions sheet
        const instructionsData = [
            ['INSTRUCTION'],
            ['1. This template contains multiple sheets for recording loan repayments.'],
            ['2. The "Expected Repayments" sheet shows all scheduled repayments for the current month.'],
            ['3. Use the "Actual Repayments" sheet to enter the repayment data. All fields marked with * are required.'],
            ['4. ERP_ID and LOAN_ID must match exactly with the values in the Expected Repayments sheet.'],
            ['5. The SCHEDULE_ID should be copied from the Expected Repayments sheet to ensure proper matching.'],
            ['6. The PAYMENT_AMOUNT should normally match the EXPECTED_AMOUNT, but can differ if partial payments are being made.'],
            ['7. The PAYMENT_DATE should be the actual date the payment was made (in YYYY-MM-DD format).'],
            ['8. The PAYMENT_MONTH and PAYMENT_YEAR indicate which month\'s repayment is being made.'],
            ['9. The summary sheets provide overviews of the outstanding loans.'],
            ['10. After completing the repayment data, save the file and upload it through the system.'],
            ['11. Important: Do not modify the structure of this template or add/remove columns.'],
            [''],
            ['WARNING: Ensure all data is accurate before uploading. Uploading incorrect data may require administrative correction.']
        ];
        
        const instructionsWs = XLSX.utils.aoa_to_sheet(instructionsData);
        XLSX.utils.book_append_sheet(workbook, instructionsWs, 'Instructions');
        
        // Create expected repayments sheet
        const expectedHeader = ['ERP_ID*', 'MEMBER_NAME', 'LOAN_ID*', 'SCHEDULE_ID*', 'LOAN_TYPE', 'DUE_DATE', 'EXPECTED_AMOUNT', 'BALANCE', 'STATUS'];
        const expectedData = [expectedHeader];
        
        dueRepayments.forEach(schedule => {
            expectedData.push([
                schedule.loan.erpId,
                schedule.loan.member.fullName,
                schedule.loanId,
                schedule.id,
                schedule.loan.loanType.name,
                schedule.dueDate.toISOString().split('T')[0],
                schedule.expectedAmount.toString(),
                schedule.remainingBalance.toString(),
                schedule.status
            ]);
        });
        
        const expectedWs = XLSX.utils.aoa_to_sheet(expectedData);
        XLSX.utils.book_append_sheet(workbook, expectedWs, 'Expected Repayments');
        
        // Create actual repayments sheet (for user input)
        const now = new Date();
        const actualHeader = ['ERP_ID*', 'LOAN_ID*', 'SCHEDULE_ID*', 'PAYMENT_MONTH*', 'PAYMENT_YEAR*', 'PAYMENT_AMOUNT*', 'PAYMENT_DATE*', 'NOTES'];
        const actualData = [
            actualHeader,
            [
                'EMP001', 
                '(Copy from Expected Repayments sheet)', 
                '(Copy from Expected Repayments sheet)', 
                now.getMonth() + 1, 
                now.getFullYear(), 
                '50000', 
                now.toISOString().split('T')[0], 
                'Monthly repayment'
            ]
        ];
        
        const actualWs = XLSX.utils.aoa_to_sheet(actualData);
        XLSX.utils.book_append_sheet(workbook, actualWs, 'Actual Repayments');
        
        // Create various summary sheets
        this.addLoanSummarySheet(workbook, outstandingLoans, 'Soft Loan', 'Soft Loans Summary');
        this.addLoanSummarySheet(workbook, outstandingLoans, 'Regular', 'Regular Loans Summary');
        this.addLoanSummarySheet(workbook, outstandingLoans, '1 Year Plus', '1 Year Plus');
        
        // Add monthly report overview
        const monthly = await this.generateMonthlyRepaymentReport(targetMonth, targetYear);
        this.addMonthlyReportSheet(workbook, monthly, 'Repayment Overview');
        
        // Write to buffer
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        return buffer;
    } catch (error: unknown) {
        console.error('Error generating template:', error);
        if (error instanceof Error) {
            throw new ApiError('Error generating repayment template: ' + error.message, 500);
        }
        throw new ApiError('Error generating repayment template: Unknown error', 500);
    }
}

async generateMonthlyRepaymentTemplateByType(month?: number, year?: number): Promise<Buffer> {
    try {
        // Use current month/year if not specified
        const targetMonth = month || new Date().getMonth() + 1;
        const targetYear = year || new Date().getFullYear();
        
        // Create new workbook
        const workbook = XLSX.utils.book_new();
        
        // Get data for the template
        const dueRepayments = await this.getDueRepaymentsForMonth(targetMonth, targetYear);
        
        // Group repayments by loan type
        const repaymentsByType: Record<string, any[]> = {};
        
        dueRepayments.forEach(schedule => {
            const loanType = schedule.loan.loanType.name;
            if (!repaymentsByType[loanType]) {
                repaymentsByType[loanType] = [];
            }
            
            repaymentsByType[loanType].push(schedule);
        });
        
        // Add instructions sheet
        const instructionsData = [
            ['MONTHLY REPAYMENT TEMPLATE INSTRUCTIONS'],
            [''],
            [`This template contains repayments due for ${targetMonth}/${targetYear}`],
            [''],
            ['INSTRUCTIONS:'],
            ['1. Each sheet represents a different loan type'],
            ['2. Fill in the "PAID_AMOUNT" column with the actual amount paid'],
            ['3. Leave "PAID_AMOUNT" empty if no payment was made'],
            ['4. The "PAYMENT_DATE" defaults to today but can be changed'],
            ['5. Download this template at the beginning of the month'],
            ['6. Upload the completed template after collecting payments'],
            [''],
            ['NOTES:'],
            ['- All fields are pre-filled except for "PAID_AMOUNT" and "PAYMENT_DATE"'],
            ['- Do not modify the ERP_ID, LOAN_ID, or SCHEDULE_ID fields as they are used for matching'],
            ['- Each sheet will be processed according to its loan type']
        ];
        
        const instructionsWs = XLSX.utils.aoa_to_sheet(instructionsData);
        XLSX.utils.book_append_sheet(workbook, instructionsWs, 'Instructions');
        
        // Add summary sheet
        const summaryData = [
            ['MONTHLY REPAYMENT SUMMARY'],
            [''],
            [`Month: ${targetMonth}/${targetYear}`],
            [''],
            ['Loan Type', 'Total Loans', 'Total Expected Amount', 'Status'],
            [''],
        ];
        
        let totalLoansCount = 0;
        let totalExpectedAmount = new Decimal(0);
        
        // Add each loan type to summary
        Object.entries(repaymentsByType).forEach(([loanType, schedules]) => {
            const count = schedules.length;
            totalLoansCount += count;
            
            const expectedAmount = schedules.reduce((sum, s) => 
                sum.add(s.expectedAmount), new Decimal(0));
            totalExpectedAmount = totalExpectedAmount.add(expectedAmount);
            
            summaryData.push([
                loanType, 
                count, 
                expectedAmount.toString(),
                'Pending'
            ]);
        });
        
        // Add total row
        summaryData.push(['']);
        summaryData.push([
            'TOTAL', 
            totalLoansCount.toString(), 
            totalExpectedAmount.toString(),
            'Pending'
        ]);
        
        const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, summaryWs, 'Summary');
        
        // Create a sheet for each loan type
        for (const [loanType, schedules] of Object.entries(repaymentsByType)) {
            // Create headers
            const headers = [
                'ERP_ID',
                'MEMBER_NAME',
                'DEPARTMENT', 
                'EXPECTED_AMOUNT',
                'PAID_AMOUNT',
                'PAYMENT_DATE',
                'MONTH',
                'YEAR',
                'NOTES',
                'LOAN_ID',
                'SCHEDULE_ID'
            ];
            
            const currentDate = new Date().toISOString().split('T')[0];
            const typeData = [headers];
            
            // Sort schedules by member name
            const sortedSchedules = [...schedules].sort((a, b) => 
                a.loan.member.fullName.localeCompare(b.loan.member.fullName)
            );
            
            // Add each schedule
            sortedSchedules.forEach(schedule => {
                typeData.push([
                    schedule.loan.erpId,
                    schedule.loan.member.fullName,
                    schedule.loan.member.department,
                    schedule.expectedAmount.toString(),
                    '',  // Paid amount (to be filled)
                    currentDate, // Default payment date
                    targetMonth,
                    targetYear,
                    `${loanType} repayment for ${targetMonth}/${targetYear}`,
                    schedule.loanId,
                    schedule.id
                ]);
            });
            
            // Create sheet
            const ws = XLSX.utils.aoa_to_sheet(typeData);
            
            // Sanitize sheet name (remove any characters not allowed in sheet names)
            const safeSheetName = loanType.replace(/[\[\]\*\?\/\\]/g, '_');
            
            // Add to workbook
            XLSX.utils.book_append_sheet(workbook, ws, safeSheetName);
        }
        
        // Write to buffer
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        return buffer;
    } catch (error: unknown) {
        console.error('Error generating monthly repayment template:', error);
        if (error instanceof Error) {
            throw new ApiError('Error generating monthly repayment template: ' + error.message, 500);
        }
        throw new ApiError('Error generating monthly repayment template: Unknown error', 500);
    }
}

private addLoanSummarySheet(workbook: any, loans: any[], typeFilter: string, sheetName: string) {
    // Filter loans by type
    const filteredLoans = loans.filter(loan => 
        loan.loanType.name.includes(typeFilter)
    );
    
    // Create headers
    const headers = ['ERP_ID', 'MEMBER_NAME', 'DEPARTMENT', 'LOAN_TYPE', 'PRINCIPAL_AMOUNT', 
        'REMAINING_BALANCE', 'MONTHLY_PAYMENT', 'DISBURSED_DATE', 'TENURE', 'STATUS'];
        const data = [headers];
        
        // Add loan data
        filteredLoans.forEach(loan => {
            // Get monthly payment from schedules
            const monthlyPayment = loan.paymentSchedules[0]?.expectedAmount || new Decimal(0);
            
            data.push([
                loan.erpId,
                loan.member.fullName,
                loan.member.department,
                loan.loanType.name,
                loan.principalAmount.toString(),
                loan.remainingBalance.toString(),
                monthlyPayment.toString(),
                loan.disbursedAt ? new Date(loan.disbursedAt).toISOString().split('T')[0] : 'N/A',
                loan.tenure,
                loan.status
            ]);
        });
        
        // Add summary row
        const totalOutstanding = filteredLoans.reduce(
            (sum, loan) => sum.add(loan.remainingBalance), 
            new Decimal(0)
        );
        
        data.push([]); // Empty row
        data.push([
            'TOTAL',
            `${filteredLoans.length} Loans`,
            '',
            '',
            '',
            totalOutstanding.toString(),
            '',
            '',
            '',
            ''
        ]);
        
        // Create sheet
        const ws = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, ws, sheetName);
    }
    
    private addMonthlyReportSheet(workbook: any, report: any, sheetName: string) {
        // Create headers
        const headers = ['LOAN_TYPE', 'TOTAL_LOANS', 'TOTAL_EXPECTED', 'TOTAL_PAID', 
            'PARTIAL_PAYMENTS', 'PENDING_PAYMENTS', 'COLLECTION_RATE'];
            const data = [headers];
            
            // Add loan type data
            for (const loanType of report.byLoanType) {
                
                const schedules: LoanSchedule[] = report.schedules.filter((s: LoanSchedule) => 
                    s.loan.loanType.name === loanType.loanType
            );
            
            const totalExpected = new Decimal(loanType.totalExpected);
            const totalPaid = schedules.reduce((sum, s) => 
                sum.add(s.paidAmount || new Decimal(0)), new Decimal(0)
        );
        
        const partialPayments = schedules.filter(s => s.status === 'PARTIAL').length;
        const pendingPayments = schedules.filter(s => s.status === 'PENDING').length;
        
        // Calculate collection rate
        const collectionRate = totalExpected.gt(0) 
        ? totalPaid.div(totalExpected).mul(100).toDecimalPlaces(2).toNumber() 
        : 0;
        
        data.push([
            loanType.loanType,
            loanType.count,
            totalExpected.toString(),
            totalPaid.toString(),
            partialPayments,
            pendingPayments,
            `${collectionRate}%`
        ]);
    }
    
    const totalPaid: Decimal = report.schedules.reduce((sum: Decimal, s: Schedule) => 
        sum.add(s.paidAmount || new Decimal(0)), new Decimal(0)
);

const totalExpected = new Decimal(report.totalAmount || 0);
const collectionRate = totalExpected.gt(0) 
? totalPaid.div(totalExpected).mul(100).toDecimalPlaces(2).toNumber()
: 0;

data.push([
    'TOTAL',
    report.totalDue,
    report.totalAmount,
    totalPaid.toString(),
    report.schedules.filter((s: Schedule) => s.status === 'PARTIAL').length,
    report.schedules.filter((s: Schedule) => s.status === 'PENDING').length,
    `${collectionRate}%`
] as const);

// Create sheet
const ws = XLSX.utils.aoa_to_sheet(data);
XLSX.utils.book_append_sheet(workbook, ws, sheetName);
}
}

export default new RepaymentService();
