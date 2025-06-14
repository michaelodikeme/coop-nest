import { apiService } from '@/lib/api/apiService';
import type { PaginatedResponse, AccountFilterParams } from '@/lib/api';

// Note: BankAccount type should be defined in your types directory
interface BankAccount {
  id: string;
  accountNumber: string;
  bankName: string;
  accountType: 'SAVINGS' | 'CURRENT';
  isVerified: boolean;
  isPrimary: boolean;
}

/**
 * Service for managing bank accounts
 * Implements only the endpoints documented in the API
 */
class AccountService {
  /**
   * Create a new bank account
   * POST /accounts
   */
  async createAccount(accountData: {
    bankId: string;
    accountNumber: string;
    bvn?: string;
    accountName: string;
  }): Promise<any> {
    return apiService.post('/accounts', accountData);
  }
  /**
   * Get a paginated list of all bank accounts with optional filtering
   * GET /accounts
   */
  async getAccounts(page = 1, limit = 10, filters: AccountFilterParams = {}): Promise<PaginatedResponse<BankAccount>> {
    // Create URLSearchParams object
    const queryParams = new URLSearchParams();
    
    // Add page and limit
    queryParams.append('page', page.toString());
    queryParams.append('limit', limit.toString());
    
    // Add filters as string values
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    
    return apiService.get<PaginatedResponse<BankAccount>>(`/accounts?${queryParams.toString()}`);
  }

  /**
   * Get the authenticated user's bank accounts
   * GET /accounts/me
   */
  async getMyAccounts(): Promise<BankAccount[]> {
    return apiService.get<BankAccount[]>('/accounts/me');
  }

  /**
   * Get a single bank account by ID
   * GET /accounts/:id
   */
  async getAccountById(id: string): Promise<BankAccount> {
    return apiService.get<BankAccount>(`/accounts/${id}`);
  }

  /**
   * Request an update to an existing bank account
   * POST /accounts/:id/update-request
   */
  async requestAccountUpdate(accountId: string, updatedDetails: Partial<BankAccount>, reason: string): Promise<{ requestId: string; message: string }> {
    return apiService.post<{ requestId: string; message: string }>(`/accounts/${accountId}/update-request`, {
      updatedDetails,
      reason
    });
  }

  /**
   * Verify bank account details with banking system
   * POST /accounts/verify
   */
  async verifyAccount(verificationData: {
    accountNumber: string;
    bankCode: string;
  }): Promise<{ isValid: boolean; accountName?: string }> {
    return apiService.post<{ isValid: boolean; accountName?: string }>('/accounts/verify', verificationData);
  }

  /**
   * Process an account update request (approve or reject)
   * POST /accounts/requests/:requestId/process
   */
  async processUpdateRequest(
    requestId: string, 
    decision: 'APPROVE' | 'REJECT', 
    notes?: string
  ): Promise<{ message: string }> {
    return apiService.post<{ message: string }>(`/accounts/requests/${requestId}/process`, {
      decision,
      notes
    });
  }
}

export const accountService = new AccountService();
