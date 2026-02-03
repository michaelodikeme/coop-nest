'use client';

import React, { useMemo } from 'react';
import { useQueryWithToast } from '@/lib/hooks/redux/useDataFetching';
import { savingsService } from '@/lib/api/services/savingsService';
import { loanService } from '@/lib/api';

interface FinancialSummaryProps {
  timeFrame?: 'week' | 'month' | 'year';
}

const FinancialSummary = ({ timeFrame = 'month' }: FinancialSummaryProps) => {
  // Use memo for consistent date rendering across server/client
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  
  // Get savings summary
  const {
    data: savingsSummary,
    isLoading: savingsLoading
  } = useQueryWithToast(
    ['savings-summary'],
    () => savingsService.getSavingsSummary(),
    { errorMessage: 'Failed to load savings summary' }
  );

  // Get loan summary
  const {
    data: loanSummary,
    isLoading: loansLoading
  } = useQueryWithToast(
    ['loan-summary'],
    () => loanService.getLoansSummary(),
    { errorMessage: 'Failed to load loan summary' }
  );
  
  // Get total assets
  const {
    data: stats,
    isLoading: statsLoading
  } = useQueryWithToast(
    ['savings-stats', currentYear.toString()],
    () => savingsService.getSavingsStats(currentYear),
    { errorMessage: 'Failed to load savings statistics' }
  );

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Financial Summary</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">Total Assets</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {statsLoading ? 'Loading...' : formatCurrency(stats?.monthlyData?.[stats.monthlyData.length - 1]?.yearlyTotal || 0)}
          </p>
        </div>
        
        <div>
          <p className="text-sm font-medium text-gray-500">Total Savings</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {savingsLoading ? 'Loading...' : formatCurrency(savingsSummary?.totalSavingsAmount || 0)}
          </p>
        </div>
        
        <div>
          <p className="text-sm font-medium text-gray-500">Total Loan Amount</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {loansLoading ? 'Loading...' : formatCurrency(loanSummary?.totalOutstanding || 0)}
          </p>
        </div>
        
        <div>
          <p className="text-sm font-medium text-gray-500">Monthly Deposits</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {savingsLoading ? 'Loading...' : formatCurrency(savingsSummary?.monthlyTarget || 0)}
          </p>
        </div>
      </div>
      
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-500 mb-2">This {timeFrame}</h3>
        
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500">New Deposits</p>
            <p className="mt-1 text-lg font-medium text-gray-900">
              {savingsLoading ? '...' : savingsSummary?.contributionCount || 0}
            </p>
          </div>
          
          <div>
            <p className="text-xs text-gray-500">New Loans</p>
            <p className="mt-1 text-lg font-medium text-gray-900">
              {loansLoading ? '...' : loanSummary?.newLoansCount || 0}
            </p>
          </div>
          
          <div>
            <p className="text-xs text-gray-500">Loan Repayments</p>
            <p className="mt-1 text-lg font-medium text-gray-900">
              {loansLoading ? '...' : loanSummary?.repaymentsCount || 0}
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <a 
          href="/admin/financial" 
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          View detailed reports →
        </a>
      </div>
    </div>
  );
};

export default FinancialSummary;
