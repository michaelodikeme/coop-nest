import { apiService } from '@/lib/api/apiService';
import { SavingsSummary, SavingsRecord, MemberSavingsSummary } from '@/types/financial.types';
import { RequestStatus } from '@/types/request.types';
import { ApiResponse, PaginatedResponse, PaginatedData } from '@/types/types';

/**
 * Service for managing savings
 * Implements only the endpoints documented in the API
 */
class SavingsService {
  /**
   * Get member's savings [MEMBER]
   * This endpoint retrieves the current member's savings records.
   * GET /savings/my-savings
   */
  async getMySavings(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<PaginatedResponse<SavingsRecord>> {
    const queryParams = new URLSearchParams();

    if (params) {
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.status) queryParams.append('status', params.status);
    }

    const queryString = queryParams.toString();
    const url = `/savings/my-savings${queryString ? `?${queryString}` : ''}`;

    const response = await apiService.get<ApiResponse<PaginatedData<SavingsRecord>>>(url);
    return response.data; // Unwrap the API response
  }

  /**
   * Get savings summary [MEMBER]
   * This endpoint retrieves the current member's savings summary.
   * GET /savings/summary
   */
  async getSavingsSummary(): Promise<SavingsSummary> {
    return apiService.get('/savings/summary');
  }

  /**
   * Get all savings records [ADMIN ONLY]
   * This endpoint retrieves all savings records with pagination.
   * GET /savings
   */
  async getAllSavings(page = 1, limit = 10, filters: Record<string, any> = {}): Promise<PaginatedResponse<SavingsRecord>> {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    // Add any additional filters to the query params
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });

    const response = await apiService.get<ApiResponse<PaginatedData<SavingsRecord>>>(`/savings?${queryParams.toString()}`);
    return response.data; // Unwrap the API response
  }

  /**
   * Get monthly savings [ADMIN ONLY]
   * This endpoint retrieves monthly savings records for a specific year and month.
   * GET /savings/monthly/:year/:month
   */
  async getMonthlySavings(year: number, month: number, pagination?: { page: number, limit: number }) {
    const params = new URLSearchParams({
      year: year.toString(),
      month: month.toString(),
      ...(pagination ? {
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      } : {})
    });

    return apiService.get(`/savings/monthly/${year}/${month}?${params.toString()}`);
  }

  /**
   * Upload bulk savings [ADMIN ONLY]
   * This endpoint allows admins to upload a file containing bulk savings entries.
   * POST /savings/upload
   */
  async uploadBulkSavings(file: File): Promise<{
    requestId: string;
    processedCount: number;
    failedCount: number;
  }> {
    const formData = new FormData();
    formData.append('fileUpload', file);
    return apiService.post('/savings/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }

  /**
   * Get admin savings summary [FRONTEND AGGREGATION]
   * Aggregates all savings and shares for admin dashboard.
   */
  async getAdminSavingsSummary(): Promise<SavingsSummary> {
    try {
      // Use current year for the stats API
      const currentYear = new Date().getFullYear();
      
      // First try to get the summary directly from the backend with required year parameter
      try {
        const response = await apiService.get(`/savings/stats/${currentYear}`) as { data?: any };
        
        // Process the response with proper structure handling
        if (response && response.data) {
          // Extract the relevant data from the response
          const stats = response.data;
          
          // Calculate aggregated values from monthlyBreakdown
          const totalSavingsAmount = Number(stats.totalSavings || 0);
          const totalSharesAmount = Number(stats.totalShares || 0);
            
          // Format into expected structure
          return {
            id: '',
            balance: totalSavingsAmount,
            monthlyTarget: Number(stats.monthlyAverageSavings || 0),
            shares: {
              totalSharesAmount,
              monthlyAmount: stats.latestContribution?.sharesAmount || 0
            },
            totalSavingsAmount,
            totalGrossAmount: Number(stats.grossContributions || 0),
            totalSavings: totalSavingsAmount,
            totalShares: totalSharesAmount,
            monthlyContribution: stats.latestContribution?.amount || 0,
            accountStatus: 'active',
            data: stats.monthlyBreakdown || [],
            activeAccountsCount: stats.contributionMonths || 0
          };
        }
        return (response as { data: SavingsSummary }).data;
      } catch (err) {
        console.log('Direct stats endpoint failed, falling back to aggregation', err);
      }
      
      // Original fallback implementation - no changes needed here
      const limit = 100;
      const response = await this.getAllSavings(1, limit);
      
      // Check the actual structure of the response
      let allSavings: SavingsRecord[] = [];
      
      // Handle different response structures
      if (response && Array.isArray(response.data)) {
        allSavings = response.data;
      } else if (response && Array.isArray(response)) {
        allSavings = response;
      } else {
        // Fallback if we can't find an array to work with
        console.warn('Unexpected response structure from getAllSavings:', response);
        allSavings = [];
      }
      
      // Now safely use reduce on the array
      const totalSavingsAmount = allSavings.reduce((sum, record) => 
        sum + (Number(record.amount || record.balance) || 0), 0);
      
      const totalSharesAmount = allSavings.reduce((sum, record) => 
        sum + (Number(record.sharesAmount) || 0), 0);
        
      const activeAccounts = new Set(
        allSavings.filter(r => r.isActive !== false && r.accountId).map(r => r.accountId)
      );

      return {
        id: '',
        balance: totalSavingsAmount,
        monthlyTarget: 0,
        shares: {
          totalSharesAmount,
          monthlyAmount: 0
        },
        totalSavingsAmount,
        totalGrossAmount: totalSavingsAmount,
        totalSavings: totalSavingsAmount,
        totalShares: totalSharesAmount,
        monthlyContribution: 0,
        accountStatus: 'active',
        data: allSavings,
        activeAccountsCount: activeAccounts.size
      };
    } catch (error) {
      console.error('Error in getAdminSavingsSummary:', error);
      // Return a default object to prevent cascading errors
      return {
        id: '',
        balance: 0,
        monthlyTarget: 0,
        shares: {
          totalSharesAmount: 0,
          monthlyAmount: 0
        },
        totalSavingsAmount: 0,
        totalGrossAmount: 0,
        totalSavings: 0,
        totalShares: 0,
        monthlyContribution: 0,
        accountStatus: 'active',
        data: [],
        activeAccountsCount: 0
      };
    }
  }

  // ================ WITHDRAWAL ENDPOINTS ================

  /**
   * Create a withdrawal request
   * This endpoint allows members to create a new withdrawal request.
   * POST /savings/withdrawal
   * 
   * @param data Withdrawal data (amount, reason)
   * @returns The created withdrawal request
   */
  async createWithdrawalRequest(data: {
    amount: number;
    reason: string;
  }): Promise<any> {
    return apiService.post('/savings/withdrawal', data);
  }

  /**
   * Get all withdrawal requests
   * This endpoint retrieves all withdrawal requests for the current user.
   * For admins, it retrieves all requests with filtering options.
   * GET /savings/withdrawal
   *
   * @param params Query parameters for filtering requests
   * @returns Paginated withdrawal requests
   */
  async getWithdrawalRequests(params?: {
    status?: RequestStatus;
    type?: RequestStatus | RequestStatus[];
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
  }): Promise<PaginatedResponse<any>> {
    const queryParams = new URLSearchParams();

    if (params) {
      if (params.status) queryParams.append('status', params.status);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      if (params.search) queryParams.append('search', params.search);
      
      if (params.type) {
        if (Array.isArray(params.type)) {
          params.type.forEach(t => queryParams.append('type', t));
        } else {
          queryParams.append('type', params.type);
        }
      }
    }

    const url = `/savings/withdrawal${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const response = await apiService.get<ApiResponse<PaginatedData<any>>>(url);
    return response.data; // Unwrap the API response
  }

  /**
   * Get a specific withdrawal request by ID
   * This endpoint retrieves a single withdrawal request by its ID.
   * GET /savings/withdrawal/:id
   * 
   * @param withdrawalId The ID of the withdrawal request
   * @returns Detailed withdrawal request data
   */
  async getWithdrawalRequestById(withdrawalId: string): Promise<any> {
    return apiService.get(`/savings/withdrawal/${withdrawalId}`);
  }

  /**
   * Update withdrawal request status [ADMIN ONLY]
   * This endpoint allows admins to update the status of a withdrawal request.
   * PATCH /savings/withdrawal/:id/status
   * 
   * @param withdrawalId The ID of the withdrawal request
   * @param data Status update data
   * @returns Updated withdrawal request
   */
  async updateWithdrawalStatus(
    withdrawalId: string,
    data: {
      status: RequestStatus;
      notes?: string;
      isLastApproval?: boolean;
    }
  ): Promise<any> {
    return apiService.patch(`/savings/withdrawal/${withdrawalId}/status`, data);
  }

  /**
   * Cancel a withdrawal request [MEMBER]
   * This endpoint allows members to cancel their own pending withdrawal requests.
   * Uses the status update endpoint with CANCELLED status.
   *
   * @param withdrawalId The ID of the withdrawal request to cancel
   * @returns Updated withdrawal request with CANCELLED status
   */
  async cancelWithdrawalRequest(withdrawalId: string): Promise<any> {
    return apiService.patch(`/savings/withdrawal/${withdrawalId}/status`, {
      status: 'CANCELLED',
      notes: 'Cancelled by member'
    });
  }

  /**
   * Get withdrawal statistics [ADMIN ONLY]
   * This endpoint provides statistics about withdrawal requests.
   * GET /savings/withdrawal/stats
   * 
   * @param params Filter parameters
   * @returns Withdrawal statistics
   */
  async getWithdrawalStatistics(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    totalAmount: number;
    formattedTotalAmount: string;
  }> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
    }
    
    const url = `/savings/withdrawal/stats${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    return apiService.get(url);
  }

  /**
   * Get transaction history
   * GET /savings/transactions/:savingsId?
   */
  async getTransactions(params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    type?: string;
    savingsId?: string;
  }): Promise<PaginatedResponse<SavingsRecord>> {
    const queryParams = new URLSearchParams();

    if (params) {
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.type) queryParams.append('type', params.type);
    }

    const endpoint = params?.savingsId
      ? `/savings/transactions/${params.savingsId}`
      : '/savings/transactions';

    const url = queryParams.toString()
      ? `${endpoint}?${queryParams.toString()}`
      : endpoint;

    const response = await apiService.get<ApiResponse<PaginatedData<SavingsRecord>>>(url);
    return response.data; // Unwrap the API response
  }


  /**
   * Download savings statement[ADMIN/MEMBER]
   * This endpoint allows downloading the savings statement as a PDF.
   * GET /savings/statement/:erpId/download
   */
  async downloadSavingsStatement(erpId: string): Promise<Blob> {
    return apiService.get(`/savings/statement/${erpId}/download`, {
      responseType: 'blob'
    });
  }


  /**
   * Get members savings summary - optimized member-centric view
   * This endpoint retrieves aggregated savings data for each member rather than individual transactions
   * GET /savings/members-summary
   */
  async getMembersSummary(params?: {
    page?: number;
    limit?: number;
    search?: string;
    department?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    status?: string;
  }): Promise<PaginatedResponse<MemberSavingsSummary>> {
    const queryParams = new URLSearchParams();

    if (params) {
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.department) queryParams.append('department', params.department);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      if (params.status) queryParams.append('status', params.status);
    }

    const url = `/savings/members-summary${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const response = await apiService.get<ApiResponse<PaginatedData<MemberSavingsSummary>>>(url);
    return response.data; // Unwrap the API response
  }
}

export const savingsService = new SavingsService();
