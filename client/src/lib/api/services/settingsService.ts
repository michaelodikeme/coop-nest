import { apiService } from '@/lib/api/apiService';

// System Settings Types
export interface SystemSettingsData {
  organizationName: string;
  organizationShortName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  logoUrl?: string;
  websiteUrl?: string;
  enableMemberRegistration: boolean;
  enablePublicWebsite: boolean;
}

// Security Settings Types
export interface SecuritySettingsData {
  passwordMinLength: number;
  passwordRequiresLowercase: boolean;
  passwordRequiresUppercase: boolean;
  passwordRequiresNumbers: boolean;
  passwordRequiresSymbols: boolean;
  mfaEnabled: boolean;
  sessionTimeout: number;
  sessionTimeoutUnit: 'minutes' | 'hours' | 'days';
  loginAttempts: number;
  lockoutDuration: number;
}

// Notification Settings Types
export interface NotificationSettingsData {
  enableEmailNotifications: boolean;
  enableSmsNotifications: boolean;
  enablePushNotifications: boolean;
  notifyOnNewMembers: boolean;
  notifyOnLoanRequests: boolean;
  notifyOnLoanApprovals: boolean;
  notifyOnDepositConfirmations: boolean;
  dailyDigest: boolean;
  weeklyReport: boolean;
  monthlyStatement: boolean;
}

// Advanced Settings Types
export interface AdvancedSettingsData {
  maintenanceMode: boolean;
  debugMode: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug' | 'trace';
  apiTimeout: number;
  cacheExpiration: number;
  maxUploadSize: number;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  allowDataExport: boolean;
  enableApiLogs: boolean;
}

// Complete Settings Type
export interface SettingsData {
  general: SystemSettingsData;
  security: SecuritySettingsData;
  notifications: NotificationSettingsData;
  advanced: AdvancedSettingsData;
}

/**
 * Service for managing system settings
 */
class SettingsService {
  /**
   * Get all settings
   * GET /settings
   */
  async getAllSettings(): Promise<SettingsData> {
    return apiService.get('/settings');
  }

  /**
   * Update system settings
   * PATCH /settings/system
   */
  async updateSystemSettings(data: SystemSettingsData): Promise<SystemSettingsData> {
    return apiService.patch('/settings/system', data);
  }

  /**
   * Update security settings
   * PATCH /settings/security
   */
  async updateSecuritySettings(data: SecuritySettingsData): Promise<SecuritySettingsData> {
    return apiService.patch('/settings/security', data);
  }
  /**
   * Update notification settings
   * PATCH /settings/notifications
   */
  async updateNotificationSettings(data: NotificationSettingsData): Promise<NotificationSettingsData> {
    return apiService.patch('/settings/notifications', data);
  }
  
  /**
   * Update advanced settings
   * PATCH /settings/advanced
   */
  async updateAdvancedSettings(data: AdvancedSettingsData): Promise<AdvancedSettingsData> {
    return apiService.patch('/settings/advanced', data);
  }
}

export const settingsService = new SettingsService();
