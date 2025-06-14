import { RequestStatus, RequestType } from '@prisma/client';

export interface CreateRequestInput {
  biodataId: string;
  type: RequestType;
  details: Record<string, any>;
  userId: string;
}

export interface UpdateRequestInput {
  status: RequestStatus;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
}

export interface RequestResponse {
  id: string;
  biodataId: string;
  userId: string;
  type: RequestType;
  status: RequestStatus;
  details: Record<string, any>;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface RequestFilter {
  type?: RequestType;
  status?: RequestStatus;
  userId?: string;
  biodataId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedRequestResponse {
  data: RequestResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}