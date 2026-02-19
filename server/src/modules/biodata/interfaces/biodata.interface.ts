import { MembershipStatus } from '@prisma/client';

export interface IBiodata {
  id: string;
  erpId: string;
  ippisId?: string;
  staffNo?: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  fullName: string;
  dateOfBirth?: Date | null;
  dateOfEmployment?: Date | null;
  department: string;
  residentialAddress?: string | null;
  emailAddress: string;
  phoneNumber: string;
  nextOfKin?: string | null;
  relationshipOfNextOfKin?: string | null;
  nextOfKinPhoneNumber?: string | null;
  nextOfKinEmailAddress?: string | null;
  maritalStatus?: string | null;
  membershipStatus: MembershipStatus;
  profilePhoto?: string | null;
  isApproved: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Include relationships as needed
  users?: {
    id: string;
    username?: string;
    emailAddress?: string;
    isActive: boolean;
    isMember: boolean;
  }[];
  accountInfo?: {
    id: string;
    accountNumber: string;
    accountName: string;
    bankId: string;
    bank?: {
      id: string;
      name: string;
      code: string;
    };
  }[];
}

// Add your existing interfaces here as well
export interface ICreateBiodataInput {
  erpId: string;
  ippisId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfEmployment: Date;
  staffNo: string;
  department: string;
  residentialAddress: string;
  emailAddress: string;
  phoneNumber: string;
  nextOfKin: string;
  relationshipOfNextOfKin: string;
  nextOfKinPhoneNumber: string;
  nextOfKinEmailAddress: string;
  profilePhoto?: string;
}

export interface IUpdateBiodataInput {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  dateOfEmployment?: Date;
  staffNo?: string;
  department?: string;
  residentialAddress?: string;
  emailAddress?: string;
  phoneNumber?: string;
  nextOfKin?: string;
  relationshipOfNextOfKin?: string;
  nextOfKinPhoneNumber?: string;
  nextOfKinEmailAddress?: string;
  profilePhoto?: string;
}

export interface IApproveLegacyBiodataInput {
  biodataId: string;
  approverNotes?: string;
}

export interface IApproveBiodataRequestInput {
  requestId: string;
  approverNotes?: string;
}

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
}

export interface ICreateAccountInfoInput {
  bankId: string;
  accountNumber: string;
  bvn: string;
  accountName: string;
}

export interface IBiodataWithRelations extends IBiodata {
  accountInfo?: IAccountInfo[];
  users?: {
    id: string;
    username?: string;
    emailAddress?: string;
    isActive: boolean;
    isMember: boolean;
  }[];
}

export interface IBiodataQueryFilters {
  erpId?: string;
  ippisId?: string;
  staffNo?: string;
  department?: string;
  isVerified?: boolean;
  isApproved?: boolean;
  isDeleted?: boolean;
  membershipStatus?: MembershipStatus;
  searchTerm?: string; // For searching across name fields
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface IVerifyBiodataInput {
  phoneNumber: string;
  verifierNotes?: string;
}

export interface IVerifyBiodataResponse {
  status: 'pending' | 'success';
  message: string;
  biodataId: string;
}

export interface IApproveBiodataInput {
  biodataId: string;
  approverNotes?: string;
}

export interface IBiodataStatusUpdate {
  membershipStatus: MembershipStatus;
  reason: string;
}

export interface IBiodataValidationResult {
  isValid: boolean;
  errors: {
    field: string;
    message: string;
  }[];
  data?: IBiodataUpload;
}

// Request types for biodata approval workflow
export interface IBiodataApprovalRequest {
  biodataId: string;
  requestType: 'BIODATA_APPROVAL' | 'BIODATA_UPDATE';
  content: {
    changes?: Partial<IBiodata>;
    notes?: string;
  };
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}

export interface IBiodataUpload {
  erpId: string;
  ippisId: string;
  name: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfEmployment: Date;
  department: string;
  staffNo: string;
  residentialAddress: string;
  emailAddress: string;
  phoneNumber: string;
  nextOfKin: string;
  relationshipOfNextOfKin: string;
  nextOfKinPhoneNumber: string;
  nextOfKinEmailAddress?: string;
}

export interface IBiodataUploadResponse {
  successful: number;
  failed: number;
  errors: Array<{
    data: any;
    errors: string[];
  }>;
  requestId: string;  // Added this field
}

export interface UploadContent {
  totalRecords: number;
  validRecords: number;
  failedRecords: number;
  records: any[];
}

export interface IBiodataUploadRequest {
  file: Buffer;
  uploaderId: string;
  fileType: string,
}

export interface IPhoneVerificationResponse {
  status: string;
  biodataId: string;
}

export interface IOtpVerificationResponse {
  status: 'success';
  message: string;
  biodataId: string;
}