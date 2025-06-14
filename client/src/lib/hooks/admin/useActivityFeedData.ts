import { useQuery } from '@tanstack/react-query';
import { useRecentTransactions } from '@/lib/hooks/admin/useAdminTransactions';
import { transformTransactionsToActivities } from '@/lib/utils/transformTransactionToActivity';

export function useActivityFeedData(maxItems = 10) {
  const { 
    data: transactionData, 
    isLoading, 
    error,
    refetch 
  } = useRecentTransactions(maxItems);

  return useQuery({
    queryKey: ['activity-feed-data', maxItems, transactionData],
    queryFn: () => {
      // FIXED: Check for array and ensure we have data
      if (!transactionData || !Array.isArray(transactionData) || transactionData.length === 0) {
        console.log('No transaction data available for activity feed');
        return [];
      }
      
      console.log('Processing transactions for activity feed:', transactionData);
      
      // Transform transactions to activity items
      const activities = transformTransactionsToActivities(transactionData);
      
      console.log('Transformed activities for feed:', activities);
      return activities;
    },
    enabled: !!transactionData && Array.isArray(transactionData),
    staleTime: 60000, // 1 minute
  });
}