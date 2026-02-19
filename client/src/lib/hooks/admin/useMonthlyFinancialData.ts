import { useQuery } from '@tanstack/react-query';
import { savingsService } from '@/lib/api/services/savingsService';
import { loanService } from '@/lib/api/services/loanService';
import { transactionService } from '@/lib/api/services/transactionService';

interface MonthlyData {
  month: string;
  savings: number;
  loans: number;
  transactions: number;
  shares: number;
  deposits: number;
  withdrawals: number;
}

interface MonthlyFinancialStats {
  monthlyData: MonthlyData[];
  totals: {
    totalSavings: number;
    totalLoans: number;
    totalTransactions: number;
    totalShares: number;
    totalDeposits: number;
    totalWithdrawals: number;
  };
  year: number;
}

export function useMonthlyFinancialData(year: number = new Date().getFullYear()) {
  return useQuery({
    queryKey: ['monthly-financial-data', year],
    queryFn: async (): Promise<MonthlyFinancialStats> => {
      console.log(`Fetching monthly financial data for year: ${year}`);
      
      // Build year-specific date range for loan filtering
      const yearStart = `${year}-01-01`;
      const yearEnd = `${year}-12-31`;

      try {
        // Fetch all data concurrently
        const [savingsData, loansData, transactionsData] = await Promise.allSettled([
          // Use getSavingsStats(year) which returns the raw stats with monthlyBreakdown at the top level
          savingsService.getSavingsStats(year),

          // Get enhanced loan summary with monthly breakdown, filtered to the selected year
          loanService.getEnhancedLoansSummary({
            startDate: yearStart,
            endDate: yearEnd,
            includeMonthlyBreakdown: true,
          }),

          // Get transactions for the year
          transactionService.getAllTransactions({
            page: 1,
            limit: 200,
          })
        ]);

        // Process data from settled promises
        const savingsStats: any = savingsData.status === 'fulfilled' ? savingsData.value : null;
        const loansStats: any = loansData.status === 'fulfilled' ? loansData.value : null;
        const transactionsStats: any = transactionsData.status === 'fulfilled' ? transactionsData.value : null;

        // Transform data into monthly format
        const monthlyData = transformToMonthlyData(savingsStats, loansStats, transactionsStats, year);
        const totals = calculateTotals(savingsStats, loansStats, transactionsStats);

        return { monthlyData, totals, year } as MonthlyFinancialStats;

      } catch (error) {
        console.error('Error fetching monthly financial data:', error);
        throw error;
      }
    },
    staleTime: 300000, // 5 minutes
    retry: 2,
    retryDelay: 1000,
  });
}

// Transform all data sources into monthly format
function transformToMonthlyData(
  savingsData: any, 
  loansData: any, 
  transactionsData: any, 
  year: number
): MonthlyData[] {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  return months.map((month, index) => {
    const monthIndex = index + 1; // 1-based month

    // Extract savings data for this month
    const savingsAmount = extractSavingsForMonth(savingsData, monthIndex);
    const sharesAmount = extractSharesForMonth(savingsData, monthIndex);

    // Extract loans data for this month
    const loansAmount = extractLoansForMonth(loansData, monthIndex);

    // Extract transactions data for this month
    const transactionAmounts = extractTransactionsForMonth(transactionsData, monthIndex, year);

    return {
      month,
      savings: savingsAmount,
      loans: loansAmount,
      transactions: transactionAmounts.total,
      shares: sharesAmount,
      deposits: transactionAmounts.deposits,
      withdrawals: transactionAmounts.withdrawals,
    };
  });
}

// Extract savings amount for specific month from API response
// savingsData comes from getSavingsStats(year) which returns { monthlyBreakdown, totalSavings, ... }
function extractSavingsForMonth(savingsData: any, month: number): number {
  if (!savingsData) return 0;

  // getSavingsStats returns the stats object directly with monthlyBreakdown at top level
  const breakdown: any[] | undefined =
    savingsData.monthlyBreakdown ||        // getSavingsStats result
    savingsData.data?.monthlyBreakdown;    // fallback for wrapped response

  if (!breakdown) return 0;

  const monthData = breakdown.find((m: any) => m.month === month);
  return Number(monthData?.savings || 0);
}

// Extract shares amount for specific month from API response
function extractSharesForMonth(savingsData: any, month: number): number {
  if (!savingsData) return 0;

  const breakdown: any[] | undefined =
    savingsData.monthlyBreakdown ||
    savingsData.data?.monthlyBreakdown;

  if (!breakdown) return 0;

  const monthData = breakdown.find((m: any) => m.month === month);
  return Number(monthData?.shares || 0);
}

// Extract loans amount for specific month from API response
// getEnhancedLoansSummary returns ApiResponse wrapper: { data: { monthlyBreakdown: [...] } }
function extractLoansForMonth(loansData: any, month: number): number {
  if (!loansData) return 0;

  // Handle both wrapped ({ data: { monthlyBreakdown } }) and direct ({ monthlyBreakdown }) formats
  const breakdown: any[] | undefined =
    loansData.data?.monthlyBreakdown ||
    loansData.monthlyBreakdown;

  if (!breakdown) return 0;

  const monthData = breakdown.find((m: any) => m.month === month);
  return Number(monthData?.disbursedAmount || 0);
}

// Extract transaction amounts for specific month from API response
function extractTransactionsForMonth(
  transactionsData: any, 
  month: number, 
  year: number
): { total: number; deposits: number; withdrawals: number } {
  let transactionsList: any[] = [];

  if (transactionsData?.data?.data && Array.isArray(transactionsData.data.data)) {
    transactionsList = transactionsData.data.data;
  } else if (transactionsData?.data && Array.isArray(transactionsData.data)) {
    transactionsList = transactionsData.data;
  } else if (Array.isArray(transactionsData)) {
    transactionsList = transactionsData;
  } else {
    return { total: 0, deposits: 0, withdrawals: 0 };
  }

  // Filter transactions for the specific month and year
  const monthTransactions = transactionsList.filter((transaction: any) => {
    if (!transaction.createdAt) return false;
    
    const transactionDate = new Date(transaction.createdAt);
    const transactionMonth = transactionDate.getMonth() + 1; // 1-based month
    const transactionYear = transactionDate.getFullYear();
    
    return transactionMonth === month && transactionYear === year;
  });

  // Calculate totals for this month
  let deposits = 0;
  let withdrawals = 0;
  let total = 0;

  monthTransactions.forEach((transaction: any) => {
    const amount = Number(transaction.amount || 0);
    
    // Categorize by baseType or transactionType
    if (transaction.baseType === 'CREDIT' || 
        transaction.transactionType?.includes('DEPOSIT') || 
        transaction.transactionType?.includes('PURCHASE')) {
      deposits += amount;
      total += amount;
    } else if (transaction.baseType === 'DEBIT' || 
               transaction.transactionType?.includes('WITHDRAWAL')) {
      withdrawals += amount;
      total += amount;
    }
  });

  return { total, deposits, withdrawals };
}

// Calculate overall totals from all data sources
function calculateTotals(savingsData: any, loansData: any, transactionsData: any) {
  // getSavingsStats returns { totalSavings, totalShares, ... } at top level
  const totalSavings = Number(
    savingsData?.totalSavings || savingsData?.data?.totalSavings || 0
  );
  const totalShares = Number(
    savingsData?.totalShares || savingsData?.data?.totalShares || 0
  );

  // Enhanced loan summary is wrapped: { data: { totalDisbursed } }
  const totalLoans = Number(loansData?.data?.totalDisbursed || loansData?.totalDisbursed || 0);
  
  // Transaction totals
  let totalTransactions = 0;
  let totalDeposits = 0;
  let totalWithdrawals = 0;

  if (transactionsData?.data?.data && Array.isArray(transactionsData.data.data)) {
    transactionsData.data.data.forEach((transaction: any) => {
      const amount = Number(transaction.amount || 0);
      totalTransactions += amount;

      if (transaction.baseType === 'CREDIT' || 
          transaction.transactionType?.includes('DEPOSIT') || 
          transaction.transactionType?.includes('PURCHASE')) {
        totalDeposits += amount;
      } else if (transaction.baseType === 'DEBIT' || 
                 transaction.transactionType?.includes('WITHDRAWAL')) {
        totalWithdrawals += amount;
      }
    });
  }

  return {
    totalSavings,
    totalLoans,
    totalTransactions,
    totalShares,
    totalDeposits,
    totalWithdrawals,
  };
}