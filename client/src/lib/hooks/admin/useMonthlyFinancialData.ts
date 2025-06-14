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
      
      try {
        // Fetch all data concurrently
        const [savingsData, loansData, transactionsData] = await Promise.allSettled([
          // FIXED: Call the correct method that returns monthly breakdown
          savingsService.getAdminSavingsSummary(), // This should work based on your API response
          
          // Get enhanced loan summary with monthly breakdown
          loanService.getEnhancedLoansSummary({
            includeMonthlyBreakdown: true
          }),
          
          // FIXED: Get more transactions and use the correct response structure
          transactionService.getAllTransactions({
            page: 1,
            limit: 5000, // Increased to capture more data
          })
        ]);

        // Process savings data
        let savingsStats: any = null;
        if (savingsData.status === 'fulfilled') {
          savingsStats = savingsData.value;
          console.log('Savings data fetched successfully:', savingsStats);
          console.log('Savings data structure check:', {
            hasData: !!savingsStats?.data?.data,
            hasMonthlyBreakdown: !!savingsStats?.data?.monthlyBreakdown,
            directMonthlyBreakdown: !!savingsStats?.monthlyBreakdown,
            breakdownLength: savingsStats?.data?.monthlyBreakdown?.length || savingsStats?.monthlyBreakdown?.length || 0
          });
        } else {
          console.error('Failed to fetch savings data:', savingsData.reason);
        }

        // Process loans data
        let loansStats: any = null;
        if (loansData.status === 'fulfilled') {
          loansStats = loansData.value;
          console.log('Loans data fetched successfully:', loansStats);
        } else {
          console.error('Failed to fetch loans data:', loansData.reason);
        }

        // Process transactions data
        let transactionsStats: any = null;
        if (transactionsData.status === 'fulfilled') {
          transactionsStats = transactionsData.value;
          console.log('Transactions data fetched successfully:', transactionsStats);
          console.log('Transactions data structure check:', {
            hasData: !!transactionsStats?.data,
            hasNestedData: !!transactionsStats?.data?.data,
            isDirectArray: Array.isArray(transactionsStats),
            dataLength: transactionsStats?.data?.data?.length || transactionsStats?.data?.length || 0,
            total: transactionsStats?.data?.total || 0
          });
        } else {
          console.error('Failed to fetch transactions data:', transactionsData.reason);
        }

        // Transform data into monthly format
        const monthlyData = transformToMonthlyData(savingsStats, loansStats, transactionsStats, year);
        
        // Calculate totals
        const totals = calculateTotals(savingsStats, loansStats, transactionsStats);
        console.log('Monthly financial data transformed:', monthlyData);

        const result: MonthlyFinancialStats = {
          monthlyData,
          totals,
          year
        };

        console.log('Final monthly financial data:', result.totals);
        return result;

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
function extractSavingsForMonth(savingsData: any, month: number): number {
  // FIXED: Check multiple possible data structures
  console.log('Savings data structure:', savingsData);
  
  if (!savingsData) {
    console.log('No savings data provided');
    return 0;
  }

  // Check if data is directly in savingsData.data.monthlyBreakdown
  if (savingsData.data?.monthlyBreakdown) {
    const monthData = savingsData.data.monthlyBreakdown.find((m: any) => m.month === month);
    if (monthData) {
      const savingsAmount = Number(monthData.savings || 0);
      console.log(`Month ${month} savings from data.monthlyBreakdown:`, savingsAmount);
      return savingsAmount;
    }
  }

  // Check if data is directly in savingsData.monthlyBreakdown
  if (savingsData.monthlyBreakdown) {
    const monthData = savingsData.monthlyBreakdown.find((m: any) => m.month === month);
    if (monthData) {
      const savingsAmount = Number(monthData.savings || 0);
      console.log(`Month ${month} savings from monthlyBreakdown:`, savingsAmount);
      return savingsAmount;
    }
  }

  console.log(`No savings monthly breakdown found for month ${month}`);
  return 0;
}

// Extract shares amount for specific month from API response
function extractSharesForMonth(savingsData: any, month: number): number {
  if (!savingsData) return 0;

  // FIXED: Check multiple possible data structures  
  let monthlyBreakdown = savingsData.data?.monthlyBreakdown || savingsData.monthlyBreakdown;
  
  if (!monthlyBreakdown) {
    console.log(`No shares monthly breakdown found for month ${month}`);
    return 0;
  }

  const monthData = monthlyBreakdown.find((m: any) => m.month === month);
  if (!monthData) {
    return 0;
  }

  // Convert string to number and handle the 'shares' field
  const sharesAmount = Number(monthData.shares || 0);
  console.log(`Month ${month} shares:`, sharesAmount);
  return sharesAmount;
}

// Extract loans amount for specific month from API response
function extractLoansForMonth(loansData: any, month: number): number {
  if (!loansData?.data?.monthlyBreakdown) {
    console.log('No loans monthly breakdown found');
    return 0;
  }

  const monthData = loansData.data.monthlyBreakdown.find((m: any) => m.month === month);
  if (!monthData) {
    return 0;
  }

  // Use disbursedAmount as the primary metric for chart display
  const disbursedAmount = Number(monthData.disbursedAmount || 0);
  console.log(`Month ${month} loans disbursed:`, disbursedAmount);
  return disbursedAmount;
}

// Extract transaction amounts for specific month from API response
function extractTransactionsForMonth(
  transactionsData: any, 
  month: number, 
  year: number
): { total: number; deposits: number; withdrawals: number } {
  // FIXED: Handle the actual response structure
  console.log('Transactions data structure:', transactionsData);
  
  let transactionsList = [];
  
  // Handle different response structures
  if (transactionsData?.data?.data && Array.isArray(transactionsData.data.data)) {
    transactionsList = transactionsData.data.data;
  } else if (transactionsData?.data && Array.isArray(transactionsData.data)) {
    transactionsList = transactionsData.data;
  } else if (Array.isArray(transactionsData)) {
    transactionsList = transactionsData;
  } else {
    console.log(`No valid transactions data found for month ${month}`);
    return { total: 0, deposits: 0, withdrawals: 0 };
  }

  console.log(`Total transactions available: ${transactionsList.length}`);

  // Filter transactions for the specific month and year
  const monthTransactions = transactionsList.filter((transaction: any) => {
    if (!transaction.createdAt) return false;
    
    const transactionDate = new Date(transaction.createdAt);
    const transactionMonth = transactionDate.getMonth() + 1; // 1-based month
    const transactionYear = transactionDate.getFullYear();
    
    return transactionMonth === month && transactionYear === year;
  });

  console.log(`Month ${month} filtered transactions:`, monthTransactions.length);

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

  console.log(`Month ${month} transaction totals:`, { total, deposits, withdrawals });
  return { total, deposits, withdrawals };
}

// Calculate overall totals from all data sources
function calculateTotals(savingsData: any, loansData: any, transactionsData: any) {
  // FIXED: Extract totals from the correct data structure
  let totalSavings = 0;
  let totalShares = 0;
  
  // Use the same logic as monthly extraction
  if (savingsData?.data?.totalSavings) {
    totalSavings = Number(savingsData.data.totalSavings);
  } else if (savingsData?.totalSavings) {
    totalSavings = Number(savingsData.totalSavings);
  }
  
  if (savingsData?.data?.totalShares) {
    totalShares = Number(savingsData.data.totalShares);
  } else if (savingsData?.totalShares) {
    totalShares = Number(savingsData.totalShares);
  }
  
  const totalLoans = Number(loansData?.data?.totalDisbursed || loansData?.totalDisbursed || 0);
  
  console.log('Totals calculated:', { totalSavings, totalShares, totalLoans });
  
  // Keep transaction totals calculation as is (it's working)
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