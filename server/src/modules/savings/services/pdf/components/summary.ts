import PDFDocument from 'pdfkit';
import { IStatementConfig } from '../../../interfaces/pdf.interface';
import { formatCurrency } from '../../../../../utils/formatters';

export const addSummary = (
    doc: PDFKit.PDFDocument,
    config: IStatementConfig,
    memberInfo: any
): void => {
    // Add section title
    doc.font(`${config.defaultFont}-Bold`)
        .fontSize(14)
        .fillColor(config.colors.primary)
        .text('Account Summary')
        .moveDown(0.5);

    // Create boxes for summary info
    const boxWidth = (doc.page.width - config.margins.left - config.margins.right - 40) / 3;
    const boxHeight = 80;
    const startY = doc.y;

    // Helper function to draw a summary box
    const drawSummaryBox = (
        title: string,
        value: string,
        x: number,
        textColor: string = config.colors.text
    ) => {
        // Draw box
        doc.roundedRect(x, startY, boxWidth, boxHeight, 5)
            .fillAndStroke('#f8f9fa', config.colors.border);

        // Add title
        doc.font(config.defaultFont)
            .fontSize(10)
            .fillColor(config.colors.secondary)
            .text(title, x + 10, startY + 15, { width: boxWidth - 20 });

        // Add value
        doc.font(`${config.defaultFont}-Bold`)
            .fontSize(16)
            .fillColor(textColor)
            .text(value, x + 10, startY + 35, { width: boxWidth - 20, align: 'center' });
    };

    // Draw summary boxes
    drawSummaryBox(
        'Total Savings Balance',
        formatCurrency(memberInfo.savings?.balance || 0),
        config.margins.left,
        config.colors.primary
    );

    drawSummaryBox(
        'Monthly Target',
        formatCurrency(memberInfo.savings?.monthlyTarget || 0),
        config.margins.left + boxWidth + 20
    );

    drawSummaryBox(
        'Total Shares Value',
        formatCurrency(memberInfo.shares?.totalValue || 0),
        config.margins.left + (boxWidth + 20) * 2,
        '#2e7d32' // Green color for shares
    );

    doc.y = startY + boxHeight + 20;
    doc.moveDown();
};
