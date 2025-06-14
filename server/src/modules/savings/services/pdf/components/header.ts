import PDFDocument from 'pdfkit';
import fs from 'fs';
import { IStatementConfig } from '../../../interfaces/pdf.interface';
import { formatCurrency } from '../../../../../utils/formatters';
import { formatDate } from '../utils';

export const addHeader = async (
    doc: PDFKit.PDFDocument,
    config: IStatementConfig,
    logoPath: string,
    dateRange?: { startDate: string; endDate: string }
): Promise<void> => {
    // Add logo if exists
    try {
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, config.margins.left, 30, { width: 100 });
        }
    } catch (error) {
        console.error('Error loading logo:', error);
    }

    // Add title
    doc.font(`${config.defaultFont}-Bold`)
        .fontSize(24)
        .fillColor(config.colors.primary)
        .text('CoopNest', config.margins.left + 120, 40)
        .fontSize(16)
        .fillColor(config.colors.text)
        .text('Savings Statement', config.margins.left + 120);

    // Add date range if provided
    if (dateRange) {
        doc.fontSize(10)
            .fillColor(config.colors.secondary)
            .text(
                `Period: ${dateRange.startDate} to ${dateRange.endDate}`,
                config.margins.left + 120,
                doc.y + 5
            );
    }

    // Add current date
    doc.fontSize(10)
        .fillColor(config.colors.secondary)
        .text(
            `Generated on: ${new Date().toLocaleDateString('en-GB')}`,
            config.margins.left + 120,
            doc.y + 5
        );

    doc.moveDown(2);
};
