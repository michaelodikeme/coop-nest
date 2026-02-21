import { Decimal } from '@prisma/client/runtime/library';

export const formatCurrency = (amount: Decimal | number): string => {
    const value = Number(amount);
    // Use 'N' instead of ₦ symbol for better PDF font compatibility
    return `N${new Intl.NumberFormat('en-NG', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value)}`;
};