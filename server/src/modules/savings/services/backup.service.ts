import xlsx from 'xlsx';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

export class SavingsBackupService {
    static async exportSavingsToExcel(): Promise<string> {
        try {
            const savingsRecords = await prisma.savings.findMany({
                include: {
                    member: {
                        select: {
                            fullName: true,
                            department: true,
                            erpId: true
                        }
                    },
                    shares: true
                },
                orderBy: [
                    { year: 'desc' },
                    { month: 'desc' }
                ]
            });

            // Format the data for Excel
            const formattedData = savingsRecords.map(record => ({
                erpId: record.erpId,
                memberName: record.member.fullName,
                department: record.member.department,
                balance: record.balance.toString(),
                monthlyTarget: record.monthlyTarget.toString(),
                lastDeposit: record.lastDeposit ? new Date(record.lastDeposit).toISOString().split('T')[0] : '',
                month: record.month,
                year: record.year,
                isProcessed: record.isProcessed,
                status: record.status,
                description: record.description || '',
                createdAt: new Date(record.createdAt).toISOString().split('T')[0],
            }));

            // Create workbook and worksheet
            const workbook = xlsx.utils.book_new();
            const worksheet = xlsx.utils.json_to_sheet(formattedData);

            // Add worksheet to workbook
            xlsx.utils.book_append_sheet(workbook, worksheet, 'Savings Records');

            // Create backup directory if it doesn't exist
            const backupDir = path.join(__dirname, '..', '..', '..', 'backups');
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }

            // Generate filename with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `savings_backup_${timestamp}.xlsx`;
            const filepath = path.join(backupDir, filename);

            // Write to file
            xlsx.writeFile(workbook, filepath);

            return filepath;
        } catch (error) {
            console.error('Export error:', error);
            throw { type: 'SavingsError', code: 'EXPORT_FAILED' };
        }
    }

    static async exportTableToExcel(tableName: 'savings' | 'shares'): Promise<string> {
        try {
            let tableData;
            
            if (tableName === 'savings') {
                tableData = await prisma.savings.findMany({
                    include: {
                        member: {
                            select: {
                                fullName: true,
                                department: true,
                                erpId: true
                            }
                        }
                    },
                    orderBy: [
                        { year: 'desc' },
                        { month: 'desc' }
                    ]
                });
            } else {
                tableData = await prisma.shares.findMany({
                    include: {
                        member: {
                            select: {
                                fullName: true,
                                department: true,
                                erpId: true
                            }
                        }
                    },
                    orderBy: [
                        { year: 'desc' },
                        { month: 'desc' }
                    ]
                });
            }

            // Format dates and decimal values in the data
            const formattedData = tableData.map((entry: any) => {
                const formatted = { ...entry };
                // Handle member nested object
                if (formatted.member) {
                    formatted.memberName = formatted.member.fullName;
                    formatted.department = formatted.member.department;
                    delete formatted.member;
                }
                
                // Format dates and decimals
                Object.keys(formatted).forEach(key => {
                    if (formatted[key] instanceof Date) {
                        formatted[key] = formatted[key].toISOString().split('T')[0];
                    }
                    if (typeof formatted[key] === 'bigint') {
                        formatted[key] = formatted[key].toString();
                    }
                });
                return formatted;
            });

            // Create workbook and worksheet
            const workbook = xlsx.utils.book_new();
            const worksheet = xlsx.utils.json_to_sheet(formattedData);

            // Add worksheet to workbook
            xlsx.utils.book_append_sheet(workbook, worksheet, tableName.toUpperCase());

            // Create backup directory if it doesn't exist
            const backupDir = path.join(__dirname, '..', '..', '..', 'backups');
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }

            // Generate filename with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `${tableName}_backup_${timestamp}.xlsx`;
            const filepath = path.join(backupDir, filename);

            // Write to file
            xlsx.writeFile(workbook, filepath);

            return filepath;
        } catch (error) {
            console.error(`Export error for table ${tableName}:`, error);
            throw { type: 'SavingsError', code: 'EXPORT_FAILED' };
        }
    }
}