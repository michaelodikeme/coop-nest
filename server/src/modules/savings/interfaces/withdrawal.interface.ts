import { TransactionStatus, RequestStatus } from '@prisma/client';

export interface WithdrawalRequestInput {
    biodataId: string;
    amount: number;
    reason: string;
    userId: string; // ID of the user making the request
    erpId: string; // Member ERP ID
}

export interface WithdrawalQueryParams {
    biodataId?: string;
    status?: TransactionStatus;
    page?: number;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface UpdateWithdrawalStatusInput {
    withdrawalId: string;
    status: RequestStatus; // New status to set
    notes?: string;
    updatedBy: string; // User ID of the person updating status
}
