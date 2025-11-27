/**
 * Role and Permission Type Definitions
 */

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  approvalLevel: number;
  canApprove: boolean;
  moduleAccess: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleInput {
  name: string;
  description?: string;
  permissions: string[];
  approvalLevel: number;
  canApprove: boolean;
  moduleAccess: string[];
}

export interface UpdateRoleInput {
  description?: string;
  permissions?: string[];
  approvalLevel?: number;
  canApprove?: boolean;
  moduleAccess?: string[];
}

export interface Permission {
  name: string;
  description: string;
  module: string;
  action: string;
  requiredApprovalLevel?: number;
}

export enum Module {
  ADMIN = 'ADMIN',
  ACCOUNT = 'ACCOUNT',
  USER = 'USER',
  LOAN = 'LOAN',
  SAVINGS = 'SAVINGS',
  SHARES = 'SHARES',
  SYSTEM = 'SYSTEM',
  REPORTS = 'REPORTS',
  TRANSACTION = 'TRANSACTION',
  REQUEST = 'REQUEST',
  MEMBERS = 'MEMBERS',
  ROLES = 'ROLES',
}

export enum Action {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  APPROVE = 'APPROVE',
  REVIEW = 'REVIEW',
  VERIFY = 'VERIFY',
  MANAGE = 'MANAGE',
  DISBURSE = 'DISBURSE',
  WITHDRAW = 'WITHDRAW',
  REQUEST = 'REQUEST',
}