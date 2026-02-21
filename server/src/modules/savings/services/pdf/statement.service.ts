import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { formatCurrency } from '../../../../utils/formatters';
import { formatDate } from './utils';
import { IStatementConfig, ITransactionRow, IPdfOptions } from '../../interfaces/pdf.interface';
import { ISavingsStatement } from '../../interfaces/savings.interface';
import { addHeader, addMemberInfo, addSummary, addTransactionTable, addFooter } from './components';

export class StatementService {
    private readonly tempDir: string;
    private readonly logoPath: string;

    constructor() {
        this.tempDir = path.join(__dirname, '..', '..', '..', '..', 'temp');
        this.logoPath = path.join(__dirname, '..', '..', '..', '..', 'assets', 'logo.png');
        this.ensureTempDirectory();
    }

    private ensureTempDirectory(): void {
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }

    private getDefaultConfig(): IStatementConfig {
        return {
            margins: {
                top: 20,
                bottom: 20,
                left: 20,
                right: 20
            },
            headerHeight: 150,
            footerHeight: 50,
            pageSize: 'A4',
            defaultFont: 'Helvetica',
            colors: {
                primary: '#1a73e8',
                secondary: '#5f6368',
                text: '#202124',
                border: '#dadce0'
            }
        };
    }

    private initializeDocument(options?: Partial<IPdfOptions>): PDFKit.PDFDocument {
        const config = this.getDefaultConfig();
        const doc = new PDFDocument({
            margins: {
                top: config.margins.top,
                right: config.margins.right,
                bottom: config.margins.bottom,
                left: config.margins.left
            },
            size: config.pageSize,
            layout: 'portrait',
            bufferPages: true,
            autoFirstPage: true,
            // ...options
        });

        return doc;
    }

    private async generateFileName(statement: ISavingsStatement): Promise<string> {
        const { erpId } = statement.memberInfo;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        return `savings_statement_${erpId}_${timestamp}.pdf`;
    }
    private filterTransactions(
        transactions: any[],
        filters?: {
            type?: 'ALL' | 'SAVINGS' | 'SHARES';
            startDate?: Date;
            endDate?: Date;
        }
    ): any[] {

        let filtered = [...transactions];

        // Filter by transaction type
        if (filters?.type && filters.type !== 'ALL') {
            const typeMap: Record<string, string[]> = {
                'SAVINGS': ['SAVINGS_DEPOSIT', 'SAVINGS_WITHDRAWAL'],
                'SHARES': ['SHARES_PURCHASE']
            };

            const allowedTypes = typeMap[filters.type] || [];
            const beforeCount = filtered.length;
            filtered = filtered.filter(tx => allowedTypes.includes(tx.transactionType));
        }

        // Filter by date range
        if (filters?.startDate || filters?.endDate) {
            filtered = filtered.filter(tx => {
                const txDate = new Date(tx.date);
                if (filters.startDate && txDate < filters.startDate) return false;
                if (filters.endDate && txDate > filters.endDate) return false;
                return true;
            });
        }

        return filtered;
    }


    private buildFilterNote(filters?: {
        type?: 'ALL' | 'SAVINGS' | 'SHARES';
        startDate?: Date;
        endDate?: Date;
    }): string {
        if (!filters) return '';

        const parts: string[] = [];

        if (filters.type && filters.type !== 'ALL') {
            parts.push(`Type: ${filters.type}`);
        }

        if (filters.startDate || filters.endDate) {
            const start = filters.startDate ? formatDate(filters.startDate.toISOString()) : 'Beginning';
            const end = filters.endDate ? formatDate(filters.endDate.toISOString()) : 'Present';
            parts.push(`Period: ${start} - ${end}`);
        }

        return parts.length > 0 ? `Filtered Statement (${parts.join(', ')})` : '';
    }

    public async generateStatement(
        statement: ISavingsStatement,
        filters?: {
            type?: 'ALL' | 'SAVINGS' | 'SHARES';
            startDate?: Date;
            endDate?: Date;
        }
    ): Promise<string> {
        const doc = this.initializeDocument();
        const config = this.getDefaultConfig();
        const fileName = await this.generateFileName(statement);
        const filePath = path.join(this.tempDir, fileName);
        const stream = fs.createWriteStream(filePath);

        doc.pipe(stream);

        // Filter transactions based on criteria
        let transactions = statement.memberInfo.transactions || [];

        if (filters) {
            transactions = this.filterTransactions(transactions, filters);
        }

        // Calculate totals from FILTERED transactions
        // Note: Withdrawal amounts are already negative in the database
        let filteredTotalSavings = 0;
        let filteredTotalShares = 0;

        transactions.forEach(tx => {
            if (tx.transactionType === 'SAVINGS_DEPOSIT') {
                filteredTotalSavings += tx.amount;
            } else if (tx.transactionType === 'SAVINGS_WITHDRAWAL') {
                // Amount is already negative, so adding it subtracts from total
                filteredTotalSavings += tx.amount;
            } else if (tx.transactionType === 'SHARES_PURCHASE') {
                filteredTotalShares += tx.amount;
            }
        });

        // Build filter note for header
        const filterNote = this.buildFilterNote(filters);

        // Create memberInfo with filtered totals for the summary
        const memberInfoForSummary = {
            ...statement.memberInfo,
            totalSavings: filteredTotalSavings,
            totalShares: filteredTotalShares
        };

        // Add components in sequence
        await addHeader(doc, config, this.logoPath, filterNote);
        addMemberInfo(doc, config, statement.memberInfo);
        addSummary(doc, config, memberInfoForSummary, filters?.type);

        addTransactionTable(doc, config, transactions);
        addFooter(doc, config);

        // Add page numbers - BEFORE finalizing to prevent extra pages
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
            doc.switchToPage(i);
            const pageNumY = doc.page.height - 30;
            doc.fontSize(8)
               .fillColor(config.colors.secondary)
               .text(
                    `Page ${i + 1} of ${pages.count}`,
                    config.margins.left,
                    pageNumY,
                    { width: doc.page.width - config.margins.left - config.margins.right, align: 'center' }
                );
        }

        doc.end();

        return new Promise((resolve, reject) => {
            stream.on('finish', () => {
                console.log('PDF generation complete:', filePath);
                resolve(filePath);
            });
            stream.on('error', reject);
        });
    }
}
