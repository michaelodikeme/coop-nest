import PDFDocument from 'pdfkit';
import { IStatementConfig } from '../../../interfaces/pdf.interface';
import { formatCurrency } from '../../../../../utils/formatters';

export const addSummary = (
    doc: PDFKit.PDFDocument,
    config: IStatementConfig,
    memberInfo: any,
    filterType?: 'ALL' | 'SAVINGS' | 'SHARES'
): void => {
    // Add section title - LEFT ALIGNED
    doc.font(`${config.defaultFont}-Bold`)
        .fontSize(14)
        .fillColor(config.colors.primary)
        .text('Account Summary', config.margins.left, doc.y, { align: 'left' })
        .moveDown(0.5);

    const startY = doc.y;

    // Determine which boxes to show based on filter type
    const showSavings = !filterType || filterType === 'ALL' || filterType === 'SAVINGS';
    const showShares = !filterType || filterType === 'ALL' || filterType === 'SHARES';

    // Count visible boxes to calculate width
    let visibleBoxCount = 0;
    if (showSavings) visibleBoxCount += 2; // Savings Balance + Monthly Target
    if (showShares) visibleBoxCount += 1;  // Total Shares

    const boxWidth = (doc.page.width - config.margins.left - config.margins.right - ((visibleBoxCount - 1) * 20)) / visibleBoxCount;
    const boxHeight = 80;

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

    let boxIndex = 0;

    // Draw summary boxes conditionally
    if (showSavings) {
        drawSummaryBox(
            'Total Savings Balance',
            formatCurrency(memberInfo.totalSavings || 0),
            config.margins.left + (boxIndex * (boxWidth + 20)),
            config.colors.primary
        );
        boxIndex++;

        drawSummaryBox(
            'Monthly Target',
            formatCurrency(memberInfo.savings?.monthlyTarget || 0),
            config.margins.left + (boxIndex * (boxWidth + 20))
        );
        boxIndex++;
    }

    if (showShares) {
        drawSummaryBox(
            'Total Shares Value',
            formatCurrency(memberInfo.totalShares || 0),
            config.margins.left + (boxIndex * (boxWidth + 20)),
            '#2e7d32' // Green color for shares
        );
    }

    doc.y = startY + boxHeight + 15; // Reduced spacing
};
