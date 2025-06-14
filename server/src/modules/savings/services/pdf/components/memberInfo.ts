import PDFDocument from 'pdfkit';
import { IStatementConfig } from '../../../interfaces/pdf.interface';

export const addMemberInfo = (
    doc: PDFKit.PDFDocument,
    config: IStatementConfig,
    memberInfo: any
): void => {
    // Add section title
    doc.font(`${config.defaultFont}-Bold`)
        .fontSize(14)
        .fillColor(config.colors.primary)
        .text('Member Information')
        .moveDown(0.5);

    // Create a grid layout for member info
    const startY = doc.y;
    const colWidth = (doc.page.width - config.margins.left - config.margins.right) / 2;

    // Left column
    doc.font(config.defaultFont)
        .fontSize(14)
        .fillColor(config.colors.text);

    [
        { label: 'Name', value: memberInfo.memberName },
        { label: 'ERP ID', value: memberInfo.erpId },
        { label: 'Staff No', value: memberInfo.staffNo }
    ].forEach((item, index) => {
        doc.text(
            `${item.label}:`,
            config.margins.left,
            startY + (index * 20),
            { continued: true, width: 100 }
        )
        .font(`${config.defaultFont}-Bold`)
        .text(item.value || 'N/A', { width: colWidth - 50 })
        .font(config.defaultFont);
    });

    // Right column
    [
        { label: 'Department', value: memberInfo.department },
        { label: 'Phone', value: memberInfo.phoneNumber },
        {            label: 'Bank Details',
            value: memberInfo.accountInfo?.length
                ? `${memberInfo.accountInfo[0].bankName} - ${memberInfo.accountInfo[0].accountNo} (${memberInfo.accountInfo[0].accountName})`
                : 'N/A'
        }
    ].forEach((item, index) => {
        doc.text(
            `${item.label}:`,
            config.margins.left + colWidth,
            startY + (index * 20),
            { continued: true, width: 70 }
        )
        .font(`${config.defaultFont}-Bold`)
        .text(item.value || 'N/A', { width: colWidth - 70 })
        .font(config.defaultFont);
    });

    doc.y = startY + 80;
    doc.moveDown();
};
