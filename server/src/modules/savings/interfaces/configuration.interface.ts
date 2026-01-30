import { Decimal } from "@prisma/client/runtime/library";

export interface ISavingsSettingValue {
  value: Decimal;
  lastUpdated: Date;
  updatedById: string;
  updatedByName?: string;
}

export interface ISavingsConfiguration {
  shareAmount: Decimal;
  minimumSavingsAmount: Decimal;
  lastUpdated: Date;
  updatedBy: {
    id: string;
    name: string;
  };
}

export interface IConfigurationUpdateInput {
  shareAmount?: number;
  minimumSavingsAmount?: number;
  reason: string; // Required for audit logging
}

export interface ISavingsValidationError {
  message: string;
  code: string;
  field?: keyof ISavingsConfiguration;
}
