import { Decimal } from '@prisma/client/runtime/library';

export interface ILoanRepaymentUploadRow {
  erpId: string;
  amount: Decimal;
  month: number;
  year: number;
  description: string;
  loanTypeId?: string; // Resolved during processing
}

export interface ILoanRepaymentUploadSheetResult {
  sheetName: string;
  totalRows: number;
  successfulRows: number;
  failedRows: Array<{
    row: number;
    erpId?: string;
    error: string;
  }>;
}

export interface ILoanRepaymentUploadResult {
  totalSheets: number;
  totalSuccessful: number;
  totalFailed: number;
  sheetResults: ILoanRepaymentUploadSheetResult[];
}
