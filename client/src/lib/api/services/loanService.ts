import { apiService } from '@/lib/api/apiService';
import {
  Loan,
  LoanType,
  LoanStatus,
  LoanSummary,
  LoanDetails,
  LoanQueryParams,
  LoanApiResponse,
  EnhancedLoanSummary
} from '@/types/loan.types';
import { requestService } from '@/lib/api/services/requestService';
import { ApiResponse, PaginatedResponse, PaginatedData } from '@/types/types';

export class LoanService {
  /**
  * Get available loan types
  * GET /loans/types
  */
  async getLoanTypes(): Promise<LoanType[]> {

    const responce = apiService.get('/loan/types')
    return apiService.get('/loan/types');
  }
  
  /**
  * Get loan summary statistics
  * GET /loans/summary
  * @param startDate Optional start date for filtering (YYYY-MM-DD)
  * @param endDate Optional end date for filtering (YYYY-MM-DD)
  */
  async getLoansSummary(startDate?: string, endDate?: string): Promise<LoanSummary> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const queryString = params.toString();
    return apiService.get(`/loan/summary${queryString ? `?${queryString}` : ''}`);
  }
  
  /**
  * Get enhanced loan summary with optional trends
  * GET /loans/summary/enhanced
  * @param params Optional query parameters for filtering and trends
  */
  async getEnhancedLoansSummary(params?: {
    startDate?: string;
    endDate?: string;
    includeTrends?: boolean;
    includeMonthlyBreakdown?: boolean;
  }): Promise<EnhancedLoanSummary> {
    const queryParams = new URLSearchParams();
    
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.includeTrends !== undefined) queryParams.append('includeTrends', params.includeTrends.toString());
    if (params?.includeMonthlyBreakdown !== undefined) queryParams.append('includeMonthlyBreakdown', params.includeMonthlyBreakdown.toString());
    
    return apiService.get(`/loan/summary/enhanced${queryParams.toString() ? `?${queryParams}` : ''}`);
  }
  
  /**
  * Get all loans with filtering and pagination
  * GET /loans
  * @param filters Filter parameters for loans
  */
  async getLoans(page: number, limit: number, filters: LoanQueryParams = {}): Promise<PaginatedResponse<Loan>> {
    const params = new URLSearchParams();

    // Add page and limit
    params.append('page', String(page));
    params.append('limit', String(limit));

    // Add all filters to URL params
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // Handle array values like status
        if (Array.isArray(value)) {
          params.append(key, value.join(','));
        } else {
          params.append(key, String(value));
        }
      }
    });

    const queryString = params.toString();
    const response = await apiService.get<ApiResponse<PaginatedData<Loan>>>(`/loan?${queryString}`);

    // Normalize the response to match expected structure
    const data = response.data;
    const meta = data.meta as any; // Handle different meta structures
    return {
      data: data.data,
      meta: {
        total: meta?.totalCount || meta?.total || 0,
        page: meta?.page || page,
        limit: meta?.limit || limit,
        totalPages: meta?.totalPages || 1
      }
    };
  }
  
  /**
  * Check loan eligibility
  * POST /loans/eligibility
  */
  async checkEligibility(loanTypeId: string, amount: number): Promise<any> {
    return apiService.post('/loan/eligibility', {
      loanTypeId,
      amount
    });
  }
  
  /**
  * Calculate loan payment schedule
  * POST /loans/calculate
  */
  async calculateLoan(loanTypeId: string, amount: number, tenure: number): Promise<any> {
    return apiService.post('/loan/calculate', {
      loanTypeId,
      amount,
      tenure
    });
  }
  
  /**
  * Apply for a loan
  * POST /loans/apply
  */
  async applyForLoan(data: {
    loanTypeId: string;
    loanAmount: number;
    loanTenure: number;
    loanPurpose: string;
  }): Promise<any> {
    return apiService.post('/loan/apply', data);
  }
  
  /**
  * Get loan details by ID
  * GET /loans/:id
  */
  async getLoanById(id: string): Promise<Loan> {
    return apiService.get(`/loan/${id}`);
  }
  
  /**
  * Get member's loans
  * GET /loan/member/:biodataId
  */
  async getMemberLoans(memberId: string): Promise<Loan['data']> {
    try {
      // Make sure we have a valid biodata ID
      if (!memberId) throw new Error('Biodata ID is required');
      
      const response = await apiService.get<Loan[]>(`/loan/member/${memberId}`);
      
      // Check console to see actual response structure
      console.log('Raw API response:', response);
      
      // Return the response directly since it's already an array
      return response || [];
    } catch (error) {
      console.error('Error fetching member loans:', error);
      return [];
    }
  }
  
  /**
  * Update loan status [ADMIN ONLY]
  * PATCH /loans/:id/status
  * Enhanced to include approval workflow
  */
  async updateLoanStatus(
    id: string, 
    status: LoanStatus, 
    approvalNotes?: string,
    approvalLevel?: number
  ): Promise<Loan> {
    return apiService.patch(`/loan/${id}/status`, {
      status,
      approvalNotes,
      approvalLevel
    });
  }
  
  /**
  * Get enhanced loan summary with trends
  * GET /loan/summary/enhanced
  */
  async getLoansSummaryWithTrends(startDate?: string, endDate?: string): Promise<LoanSummary & { trends: any }> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    params.append('includeTrends', 'true');
    params.append('includeMonthlyBreakdown', 'true');

    const queryString = params.toString();
    return apiService.get(`/loan/summary/enhanced${queryString ? `?${queryString}` : ''}`);
  }
  
  /**
  * Get detailed loan information including payment schedules and history
  * GET /loan/:id
  */
  async getLoanDetails(id: string): Promise<LoanDetails> {
    try {
      const response = await apiService.get<LoanApiResponse>(`/loan/${id}`);
      console.log('Loan Details API Response:', response);
      
      // Handle the nested data structure if present
      if (response.data) {
        return response.data;
      }
      
      // If response is already unwrapped, return directly
      return response as unknown as LoanDetails;
    } catch (error) {
      console.error('Error fetching loan details:', error);
      throw error;
    }
  }
  
  // Add a new method to get loan request details
  /**
  * Get loan request details by ID
  * This method retrieves the loan request and its associated loan details if available.
  * @param requestId ID of the loan request
  * @returns Promise containing the request and loan details
  */
  async getLoanRequestById(requestId: string): Promise<{
    request: any;
    loan: LoanDetails | null;
  }> {
    try {
      // Get the request first
      const request = await requestService.getRequestById(requestId);

      // If there's a linked loan, fetch its details
      if (request.loanId) {
        const loanDetails = await this.getLoanDetails(request.loanId);
        return { request, loan: loanDetails };
      }

      return { request, loan: null };
    } catch (error) {
      console.error('Error fetching loan request details:', error);
      throw error;
    }
  }

  /**
   * Upload bulk loan repayments
   * POST /loan/repayment/upload
   * @param file Excel or CSV file with loan repayments
   */
  async uploadBulkLoanRepayments(file: File): Promise<{
    totalSheets: number;
    totalSuccessful: number;
    totalFailed: number;
    sheetResults: Array<{
      sheetName: string;
      totalRows: number;
      successfulRows: number;
      failedRows: Array<{
        row: number;
        erpId?: string;
        error: string;
      }>;
    }>;
  }> {
    const formData = new FormData();
    formData.append('fileUpload', file);

    const response: any = await apiService.post('/loan/repayment/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    // Unwrap the response if it's wrapped in ApiResponse format
    if (response && response.data) {
      return response.data;
    }

    return response;
  }

}


export const loanService = new LoanService();