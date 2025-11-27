import { Module } from '../../../types/permissions';

export interface IRole {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  approvalLevel: number;
  canApprove: boolean;
  moduleAccess: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateRoleInput {
  name: string;
  description?: string;
  permissions: string[];
  approvalLevel: number;
  canApprove: boolean;
  moduleAccess: string[];
}

export interface IUpdateRoleInput {
  description?: string;
  permissions?: string[];
  approvalLevel?: number;
  canApprove?: boolean;
  moduleAccess?: string[];
}

export interface IRoleQueryFilters {
  approvalLevel?: number;
  canApprove?: boolean;
  // moduleAccess?: string[];
}
