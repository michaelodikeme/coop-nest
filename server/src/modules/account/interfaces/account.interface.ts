import { AccountInfo, Bank } from '@prisma/client';
import { RequestType, RequestStatus } from '@prisma/client';

export interface IAccountInfo {
  id: string;
  biodataId: string;
  bankId: string;
  accountNumber: string;
  bvn: string;
  accountName: string;
  isVerified: boolean;
  verificationDate?: Date;
  verifiedBy?: string;
  bank?: Bank;
}

export interface ICreateAccountInput {
  biodataId: string;
  bankId: string;
  accountNumber: string;
  bvn: string;
  accountName: string;
}

export interface IUpdateAccountInput {
  bankId?: string;
  accountNumber?: string;
  bvn?: string;
  accountName?: string;
}

export interface IAccountVerificationInput {
  accountNumber: string;
  bankCode: string;
}

export interface IAccountVerificationResult {
  success: boolean;
  accountName?: string;
  message?: string;
}

export interface IAccountRequest {
  type: RequestType;
  biodataId: string;
  content: {
    accountInfo: Partial<IAccountInfo>;
    reason?: string;
  };
  status: RequestStatus;
}

export interface AccountFilters {
  biodataId?: string;
  [key: string]: any;
}

export interface IAccountQueryFilters {
  biodataId?: string;
  bankId?: string;
  isVerified?: boolean;
}

export interface IAccountService {
  createAccount(input: ICreateAccountInput): Promise<AccountInfo>;
  getAccountById(id: string): Promise<AccountInfo | null>;
  getAccounts(filters?: IAccountQueryFilters): Promise<AccountInfo[]>;
  requestAccountUpdate(accountId: string, updates: IUpdateAccountInput): Promise<IAccountRequest>;
  verifyAccount(input: IAccountVerificationInput): Promise<IAccountVerificationResult>;
  processAccountUpdateRequest(requestId: string, approved: boolean, notes?: string): Promise<AccountInfo>;
}