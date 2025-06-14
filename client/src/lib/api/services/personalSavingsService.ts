import { apiService } from '../apiService';
import {
  PersonalSavingsResponse,
  PersonalSavingsPlanType,
  PaginatedResponse,
  Transaction,  
  BalanceHistory,
  MemberSummary,
  AdminDashboard
} from '@/types/personal-savings.types';

// API service functions
export const personalSavingsService = {
  // Plan Management
  requestPersonalSavingsPlan: async (data: {
    erpId: string;
    planTypeId: string;
    planName?: string;
    targetAmount?: number;
    notes?: string;
  }) => {
    return apiService.post('/savings/personal/request', data);
  },

  getPersonalSavingsPlans: async (params?: {
    page?: number;
    limit?: number;
    erpId?: string;
    status?: string;
    sort?: 'asc' | 'desc';
    includePending?: boolean; // New parameter
  }): Promise<PaginatedResponse<PersonalSavingsResponse>> => {
    return apiService.get('/savings/personal', { params });
  },

  getPersonalSavingsPlanById: async (id: string): Promise<PersonalSavingsResponse> => {
    const response = await apiService.get(`/savings/personal/${id}`) as { data: PersonalSavingsResponse };
    return response.data;
  },

  closePlan: async (id: string) => {
    return apiService.patch(`/savings/personal/${id}/close`);
  },

  // Transaction Management
  processDeposit: async (id: string, data: {
    amount: number;
    description?: string;
  }) => {
    return apiService.post(`/savings/personal/${id}/deposit`, data);
  },

  requestWithdrawal: async (id: string, data: {
    amount: number;
    reason?: string;
  }) => {
    return apiService.post(`/savings/personal/${id}/withdraw`, data);
  },

  getTransactionHistory: async (id: string, params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    type?: string;
  }): Promise<PaginatedResponse<Transaction>> => {
    return apiService.get(`/savings/personal/${id}/transactions`, { params });
  },

  // Analytics
  getBalanceHistory: async (id: string, params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<BalanceHistory> => {
    const response = await apiService.get(`/savings/personal/${id}/balance-history`, { params }) as { data: BalanceHistory };
    return response.data;
  },

  getMemberSummary: async (erpId: string): Promise<MemberSummary> => {
    try {
      const response = await apiService.get(`/savings/personal/member/${erpId}/summary`) as { data: MemberSummary };
      
      // Ensure pendingRequests exists even if the backend doesn't provide it yet
      if (!response.data.pendingRequests) {
        response.data.pendingRequests = [];
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching member summary:', error);
      throw error;
    }
  },

  getAdminDashboard: async (): Promise<AdminDashboard> => {
    const response = await apiService.get('/savings/personal/admin/dashboard') as { data: AdminDashboard };
    return response.data;
  },

  // Plan Types
  getPersonalSavingsPlanTypes: async (): Promise<PersonalSavingsPlanType[]> => {
    try {
      const response = await apiService.get('/savings/personal/plans') as any;
      
      // Handle different response structures
      if (response?.data?.data) {
        return response.data.data;
      } else if (response?.data && Array.isArray(response.data)) {
        return response.data;
      } else if (Array.isArray(response)) {
        return response;
      }
      
      console.warn('Unexpected plan types response format:', response);
      return [];
    } catch (error) {
      console.error('Error fetching plan types:', error);
      return [];
    }
  },
};