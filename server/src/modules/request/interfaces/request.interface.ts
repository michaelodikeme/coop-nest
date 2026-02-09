import { 
    RequestType, 
    RequestStatus, 
    RequestModule,
    ApprovalStatus
} from '@prisma/client';

export interface IRequestQueryParams {
    type?: RequestType;
    status?: RequestStatus;
    startDate?: Date;
    endDate?: Date;
    biodataId?: string;
    assignedTo?: string;
    initiatorId?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface IPaginatedRequestResponse {
    data: IRequest[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        statusCounts?: Record<string, number>;
    }
}

export interface IRequest {
    id: string;
    type: RequestType;
    module: RequestModule;
    status: RequestStatus;
    biodataId: string | null;
    savingsId?: string | null;
    loanId?: string | null;
    sharesId?: string | null;
    personalSavingsId?: string | null; // Add this line
    initiatorId: string;
    approverId?: string | null;
    content: any;
    metadata: any;
    nextApprovalLevel: number;
    notes?: string | null;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date | null;
    approvalSteps?: IApprovalStep[];
    biodata?: {
        id: string;
        fullName: string;
        department: string;
        erpId: string;
        emailAddress: string;
        phoneNumber: string;
    };
    initiator?: {
        id: string;
        username: string;
        firstName?: string | null;
    };
    approver?: {
        id: string;
        username: string;
        firstName?: string | null;
    };
    transactions?: any[];
}

export interface IApprovalStep {
    id: string;
    requestId: string;
    level: number;
    status: ApprovalStatus;
    approverRole: string;
    approverId?: string | null;
    approvedAt?: Date | null;
    notes?: string | null;
    approver?: {
        id: string;
        username: string;
        firstName?: string | null;
    };
}

export interface ICreateRequestInput {
    type: RequestType;
    module: RequestModule;
    biodataId?: string;
    savingsId?: string;
    loanId?: string;
    sharesId?: string;
    userId: string;
    content: any;
    metadata?: any;
    nextApprovalLevel?: number;
    notes?: string;
    personalSavingsId?: string; // Add this line
}

export interface IUpdateRequestStatusInput {
    requestId: string;
    status: RequestStatus;
    notes?: string;
    updatedBy: string;
}

export interface IRequestStatistics {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    cancelled: number;
    byType: Record<RequestType, number>;
}