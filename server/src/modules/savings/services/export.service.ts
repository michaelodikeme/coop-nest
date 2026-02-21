import xlsx from 'xlsx';
import { Prisma } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import { prisma } from '../../../utils/prisma';
import logger from '../../../utils/logger';

interface ExportAllSavingsSummaryParams {
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    status?: string;
}

interface ExportWithdrawalRequestsParams {
    status?: string;
    search?: string;
}

export class SavingsExportService {
    /**
     * Export all savings summary (all records matching filters)
     */
    static async exportAllSavingsSummary(filters: ExportAllSavingsSummaryParams): Promise<string> {
        try {
            const {
                search = '',
                sortBy = 'lastDeposit',
                sortOrder = 'desc',
                status
            } = filters;

            // Build the where conditions for filtering
            const where: any = {};

            // Apply search filter (across member name, erpId)
            if (search) {
                where.OR = [
                    { member: { fullName: { contains: search, mode: 'insensitive' } } },
                    { erpId: { contains: search, mode: 'insensitive' } },
                ];
            }

            // Apply status filter
            if (status) {
                const isValidAccountStatus = ['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status);
                if (isValidAccountStatus) {
                    where.status = status;
                } else {
                    logger.warn(`Ignoring invalid AccountStatus value in filter: ${status}`);
                }
            }

            // Get unique member IDs from savings records
            const memberIds = await prisma.savings.groupBy({
                by: ['memberId'],
                where,
            });

            // Get the latest savings record for each member
            const memberSavings = await Promise.all(
                memberIds.map(async (item) => {
                    // Get the latest savings record for this member
                    const latestSavings = await prisma.savings.findFirst({
                        where: { memberId: item.memberId },
                        orderBy: { lastDeposit: 'desc' },
                        include: {
                            member: {
                                select: {
                                    id: true,
                                    erpId: true,
                                    fullName: true,
                                    department: true
                                }
                            }
                        }
                    });

                    if (!latestSavings) return null;

                    // Get the latest shares record for this member
                    const latestShares = await prisma.shares.findFirst({
                        where: { memberId: item.memberId },
                        orderBy: { lastPurchase: 'desc' },
                        select: {
                            totalSharesAmount: true
                        }
                    });

                    return {
                        erpId: latestSavings.erpId,
                        memberName: latestSavings.member.fullName,
                        department: latestSavings.member.department,
                        totalSavingsAmount: latestSavings.totalSavingsAmount.toString(),
                        totalSharesAmount: latestShares?.totalSharesAmount.toString() || '0',
                        totalGrossAmount: latestSavings.totalGrossAmount.toString(),
                        lastDeposit: latestSavings.lastDeposit
                            ? new Date(latestSavings.lastDeposit).toISOString().split('T')[0]
                            : '',
                        status: latestSavings.status
                    };
                })
            );

            // Filter out null values
            const validMemberSavings = memberSavings.filter(item => item !== null);

            // Apply sorting
            const sortedData = [...validMemberSavings].sort((a: any, b: any) => {
                if (sortBy === 'memberName') {
                    return sortOrder === 'asc'
                        ? a.memberName.localeCompare(b.memberName)
                        : b.memberName.localeCompare(a.memberName);
                }

                if (sortBy === 'department') {
                    return sortOrder === 'asc'
                        ? a.department.localeCompare(b.department)
                        : b.department.localeCompare(a.department);
                }

                if (sortBy === 'lastDeposit') {
                    const dateA = a.lastDeposit ? new Date(a.lastDeposit).getTime() : 0;
                    const dateB = b.lastDeposit ? new Date(b.lastDeposit).getTime() : 0;
                    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
                }

                // Default for numeric fields
                const valA = parseFloat(a[sortBy] || '0');
                const valB = parseFloat(b[sortBy] || '0');
                return sortOrder === 'asc' ? valA - valB : valB - valA;
            });

            // Format data for Excel with proper column headers
            const formattedData = sortedData.map(record => ({
                'ERP ID': record.erpId,
                'Member Name': record.memberName,
                'Department': record.department,
                'Total Savings': record.totalSavingsAmount,
                'Total Shares': record.totalSharesAmount,
                'Total Amount': record.totalGrossAmount,
                'Last Contribution': record.lastDeposit,
                'Status': record.status
            }));

            // Create workbook and worksheet
            const workbook = xlsx.utils.book_new();
            const worksheet = xlsx.utils.json_to_sheet(formattedData);

            // Set column widths
            worksheet['!cols'] = [
                { wch: 15 }, // ERP ID
                { wch: 30 }, // Member Name
                { wch: 20 }, // Department
                { wch: 15 }, // Total Savings
                { wch: 15 }, // Total Shares
                { wch: 15 }, // Total Amount
                { wch: 18 }, // Last Contribution
                { wch: 12 }  // Status
            ];

            // Add worksheet to workbook
            xlsx.utils.book_append_sheet(workbook, worksheet, 'All Savings Summary');

            // Create backups directory if it doesn't exist
            const backupsDir = path.join(__dirname, '..', '..', '..', 'backups');
            if (!fs.existsSync(backupsDir)) {
                fs.mkdirSync(backupsDir, { recursive: true });
            }

            // Generate filename with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `savings_all_summary_${timestamp}.xlsx`;
            const filepath = path.join(backupsDir, filename);

            // Write to file
            xlsx.writeFile(workbook, filepath);

            return filepath;
        } catch (error) {
            logger.error('Export all savings summary error:', error);
            throw { type: 'SavingsError', code: 'EXPORT_FAILED', message: 'Failed to export savings summary' };
        }
    }

    /**
     * Export monthly savings for a specific month and year
     */
    static async exportMonthlySavings(year: number, month: number): Promise<string> {
        try {
            // Fetch all savings for the specified month and year
            const monthlySavings = await prisma.savings.findMany({
                where: {
                    year,
                    month
                },
                include: {
                    member: {
                        select: {
                            fullName: true,
                            erpId: true
                        }
                    }
                },
                orderBy: [
                    { erpId: 'asc' }
                ]
            });

            // Fetch shares for the same month/year separately
            const sharesData = await prisma.shares.findMany({
                where: {
                    year,
                    month
                },
                select: {
                    erpId: true,
                    totalValue: true,
                    totalSharesAmount: true
                }
            });

            // Create a map of shares by erpId for quick lookup
            const sharesMap = new Map(
                sharesData.map(share => [share.erpId, share])
            );

            // Format data for Excel
            const formattedData = monthlySavings.map(record => {
                const savingsAmount = record.balance || new Prisma.Decimal(0);
                const share = sharesMap.get(record.erpId);
                const sharesAmount = share?.totalValue || new Prisma.Decimal(0);
                const totalAmount = new Prisma.Decimal(savingsAmount).plus(sharesAmount);

                return {
                    'ERP ID': record.erpId,
                    'Member Name': record.member?.fullName || 'N/A',
                    'Savings Amount': savingsAmount.toString(),
                    'Shares Amount': sharesAmount.toString(),
                    'Total Amount': totalAmount.toString(),
                    'Status': record.status,
                    'Month': record.month,
                    'Year': record.year
                };
            });

            // Create workbook and worksheet
            const workbook = xlsx.utils.book_new();
            const worksheet = xlsx.utils.json_to_sheet(formattedData);

            // Set column widths
            worksheet['!cols'] = [
                { wch: 15 }, // ERP ID
                { wch: 30 }, // Member Name
                { wch: 18 }, // Savings Amount
                { wch: 18 }, // Shares Amount
                { wch: 18 }, // Total Amount
                { wch: 12 }, // Status
                { wch: 8 },  // Month
                { wch: 8 }   // Year
            ];

            // Add worksheet to workbook
            const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
            xlsx.utils.book_append_sheet(workbook, worksheet, `${monthName} ${year}`);

            // Create backups directory if it doesn't exist
            const backupsDir = path.join(__dirname, '..', '..', '..', 'backups');
            if (!fs.existsSync(backupsDir)) {
                fs.mkdirSync(backupsDir, { recursive: true });
            }

            // Generate filename with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `savings_monthly_${monthName}_${year}_${timestamp}.xlsx`;
            const filepath = path.join(backupsDir, filename);

            // Write to file
            xlsx.writeFile(workbook, filepath);

            return filepath;
        } catch (error) {
            logger.error('Export monthly savings error:', error);
            throw { type: 'SavingsError', code: 'EXPORT_FAILED', message: 'Failed to export monthly savings' };
        }
    }

    /**
     * Export withdrawal requests with filters
     */
    static async exportWithdrawalRequests(filters: ExportWithdrawalRequestsParams): Promise<string> {
        try {
            const { status, search } = filters;

            // Build where clause
            const where: any = {
                type: 'SAVINGS_WITHDRAWAL'
            };

            if (status) {
                where.status = status;
            }

            if (search) {
                where.OR = [
                    { biodata: { fullName: { contains: search, mode: 'insensitive' } } },
                    { biodata: { erpId: { contains: search, mode: 'insensitive' } } }
                ];
            }

            // Fetch withdrawal requests
            const withdrawalRequests = await prisma.request.findMany({
                where,
                include: {
                    biodata: {
                        select: {
                            fullName: true,
                            erpId: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            // Format data for Excel
            const formattedData = withdrawalRequests.map(request => {
                const content = request.content as any;
                const amount = content?.amount || 0;
                const reason = content?.reason || '';

                return {
                    'Member Name': request.biodata?.fullName || 'N/A',
                    'ERP ID': request.biodata?.erpId || 'N/A',
                    'Amount': amount.toString(),
                    'Request Date': new Date(request.createdAt).toISOString().split('T')[0],
                    'Status': request.status,
                    'Reason': reason
                };
            });

            // Create workbook and worksheet
            const workbook = xlsx.utils.book_new();
            const worksheet = xlsx.utils.json_to_sheet(formattedData);

            // Set column widths
            worksheet['!cols'] = [
                { wch: 30 }, // Member Name
                { wch: 15 }, // ERP ID
                { wch: 15 }, // Amount
                { wch: 15 }, // Request Date
                { wch: 12 }, // Status
                { wch: 50 }  // Reason
            ];

            // Add worksheet to workbook
            const statusLabel = status || 'All';
            xlsx.utils.book_append_sheet(workbook, worksheet, 'Withdrawal Requests');

            // Create backups directory if it doesn't exist
            const backupsDir = path.join(__dirname, '..', '..', '..', 'backups');
            if (!fs.existsSync(backupsDir)) {
                fs.mkdirSync(backupsDir, { recursive: true });
            }

            // Generate filename with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `withdrawals_${statusLabel}_${timestamp}.xlsx`;
            const filepath = path.join(backupsDir, filename);

            // Write to file
            xlsx.writeFile(workbook, filepath);

            return filepath;
        } catch (error) {
            logger.error('Export withdrawal requests error:', error);
            throw { type: 'SavingsError', code: 'EXPORT_FAILED', message: 'Failed to export withdrawal requests' };
        }
    }
}
