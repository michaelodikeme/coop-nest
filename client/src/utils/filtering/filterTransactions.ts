import { TransactionRecord } from '@/types/transaction.types';

interface TransactionFilters {
  module?: string;
  transactionType?: string;
  status?: string;
  startDate?: Date | null;
  endDate?: Date | null;
}

export function filterTransactions(
  transactions: TransactionRecord[], 
  filters: TransactionFilters
): TransactionRecord[] {
  return transactions.filter(tx => {
    // Module filter
    const matchesModule = !filters.module || tx.module === filters.module;
    
    // Transaction type filter
    const matchesType = !filters.transactionType || tx.transactionType === filters.transactionType;
    
    // Status filter
    const matchesStatus = !filters.status || tx.status === filters.status;
    
    // Date range filters
    let matchesDateRange = true;
    if (filters.startDate) {
      const txDate = new Date(tx.createdAt);
      matchesDateRange = matchesDateRange && txDate >= filters.startDate;
    }
    
    if (filters.endDate) {
      const txDate = new Date(tx.createdAt);
      const endOfDay = new Date(filters.endDate);
      endOfDay.setHours(23, 59, 59, 999); // Set to end of day
      matchesDateRange = matchesDateRange && txDate <= endOfDay;
    }
    
    return matchesModule && matchesType && matchesStatus && matchesDateRange;
  });
}