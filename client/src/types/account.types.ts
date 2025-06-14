export interface BankAccountVerification {
  accountNumber: string;
  bankCode: string;
  bvn?: string;
}

export interface BankAccount {
  id: string;
  bankId: string;
  accountNumber: string;
  accountName: string;
  bankName: string;
  bvn?: string;
  accountType: 'SAVINGS' | 'CURRENT';
  isVerified: boolean;
  isPrimary: boolean;
}

export interface AccountFilterParams {
  status?: string;
  verificationStatus?: string;
}
