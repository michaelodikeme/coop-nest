import PDFDocument from 'pdfkit';
import fs from 'fs';
import { IStatementConfig } from '../../../interfaces/pdf.interface';
import { formatCurrency } from '../../../../../utils/formatters';
import { formatDate } from '../utils';

export const addHeader = async (
    doc: PDFKit.PDFDocument,
    config: IStatementConfig,
    logoPath: string,
    filterNote?: string
): Promise<void> => {
    // Add logo if exists
    try {
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, config.margins.left, 30, { width: 100 });
        }
    } catch (error) {
        console.error('Error loading logo:', error);
    }

    // Add title - LEFT ALIGNED
    doc.font(`${config.defaultFont}-Bold`)
        .fontSize(24)
        .fillColor(config.colors.primary)
        .text('CoopNest', config.margins.left, 40, { align: 'left' });

    doc.fontSize(16)
        .fillColor(config.colors.text)
        .text('Savings Statement', config.margins.left, doc.y, { align: 'left' });

    // Add filter note if provided - change to just show period
    if (filterNote) {
        // Extract just the period text, removing "Filtered Statement"
        const periodText = filterNote.replace('Filtered Statement (', '').replace(')', '');
        doc.fontSize(10)
            .fillColor(config.colors.secondary)
            .text(periodText, config.margins.left, doc.y + 5, { align: 'left' });
    }

    // Add current date
    doc.fontSize(10)
        .fillColor(config.colors.secondary)
        .text(
            `Generated on: ${new Date().toLocaleDateString('en-GB')}`,
            config.margins.left,
            doc.y + 5,
            { align: 'left' }
        );

    doc.y += 30; // Move down 30 pixels
};
