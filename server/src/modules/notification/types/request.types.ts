import { RequestStatus, RequestType } from '@prisma/client';

export interface CreateRequestDTO {
  biodataId: string;
  userId: string;
  type: RequestType;
  details: any;
}

export interface UpdateRequestDTO {
  status: RequestStatus;
  adminNotes?: string;
}

export interface FilterOptions {
  type?: RequestType;
  status?: RequestStatus;
  biodataId?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface RequestResponse {
  requests: any[];
  total: number;
  page: number;
  totalPages: number;
}