import { apiService } from '../apiService';
import type { 
  TransactionRecord, 
  TransactionSummary, 
  TransactionQueryParams, 
  CreateTransactionPayload, 
  BatchTransactionPayload,
  PaginatedResponse,
  TransactionDetailView
} from '@/types/transaction.types';

export class TransactionService {
  /**
   * [ADMIN ONLY] Get all transactions with pagination and filtering
   * Get all transactions with filtering
   * GET /transactions
   */
  async getAllTransactions(params: TransactionQueryParams = {}): Promise<PaginatedResponse<TransactionRecord>> {
    const queryParams = new URLSearchParams();
    
    // Add all query parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    
    try {
      // Make the API request
      const response = await apiService.get(`/transactions?${queryParams.toString()}`) as { data: any };
      
      // Log the raw response for debugging
      console.log('Raw API transaction response:', response);
      
      // Extract the actual data from the API response structure
      // The structure from your logs shows: { data: { data: [...], page: 1, limit: 10, total: 7418 } }
      const responseData = response.data || {};
      
      // Properly structure the response to match what your frontend expects
      return {
        data: responseData.data || [],
        meta: {
          totalCount: responseData.total || 0,
          totalPages: Math.ceil((responseData.total || 0) / (params.limit || 10)),
          currentPage: responseData.page || params.page || 1,
          pageSize: responseData.limit || params.limit || 10,
          limit: responseData.limit ?? params.limit ?? 10,
          page: responseData.page ?? params.page ?? 1,
          total: responseData.total || 0
        },
        pagination: {
          total: responseData.total || 0,
          page: responseData.page || params.page || 1,
          limit: responseData.limit || params.limit || 10,
          totalPages: Math.ceil((responseData.total || 0) / (params.limit || 10))
        }
      };
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }

  /**
   * [ADMIN ONLY] Search transactions with filters
   * Search transactions with filters
   * GET /transactions/search
   */
  async searchTransactions(filters: TransactionQueryParams = {}): Promise<PaginatedResponse<TransactionRecord>> {
    const queryParams = new URLSearchParams();
    
    // Add all query parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    
    const response = await apiService.get(`/transactions/search?${queryParams.toString()}`) as { data: PaginatedResponse<TransactionRecord> };
    return response.data;
  }

  /**
   * [MEMBER/ADMIN ONLY] Get transaction by ID
   * Get transaction by ID
   * GET /transactions/:id
   */
  async getTransaction(id: string): Promise<TransactionDetailView> {
    const response = await apiService.get(`/transactions/${id}`) as { data: TransactionDetailView };
    return response.data;
  }

  /**
   * [ADMIN ONLY] Create a new transaction
   * Create a new transaction
   * POST /transactions
   */
  async createTransaction(data: CreateTransactionPayload): Promise<TransactionRecord> {
    const response = await apiService.post('/transactions', data) as { data: TransactionRecord };
    return response.data;
  }

  /**
   * [ADMIN ONLY] Create multiple transactions in a batch
   * Create multiple transactions in a batch
   * POST /transactions/batch
   */
  async createBatchTransactions(data: BatchTransactionPayload): Promise<TransactionRecord[]> {
    const response = await apiService.post('/transactions/batch', data) as { data: TransactionRecord[] };
    return response.data;
  }

  /**
   * [ADMIN ONLY] Update an existing transaction status
   * Update transaction status
   * PATCH /transactions/:id/status
   */
  async updateTransactionStatus(id: string, status: string, notes?: string): Promise<TransactionRecord> {
    const response = await apiService.patch(`/transactions/${id}/status`, { status, notes }) as { data: TransactionRecord };
    return response.data;
  }

  /**
   * [ADMIN ONLY] Reverse a transaction
   * Reverse a transaction
   * POST /transactions/:id/reverse
   */
  async reverseTransaction(id: string, reason: string): Promise<TransactionRecord> {
    const response = await apiService.post(`/transactions/${id}/reverse`, { reason }) as { data: TransactionRecord };
    return response.data;
  }

  /**
   * [MEMBER/ADMIN] Get transactions by entity type and ID
   * This method retrieves transactions related to a specific entity type and ID.
   * GET /transactions/entity/:entityType/:entityId
   */
  async getEntityTransactions(
    entityType: 'BIODATA' | 'LOAN' | 'SAVINGS' | 'SHARES',
    entityId: string,
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<TransactionRecord>> {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    
    const response = await apiService.get(
      `/transactions/entity/${entityType}/${entityId}?${queryParams.toString()}`
    ) as { data: PaginatedResponse<TransactionRecord> };
    return response.data;
  }

  /**
   * [MEMBER/ADMIN] Get transactions for a user
   * This method retrieves transactions related to a specific user.
   * GET /transactions/user/:userId?
   */
  async getUserTransactions(userId?: string, page = 1, limit = 20): Promise<PaginatedResponse<TransactionRecord>> {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    
    const endpoint = userId 
      ? `/transactions/user/${userId}?${queryParams.toString()}`
      : `/transactions/user?${queryParams.toString()}`;
    
    const response = await apiService.get(endpoint) as { data: PaginatedResponse<TransactionRecord> };
    return response.data;
  }

  /**
   * [ADMIN ONLY] Get transaction summary statistics
   * This method retrieves summary statistics for transactions.
   * GET /transactions/summary
   */
  async getTransactionSummary(
    module?: string,
    startDate?: string,
    endDate?: string,
    status?: string,
    groupBy: 'day' | 'week' | 'month' | 'module' | 'type' = 'day',
    format: 'json' | 'csv' | 'pdf' | 'excel' = 'json'
  ): Promise<TransactionSummary> {
    const queryParams = new URLSearchParams();

    if (module) queryParams.append('module', module);
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    if (status) queryParams.append('status', status);
    queryParams.append('groupBy', groupBy);
    queryParams.append('format', format);

    const response = await apiService.get(`/transactions/summary?${queryParams.toString()}`) as { data: TransactionSummary };
    return response.data;
  }

  /**
   * [ADMIN ONLY] Get transaction counts by status
   * GET /transactions/counts
   */
  async getTransactionCounts(module?: string): Promise<Record<string, number>> {
    const queryParams = new URLSearchParams();
    if (module) queryParams.append('module', module);
    
    const response = await apiService.get(`/transactions/counts?${queryParams.toString()}`) as { data: Record<string, number> };
    return response.data;
  }

  /**
   * [ADMIN ONLY] Get transaction statistics for dashboard
   * This method uses the transaction summary endpoint to get essential stats for the admin dashboard.
   */
  async getTransactionStats(): Promise<{
    totalCount: number;
    totalAmount: number;
    totalDeposits: number;
    totalWithdrawals: number;
    totalSavingsDeposits: number;
    totalSavingsWithdrawals: number;
    totalSharesDeposits: number;
    totalLoanRepayments: number;
    totalLoanDisbursements: number;
  }> {
    try {
      // Get transaction summary with default parameters
      const summary = await this.getTransactionSummary(
        undefined, // module
        undefined, // startDate
        undefined, // endDate
        undefined, // status
        'day',     // groupBy
        'json'     // format
      );

      // Extract deposit and withdrawal totals from typeSummary
      const savingDepositsData = summary.typeSummary?.SAVINGS_DEPOSIT || { totalTransactions: 0, totalAmount: 0 };
      const sharesDepositData = summary.typeSummary?.SHARES_PURCHASE || { totalTransactions: 0, totalAmount: 0 };
      const savingsWithdrawalsData = summary.typeSummary?.SAVINGS_WITHDRAWAL || { totalTransactions: 0, totalAmount: 0 };
      const totalWithdrawalsData = summary.debitTotal || 0;

      console.log('Comprehensive transaction data: ',
        summary,
        savingDepositsData,
        sharesDepositData,
        savingsWithdrawalsData,
        totalWithdrawalsData
      )

      return {
        totalCount: summary.totalTransactions || 0,
        totalAmount: summary.creditTotal + summary.debitTotal || 0,
        totalDeposits: savingDepositsData.totalAmount + sharesDepositData.totalAmount || 0,
        totalWithdrawals: totalWithdrawalsData || 0,
        totalSavingsDeposits: savingDepositsData.totalAmount || 0,
        totalSavingsWithdrawals: savingsWithdrawalsData.totalAmount || 0,
        totalSharesDeposits: sharesDepositData.totalAmount || 0,
        totalLoanRepayments: summary.typeSummary?.LOAN_REPAYMENT?.totalAmount || 0,
        totalLoanDisbursements: summary.typeSummary?.LOAN_DISBURSEMENT?.totalAmount || 0
      };
    } catch (error) {
      console.error('Failed to fetch transaction statistics:', error);
      // Return default values in case of error
      return {
        totalCount: 0,
        totalAmount: 0,
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalSavingsDeposits: 0,
        totalSavingsWithdrawals: 0,
        totalSharesDeposits: 0,
        totalLoanRepayments: 0,
        totalLoanDisbursements: 0
      };
    }
  }

  /**
   * [ADMIN ONLY] Get recent transactions for admin
   * This method retrieves the most recent transactions, primarily for admin review.
   * Uses GET /transactions with limit and sorting
   */
  async getRecentAdminTransactions(limit: number = 5): Promise<PaginatedResponse<TransactionRecord>> {
    try {
      // Use the existing getAllTransactions endpoint with limit and page 1
      const response = await this.getAllTransactions({
        page: 1,
        limit: limit,
        sort: 'createdAt:desc'
      });
      return response;
    } catch (error) {
      console.error('Failed to fetch recent transactions:', error);
      return {
        data: [],
        meta: {
          totalCount: 0,
          totalPages: 0,
          currentPage: 1,
          pageSize: 0,
          limit: 0,
          page: 1,
          total: 0
        },
        pagination: {
          total: 0,
          page: 1,
          limit: 0,
          totalPages: 0
        }
      };
    }
  }

  // /**
  //  * [ADMIN ONLY] Get transaction statistics with monthly breakdown
  //  * GET /transactions/stats
  //  */
  // async getTransactionStats(): Promise<{
  //   totalTransactions: number;
  //   totalAmount: number;
  //   monthlyBreakdown: Array<{
  //     month: number;
  //     totalAmount: number;
  //     totalCount: number;
  //     deposits: number;
  //     withdrawals: number;
  //   }>;
  // }> {
  //   try {
  //     const response = await apiService.get('/transactions/stats');
  //     return response;
  //   } catch (error) {
  //     console.error('Error fetching transaction stats:', error);
  //     // Return fallback data structure
  //     return {
  //       totalTransactions: 0,
  //       totalAmount: 0,
  //       monthlyBreakdown: Array.from({ length: 12 }, (_, i) => ({
  //         month: i + 1,
  //         totalAmount: 0,
  //         totalCount: 0,
  //         deposits: 0,
  //         withdrawals: 0,
  //       })),
  //     };
  //   }
  // }

  /**
   * [ADMIN ONLY] Get monthly statistics for a specific year
   * Uses GET /transactions with date filters and processes data client-side
   */
  async getMonthlyStats(year: number): Promise<{
    year: number;
    monthlyData: Array<{
      month: number;
      monthName: string;
      totalAmount: number;
      transactionCount: number;
      deposits: number;
      withdrawals: number;
      avgTransactionSize: number;
    }>;
    yearlyTotal: number;
    yearlyCount: number;
  }> {
    try {
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];

      // Initialize monthly data structure
      const monthlyData = months.map((monthName, index) => ({
        month: index + 1,
        monthName,
        totalAmount: 0,
        transactionCount: 0,
        deposits: 0,
        withdrawals: 0,
        avgTransactionSize: 0,
      }));

      // Fetch all transactions for the year
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;

      // Fetch transactions with a large limit to get all for the year
      const response = await this.getAllTransactions({
        startDate,
        endDate,
        page: 1,
        limit: 100, // Large limit to get all transactions for the year
        status: 'COMPLETED' // Only include completed transactions in stats
      });

      let yearlyTotal = 0;
      let yearlyCount = response.data.length;

      // Process each transaction and group by month
      response.data.forEach((transaction) => {
        const date = new Date(transaction.createdAt);
        const month = date.getMonth(); // 0-indexed (0 = January)

        const amount = typeof transaction.amount === 'string'
          ? parseFloat(transaction.amount)
          : transaction.amount;

        monthlyData[month].transactionCount++;
        monthlyData[month].totalAmount += amount;

        // Categorize as deposit or withdrawal based on baseType
        if (transaction.baseType === 'CREDIT') {
          monthlyData[month].deposits += amount;
        } else if (transaction.baseType === 'DEBIT') {
          monthlyData[month].withdrawals += amount;
        }

        yearlyTotal += amount;
      });

      // Calculate average transaction size for each month
      monthlyData.forEach((month) => {
        if (month.transactionCount > 0) {
          month.avgTransactionSize = month.totalAmount / month.transactionCount;
        }
      });

      return {
        year,
        monthlyData,
        yearlyTotal,
        yearlyCount,
      };
    } catch (error) {
      console.error('Error fetching monthly stats:', error);
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];

      return {
        year,
        monthlyData: months.map((monthName, index) => ({
          month: index + 1,
          monthName,
          totalAmount: 0,
          transactionCount: 0,
          deposits: 0,
          withdrawals: 0,
          avgTransactionSize: 0,
        })),
        yearlyTotal: 0,
        yearlyCount: 0,
      };
    }
  }
}

export const transactionService = new TransactionService();