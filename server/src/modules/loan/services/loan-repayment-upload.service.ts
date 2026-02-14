import { Decimal } from '@prisma/client/runtime/library';
import { LoanType, PaymentStatus } from '@prisma/client';
import { prisma } from '../../../utils/prisma';
import {
  ILoanRepaymentUploadRow,
  ILoanRepaymentUploadSheetResult,
  ILoanRepaymentUploadResult,
} from '../interfaces/loan-repayment-upload.interface';

export class LoanRepaymentUploadService {
  /**
   * Validate a single row from the upload file
   */
  private static validateRow(row: any): { valid: boolean; data?: ILoanRepaymentUploadRow; error?: string } {
    const errors: string[] = [];

    // Check required fields
    const employee = row.Employee || row.employee;
    const amount = row.amount || row.Amount;
    const month = row.month || row.Month;
    const year = row.year || row.Year;
    const description = row.description || row.Description;

    if (!employee) {
      errors.push('Missing Employee (erpId)');
    }
    if (!amount) {
      errors.push('Missing amount');
    }
    if (!month) {
      errors.push('Missing month');
    }
    if (!year) {
      errors.push('Missing year');
    }
    if (!description) {
      errors.push('Missing description (loan type)');
    }

    if (errors.length > 0) {
      return { valid: false, error: errors.join(', ') };
    }

    // Extract and validate erpId
    const erpId = employee.toString().trim();
    const erpIdPattern = /^(ERP\d+|FUO-ADM-\d+)$/i;
    if (!erpIdPattern.test(erpId)) {
      return {
        valid: false,
        error: `Invalid ERP ID format: ${erpId}. Expected: ERP### or FUO-ADM-###`,
      };
    }

    // Validate amount
    let amountDecimal: Decimal;
    try {
      amountDecimal = new Decimal(amount);
      if (amountDecimal.lte(0)) {
        return { valid: false, error: `Amount must be greater than 0` };
      }
    } catch {
      return { valid: false, error: `Invalid amount: ${amount}` };
    }

    // Validate month
    const monthNum = parseInt(month);
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return { valid: false, error: `Invalid month: ${month}. Must be 1-12` };
    }

    // Validate year
    const yearNum = parseInt(year);
    const currentYear = new Date().getFullYear();
    if (isNaN(yearNum) || yearNum < 2020 || yearNum > currentYear + 1) {
      return {
        valid: false,
        error: `Invalid year: ${year}. Must be between 2020 and ${currentYear + 1}`,
      };
    }

    return {
      valid: true,
      data: {
        erpId: erpId.toUpperCase(),
        amount: amountDecimal,
        month: monthNum,
        year: yearNum,
        description: description.toString().trim(),
      },
    };
  }

  /**
   * Match loan type from description (case-insensitive fuzzy matching)
   */
  private static matchLoanType(description: string, loanTypes: LoanType[]): LoanType | null {
    // Normalize text
    const normalizeText = (text: string): string => {
      return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Remove special chars
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim();
    };

    const normalizedDesc = normalizeText(description);

    // Build lookup map with aliases
    const loanTypeMap = new Map<string, LoanType>();
    loanTypes.forEach((lt) => {
      const normalized = normalizeText(lt.name);
      loanTypeMap.set(normalized, lt);

      // Add common aliases - be specific to avoid overlaps
      if (normalized.includes('soft')) {
        loanTypeMap.set('soft loan', lt);
        loanTypeMap.set('soft', lt);
      }

      // Regular Loan (1 Year) - exact match only
      if (normalized.includes('regular') && normalized.includes('1 year') && !normalized.includes('plus')) {
        loanTypeMap.set('regular loan 1 year', lt);
        loanTypeMap.set('regular 1 year', lt);
        loanTypeMap.set('1 year regular', lt);
      }

      // Regular Loan (1 Year Plus) - requires "plus" or "1+"
      if (normalized.includes('regular') && (normalized.includes('plus') || normalized.includes('1 year plus'))) {
        loanTypeMap.set('regular loan 1 year plus', lt);
        loanTypeMap.set('regular loan 1 plus', lt);
        loanTypeMap.set('regular loan 1+ year', lt);
        loanTypeMap.set('1 year plus', lt);
        loanTypeMap.set('1 plus', lt);
        loanTypeMap.set('regular 1+', lt);
      }
    });

    // Try exact match first
    if (loanTypeMap.has(normalizedDesc)) {
      return loanTypeMap.get(normalizedDesc)!;
    }

    // Try partial match
    for (const [key, loanType] of loanTypeMap.entries()) {
      if (normalizedDesc.includes(key) || key.includes(normalizedDesc)) {
        return loanType;
      }
    }

    return null;
  }

  /**
   * Group validated rows by member for batch processing
   */
  private static groupRowsByMember(
    validatedRows: Array<{ index: number; data: ILoanRepaymentUploadRow }>
  ): Map<string, Array<{ index: number; data: ILoanRepaymentUploadRow }>> {
    const memberGroups = new Map<string, Array<{ index: number; data: ILoanRepaymentUploadRow }>>();

    validatedRows.forEach((item) => {
      if (!memberGroups.has(item.data.erpId)) {
        memberGroups.set(item.data.erpId, []);
      }
      memberGroups.get(item.data.erpId)!.push(item);
    });

    return memberGroups;
  }

  /**
   * Process loan repayment transaction within a Prisma transaction
   */
  private static async processLoanRepaymentTransaction(
    tx: any,
    data: {
      loan: any;
      amount: Decimal;
      repaymentMonth: number;
      repaymentYear: number;
      uploadedBy: string;
      repaymentDate: Date;
    }
  ): Promise<void> {
    const { loan, amount, repaymentMonth, repaymentYear, uploadedBy, repaymentDate } = data;

    // 1. Find matching schedule entry by month/year
    const schedule = loan.paymentSchedules.find((s: any) => {
      const dueDate = new Date(s.dueDate);
      return dueDate.getMonth() + 1 === repaymentMonth && dueDate.getFullYear() === repaymentYear;
    });

    // 2. Create LoanRepayment record
    await tx.loanRepayment.create({
      data: {
        loanId: loan.id,
        amount: amount,
        repaymentDate: repaymentDate,
        repaymentMonth: repaymentMonth,
        repaymentYear: repaymentYear,
        uploadedBy: uploadedBy,
        scheduleId: schedule?.id,
      },
    });

    // 3. Update schedule status and paid amount (if schedule exists)
    if (schedule) {
      const newPaidAmount = new Decimal(schedule.paidAmount).plus(amount);
      const expectedAmount = new Decimal(schedule.expectedAmount);

      let newStatus: PaymentStatus;
      if (newPaidAmount.gte(expectedAmount)) {
        newStatus = 'PAID';
      } else if (newPaidAmount.gt(0)) {
        newStatus = 'PARTIAL';
      } else {
        newStatus = 'PENDING';
      }

      await tx.loanSchedule.update({
        where: { id: schedule.id },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus,
          actualPaymentDate: newStatus === 'PAID' ? repaymentDate : schedule.actualPaymentDate,
        },
      });
    }

    // 4. Update loan totals
    const currentPaidAmount = new Decimal(loan.paidAmount);
    const totalAmount = new Decimal(loan.totalAmount);
    const newPaidAmount = currentPaidAmount.plus(amount);
    const newRemainingBalance = totalAmount.minus(newPaidAmount);

    // Check if loan is fully paid (with decimal tolerance)
    const isFullyPaid = newRemainingBalance.lte(0.01);

    const loanUpdateData: any = {
      paidAmount: newPaidAmount,
      remainingBalance: newRemainingBalance.lt(0) ? new Decimal(0) : newRemainingBalance,
      lastPaymentDate: repaymentDate,
    };

    if (isFullyPaid) {
      loanUpdateData.status = 'COMPLETED';
      loanUpdateData.completedAt = repaymentDate;
    }

    await tx.loan.update({
      where: { id: loan.id },
      data: loanUpdateData,
    });

    // 5. Create transaction record
    await tx.transaction.create({
      data: {
        transactionType: 'LOAN_REPAYMENT',
        baseType: 'CREDIT', // Credit to the cooperative
        module: 'LOAN',
        amount: amount,
        balanceAfter: newRemainingBalance.lt(0) ? new Decimal(0) : newRemainingBalance,
        status: 'COMPLETED',
        description: `Bulk loan repayment - ${loan.loanType.name} (${repaymentMonth}/${repaymentYear})`,
        loanId: loan.id,
        initiatedBy: uploadedBy,
        approvedBy: uploadedBy, // Auto-approved for bulk uploads
      },
    });

    // 6. Create notification if loan completed
    if (isFullyPaid) {
      await tx.notification.create({
        data: {
          userId: loan.memberId,
          title: 'Loan Completed',
          message: `Congratulations! Your ${loan.loanType.name} has been fully paid. Total amount repaid: ₦${newPaidAmount.toFixed(2)}`,
          type: 'LOAN',
          isRead: false,
        },
      });
    }
  }

  /**
   * Process rows from a single sheet
   */
  private static async processSheetRows(
    rows: any[],
    sheetName: string,
    uploadedBy: string
  ): Promise<ILoanRepaymentUploadSheetResult> {
    const successfulRows: number[] = [];
    const failedRows: Array<{ row: number; erpId?: string; error: string }> = [];

    // Step 1: Fetch all loan types ONCE
    const loanTypes = await prisma.loanType.findMany({
      where: { isActive: true },
    });

    // Step 2: Validate all rows
    const validatedRows: Array<{ index: number; data: ILoanRepaymentUploadRow }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const validation = this.validateRow(row);

      if (!validation.valid) {
        failedRows.push({
          row: i + 2, // Excel row number (header is row 1)
          erpId: row.Employee || row.employee,
          error: validation.error!,
        });
        continue;
      }

      validatedRows.push({ index: i + 2, data: validation.data! });
    }

    // Step 3: Group by member for batch processing
    const memberMap = this.groupRowsByMember(validatedRows);

    // Step 4: Process each member's repayments in a SINGLE transaction
    for (const [erpId, memberRows] of memberMap.entries()) {
      try {
        await prisma.$transaction(async (tx) => {
          // 4a. Find member by erpId
          const member = await tx.biodata.findFirst({
            where: { erpId },
          });

          if (!member) {
            memberRows.forEach((item) => {
              failedRows.push({
                row: item.index,
                erpId: erpId,
                error: `Member not found with ERP ID: ${erpId}`,
              });
            });
            return;
          }

          // 4b. Fetch ALL active loans for this member ONCE
          const activeLoans = await tx.loan.findMany({
            where: {
              erpId,
              status: { in: ['ACTIVE', 'DISBURSED'] },
            },
            include: {
              loanType: true,
              paymentSchedules: {
                orderBy: { dueDate: 'asc' },
              },
            },
          });

          // 4c. Process each repayment row for this member
          for (const item of memberRows) {
            try {
              const { data: row, index: rowIndex } = item;

              // Match loan type
              const matchedLoanType = this.matchLoanType(row.description, loanTypes);
              if (!matchedLoanType) {
                const availableTypes = loanTypes.map((lt) => lt.name).join(', ');
                failedRows.push({
                  row: rowIndex,
                  erpId: erpId,
                  error: `Loan type not found: "${row.description}". Available types: ${availableTypes}`,
                });
                continue;
              }

              // Find matching active loan (oldest first if multiple)
              const matchingLoans = activeLoans
                .filter((l) => l.loanTypeId === matchedLoanType.id)
                .sort((a, b) => {
                  const dateA = a.disbursedAt ? new Date(a.disbursedAt).getTime() : 0;
                  const dateB = b.disbursedAt ? new Date(b.disbursedAt).getTime() : 0;
                  return dateA - dateB;
                });

              const loan = matchingLoans[0];

              if (!loan) {
                failedRows.push({
                  row: rowIndex,
                  erpId: erpId,
                  error: `No active ${matchedLoanType.name} found for member ${erpId}`,
                });
                continue;
              }

              // Check for overpayment
              const remainingBalance = new Decimal(loan.remainingBalance);
              if (row.amount.gt(remainingBalance)) {
                failedRows.push({
                  row: rowIndex,
                  erpId: erpId,
                  error: `Repayment amount ₦${row.amount.toFixed(2)} exceeds remaining balance ₦${remainingBalance.toFixed(2)} for ${matchedLoanType.name}`,
                });
                continue;
              }

              // Check duplicate repayment
              const existingRepayment = await tx.loanRepayment.findFirst({
                where: {
                  loanId: loan.id,
                  repaymentMonth: row.month,
                  repaymentYear: row.year,
                },
              });

              if (existingRepayment) {
                failedRows.push({
                  row: rowIndex,
                  erpId: erpId,
                  error: `Duplicate repayment: ${matchedLoanType.name} for ${row.month}/${row.year} already exists`,
                });
                continue;
              }

              // Process repayment
              await this.processLoanRepaymentTransaction(tx, {
                loan,
                amount: row.amount,
                repaymentMonth: row.month,
                repaymentYear: row.year,
                uploadedBy,
                repaymentDate: new Date(),
              });

              successfulRows.push(rowIndex);
            } catch (rowError: any) {
              failedRows.push({
                row: item.index,
                erpId: erpId,
                error: rowError.message || 'Failed to process repayment',
              });
            }
          }
        });
      } catch (memberError: any) {
        // If entire member transaction fails, mark all rows as failed
        memberRows.forEach((item) => {
          failedRows.push({
            row: item.index,
            erpId: erpId,
            error: `Transaction failed: ${memberError.message}`,
          });
        });
      }
    }

    return {
      sheetName,
      totalRows: rows.length,
      successfulRows: successfulRows.length,
      failedRows,
    };
  }

  /**
   * Process Excel file
   */
  public static async processExcelFile(
    fileBuffer: Buffer,
    uploadedBy: string
  ): Promise<ILoanRepaymentUploadResult> {
    const xlsx = require('xlsx');
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });

    const sheetResults: ILoanRepaymentUploadSheetResult[] = [];
    let totalSuccessful = 0;
    let totalFailed = 0;

    // Process each sheet
    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const rows = xlsx.utils.sheet_to_json(worksheet);

      if (rows.length === 0) continue;

      const result = await this.processSheetRows(rows, sheetName, uploadedBy);
      sheetResults.push(result);
      totalSuccessful += result.successfulRows;
      totalFailed += result.failedRows.length;
    }

    return {
      totalSheets: workbook.SheetNames.length,
      totalSuccessful,
      totalFailed,
      sheetResults,
    };
  }

  /**
   * Process CSV file
   */
  public static async processCsvFile(
    fileBuffer: Buffer,
    uploadedBy: string
  ): Promise<ILoanRepaymentUploadResult> {
    const { parse } = require('csv-parse/sync');

    const rows = parse(fileBuffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const result = await this.processSheetRows(rows, 'CSV', uploadedBy);

    return {
      totalSheets: 1,
      totalSuccessful: result.successfulRows,
      totalFailed: result.failedRows.length,
      sheetResults: [result],
    };
  }
}
