import PDFDocument from 'pdfkit';
import { IStatementConfig } from '../../../interfaces/pdf.interface';

export const addFooter = (
    doc: PDFKit.PDFDocument,
    config: IStatementConfig
): void => {
    // Add disclaimer
    doc.font(config.defaultFont)
        .fontSize(8)
        .fillColor(config.colors.secondary)
        .text(
            'This statement is computer generated and serves as an official record of your transactions. ' +
            'All amounts are in Nigerian Naira (NGN) unless otherwise stated.',
            config.margins.left,
            doc.page.height - config.footerHeight,
            { width: doc.page.width - config.margins.left - config.margins.right, align: 'center' }
        );

    // Add contact information
    doc.text(
        'For inquiries, contact your cooperative office or visit the member portal.',
        {
            width: doc.page.width - config.margins.left - config.margins.right,
            align: 'center'
        }
    );
};
