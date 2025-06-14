import { format as fnsFormat } from 'date-fns';
import { enUS } from 'date-fns/locale';

/**
 * Format a number as currency (Naira)
 */
export function formatCurrency(amount: number | string, p0?: { notation: string; }): string {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numericAmount)) return '₦0.00';

  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);
}

/**
 * Format a date string to a readable format
 */
export const formatDate = (dateValue: string | Date | null | undefined): string => {
  // Return placeholder for empty values
  if (dateValue === null || dateValue === undefined || dateValue === '') {
    return 'N/A';
  }
  
  try {
    // Try to create a valid date
    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    // Format the valid date
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.warn('Date formatting error:', error, 'for value:', dateValue);
    return 'Invalid Date';
  }
};

/**
 * Format a number with comma separators
 */
export function formatNumber(num: number | string): string {
  const numericValue = typeof num === 'string' ? parseFloat(num) : num;
  
  if (isNaN(numericValue)) return '0';
  
  return new Intl.NumberFormat().format(numericValue);
}