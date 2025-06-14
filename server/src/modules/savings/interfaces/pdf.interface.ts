import { TransactionStatus } from '@prisma/client';
import PDFDocument from 'pdfkit';

export interface IStatementConfig {
    margins: {
        top: number;
        bottom: number;
        left: number;
        right: number;
    };
    headerHeight: number;
    footerHeight: number;
    pageSize: string;
    defaultFont: string;
    colors: {
        primary: string;
        secondary: string;
        text: string;
        border: string;
    };
}

export interface IPdfOptions {
    size: string;
    margin: {
        top: number;
        bottom: number;
        left: number;
        right: number;
    };
    layout: 'portrait' | 'landscape';
    bufferPages: boolean;
    autoFirstPage: boolean;
}


export interface ITransactionRow {
    month: number;
    year: number;
    grossAmount: number;
    savingsAmount: number;
    sharesAmount: number;
    status: TransactionStatus;
}
