import xlsx from 'xlsx';
import { parse } from 'csv-parse';
import { Readable } from 'stream';
import { Decimal } from '@prisma/client/runtime/library';
import { ISavingsUploadRow, ISavingsUploadResult, ISavingsUploadSheetResult } from '../interfaces/savings.interface';
import { processSavingsTransaction } from './transaction.service';
import { SystemSettingsService } from '../../system/services/systemSettings.service';
import logger from '../../../utils/logger';
import { prisma } from '../../../utils/prisma';

export class SavingsUploadService {
    private static async getShareAmount(): Promise<Decimal> {
        try {
            const systemSettings = SystemSettingsService.getInstance();
            return await systemSettings.getSetting<Decimal>('DEFAULT_SHARE_AMOUNT');
        } catch (error) {
            logger.warn('Failed to get share amount from settings, using default:', error);
            return new Decimal(5000);
        }
    }

    private static validateSavingsRow(
        row: any,
        shareAmount: Decimal
    ): { data: ISavingsUploadRow | null; error?: string } {
        try {
            logger.debug('Validating row:', row);

            // Validate required fields
            const requiredFields = ['erpId', 'grossAmount', 'month', 'year'];
            if (!requiredFields.every(field => row[field])) {
                const missingFields = requiredFields.filter(field => !row[field]);
                throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
            }

            // Validate and convert amount
            const grossAmount = new Decimal(row.grossAmount);
            if (grossAmount.lessThan(shareAmount)) {
                throw new Error(`Gross amount must be at least ${shareAmount} to cover share contribution`);
            }

            // Calculate savings amount after share deduction
            const savingsAmount = grossAmount.minus(shareAmount);

            // Validate month and year
            const month = Number(row.month);
            const year = Number(row.year);

            if (month < 1 || month > 12) {
                throw new Error('Invalid month');
            }

            const currentYear = new Date().getFullYear();
            if (year < 2020 || year > currentYear + 1) {
                throw new Error('Invalid year range');
            }

            const validatedRow: ISavingsUploadRow = {
                erpId: row.erpId.toString().trim(),
                grossAmount,
                savingsAmount,
                shareAmount,
                month,
                year,
                description: row.description?.toString().trim()
            };

            return { data: validatedRow };
        } catch (error) {
            return { data: null, error: error instanceof Error ? error.message : 'Invalid row data' };
        }
    }    

    static async processExcelFile(buffer: Buffer): Promise<ISavingsUploadResult> {
        const workbook = xlsx.read(buffer);
        const results: ISavingsUploadSheetResult[] = [];
        let totalProcessed = 0;

        // Fetch share amount once for the entire upload
        const shareAmount = await this.getShareAmount();

        // Process each sheet in the workbook
        for (const sheetName of workbook.SheetNames) {
            try {
                logger.info(`Processing sheet: ${sheetName} (${totalProcessed + 1} of ${workbook.SheetNames.length})`);
                const sheet = workbook.Sheets[sheetName];
                const rows = xlsx.utils.sheet_to_json(sheet);

                const sheetResult = await this.processSavingsRows(rows, sheetName, shareAmount);
                results.push(sheetResult);
                totalProcessed++;

                logger.info(`Completed sheet ${sheetName}. Running total: ${totalProcessed} sheets`);
            } catch (error) {
                logger.error(`Error processing sheet ${sheetName}:`, error);
            }
        }

        return {
            totalSheets: workbook.SheetNames.length,
            totalSuccessful: results.reduce((sum, r) => sum + r.successful, 0),
            totalFailed: results.reduce((sum, r) => sum + r.failed, 0),
            sheetResults: results
        };
    }

    static async processCsvFile(buffer: Buffer): Promise<ISavingsUploadResult> {
        const rows: any[] = [];
        const parser = parse({
            columns: true,
            skip_empty_lines: true,
            trim: true
        });

        // Fetch share amount once for the entire upload
        const shareAmount = await this.getShareAmount();

        return new Promise((resolve, reject) => {
            Readable.from(buffer)
                .pipe(parser)
                .on('data', (row) => rows.push(row))
                .on('end', async () => {
                    try {
                        const result = await this.processSavingsRows(rows, 'CSV File', shareAmount);
                        resolve({
                            totalSheets: 1,
                            totalSuccessful: result.successful,
                            totalFailed: result.failed,
                            sheetResults: [result]
                        });
                    } catch (error) {
                        logger.error(`Error processing CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`);
                        reject(error);
                    }
                })
                .on('error', (error) => {
                    logger.error(`CSV parser error: ${error.message}`);
                    reject(error);
                });
        });
    }

    private static async processSavingsRows(rows: any[], sheetName: string, shareAmount: Decimal): Promise<ISavingsUploadSheetResult> {
        const results: ISavingsUploadSheetResult = {
            sheetName,
            successful: 0,
            failed: 0,
            errors: []
        };

        // Group rows by month and year
        const groupedRows = rows.reduce<Record<string, any[]>>((acc, row) => {
            const key = `${row.month}-${row.year}`;
            if (!acc[key]) acc[key] = [];
            acc[key].push(row);
            return acc;
        }, {});

        for (const [period, periodRows] of Object.entries(groupedRows)) {
            logger.info(`Processing ${periodRows.length} entries for period ${period} in sheet ${sheetName}`);

            for (const [index, row] of periodRows.entries()) {
                const validation = this.validateSavingsRow(row, shareAmount);
                if (!validation.data) {
                    results.failed++;
                    results.errors.push(
                        `[Sheet: ${sheetName}] Row ${index + 2} (erpId: ${row.erpId ?? 'unknown'}): ${validation.error}`
                    );
                    continue;
                }
                const validatedRow = validation.data;

                try {
                    await prisma.$transaction(async (tx) => {
                        // Find member
                        const member = await tx.biodata.findFirst({
                            where: { erpId: validatedRow.erpId },
                            include: {
                                users: {
                                    select: { id: true }
                                }
                            }
                        });

                        if (!member) {
                            throw new Error(`Member not found for erpId: ${validatedRow.erpId}`);
                        }

                        // Check for existing entry
                        const existingSavings = await tx.savings.findUnique({
                            where: {
                                erpId_month_year: {
                                    erpId: validatedRow.erpId,
                                    month: validatedRow.month,
                                    year: validatedRow.year
                                }
                            }
                        });

                        if (existingSavings) {
                            throw new Error(
                                `Savings entry already exists for ${validatedRow.month}/${validatedRow.year}`
                            );
                        }

                        const initiatorId = member.users[0]?.id;

                        // Process the transaction with split amounts
                        await processSavingsTransaction(tx, {
                            memberId: member.id,
                            erpId: validatedRow.erpId,
                            grossAmount: validatedRow.grossAmount,
                            savingsAmount: validatedRow.savingsAmount,
                            shareAmount: validatedRow.shareAmount,
                            month: validatedRow.month,
                            year: validatedRow.year,
                            initiatorId,
                            description: validatedRow.description || `Bulk upload from ${sheetName}`
                        });

                        results.successful++;
                    });
                } catch (error: any) {
                    results.failed++;
                    results.errors.push(
                        `[Sheet: ${sheetName}] Failed to process row with erpId ${validatedRow.erpId}: ${error.message}`
                    );
                }
            }
        }

        return results;
    }
}