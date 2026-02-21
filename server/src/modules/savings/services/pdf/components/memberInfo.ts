import PDFDocument from 'pdfkit';
import { IStatementConfig } from '../../../interfaces/pdf.interface';

export const addMemberInfo = (
    doc: PDFKit.PDFDocument,
    config: IStatementConfig,
    memberInfo: any
): void => {
    // Add section title - LEFT ALIGNED
    doc.font(`${config.defaultFont}-Bold`)
        .fontSize(14)
        .fillColor(config.colors.primary)
        .text('Member Information', config.margins.left, doc.y, { align: 'left' })
        .moveDown(0.5);

    const startY = doc.y;
    const labelX = config.margins.left;
    const valueX = config.margins.left + 90;
    const col2LabelX = doc.page.width / 2 + 10;
    const col2ValueX = col2LabelX + 90;
    const lineHeight = 18;

    doc.fontSize(10);

    // Helper function to add a field
    const addField = (label: string, value: string, x: number, valueX: number, y: number) => {
        doc.font(config.defaultFont)
            .fillColor(config.colors.secondary)
            .text(`${label}:`, x, y, { width: 85, align: 'left' });

        doc.font(`${config.defaultFont}-Bold`)
            .fillColor(config.colors.text)
            .text(value || 'N/A', valueX, y, { width: 200, align: 'left' });
    };

    // Left column
    addField('Name', memberInfo.memberName, labelX, valueX, startY);
    addField('ERP ID', memberInfo.erpId, labelX, valueX, startY + lineHeight);
    addField('Staff No', memberInfo.staffNo, labelX, valueX, startY + lineHeight * 2);

    // Right column
    addField('Department', memberInfo.department, col2LabelX, col2ValueX, startY);
    addField('Phone', memberInfo.phoneNumber, col2LabelX, col2ValueX, startY + lineHeight);

    const bankDetails = memberInfo.accountInfo?.length
        ? `${memberInfo.accountInfo[0].bankName}`
        : 'N/A';
    addField('Bank', bankDetails, col2LabelX, col2ValueX, startY + lineHeight * 2);

    doc.y = startY + lineHeight * 3 + 10;
    doc.moveDown(0.5);
};
