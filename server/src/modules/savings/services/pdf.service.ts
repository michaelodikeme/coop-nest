import PDFDocument from 'pdfkit';
import { ISavingsStatement } from '../interfaces/savings.interface';
import { formatCurrency } from '../../../utils/formatters';
import path from 'path';
import fs from 'fs';

export const generateSavingsStatementPdf = async (
    statement: ISavingsStatement,
    dateRange?: { startDate: string; endDate: string }
): Promise<string> => {
    const doc = new PDFDocument({ margin: 50 });
    
    // Create a file path in a temporary directory
    const fileName = `savings_statement_${statement.memberInfo.erpId}_${Date.now()}.pdf`;
    const filePath = path.join(__dirname, '..', '..', '..', 'temp', fileName);
    
    // Ensure temp directory exists
    const tempDir = path.dirname(filePath);
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    // Pipe PDF to file
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Add cooperative logo and header
    doc.fontSize(23).text('CoopNest Savings Statement', { align: 'center' });
    doc.moveDown();

    // Add date range if provided
    if (dateRange) {
        doc.fontSize(12).text(`Period: ${dateRange.startDate} to ${dateRange.endDate}`, { align: 'center' });
        doc.moveDown();
    }

    // Member Information
    const member = statement.memberInfo;
    doc.fontSize(14).text('Member Information');
    doc.fontSize(10)
        .text(`Name: ${member.memberName}`)
        .text(`ERP ID: ${member.erpId}`)
        .text(`Staff No: ${member.staffNo}`)
        .text(`Department: ${member.department}`)
        .text(`Phone: ${member.phoneNumber}`);
    
    if (member.accountInfo.length > 0) {
        doc.text(`Bank: ${member.accountInfo[0].bankName}`)
            .text(`Account No: ${member.accountInfo[0].accountNo}`);
    }
    
    doc.moveDown();

    // Summary
    doc.fontSize(14).text('Summary');
    doc.fontSize(10)
        .text(`Balance: ${formatCurrency(statement.memberInfo.savings.balance)}`)
        .text(`Monthly Target: ${formatCurrency(statement.memberInfo.savings.monthlyTarget)}`);
    
    doc.moveDown();

    // Monthly Contributions Table
    doc.fontSize(14).text('Monthly Contributions');
    doc.moveDown();

    // Table headers with column widths
    const columns = {
        date: { x: 50, width: 100 },
        gross: { x: 150, width: 100 },
        savings: { x: 250, width: 100 },
        shares: { x: 350, width: 100 }
    };

    let currentY = doc.y;
    doc.fontSize(10);
    
    // Add headers
    doc.text('Month/Year', columns.date.x, currentY)
        .text('Gross Amount', columns.gross.x, currentY)
        .text('Savings', columns.savings.x, currentY)
        .text('Shares', columns.shares.x, currentY);
    
    // Add a line under headers
    currentY += 15;
    doc.moveTo(50, currentY)
       .lineTo(500, currentY)
       .stroke();
    
    currentY += 10;

    // Table rows with proper data access and formatting
    statement.memberInfo.transactions?.forEach((transaction) => {
        if (currentY > doc.page.height - 50) {
            doc.addPage();
            currentY = 50;
        }

        // Format the date
        const date = `${transaction.month}/${transaction.year}`;
        
        // Format the amounts using the formatCurrency utility
        const grossAmount = formatCurrency(transaction.grossAmount || 0);
        const savingsAmount = formatCurrency(transaction.savingsAmount || 0);
        const sharesAmount = formatCurrency(transaction.sharesAmount || 0);

        // Add row data with proper alignment
        doc.text(date, columns.date.x, currentY, { width: columns.date.width })
           .text(grossAmount, columns.gross.x, currentY, { width: columns.gross.width })
           .text(savingsAmount, columns.savings.x, currentY, { width: columns.savings.width })
           .text(sharesAmount, columns.shares.x, currentY, { width: columns.shares.width });

        currentY += 20;
    });

    // Add totals
    currentY += 10;
    doc.moveTo(50, currentY)
       .lineTo(500, currentY)
       .stroke();
    currentY += 10;

    // Calculate totals
    const totals = statement.memberInfo.transactions?.reduce((acc, curr) => ({
        gross: acc.gross + (curr.grossAmount || 0),
        savings: acc.savings + (curr.savingsAmount || 0),
        shares: acc.shares + (curr.sharesAmount || 0)
    }), { gross: 0, savings: 0, shares: 0 });

    // Add totals row
    doc.font('Helvetica-Bold')
       .text('Totals:', columns.date.x, currentY)
       .text(formatCurrency(totals?.gross || 0), columns.gross.x, currentY)
       .text(formatCurrency(totals?.savings || 0), columns.savings.x, currentY)
       .text(formatCurrency(totals?.shares || 0), columns.shares.x, currentY);

    // Footer
    doc.fontSize(8)
        .text(
            'This statement is computer generated and does not require a signature.',
            50,
            doc.page.height - 50,
            { align: 'center' }
        );

    // Finalize PDF
    doc.end();

    // Return promise that resolves when PDF is written
    return new Promise((resolve, reject) => {
        stream.on('finish', () => resolve(filePath));
        stream.on('error', reject);
    });
};