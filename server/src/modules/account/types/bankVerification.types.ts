export interface BankVerificationRequest {
  accountNumber: string;
  bankCode: string;
}

export interface BankVerificationResponse {
  firstName?: string;
  lastName?: string;
  otherName?: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  status: 'success' | 'error';
}

export interface BankVerificationError {
  status: 'error';
  message: string;
}