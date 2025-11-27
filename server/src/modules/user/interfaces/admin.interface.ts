import { Request } from 'express';

// Extend Express Request to include authenticated user
export interface AuthRequest extends Request {
  user: {
    id: string;
    biodataId: string;
    role: {
      name: string;
      isAdmin: boolean;
    };
    permissions?: string[];
    approvalLevel: number;
  };
  session?: {
    id: string;
  };
}

export interface IAdminProfileInput {
    firstName: string;
    lastName: string;
    emailAddress: string;
    phoneNumber: string;
    department: string;
    staffId: string;
    position: string;
    isActive?: boolean;
}

export interface ICreateAdminUserInput {
    adminProfileId: string;
    username: string;
    password: string;
    roleIds?: string[];
}

export interface IAdminProfile {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
    emailAddress: string;
    phoneNumber: string;
    department: string;
    staffId: string;
    isActive: boolean;
    isVerified: boolean;
}

export interface IVerifyAdminProfileInput {
    phoneNumber: string;
}

export interface IVerifyAdminProfileResponse {
    status: string;
    message: string;
    adminProfileId: string;
}

export interface IOtpVerificationResponse {
    status: string;
    message: string;
    adminProfileId: string;
    isVerified: boolean;
    isActive: boolean;
}