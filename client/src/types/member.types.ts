import { AccountInfo } from "./financial.types";
import { AdminProfile } from "./auth.types";
import { Notification } from "./notification.types";

// export interface BankAccount {
//   id?: string;
//   accountNumber: string;
//   isVerified?: boolean;
// }
export interface MemberRegistrationData {
  // Personal Information
  firstName: string
  middleName?: string
  lastName: string
  dateOfBirth?: string
  maritalStatus?: string

  // Employment Information
  erpId: string
  ippisId: string
  staffNo: string
  department: string
  dateOfEmployment: string

  // Contact Information
  emailAddress: string
  phoneNumber: string
  residentialAddress: string

  // Next of Kin Information
  nextOfKin: string
  relationshipOfNextOfKin: string
  nextOfKinPhoneNumber: string
  nextOfKinEmailAddress: string

  // Optional profile photo
  profilePhoto?: string
}

export interface MemberRegistrationResponse {
  success: boolean
  message: string
  data: {
    biodataId: string
    requestId: string
    status: "PENDING" | "APPROVED" | "REJECTED"
  }
}

export interface MemberFilterParams {
  department?: string;
  isVerified?: boolean;
  membershipStatus?: string;
  searchTerm?: string;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export interface Member extends Omit<Biodata, 'id' | 'createdAt' | 'updatedAt'> {
  data: any;
  // data: any;
  id: string;
  biodata: Biodata;
  biodataId: string;
  username: string;
  password: string;
  isActive: boolean;
  isMember: boolean;
  createdAt: string;
  updatedAt: string;
  roleAssignment: {
    id: string;
    userId: string;
    roleId: string;
    assignedAt: string;
    expiresAt: string | null;
    isActive: boolean;
    role: {
      id: string;
      name: string;
      description: string;
      permissions: string[];
      approvalLevel: number;
      canApprove: boolean;
      moduleAccess: string[];
      createdAt: string;
      updatedAt: string;
    };
  };
  adminProfile: AdminProfile | null;
  notifications: Notification[];
}

export interface Biodata {
  id: string;
  erpId: string;
  ippisId: string;
  firstName: string;
  middleName: string;
  lastName: string;
  fullName: string;
  dateOfEmployment: string;
  staffNo: string;
  department: string;
  residentialAddress: string;
  emailAddress: string;
  phoneNumber: string;
  nextOfKin: string;
  relationshipOfNextOfKin: string;
  nextOfKinPhoneNumber: string;
  nextOfKinEmailAddress: string;
  profilePhoto: string | null;
  isVerified: boolean;
  isApproved: boolean;
  isDeleted: boolean;
  membershipStatus: MembershipStatus;
  comments?: string;
  createdAt: string;
  updatedAt: string;
  accountInfo?: AccountInfo
};

export interface BiodataUploadRecord {
  id: string;
  status: string;
  createdAt: string;
  createdBy: string;
  totalRecords: number;
  processedRecords: number;
  fileName: string;
}

export interface UploadRequestDetails extends BiodataUploadRecord {
  approvedBy?: {
    id: string;
    username: string;
  };
  rejectedBy?: {
    id: string;
    username: string;
  };
  failedRecords: number;
  records: Array<{
    row: number;
    status: string;
    data: any;
    error?: string;
  }>;
}

export enum MembershipStatus {
    PENDING = "PENDING",
    ACTIVE = "ACTIVE",
    SUSPENDED = "SUSPENDED",
    RESIGNED = "RESIGNED",
    TERMINATED = "TERMINATED",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
}

export interface MemberFormData {
  erpId: string;
  ippisId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfEmployment: string;
  staffNo: string;
  department: string;
  residentialAddress: string;
  emailAddress: string;
  phoneNumber: string;
  nextOfKin: string; // This is correct - it's a string for the full name
  relationshipOfNextOfKin: string;
  nextOfKinPhoneNumber: string;
  nextOfKinEmailAddress: string;
  profilePhoto?: string;
}
