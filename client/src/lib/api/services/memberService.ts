import { apiService } from '@/lib/api/apiService';
import type { PaginatedResponse } from '@/types/types';
import type { Biodata, Member, MemberFormData, MemberFilterParams } from '@/types/member.types';
import type { LoanRecord } from '@/types/loan.types';

/**
 * Service for managing cooperative members biodata
 */
class MemberService {
  /**
   * Verify biodata phone number (initiates OTP)
   * POST /biodata/verify
   */
  async verifyBiodata(phoneNumber: string): Promise<{ message: string; refCode: string }> {
    return apiService.post<{ message: string; refCode: string }>('/biodata/verify', { phoneNumber });
  }

  /**
   * Verify OTP for phone verification
   * POST /biodata/verify/otp
   */
  async validateOTP(otp: string): Promise<{ message: string }> {
    return apiService.post<{ message: string }>('/biodata/verify/otp', { otp });
  }

  /**
   * Get all biodata records with filtering
   * GET /biodata
   */
  async getAllBiodata(filters: MemberFilterParams = {}): Promise<PaginatedResponse<Member>> {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    return apiService.get<PaginatedResponse<Member>>(`/biodata?${queryParams.toString()}`);
  }

  /**
   * Get biodata by ID
   * GET /biodata/:id
   */
  async getBiodataById(id: string): Promise<Member> {
    return apiService.get<Member>(`/biodata/${id}`);
  }

  /**
   * Add bank account info to biodata
   * POST /biodata/:id/account-info
   */
  async addBankAccount(biodataId: string, accountData: {
    bankId: string;
    accountNumber: string;
    accountName: string;
  }): Promise<Member> {
    return apiService.post<Member>(`/biodata/${biodataId}/account-info`, accountData);
  }

  /**
   * Create new biodata record
   * POST /biodata
   */
  async createBiodata(data: MemberFormData): Promise<Member> {
    // Ensure we're calling the correct endpoint
    console.log('Calling API endpoint:', '/biodata');
    return apiService.post<Member>('/biodata', data);
  }

  /**
   * Delete biodata record
   * DELETE /biodata/:id
   */
  async deleteBiodata(id: string): Promise<{ message: string }> {
    return apiService.delete<{ message: string }>(`/biodata/${id}`);
  }

  /**
   * Admin verification of member biodata
   * POST /biodata/member/verify
   */
  async verifyMemberBiodata(id: string): Promise<Member> {
    return apiService.post<Member>('/biodata/member/verify', { id });
  }

  /**
   * Get unapproved biodata records
   * GET /biodata/member/unapproved
   */
  async getUnapprovedBiodata(page = 1, limit = 10): Promise<PaginatedResponse<Member>> {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    return apiService.get<PaginatedResponse<Member>>(`/biodata/member/unapproved?${queryParams.toString()}`);
  }

  /**
   * Approve member biodata
   * POST /biodata/member/approve
   */
  async approveBiodata(biodataId: string, approverNotes?: string): Promise<Member> {
    return apiService.post<Member>('/biodata/member/approve', { 
      biodataId, 
      approverNotes 
    });
  }

  /**
   * Update membership status
   * POST /biodata/member/:id/status
   */
  async updateMembershipStatus(
    id: string, 
    status: 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
    note?: string
  ): Promise<Member> {
    return apiService.post<Member>(`/biodata/member/${id}/status`, { status, note });
  }

  /**
   * Get currently logged-in member's biodata
   * GET /users/me
   */
  async getCurrentMemberBiodata(): Promise<Member> {
    return apiService.get<Member>('/users/me');
  }

  /**
   * Update member biodata by ID
   * @param biodataId - Biodata ID to update
   * @param data - Partial biodata to update
   * @returns Promise<Biodata>
   */
  async updateBiodata(biodataId: string, data: Partial<MemberFormData>): Promise<Biodata> {
    console.log(`Updating biodata with ID: ${biodataId}`);
    return apiService.put<Biodata>(`/biodata/${biodataId}`, data);
  }

  /**
   * Upload profile photo
   * @param biodataId - Biodata ID
   * @param file - Photo file to upload
   * @returns Promise<{ url: string }>
   */
  async uploadProfilePhoto(biodataId: string, file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('photo', file);
    
    return apiService.post<{ url: string }>(
      `/biodata/${biodataId}/profile-photo`, 
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  }

  // Bulk Operations

  /**
   * Upload bulk biodata records (Excel)
   * POST /biodata/upload
   */
  async uploadBulkBiodata(file: File): Promise<{ requestId: string; message: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return apiService.post<{ requestId: string; message: string }>('/biodata/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }

  /**
   * Check upload status
   * GET /biodata/upload/:requestId/status
   */
  async checkUploadStatus(requestId: string): Promise<{ 
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'APPROVED' | 'REJECTED';
    totalRecords?: number;
    processedRecords?: number;
    failedRecords?: number;
    message?: string;
  }> {
    return apiService.get(`/biodata/upload/${requestId}/status`);
  }

  /**
   * Cancel upload request
   * POST /biodata/upload/:requestId/cancel
   */
  async cancelUpload(requestId: string): Promise<{ message: string }> {
    return apiService.post(`/biodata/upload/${requestId}/cancel`);
  }

  /**
   * Approve biodata upload
   * POST /biodata/upload/:requestId/approve
   */
  async approveUpload(requestId: string, notes?: string): Promise<{ message: string }> {
    return apiService.post(`/biodata/upload/${requestId}/approve`, { notes });
  }

  /**
   * Reject biodata upload
   * POST /biodata/upload/:requestId/reject
   */
  async rejectUpload(requestId: string, reason: string): Promise<{ message: string }> {
    return apiService.post(`/biodata/upload/${requestId}/reject`, { reason });
  }

  /**
   * Get all upload requests
   * GET /biodata/upload/requests
   */
  async getUploadRequests(page = 1, limit = 10): Promise<PaginatedResponse<{
    id: string;
    status: string;
    createdAt: string;
    createdBy: string;
    totalRecords: number;
    processedRecords: number;
    fileName: string;
  }>> {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    return apiService.get(`/biodata/upload/requests?${queryParams.toString()}`);
  }

  /**
   * Get upload request details
   * GET /biodata/upload/requests/:requestId
   */
  async getUploadRequestDetails(requestId: string): Promise<{
    id: string;
    status: string;
    createdAt: string;
    createdBy: {
      id: string;
      username: string;
    };
    approvedBy?: {
      id: string;
      username: string;
    };
    rejectedBy?: {
      id: string;
      username: string;
    };
    totalRecords: number;
    processedRecords: number;
    failedRecords: number;
    fileName: string;
    records: Array<{
      row: number;
      status: string;
      data: any;
      error?: string;
    }>;
  }> {
    return apiService.get(`/biodata/upload/requests/${requestId}`);
  }

  /**
   * Get member loans
   * GET /loan/member/:biodataId
   */
  async getMemberLoans(biodataId: string, page = 1, limit = 10, filters = {}): Promise<PaginatedResponse<LoanRecord>> {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });
    return apiService.get<PaginatedResponse<LoanRecord>>(`/loan/member/${biodataId}?${queryParams.toString()}`);
  }
}

export const memberService = new MemberService();