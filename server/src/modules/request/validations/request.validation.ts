import { z } from 'zod';
import { RequestStatus, RequestType, RequestModule } from '@prisma/client';

// Request query parameters schema
export const requestQuerySchema = z.object({
    type: z.enum([
        RequestType.ACCOUNT_CREATION,
        RequestType.LOAN_APPLICATION, 
        RequestType.BIODATA_UPDATE, 
        RequestType.ACCOUNT_UPDATE, 
        RequestType.SAVINGS_WITHDRAWAL,
        RequestType.ACCOUNT_CLOSURE,
        RequestType.LOAN_DISBURSEMENT,
        RequestType.BULK_UPLOAD,
        RequestType.SYSTEM_ADJUSTMENT,
        RequestType.ACCOUNT_VERIFICATION,
        RequestType.PERSONAL_SAVINGS_CREATION,
        RequestType.PERSONAL_SAVINGS_WITHDRAWAL
    ]).optional(),
    status: z.enum([
        RequestStatus.PENDING, 
        RequestStatus.IN_REVIEW, 
        RequestStatus.REVIEWED, 
        RequestStatus.APPROVED, 
        RequestStatus.REJECTED, 
        RequestStatus.COMPLETED, 
        RequestStatus.CANCELLED
    ]).optional(),
    startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
    endDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
    sortBy: z.string().optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Create request schema
export const createRequestSchema = z.object({
    type: z.enum([
        RequestType.LOAN_APPLICATION, 
        RequestType.BIODATA_UPDATE, 
        RequestType.ACCOUNT_UPDATE, 
        RequestType.SAVINGS_WITHDRAWAL,
        RequestType.ACCOUNT_CREATION,
        RequestType.ACCOUNT_CLOSURE
    ]),
    module: z.enum([
        RequestModule.LOAN, 
        RequestModule.SYSTEM, 
        RequestModule.ACCOUNT, 
        RequestModule.SAVINGS,
        RequestModule.SHARES
    ]),
    biodataId: z.string().uuid().optional(),
    savingsId: z.string().uuid().optional(),
    loanId: z.string().uuid().optional(),
    sharesId: z.string().uuid().optional(),
    content: z.record(z.any()),
    metadata: z.record(z.any()).optional(),
    notes: z.string().optional()
});

// Update request status schema
export const updateRequestStatusSchema = z.object({
    status: z.enum([
        RequestStatus.PENDING, 
        RequestStatus.IN_REVIEW, 
        RequestStatus.REVIEWED, 
        RequestStatus.APPROVED, 
        RequestStatus.REJECTED, 
        RequestStatus.COMPLETED, 
        RequestStatus.CANCELLED
    ]),
    notes: z.string().optional()
});

// Request ID schema
export const requestIdSchema = z.object({
    id: z.string().uuid()
});