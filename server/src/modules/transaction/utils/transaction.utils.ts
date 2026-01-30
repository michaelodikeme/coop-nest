import { TransactionType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Determines the base transaction type (CREDIT/DEBIT) for a given transaction type
 * @param transactionType The specific transaction type
 * @returns The base transaction type (CREDIT/DEBIT)
 */
export function determineBaseType(transactionType: TransactionType): TransactionType {
    switch (transactionType) {
        // Credit transactions (increase balance)
        case TransactionType.SAVINGS_DEPOSIT:
        case TransactionType.PERSONAL_SAVINGS_DEPOSIT:
        case TransactionType.SHARES_PURCHASE:
        case TransactionType.SAVINGS_INTEREST:
        case TransactionType.SHARES_DIVIDEND:
        case TransactionType.LOAN_REPAYMENT:
            return TransactionType.CREDIT;
            
        // Debit transactions (decrease balance)
        case TransactionType.SAVINGS_WITHDRAWAL:
        case TransactionType.PERSONAL_SAVINGS_WITHDRAWAL:
        case TransactionType.SHARES_LIQUIDATION:
        case TransactionType.LOAN_DISBURSEMENT:
        case TransactionType.LOAN_PENALTY:
        case TransactionType.FEE:
            return TransactionType.DEBIT;
            
        // Special cases
        case TransactionType.ADJUSTMENT:
        case TransactionType.REVERSAL:
            // These types need explicit base type specification when creating the transaction
            return TransactionType.CREDIT; // Default to credit, though should be overridden
            
        default:
            return transactionType;
    }
}

/**
 * Format amount for display with currency symbol
 * @param amount Amount to format
 * @param currency Currency symbol
 * @returns Formatted amount string
 */
export function formatCurrency(amount: number | Decimal, currency: string = '₦'): string {
    const numericAmount = typeof amount === 'number' ? amount : amount.toNumber();
    return `${currency}${numericAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}