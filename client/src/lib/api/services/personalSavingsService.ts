import { apiService } from '@/lib/api/apiService';
import { PaginatedResponse } from '@/types/types';
import { TransactionRecord } from '@/types/transaction.types';
import { MemberSummary, PersonalSavingsResponse, AdminDashboard } from '@/types/personal-savings.types';

// API response wrapper type
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PersonalSavingsPlanType {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePersonalSavingsRequest {
  erpId: string;
  planTypeId: string;
  planName?: string;
  targetAmount?: number;
  notes?: string;
}

export interface RequestWithdrawalData {
  amount: number;
  reason?: string;
}

export interface BalanceHistoryItem {
  date: string;
  balance: number;
}

export interface BalanceHistoryResponse {
  history: BalanceHistoryItem[];
  memberErpId: string;
  memberName: string;
  planName?: string;
  currentBalance: number;
}

class PersonalSavingsService {
  async getPersonalSavingsTransactions(
    planId: string,
    params?: {
      page?: number;
      limit?: number;
      startDate?: string;
      endDate?: string;
      type?: string;
    }
  ): Promise<PaginatedResponse<TransactionRecord>> {
    const queryParams = new URLSearchParams();
    if (params) {
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.type) queryParams.append('type', params.type);
    }
    const url = `/personal-savings/${planId}/transactions?${queryParams.toString()}`;
    return apiService.get(url);
  }

  async getMemberSummary(erpId: string): Promise<ApiResponse<MemberSummary>> {
    const url = `/personal-savings/member/${erpId}/summary`;
    return apiService.get<ApiResponse<MemberSummary>>(url);
  }

  async getPersonalSavingsPlans(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<PaginatedResponse<PersonalSavingsResponse>> {
    const queryParams = new URLSearchParams();
    if (params) {
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.status) queryParams.append('status', params.status);
    }
    const url = `/personal-savings?${queryParams.toString()}`;
    return apiService.get(url);
  }

  async getPersonalSavingsPlan(planId: string): Promise<PersonalSavingsResponse> {
    const url = `/personal-savings/${planId}`;
    const response = await apiService.get<ApiResponse<PersonalSavingsResponse>>(url);
    return response.data;
  }

  // Get available personal savings plan types
  async getPersonalSavingsPlanTypes(): Promise<PersonalSavingsPlanType[]> {
    const url = '/personal-savings/plans';
    return apiService.get(url);
  }

  // Request creation of a new personal savings plan
  async createPersonalSavingsRequest(data: CreatePersonalSavingsRequest) {
    const url = '/personal-savings/request';
    return apiService.post(url, data);
  }

  // Request withdrawal from a personal savings plan
  async requestWithdrawal(planId: string, data: RequestWithdrawalData) {
    const url = `/personal-savings/${planId}/withdraw`;
    return apiService.post(url, data);
  }

  // Get balance history for charts
  async getBalanceHistory(
    planId: string,
    params?: {
      startDate?: string;
      endDate?: string;
    }
  ): Promise<BalanceHistoryResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
    }
    const queryString = queryParams.toString();
    const url = `/personal-savings/${planId}/balance-history${queryString ? `?${queryString}` : ''}`;
    return apiService.get(url);
  }


  // Get admin dashboard data
  async getAdminDashboard(): Promise<AdminDashboard> {
    const url = `/personal-savings/admin/dashboard`;
    return apiService.get(url);
  }

  // Get a specific pending savings request
  async getPendingSavingsRequest(requestId: string) {
    const url = `/requests/${requestId}`;
    return apiService.get(url);
  }

  // Process a deposit to a personal savings plan (Admin/Treasurer only)
  async processDeposit(planId: string, data: { amount: number; description?: string }) {
    const url = `/personal-savings/${planId}/deposit`;
    return apiService.post(url, data);
  }

  // Close a personal savings plan (Admin only)
  async closePlan(planId: string) {
    const url = `/personal-savings/${planId}/close`;
    return apiService.patch(url, {});
  }
}

export const personalSavingsService = new PersonalSavingsService();
