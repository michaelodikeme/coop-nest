import { PrismaClient, MembershipStatus, Biodata, AccountInfo, User } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import { ApiError } from '../../../utils/apiError';
import logger from '../../../utils/logger';
import { prisma } from '../../../utils/prisma';

interface BiodataWithRelations extends Biodata {
    accountInfo: (AccountInfo & { bank: { name: string } })[];
    users: Pick<User, 'username' | 'isActive' | 'isMember'>[];
}

interface FormattedBiodataRow {
    erpId: string;
    ippisId: string;
    firstName: string;
    middleName: string;
    lastName: string;
    fullName: string;
    dateOfEmployment: string;
    staffNo: string;
    department: string;
    residentialAddress: string;
    emailAddress: string;
    phoneNumber: string;
    nextOfKin: string;
    relationshipOfNextOfKin: string;
    nextOfKinPhoneNumber: string;
    nextOfKinEmailAddress: string;
    membershipStatus: string;
    isVerified: string;
    isApproved: string;
    bankAccounts: string;
    hasUserAccount: string;
    userStatus: string;
    createdAt: string;
    updatedAt: string;
}

interface ExcelRow {
    [key: string]: string | number | undefined;
}

export class BiodataBackupService {
    private readonly backupDir: string;

    constructor() {
        this.backupDir = path.join(__dirname, '..', '..', '..', '..', 'backups', 'biodata');
    }

    async exportBiodataToExcel(): Promise<string> {
        try {
            // Ensure backup directory exists
            await this.ensureBackupDirectory();

            // Check if biodata exists
            const biodataCount = await prisma.biodata.count({
                where: { isDeleted: false }
            });

            if (biodataCount === 0) {
                throw new ApiError('No active biodata entries found', 404);
            }

            // Fetch biodata with relations
            const biodataEntries = await this.fetchBiodataWithRelations();

            // Format data
            const formattedData = this.formatBiodataForExcel(biodataEntries);

            // Create and save workbook
            const filepath = await this.createExcelWorkbook(formattedData);

            logger.info(`Biodata backup created successfully at ${filepath}`);
            return filepath;

        } catch (error) {
            logger.error('Error during biodata export:', error);
            if (error instanceof ApiError) throw error;
            throw new ApiError('Failed to export biodata', 500);
        }
    }

    private async ensureBackupDirectory(): Promise<void> {
        try {
            if (!fs.existsSync(this.backupDir)) {
                await fs.promises.mkdir(this.backupDir, { recursive: true });
            }
        } catch (error) {
            throw new ApiError('Failed to create backup directory', 500);
        }
    }

    private async fetchBiodataWithRelations(): Promise<BiodataWithRelations[]> {
        try {
            return await prisma.biodata.findMany({
                where: { isDeleted: false },
                include: {
                    accountInfo: {
                        include: { bank: true }
                    },
                    users: {
                        select: {
                            username: true,
                            isActive: true,
                            isMember: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
        } catch (error) {
            throw new ApiError('Failed to fetch biodata records', 500);
        }
    }

    private formatBiodataForExcel(entries: BiodataWithRelations[]): FormattedBiodataRow[] {
        return entries.map(entry => ({
            erpId: entry.erpId,
            ippisId: entry.ippisId,
            firstName: entry.firstName,
            middleName: entry.middleName || '',
            lastName: entry.lastName,
            fullName: entry.fullName,
            dateOfEmployment: entry.dateOfEmployment.toISOString().split('T')[0],
            staffNo: entry.staffNo,
            department: entry.department,
            residentialAddress: entry.residentialAddress,
            emailAddress: entry.emailAddress,
            phoneNumber: entry.phoneNumber,
            nextOfKin: entry.nextOfKin,
            relationshipOfNextOfKin: entry.relationshipOfNextOfKin,
            nextOfKinPhoneNumber: entry.nextOfKinPhoneNumber,
            nextOfKinEmailAddress: entry.nextOfKinEmailAddress,
            membershipStatus: entry.membershipStatus,
            isVerified: entry.isVerified ? 'Yes' : 'No',
            isApproved: entry.isApproved ? 'Yes' : 'No',
            bankAccounts: this.formatBankAccounts(entry.accountInfo),
            hasUserAccount: entry.users.length > 0 ? 'Yes' : 'No',
            userStatus: this.getUserStatus(entry.users),
            createdAt: entry.createdAt.toISOString(),
            updatedAt: entry.updatedAt.toISOString()
        }));
    }

    private formatBankAccounts(accounts: (AccountInfo & { bank: { name: string } })[]): string {
        return accounts.map(acc => 
            `${acc.bank.name}: ${acc.accountNumber} (${acc.accountName})`
        ).join('; ');
    }

    private getUserStatus(users: Pick<User, 'username' | 'isActive' | 'isMember'>[]): string {
        return users[0]?.isActive ? 'Active' : 'Inactive';
    }

    private async createExcelWorkbook(data: FormattedBiodataRow[]): Promise<string> {
        try {
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(data);

            // Set column widths
            worksheet['!cols'] = this.getColumnWidths();

            XLSX.utils.book_append_sheet(workbook, worksheet, 'Biodata');

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `biodata_backup_${timestamp}.xlsx`;
            const filepath = path.join(this.backupDir, filename);

            XLSX.writeFile(workbook, filepath);
            return filepath;

        } catch (error) {
            throw new ApiError('Failed to create Excel workbook', 500);
        }
    }

    private getColumnWidths() {
        return [
            { wch: 15 }, // erpId
            { wch: 15 }, // ippisId
            { wch: 20 }, // firstName
            { wch: 15 }, // middleName
            { wch: 20 }, // lastName
            { wch: 30 }, // fullName
            { wch: 12 }, // dateOfEmployment
            { wch: 15 }, // staffNo
            { wch: 25 }, // department
            { wch: 40 }, // residentialAddress
            { wch: 30 }, // emailAddress
            { wch: 15 }, // phoneNumber
            { wch: 30 }, // nextOfKin
            { wch: 20 }, // relationshipOfNextOfKin
            { wch: 15 }, // nextOfKinPhoneNumber
            { wch: 30 }, // nextOfKinEmailAddress
            { wch: 15 }, // membershipStatus
            { wch: 10 }, // isVerified
            { wch: 10 }, // isApproved
            { wch: 50 }, // bankAccounts
            { wch: 15 }, // hasUserAccount
            { wch: 12 }, // userStatus
            { wch: 20 }, // createdAt
            { wch: 20 }  // updatedAt
        ];
    }

    async validateBackupFile(filepath: string): Promise<boolean> {
        try {
            if (!fs.existsSync(filepath)) {
                throw new ApiError('Backup file not found', 404);
            }

            const workbook = XLSX.readFile(filepath);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(worksheet) as ExcelRow[];

            if (!Array.isArray(data) || data.length === 0) {
                throw new ApiError('Backup file is empty or invalid', 400);
            }

            const requiredFields = [
                'erpId', 'ippisId', 'firstName', 'lastName', 'staffNo',
                'department', 'emailAddress', 'phoneNumber'
            ];

            const isValid = data.every((row: ExcelRow) => 
                requiredFields.every(field => {
                    const value = row[field];
                    return value !== undefined && 
                           value !== null && 
                           String(value).trim() !== '';
                })
            );

            if (!isValid) {
                throw new ApiError('Backup file missing required fields', 400);
            }

            return true;

        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError('Failed to validate backup file', 500);
        }
    }
}