// Enums

/**
* Request types from your backend
*/
export enum RequestType {
  LOAN_APPLICATION = 'LOAN_APPLICATION',
  BIODATA_UPDATE = 'BIODATA_UPDATE',
  ACCOUNT_UPDATE = 'ACCOUNT_UPDATE',
  SAVINGS_WITHDRAWAL = 'SAVINGS_WITHDRAWAL',
  ACCOUNT_CLOSURE = 'ACCOUNT_CLOSURE',
  ACCOUNT_CREATION = 'ACCOUNT_CREATION',
  LOAN_DISBURSEMENT = 'LOAN_DISBURSEMENT',
  BULK_UPLOAD = 'BULK_UPLOAD',
  SYSTEM_ADJUSTMENT = 'SYSTEM_ADJUSTMENT',
  ACCOUNT_VERIFICATION = 'ACCOUNT_VERIFICATION',
  PERSONAL_SAVINGS_CREATION = 'PERSONAL_SAVINGS_CREATION',
  PERSONAL_SAVINGS_WITHDRAWAL = 'PERSONAL_SAVINGS_WITHDRAWAL'
}

/**
* Request status values
*/
export enum RequestStatus {
  PENDING = 'PENDING',
  IN_REVIEW = 'IN_REVIEW',
  REVIEWED = 'REVIEWED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

/**
* Request module types
*/
export enum RequestModule {
  ADMIN = 'ADMIN',
  ACCOUNT = 'ACCOUNT',
  USER = 'USER',
  LOAN = 'LOAN',
  SAVINGS = 'SAVINGS',
  SHARES = 'SHARES',
  SYSTEM = 'SYSTEM'
}

/**
* Request priority levels
*/
export enum RequestPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

/**
* Request query parameters interface
*/
export interface RequestQueryParams {
  searchTerm?: string;
  page?: number;
  limit?: number;
  total?: number;
  type?: RequestType;
  status?: RequestStatus;
  biodataId?: string;
  initiatorId?: string;
  assignedTo?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  where?: any;
}

// export interface IRequestQueryParams {
//   type?: RequestType;
//   status?: RequestStatus;
//   startDate?: Date;
//   endDate?: Date;
//   biodataId?: string;
//   assignedTo?: string;
//   initiatorId?: string;
//   page?: number;
//   limit?: number;
//   sortBy?: string;
//   sortOrder?: 'asc' | 'desc';
// }


/**
* Approval step interface
*/
export interface ApprovalStep {
  id: string;
  requestId: string;
  level: number;
  status: string;
  approverRole: string;
  approverId?: string;
  approvedAt?: string;
  notes?: string;
  approver?: {
    id: string;
    username: string;
    firstName?: string;
  };
}

/**
* Request types from your backend
*/
export interface Request {
  displayStatus: string;
  data: any;
  targetAmount: any;
  id: string;
  type: RequestType;
  module: RequestModule;
  status: RequestStatus;
  priority: RequestPriority;
  content: Record<string, any>;
  metadata: Record<string, any>;
  initiatorId: string;
  assigneeId?: string;
  approverId?: string;
  nextApprovalLevel: number;
  loanId?: string;
  savingsId?: string;
  biodataId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  biodata?: {
    id: string;
    fullName: string;
    department?: string;
    erpId?: string;
    emailAddress?: string;
    phoneNumber?: string;
  };
  initiator?: {
    id: string;
    username: string;
    firstName?: string;
  };
  approver?: {
    id: string;
    username: string;
    firstName?: string;
  };
  approvalSteps?: ApprovalStep[];
}

/**
* Request creation interface
*/
export interface CreateRequestInput {
  type: RequestType;
  module: RequestModule;
  biodataId?: string;
  savingsId?: string;
  loanId?: string;
  content: Record<string, any>;
  metadata?: Record<string, any>;
  notes?: string;
}

/**
* Request statistics interface
*/
export interface RequestStatistics {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
  byType: Record<RequestType, number>;
}

// Define consistent meta information structure
export interface RequestMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Define the structure for paginated response
export interface PaginatedResponse<T> {
  data: T[];
  meta: RequestMeta;
}

// Define the API response type
export interface ApiResponse<T> {
  data: T;
  status: string;
}
