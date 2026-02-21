import PDFDocument from 'pdfkit';
import { IStatementConfig, ITransactionRow } from '../../../interfaces/pdf.interface';
import { formatCurrency } from '../../../../../utils/formatters';

export const addTransactionTable = (
    doc: PDFKit.PDFDocument,
    config: IStatementConfig,
    transactions: ITransactionRow[]
): void => {
    // Add section title - LEFT ALIGNED
    doc.font(`${config.defaultFont}-Bold`)
        .fontSize(14)
        .fillColor(config.colors.primary)
        .text('Transaction History', config.margins.left, doc.y, { align: 'left' })
        .moveDown(0.5);

    const columns = {
        date: { x: config.margins.left, width: 70 },
        type: { x: config.margins.left + 75, width: 120 },
        baseType: { x: config.margins.left + 200, width: 50 },
        amount: { x: config.margins.left + 255, width: 85 },
        description: { x: config.margins.left + 350, width: 210 }
    };

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
            .fontSize(9);

        // Draw cells
        Object.entries(data).forEach(([key, value]) => {
            const col = columns[key as keyof typeof columns];
            const align = key === 'amount' ? 'right' : 'left';
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
        date: 'Date',
        type: 'Transaction Type',
        baseType: 'Type',
        amount: 'Amount',
        description: 'Description'
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
                date: 'Date',
                type: 'Transaction Type',
                baseType: 'Type',
                amount: 'Amount',
                description: 'Description'
            }, doc.y, true);
            doc.y += 20;
        }

        // Format date
        const dateStr = new Date(transaction.date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        // Draw transaction row
        drawTableRow({
            date: dateStr,
            type: transaction.transactionType,
            baseType: transaction.baseType,
            amount: formatCurrency(transaction.amount || 0),
            description: transaction.description || 'N/A'
        }, doc.y, false, index % 2 === 1);
        doc.y += 25;
    });

    // Draw footer line
    doc.strokeColor(config.colors.border)
        .moveTo(config.margins.left, doc.y - 10)
        .lineTo(doc.page.width - config.margins.right, doc.y - 10)
        .stroke();

    doc.y += 15; // Reduced spacing
};
