import { TransactionRecord } from '@/types/transaction.types';

interface ActivityItem {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'LOAN_DISBURSEMENT' | 'LOAN_REPAYMENT' | 'MEMBER_JOINED' | 'SHARES_PURCHASE';
  title: string;
  description?: string;
  amount?: number;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  timestamp: string;
  user?: {
    name: string;
    avatar?: string;
  };
}

export function transformTransactionToActivity(transaction: TransactionRecord): ActivityItem {
  // Map transaction types to activity types
  const getActivityType = (transaction: TransactionRecord): ActivityItem['type'] => {
    // Prioritize baseType for clear credit/debit actions
    if (transaction.baseType === 'CREDIT') {
      // Further refine based on transactionType for specific credit types
      if (transaction.transactionType.includes('LOAN_REPAYMENT')) {
        return 'LOAN_REPAYMENT';
      }
      if (transaction.transactionType.includes('SHARES_PURCHASE')) {
        return 'SHARES_PURCHASE';
      }
      return 'DEPOSIT';
    }
    
    if (transaction.baseType === 'DEBIT') {
      // Further refine based on transactionType for specific debit types
      if (transaction.transactionType.includes('LOAN_DISBURSEMENT')) {
        return 'LOAN_DISBURSEMENT';
      }
      return 'WITHDRAWAL';
    }

    // Fallback for older data or transactions without a baseType
    if (transaction.transactionType.includes('DEPOSIT')) return 'DEPOSIT';
    if (transaction.transactionType.includes('WITHDRAWAL')) return 'WITHDRAWAL';
    if (transaction.transactionType.includes('LOAN_DISBURSEMENT')) return 'LOAN_DISBURSEMENT';
    if (transaction.transactionType.includes('LOAN_REPAYMENT')) return 'LOAN_REPAYMENT';
    if (transaction.transactionType.includes('SHARES')) return 'SHARES_PURCHASE';
    
    return 'DEPOSIT'; // Default fallback
  };

  // Generate user-friendly titles
  const generateTitle = (transaction: TransactionRecord): string => {
    const amount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'NGN'
    }).format(Number(transaction.amount));

    switch (transaction.transactionType) {
      case 'SAVINGS_DEPOSIT':
        return `Savings Deposit - ${amount}`;
      case 'SAVINGS_WITHDRAWAL':
        return `Savings Withdrawal - ${amount}`;
      case 'PERSONAL_SAVINGS_DEPOSIT':
        return `Personal Savings Deposit - ${amount}`;
      case 'PERSONAL_SAVINGS_WITHDRAWAL':
        return `Personal Savings Withdrawal - ${amount}`;
      case 'LOAN_DISBURSEMENT':
        return `Loan Disbursed - ${amount}`;
      case 'LOAN_REPAYMENT':
        return `Loan Repayment - ${amount}`;
      case 'SHARES_PURCHASE':
        return `Shares Purchase - ${amount}`;
      default:
        return `Transaction - ${amount}`;
    }
  };

  return {
    id: transaction.id,
    type: getActivityType(transaction),
    title: generateTitle(transaction),
    description: transaction.description || `${transaction.transactionType.replace(/_/g, ' ')}`,
    amount: Number(transaction.amount),
    status: transaction.status as ActivityItem['status'],
    timestamp: transaction.createdAt,
    user: {
      name: transaction.initiatedBy || 'System', // You might need to fetch user details
      avatar: undefined // Can be enhanced with user profile data
    }
  };
}

export function transformTransactionsToActivities(transactions: TransactionRecord[]): ActivityItem[] {
  // FIXED: Add validation and error handling
  if (!Array.isArray(transactions)) {
    console.error('transformTransactionsToActivities expects an array, received:', typeof transactions);
    return [];
  }

  if (transactions.length === 0) {
    console.log('No transactions to transform');
    return [];
  }

  console.log(`Transforming ${transactions.length} transactions to activities`);
  
  return transactions.map((transaction, index) => {
    try {
      return transformTransactionToActivity(transaction);
    } catch (error) {
      console.error(`Error transforming transaction ${index}:`, error, transaction);
      // Return a fallback activity item
      return {
        id: transaction.id || `fallback-${index}`,
        type: 'DEPOSIT' as const,
        title: 'Transaction',
        description: 'Failed to load transaction details',
        amount: Number(transaction.amount) || 0,
        status: 'COMPLETED' as const,
        timestamp: transaction.createdAt || new Date().toISOString(),
        user: {
          name: 'System',
          avatar: undefined
        }
      };
    }
  });
}