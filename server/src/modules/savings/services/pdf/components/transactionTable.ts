import PDFDocument from 'pdfkit';
import { IStatementConfig, ITransactionRow } from '../../../interfaces/pdf.interface';
import { formatCurrency } from '../../../../../utils/formatters';

export const addTransactionTable = (
    doc: PDFKit.PDFDocument,
    config: IStatementConfig,
    transactions: ITransactionRow[]
): void => {
    // Add section title
    doc.font(`${config.defaultFont}-Bold`)
        .fontSize(14)
        .fillColor(config.colors.primary)
        .text('Transaction History')
        .moveDown(0.5);

    const columns = {
        date: { x: config.margins.left, width: 100 },
        gross: { x: config.margins.left + 100, width: 120 },
        savings: { x: config.margins.left + 220, width: 120 },
        shares: { x: config.margins.left + 340, width: 120 },
        status: { x: config.margins.left + 460, width: 100 }
    };

    // Calculate totals while rendering
    let totalGross = 0;
    let totalSavings = 0;
    let totalShares = 0;

    // Helper function to draw a row
    const drawTableRow = (
        data: { [key: string]: any },
        y: number,
        isHeader: boolean = false,
        isAlternate: boolean = false
    ) => {
        // Draw row background for alternate rows
        if (!isHeader && isAlternate) {
            doc.fillColor('#f8f9fa')
                .rect(config.margins.left, y - 5, doc.page.width - config.margins.left - config.margins.right, 25)
                .fill();
        }

        doc.fillColor(isHeader ? config.colors.primary : config.colors.text);

        // Adjust font based on row type
        doc.font(isHeader ? `${config.defaultFont}-Bold` : config.defaultFont)
            .fontSize(10);

        // Draw cells
        Object.entries(data).forEach(([key, value]) => {
            const col = columns[key as keyof typeof columns];
            const align = key === 'date' ? 'left' : 'right';
            doc.text(
                value.toString(),
                col.x,
                y,
                { width: col.width, align }
            );
        });
    };

    // Draw headers
    drawTableRow({
        date: 'Period',
        gross: 'Gross Amount',
        savings: 'Savings',
        shares: 'Shares',
        status: 'Status'
    }, doc.y, true);
    doc.y += 20;

    // Draw horizontal line after headers
    doc.strokeColor(config.colors.border)
        .moveTo(config.margins.left, doc.y - 10)
        .lineTo(doc.page.width - config.margins.right, doc.y - 10)
        .stroke();

    // Draw transaction rows
    transactions.forEach((transaction, index) => {
        // Check if we need a new page
        if (doc.y > doc.page.height - 150) {
            doc.addPage();
            // Redraw headers on new page
            drawTableRow({
                date: 'Period',
                gross: 'Gross Amount',
                savings: 'Savings',
                shares: 'Shares',
                status: 'Status'
            }, doc.y, true);
            doc.y += 20;
        }

        // Update totals
        totalGross += transaction.grossAmount;
        totalSavings += transaction.savingsAmount;
        totalShares += transaction.sharesAmount;        // Draw transaction row
        drawTableRow({
            date: `${transaction.month}/${transaction.year}`,
            gross: formatCurrency(transaction.grossAmount || 0),
            savings: formatCurrency(transaction.savingsAmount || 0),
            shares: formatCurrency(transaction.sharesAmount || 0),
            status: transaction.status
        }, doc.y, false, index % 2 === 1);
        doc.y += 25;
    });

    // Draw footer line
    doc.strokeColor(config.colors.border)
        .moveTo(config.margins.left, doc.y - 10)
        .lineTo(doc.page.width - config.margins.right, doc.y - 10)
        .stroke();

    // Draw totals row
    doc.y += 5;
    drawTableRow({
        date: 'Total',
        gross: formatCurrency(totalGross),
        savings: formatCurrency(totalSavings),
        shares: formatCurrency(totalShares),
        status: ''
    }, doc.y, true);
    doc.y += 30;

    doc.moveDown();
};
