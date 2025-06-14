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
    }    private groupTransactionsByPeriod(transactions: any[]): ITransactionRow[] {
        if (!Array.isArray(transactions)) return [];
        
        // Group transactions by month/year
        const grouped = transactions.reduce<Record<string, ITransactionRow>>((acc, curr) => {
            const key = `${curr.month}-${curr.year}`;
            if (!acc[key]) {
                acc[key] = {
                    month: Number(curr.month),
                    year: Number(curr.year),
                    savingsAmount: 0,
                    sharesAmount: 0,
                    grossAmount: 0,
                    status: curr.status
                };
            }

            if (curr.transactionType === 'SAVINGS_DEPOSIT') {
                acc[key].savingsAmount = Number(curr.savingsAmount || 0);
            } else if (curr.transactionType === 'SHARES_PURCHASE') {
                acc[key].sharesAmount = Number(curr.sharesAmount || 0);
            }
            acc[key].grossAmount = acc[key].savingsAmount + acc[key].sharesAmount;

            return acc;
        }, {});

        // Convert to array and sort by date
        return Object.values(grouped).sort((a: any, b: any) => {
            if (a.year !== b.year) return b.year - a.year;
            return b.month - a.month;
        });
    }

    public async generateStatement(
        statement: ISavingsStatement,
        dateRange?: { startDate: string; endDate: string }
    ): Promise<string> {
        const doc = this.initializeDocument();
        const config = this.getDefaultConfig();
        const fileName = await this.generateFileName(statement);
        const filePath = path.join(this.tempDir, fileName);
        const stream = fs.createWriteStream(filePath);

        doc.pipe(stream);

        // Add components in sequence
        await addHeader(doc, config, this.logoPath, dateRange);
        addMemberInfo(doc, config, statement.memberInfo);
        addSummary(doc, config, statement.memberInfo);

        const groupedTransactions = this.groupTransactionsByPeriod(statement.memberInfo.transactions || []);
        addTransactionTable(doc, config, groupedTransactions);
        addFooter(doc, config);

        // Add page numbers
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
            doc.switchToPage(i);
            doc.fontSize(8)
               .text(
                    `Page ${i + 1} of ${pages.count}`,
                    config.margins.left,
                    doc.page.height - 25,
                    { align: 'center' }
                );
        }

        doc.end();

        return new Promise((resolve, reject) => {
            stream.on('finish', () => resolve(filePath));
            stream.on('error', reject);
        });
    }
}
