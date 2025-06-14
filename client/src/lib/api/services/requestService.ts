import { apiService } from '@/lib/api/apiService';
import type { PaginatedResponse } from '@/types/types';
import { 
  CreateRequestInput, 
  ApprovalStep, 
  Request, 
  RequestQueryParams, 
  RequestStatus, 
  RequestStatistics 
} from '@/types/request.types';

/**
* Request service for managing requests and approvals
* Aligned with backend API documented in request.routes.ts and request.controller.ts
*/
class RequestService {
  /**
  * Create a new request
  * POST /api/requests
  * @param requestData - Request creation data
  * @returns Created request
  * @access All authenticated users
  */
  async createRequest(requestData: CreateRequestInput): Promise<Request> {
    console.log('Creating request:', requestData);
    const response = await apiService.post<{ data: Request }>('/requests', requestData);
    console.log('Request created successfully:', response);
    return response.data;
  }
  
  /**
  * Get all requests with filtering and pagination
  * GET /api/requests
  * @param params - Query parameters for filtering
  * @returns Paginated list of requests
  * @access ADMIN, TREASURER, CHAIRMAN, SUPER_ADMIN
  */
  async getAllRequests(params: RequestQueryParams = {}): Promise<PaginatedResponse<Request>> {
    console.log('Fetching all requests with params:', params);
    
    // Clone params to avoid modifying the original object
    const queryParams = { ...params };
    
    // Special handling for loan-specific statuses
    if (queryParams.status === 'DISBURSED' as any) {
      // Convert DISBURSED (loan status) to COMPLETED (request status)
      queryParams.status = RequestStatus.COMPLETED;
    }
    
    const queryString = this.buildQueryString(queryParams);
    const response = await apiService.get<{
      data: {
        data: Request[];
        meta: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      };
    }>(`/requests${queryString}`);
    
    console.log('Raw API response structure:', response);
    console.log('Nested data structure:', response.data);
    console.log('Meta information:', response.data?.meta);
    
    // FIXED: Extract data from the nested structure
    const actualData = response.data?.data || [];
    const actualMeta = response.data?.meta || {};
    
    console.log('Extracted data count:', actualData.length);
    console.log('Extracted total from meta:', actualMeta.total);
    
    // Ensure consistent response structure
    return {
      data: actualData,
      total: actualMeta.total || 0,
      page: actualMeta.page || params.page || 1,
      limit: actualMeta.limit || params.limit || 10,
      totalPages: actualMeta.totalPages || 0,
      meta: actualMeta
    };
  }
  
  /**
  * Get requests initiated by current user
  * GET /api/requests/user
  * @param params - Query parameters for filtering
  * @returns Paginated list of user's requests
  * @access Authenticated user
  */
  async getUserRequests(params: RequestQueryParams = {}): Promise<PaginatedResponse<Request>> {
    console.log('Fetching user requests with params:', params);
    const queryString = this.buildQueryString(params);
    const response = await apiService.get<PaginatedResponse<Request>>(`/requests/user${queryString}`);
    console.log('User requests fetched successfully:', response);
    return response;
  }
  
  /**
  * Get a request by ID
  * GET /api/requests/:id
  * @param id - Request ID
  * @returns Request details
  * @access Request initiator or Admin
  */
  async getRequestById(id: string): Promise<Request> {
    console.log('Fetching request with ID:', id);
    const response = await apiService.get<{ data: Request }>(`/requests/${id}`);
    console.log('Request fetched successfully:', response);
    return response.data;
  }
  
  /**
  * Update request status
  * PUT /api/requests/:id
  * @param id - Request ID
  * @param status - New status
  * @param notes - Optional notes
  * @returns Updated request
  * @access Depends on status (see request.routes.ts)
  */
  async updateRequestStatus(id: string, status: RequestStatus, notes?: string): Promise<Request> {
    console.log(`Updating request ${id} status to ${status}`);
    const response = await apiService.put<{ data: Request }>(`/requests/${id}`, {
      status,
      notes
    });
    console.log('Request status updated successfully:', response);
    return response.data;
  }
  
  /**
  * Delete (cancel) a request
  * DELETE /api/requests/:id
  * @param id - Request ID
  * @returns Success message
  * @access Request initiator
  */
  async deleteRequest(id: string): Promise<{ message: string }> {
    console.log('Deleting request with ID:', id);
    const response = await apiService.delete<{ message: string }>(`/requests/${id}`);
    console.log('Request deleted successfully:', response);
    return response;
  }
  
  /**
  * Get count of pending requests
  * GET /api/requests/pending-count
  * @returns Pending request count
  * @access Authenticated user
  */
  async getPendingRequestCount(): Promise<number> {
    console.log('Fetching pending request count');
    try {
      const response = await apiService.get<{ data: { count: number } }>('/requests/pending-count');
      console.log('Pending request count fetched successfully:', response);
      return response.data.count;
    } catch (error) {
      console.error('Error fetching pending request count:', error);
      // Fallback method if the endpoint is not available
      console.log('Attempting fallback method to count pending requests');
      try {
        const assignedRequests = await this.getAssignedRequests(1, 100);
        const pendingCount = assignedRequests.data.filter(
          req => req.status === RequestStatus.PENDING || req.status === RequestStatus.IN_REVIEW
        ).length;
        console.log('Calculated pending request count from assigned requests:', pendingCount);
        return pendingCount;
      } catch (innerError) {
        console.error('Fallback method also failed:', innerError);
        return 0;
      }
    }
  }
  
  /**
  * Get request statistics
  * GET /api/requests/statistics
  * @param filters - Optional filters
  * @returns Request statistics
  * @access ADMIN, TREASURER, CHAIRMAN, SUPER_ADMIN
  */
  async getRequestStatistics(filters: { 
    startDate?: Date | string;
    endDate?: Date | string;
    biodataId?: string;
  } = {}): Promise<RequestStatistics> {
    console.log('Fetching request statistics with filters:', filters);
    const queryParams = new URLSearchParams();
    
    if (filters.startDate) {
      queryParams.append('startDate', filters.startDate.toString());
    }
    
    if (filters.endDate) {
      queryParams.append('endDate', filters.endDate.toString());
    }
    
    if (filters.biodataId) {
      queryParams.append('biodataId', filters.biodataId);
    }
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    
    const response = await apiService.get<{ data: RequestStatistics }>(`/requests/statistics${queryString}`);
    console.log('Request statistics fetched successfully:', response);
    return response.data;
  }
  
  /**
  * Get assigned requests from user service endpoint
  * GET /api/users/me/requests/assigned
  * @param page - Page number
  * @param limit - Items per page
  * @returns Paginated list of assigned requests
  * @access Authenticated user
  */
  async getAssignedRequests(page = 1, limit = 10): Promise<PaginatedResponse<Request>> {
    console.log(`Fetching assigned requests (page ${page}, limit ${limit})`);
    try {
      const response = await apiService.get<PaginatedResponse<Request>>(
        `/users/me/requests/assigned?page=${page}&limit=${limit}`
      );
      console.log('Assigned requests fetched successfully:', response);
      return response;
    } catch (error) {
      console.error('Error fetching assigned requests:', error);
      // Return empty response if endpoint fails
      return { data: [], total: 0, page, limit, totalPages: 0, meta: {} };
    }
  }
  
  /**
  * Count pending requests system-wide (for dashboard metrics)
  * Uses getAllRequests with PENDING status filter for accurate count
  * @returns Count of all pending requests in the system
  */
  async getPendingApprovalsCount(): Promise<number> {
    console.log('Calculating system-wide pending requests count for dashboard');
    
    try {
      // Use getAllRequests with PENDING status filter and minimal limit to get count
      const response = await this.getAllRequests({
        status: RequestStatus.PENDING,
        page: 1,
        limit: 1 // We only need the total count, not the data
      });
      
      console.log('System pending requests count from getAllRequests:', response.total);
      return response.total || 0;
    } catch (error) {
      console.error('Error fetching system pending requests count:', error);
      return 0;
    }
  }
  
  /**
  * Get approval history for a request
  * GET /api/requests/:id/history
  * @param requestId - Request ID
  * @returns Approval history
  */
  async getRequestHistory(requestId: string): Promise<any[]> {
    console.log(`Fetching approval history for request ${requestId}`);
    try {
      const response = await apiService.get<{ data: any[] }>(`/requests/${requestId}/history`);
      console.log('Approval history fetched successfully:', response);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch approval history for request ${requestId}:`, error);
      return [];
    }
  }
  
  /**
  * Build query string from parameters
  * @param params - Query parameters
  * @returns Formatted query string
  * @private
  */
  private buildQueryString(params: Record<string, any>): string {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (value instanceof Date) {
          queryParams.append(key, value.toISOString());
        } else {
          queryParams.append(key, String(value));
        }
      }
    });
    
    return queryParams.toString() ? `?${queryParams.toString()}` : '';
  }
}

export const requestService = new RequestService();