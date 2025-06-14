import { Prisma, TransactionStatus, TransactionType, TransactionModule, NotificationType, NotificationPriority } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { ISavingsResponse } from '../interfaces/savings.interface';
import logger from '../../../utils/logger';
import { SystemSettingsService } from '../../system/services/systemSettings.service';
import { TransactionService } from '../../transaction/services/transaction.service';

/**
 * Process a monthly savings transaction for a cooperative member
 */
export const processSavingsTransaction = async (
    tx: Prisma.TransactionClient,
    data: {
        memberId: string;
        erpId: string;
        grossAmount: Decimal;
        savingsAmount: Decimal;
        shareAmount: Decimal;
        month: number;
        year: number;
        initiatorId?: string;
        description?: string;
    }
): Promise<ISavingsResponse> => {
    const { memberId, erpId, grossAmount, savingsAmount, shareAmount, month, year, initiatorId, description } = data;
    
    try {
        // Check for existing entry for this month/year
        const existingSavings = await tx.savings.findUnique({
            where: {
                erpId_month_year: {
                    erpId,
                    month,
                    year
                }
            }
        });
        
        if (existingSavings) {
            throw new Error(`Savings entry already exists for ${month}/${year}`);
        }
        
        // Validate member exists first
        const member = await tx.biodata.findFirst({
            where: { id: memberId, erpId },
            select: {
                id: true,
                fullName: true,
                department: true,
                users: {
                    select: { id: true }
                }
            }
        });
        
        if (!member) {
            throw new Error(`Member not found for erpId: ${erpId}`);
        }
        
        // Get ALL existing entries INCLUDING previous uploads in this transaction
        const allEntries = await tx.savings.findMany({
            where: { erpId },
            include: {
                shares: true,
                transactions: {
                    orderBy: { createdAt: 'desc' }
                }
            },
            orderBy: [
                { year: 'asc' },
                { month: 'asc' }
            ]
        });
        
        // Calculate cumulative totals properly
        const runningTotals = allEntries.reduce((acc, curr) => ({
            grossTotal: acc.grossTotal.add(curr.monthlyTarget || new Decimal(0)),
            savingsTotal: acc.savingsTotal.add(curr.balance || new Decimal(0)),
            sharesTotal: curr.shares[0] 
                ? acc.sharesTotal.add(curr.shares[0].totalValue || new Decimal(0))
                : acc.sharesTotal
        }), {
            grossTotal: new Decimal(grossAmount),
            savingsTotal: new Decimal(savingsAmount),
            sharesTotal: new Decimal(shareAmount)
        });

        // Create savings entry with ACCUMULATED totals
        const savings = await tx.savings.create({
            data: {
                memberId,
                erpId,
                balance: savingsAmount,
                monthlyTarget: grossAmount,
                month,
                year,
                lastDeposit: new Date(),
                description: description || `Monthly savings for ${month}/${year}`,
                status: 'ACTIVE',
                isProcessed: false,
                totalGrossAmount: runningTotals.grossTotal,    // Use accumulated total
                totalSavingsAmount: runningTotals.savingsTotal // Use accumulated total
            }
        });

        // Create shares entry with proper total
        const shares = await tx.shares.create({
            data: {
                memberId,
                erpId,
                savingsId: savings.id,
                totalValue: shareAmount,
                monthlyTarget: shareAmount,
                month,
                year,
                lastPurchase: new Date(),
                status: 'ACTIVE',
                valuePerUnit: shareAmount,
                unitsHeld: new Decimal(1).toNumber(),
                totalSharesAmount: runningTotals.sharesTotal
            }
        });

        // Update ALL existing entries with new totals
        await Promise.all(allEntries.map(entry =>
            Promise.all([
                tx.savings.update({
                    where: { id: entry.id },
                    data: {
                        totalGrossAmount: runningTotals.grossTotal,
                        totalSavingsAmount: runningTotals.savingsTotal
                    }
                }),
                tx.shares.update({
                    where: { id: entry.shares[0]?.id },
                    data: {
                        totalSharesAmount: runningTotals.sharesTotal
                    }
                })
            ])
        ));

        // Get effective initiator
        const effectiveInitiatorId = initiatorId || 
            member.users[0]?.id || 
            await SystemSettingsService.getInstance().ensureSystemUser();

        const transactionService = new TransactionService();
        // Create savings deposit transaction using the TransactionService
        const savingsTransaction = await transactionService.createTransactionWithTx(tx, {
            transactionType: TransactionType.SAVINGS_DEPOSIT,
            module: TransactionModule.SAVINGS,
            amount: savingsAmount,
            description: `Net savings for ${month}/${year}`,
            initiatedBy: effectiveInitiatorId,
            relatedEntityId: savings.id,
            relatedEntityType: 'SAVINGS',
            balanceAfter: runningTotals.savingsTotal,
            autoComplete: true
        });
        
        // Create shares purchase transaction using the TransactionService
        const sharesTransaction = await transactionService.createTransactionWithTx(tx, {
            transactionType: TransactionType.SHARES_PURCHASE,
            module: TransactionModule.SHARES,
            amount: shareAmount,
            description: `Shares contribution for ${month}/${year}`,
            initiatedBy: effectiveInitiatorId,
            relatedEntityId: shares.id,
            relatedEntityType: 'SHARES',
            balanceAfter: runningTotals.sharesTotal,
            autoComplete: true
        });
        
        // Create notification
        if (member.users.length > 0) {
            const memberId = member.users[0].id;
            
            await tx.notification.create({
                data: {
                    userId: memberId,
                    type: NotificationType.TRANSACTION,
                    title: 'Monthly Savings Recorded',
                    message: `Your monthly contribution of ₦${grossAmount} for ${month}/${year} has been processed. ₦${shareAmount} allocated to shares and ₦${savings.balance} to savings.`,
                    priority: NotificationPriority.NORMAL,
                    isRead: false
                }
            });
        }
        
        // Mark savings as processed
        await tx.savings.update({
            where: { id: savings.id },
            data: { isProcessed: true }
        });
        logger.info(`Successfully processed savings for ${erpId} for ${month}/${year}`);
        
        // Return combined information with proper totals
        return {
            id: savings.id,
            erpId,
            balance: savingsAmount,
            totalAmount: runningTotals.grossTotal,
            monthlyTarget: grossAmount,
            month,
            year,
            isProcessed: true,
            status: savings.status,
            description: savings.description,
            member: {
                id: memberId,
                name: member.fullName,
                department: member.department
            },
            transactions: [
                {
                    id: savingsTransaction.id,
                    amount: savingsTransaction.amount,
                    transactionType: savingsTransaction.transactionType,
                    status: savingsTransaction.status,
                    description: savingsTransaction.description || null,
                    createdAt: savingsTransaction.createdAt,
                    balanceAfter: savingsTransaction.balanceAfter
                },
                {
                    id: sharesTransaction.id,
                    amount: sharesTransaction.amount,
                    transactionType: sharesTransaction.transactionType,
                    status: sharesTransaction.status,
                    description: sharesTransaction.description || null,
                    createdAt: sharesTransaction.createdAt,
                    balanceAfter: sharesTransaction.balanceAfter
                }
            ]
        };
    } catch (error) {
        logger.error(`Error processing savings transaction:`, error);
        throw error;
    }
};
