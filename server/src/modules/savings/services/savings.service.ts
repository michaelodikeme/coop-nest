import { Prisma, AccountStatus, Savings } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { ApiError } from '../../../utils/apiError';
import logger from '../../../utils/logger';
import {
    ISavingsQueryParams,
    ISavingsSummaryResponse,
    ITransactionHistoryParams,
    IMonthlySavingsInput,
    ISavingsStatementParams,
    ISavingsStatement,
    IPaginatedTransactionResponse,
    ISavingsStats,
    IPaginatedSavingsResponse,
    IProcessedSavings,
    ISavingsConfiguration,
    IAdminOverview
} from '../interfaces/savings.interface';
import {
    MemberSavingsSummaryParams,
    MemberSavingsSummaryResponse
} from '../interfaces/members-summary.interface';
import { processSavingsTransaction } from './transaction.service';
import { prisma } from '../../../utils/prisma';

export class SavingsService {
    constructor() {}
    
    async getAllSavings(queryParams: ISavingsQueryParams): Promise<IPaginatedSavingsResponse> {
        try {
            const { page = 1, limit = 12, year, month, erpId, department } = queryParams;
            
            const where = {
                ...(year && { year: { equals: year } }),
                ...(month && { month: { equals: month } }),
                ...(erpId && { erpId: { equals: erpId } }),
                ...(department && { member: { department: { equals: department } } })
            };
            
            const [total, savings] = await Promise.all([
                prisma.savings.count({ where }),
                prisma.savings.findMany({
                    where,
                    include: {
                        member: {
                            select: {
                                id: true,
                                fullName: true,
                                department: true,
                                erpId: true
                            }
                        },
                        shares: {
                            select: {
                                id: true,
                                monthlyTarget: true,
                                totalValue: true,
                                totalSharesAmount: true
                            }
                        },
                        transactions: {
                            select: {
                                id: true,
                                amount: true,
                                transactionType: true,
                                baseType: true,
                                status: true,
                                description: true,
                                createdAt: true,
                                balanceAfter: true
                            },
                            orderBy: { createdAt: 'desc' }
                        }
                    },
                    orderBy: [
                        { year: 'desc' },
                        { month: 'desc' }
                    ],
                    skip: (page - 1) * limit,
                    take: limit
                })
            ]);
            
            return {
                data: savings.map(saving => ({
                    id: saving.id,
                    erpId: saving.erpId,
                    balance: saving.balance,
                    monthlyTarget: saving.monthlyTarget,
                    totalGrossAmount: saving.totalGrossAmount,
                    totalSavingsAmount: saving.totalSavingsAmount,
                    lastDeposit: saving.lastDeposit,
                    month: saving.month,
                    year: saving.year,
                    status: saving.status,
                    description: saving.description,
                    isProcessed: saving.isProcessed,
                    member: {
                        id: saving.member.id,
                        name: saving.member.fullName,
                        department: saving.member.department
                    },
                    shares: saving.shares.map(share => ({
                        id: share.id,
                        monthlyAmount: share.monthlyTarget,
                        totalAmount: share.totalValue,
                        totalSharesAmount: share.totalSharesAmount
                    })),
                    transactions: saving.transactions.map(tx => ({
                        id: tx.id,
                        amount: tx.amount,
                        transactionType: tx.transactionType,
                        baseType: tx.baseType,
                        status: tx.status,
                        description: tx.description,
                        createdAt: tx.createdAt,
                        balanceAfter: tx.balanceAfter
                    }))
                })),
                meta: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            logger.error('Error fetching savings:', error);
            throw new ApiError('Failed to fetch savings records', 500);
        }
    }    
    
    async createMonthlySavings(data: IMonthlySavingsInput): Promise<IProcessedSavings> {
        const { erpId, monthlyTarget: inputAmount, month, year, description } = data;
        const grossAmount = new Decimal(inputAmount);
        
        try {
            // Get member details first
            const member = await prisma.biodata.findFirst({
                where: { erpId },
                select: {
                    id: true,
                    fullName: true,
                    department: true,
                    users: {
                        select: {
                            id: true
                        }
                    }
                }
            });
            
            if (!member) {
                throw new ApiError('Member not found', 404);
            }
            
            // Validate that the member hasn't already contributed for this month/year
            const existingSavings = await prisma.savings.findUnique({
                where: {
                    erpId_month_year: {
                        erpId,
                        month,
                        year
                    }
                }
            });
            
            if (existingSavings) {
                throw new ApiError(`Savings entry already exists for ${month}/${year}`, 400);
            }
            
            // Validate gross amount against share amount
            const shareAmount = await this.getShareAmount(erpId);
            const savingsAmount = grossAmount.minus(shareAmount);
            
            if (savingsAmount.lessThan(0)) {
                throw new ApiError(
                    `Gross amount (${grossAmount}) must be greater than share amount (${shareAmount})`, 
                    400
                );
            }
            
            // // Calculate savings and share amounts
            // const shareAmount = await this.getShareAmount(erpId);
            // const savingsAmount = grossAmount.minus(shareAmount);
            
            // Use transaction service to handle all transaction-related operations
            const transactionResult = await prisma.$transaction(async (tx) => {
                return await processSavingsTransaction(tx, {
                    memberId: member.id,
                    erpId,
                    grossAmount: grossAmount,
                    savingsAmount: savingsAmount,
                    shareAmount: shareAmount,
                    month,
                    year,
                    initiatorId: member.users[0]?.id,
                    description: description || `Monthly savings for ${month}/${year}`
                });
            });
            
            // Get the complete savings record with related data
            const savings = await prisma.savings.findUnique({
                where: { id: transactionResult.id },
                include: {
                    member: {
                        select: {
                            id: true,
                            fullName: true,
                            department: true
                        }
                    },
                    shares: {
                        select: {
                            id: true,
                            monthlyTarget: true,
                            totalValue: true
                        }
                    },
                    transactions: {
                        select: {
                            id: true,
                            amount: true,
                            transactionType: true,
                            status: true,
                            createdAt: true,
                            description: true
                        }
                    }
                }
            });
            
            if (!savings) {
                throw new ApiError('Failed to fetch created savings record', 500);
            }
            
            // Map the response to IProcessedSavings format
            return {
                id: savings.id,
                erpId: savings.erpId,
                monthlyAmount: savings.monthlyTarget,
                totalAmount: savings.balance,
                month: savings.month,
                year: savings.year,
                description: savings.description,
                status: savings.status,
                biodata: {
                    name: savings.member.fullName,
                    department: savings.member.department
                },
                shares: savings.shares.map(share => ({
                    id: share.id,
                    monthlyAmount: share.monthlyTarget,
                    totalAmount: share.totalValue
                })),
                transactions: savings.transactions.map(tx => ({
                    id: tx.id,
                    amount: tx.amount,
                    transactionType: tx.transactionType,
                    status: tx.status,
                    description: tx.description,
                    createdAt: tx.createdAt
                }))
            };
        } catch (error) {
            if (error instanceof ApiError) throw error;
            logger.error('Error creating monthly savings:', error);
            throw new ApiError(
                'Failed to create monthly savings: ' + (error instanceof Error ? error.message : 'Unknown error'),
                500
            );
        }
    }
    
    async getSavingsStatement({ erpId, year }: ISavingsStatementParams): Promise<ISavingsStatement> {
        try {
            const member = await prisma.biodata.findFirst({
                where: { erpId },
                select: {
                    id: true,
                    erpId: true,
                    staffNo: true,
                    fullName: true,
                    department: true,
                    phoneNumber: true,
                    accountInfo: {
                        select: {
                            accountNumber: true,
                            accountName: true,
                            bvn: true,
                            bank: {
                                select: {
                                    name: true
                                }
                            }
                        }
                    }
                }
            });

            if (!member) {
                throw new ApiError('Member not found', 404);
            }

            // Fetch ALL savings records for the member (not just one)
            const allSavings = await prisma.savings.findMany({
                where: {
                    erpId,
                    ...(year && { year })
                },
                orderBy: [
                    { year: 'desc' },
                    { month: 'desc' }
                ],
                include: {
                    transactions: {
                        select: {
                            id: true,
                            createdAt: true,
                            transactionType: true,
                            baseType: true,
                            amount: true,
                            balanceAfter: true,
                            description: true,
                            status: true
                        },
                        orderBy: {
                            createdAt: 'desc'
                        }
                    },
                    shares: {
                        select: {
                            totalSharesAmount: true,
                            monthlyTarget: true,
                            transactions: {
                                select: {
                                    id: true,
                                    createdAt: true,
                                    transactionType: true,
                                    baseType: true,
                                    amount: true,
                                    balanceAfter: true,
                                    description: true,
                                    status: true
                                },
                                orderBy: {
                                    createdAt: 'desc'
                                }
                            }
                        }
                    }
                }
            });

            if (!allSavings || allSavings.length === 0) {
                throw new ApiError('No savings records found', 404);
            }

            // Get the most recent savings record for summary info
            const latestSavings = allSavings[0];

            // Collect all transactions from all savings records AND shares records
            const allTransactions: any[] = [];

            allSavings.forEach(savingsRecord => {
                // Add savings transactions
                if (savingsRecord.transactions && savingsRecord.transactions.length > 0) {
                    savingsRecord.transactions.forEach(tx => {
                        allTransactions.push({
                            date: tx.createdAt,
                            transactionType: tx.transactionType,
                            baseType: tx.baseType,
                            amount: Number(tx.amount),
                            description: tx.description || ''
                        });
                    });
                }

                // Add share transactions
                if (savingsRecord.shares && savingsRecord.shares.length > 0) {
                    savingsRecord.shares.forEach(shareRecord => {
                        if (shareRecord.transactions && shareRecord.transactions.length > 0) {
                            shareRecord.transactions.forEach(tx => {
                                allTransactions.push({
                                    date: tx.createdAt,
                                    transactionType: tx.transactionType,
                                    baseType: tx.baseType,
                                    amount: Number(tx.amount),
                                    description: tx.description || ''
                                });
                            });
                        }
                    });
                }
            });

            // Sort all transactions by date descending (most recent first)
            allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            // Calculate totals from ACTUAL TRANSACTIONS (not from savings record fields)
            // Note: Withdrawal amounts are already negative in the database
            let totalSavingsAmount = 0;
            let totalSharesAmount = 0;

            allTransactions.forEach(tx => {
                if (tx.transactionType === 'SAVINGS_DEPOSIT') {
                    totalSavingsAmount += tx.amount;
                } else if (tx.transactionType === 'SAVINGS_WITHDRAWAL') {
                    // Amount is already negative, so adding it subtracts from total
                    totalSavingsAmount += tx.amount;
                } else if (tx.transactionType === 'SHARES_PURCHASE') {
                    totalSharesAmount += tx.amount;
                }
            });

            logger.info(`Fetched statement for ${erpId}: ${allSavings.length} savings records, ${allTransactions.length} total transactions`);

            return {
                memberInfo: {
                    id: member.id,
                    memberName: member.fullName,
                    erpId: member.erpId,
                    staffNo: member.erpId,
                    department: member.department,
                    phoneNumber: member.phoneNumber || '',
                    accountInfo: member.accountInfo.map(acc => ({
                        accountNo: acc.accountNumber,
                        accountName: acc.accountName,
                        bankName: acc.bank.name,
                        bvn: acc.bvn
                    })),
                    savings: {
                        id: latestSavings.id,
                        balance: latestSavings.balance,
                        monthlyTarget: latestSavings.monthlyTarget,
                        lastDeposit: latestSavings.lastDeposit,
                        status: latestSavings.status
                    },
                    totalSavings: totalSavingsAmount,
                    totalShares: totalSharesAmount,
                    transactions: allTransactions
                },
            };
        } catch (error) {
            if (error instanceof ApiError) throw error;
            logger.error('Error fetching savings statement:', error);
            throw new ApiError('Failed to fetch savings statement', 500);
        }
    }
    
    async getMemberSavings(biodataId: string, queryParams: ISavingsQueryParams): Promise<IPaginatedSavingsResponse> {
        try {
            const { page = 1, limit = 12, status } = queryParams;
            
            const where = {
                memberId: biodataId,
                ...(status && { status })
            };
            
            const [total, savings] = await Promise.all([
                prisma.savings.count({ where }),
                prisma.savings.findMany({
                    where,
                    include: {
                        member: {
                            select: {
                                fullName: true,
                                department: true,
                                erpId: true
                            }
                        },
                        shares: {
                            select: {
                                id: true,
                                monthlyTarget: true,
                                totalValue: true,
                                totalSharesAmount: true
                            }
                        },
                        transactions: {
                            select: {
                                id: true,
                                amount: true,
                                transactionType: true,
                                baseType: true,
                                status: true,
                                description: true,
                                createdAt: true,
                                balanceAfter: true
                            },
                            orderBy: { createdAt: 'desc' }
                        }
                    },
                    orderBy: [
                        { year: 'desc' },
                        { month: 'desc' }
                    ],
                    skip: (page - 1) * limit,
                    take: limit
                })
            ]);
            
            return {
                data: savings.map(saving => ({
                    id: saving.id,
                    erpId: saving.member.erpId,
                    balance: saving.balance,
                    monthlyTarget: saving.monthlyTarget,
                    totalGrossAmount: saving.totalGrossAmount,
                    totalSavingsAmount: saving.totalSavingsAmount,
                    lastDeposit: saving.lastDeposit,
                    month: saving.month,
                    year: saving.year,
                    status: saving.status,
                    description: saving.description,
                    isProcessed: saving.isProcessed,
                    member: {
                        id: saving.memberId,
                        name: saving.member.fullName,
                        department: saving.member.department
                    },
                    shares: saving.shares.map(share => ({
                        id: share.id,
                        monthlyAmount: share.monthlyTarget,
                        totalAmount: share.totalValue,
                        totalSharesAmount: share.totalSharesAmount
                    })),
                    transactions: saving.transactions.map(tx => ({
                        id: tx.id,
                        amount: tx.amount,
                        transactionType: tx.transactionType,
                        baseType: tx.baseType,
                        status: tx.status,
                        description: tx.description,
                        createdAt: tx.createdAt,
                        balanceAfter: tx.balanceAfter
                    }))
                })),
                meta: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            if (error instanceof ApiError) throw error;
            logger.error('Error fetching member savings:', error);
            throw new ApiError('Failed to fetch member savings', 500);
        }
    }
    
    async getSavingsSummary(biodataId: string): Promise<ISavingsSummaryResponse> {
        try {
            // Get latest savings record with totals
            const savings = await prisma.savings.findFirst({
                where: { memberId: biodataId },
                orderBy: [
                    { year: 'desc' },
                    { month: 'desc' }
                ],
                include: {
                    transactions: {
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    },
                    shares: {
                        orderBy: [
                            { year: 'desc' },
                            { month: 'desc' }
                        ],
                        take: 1
                    }
                }
            });
            
            if (!savings) {
                throw new ApiError('No savings record found', 404);
            }
            
            const lastTransaction = savings.transactions[0];
            const lastShare = savings.shares[0];
            
            return {
                id: savings.id,
                balance: savings.balance,
                monthlyTarget: savings.monthlyTarget,
                totalGrossAmount: savings.totalGrossAmount,
                totalSavingsAmount: savings.totalSavingsAmount,
                lastDeposit: lastTransaction?.createdAt,
                lastTransaction: lastTransaction ? {
                    amount: lastTransaction.amount,
                    type: lastTransaction.transactionType,
                    date: lastTransaction.createdAt
                } : undefined,
                shares: lastShare ? {
                    monthlyAmount: lastShare.monthlyTarget,
                    totalSharesAmount: lastShare.totalSharesAmount,
                } : undefined,
                accountStatus: savings.status
            };
        } catch (error) {
            if (error instanceof ApiError) throw error;
            logger.error('Error fetching savings summary:', error);
            throw new ApiError('Failed to fetch savings summary', 500);
        }
    }
    
    /**
    * Get aggregated savings summary for all members with pagination and filtering
    * This provides a member-centric view rather than transaction-centric view
    */
    async getMembersSummary(params: MemberSavingsSummaryParams): Promise<MemberSavingsSummaryResponse> {
        try {
            const {
                page = 1,
                limit = 10,
                search = '',
                department,
                sortBy = 'lastDeposit',
                sortOrder = 'desc',
                status
            } = params;

            // Build the where conditions for filtering
            const where: any = {};

            // Apply search filter (across member name, erpId)
            if (search) {
              where.OR = [
                { member: { fullName: { contains: search, mode: 'insensitive' } } },
                { erpId: { contains: search, mode: 'insensitive' } },
              ];
            }

            // Apply department filter
            if (department) {
              where.member = {
                ...(where.member || {}),
                department: { equals: department },
              };
            }

            // Apply status filter
            if (status) {
              try {
                // Only apply the status filter if it's a valid AccountStatus value
                const isValidAccountStatus = ['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status);
                if (isValidAccountStatus) {
                  where.status = status;
                } else {
                  // Log a warning that we're ignoring an invalid status filter
                  logger.warn(`Ignoring invalid AccountStatus value in filter: ${status}`);
                }
              } catch (error) {
                if (error instanceof ApiError) throw error;
                logger.warn('Error applying status filter:', error);
              }
            }

            // First, get unique member IDs from savings records
            const memberIds = await prisma.savings.groupBy({
              by: ['memberId'],
              where,
            });

            // Count total unique members for pagination
            const totalMembers = memberIds.length;

            // Calculate pagination values
            const skip = (page - 1) * limit;
            const take = limit;

            // Get member IDs for this page
            const paginatedMemberIds = memberIds
              .slice(skip, skip + take)
              .map(item => item.memberId);

            // Get the latest savings record for each member
            const memberSavings = await Promise.all(
              paginatedMemberIds.map(async (memberId) => {
                // Get the latest savings record for this member
                const latestSavings = await prisma.savings.findFirst({
                  where: { memberId },
                  orderBy: { lastDeposit: 'desc' },
                  include: {
                    member: {
                      select: {
                        id: true,
                        erpId: true,
                        fullName: true,
                        department: true
                      }
                    }
                  }
                });

                if (!latestSavings) return null;

                // Get the latest shares record for this member
                const latestShares = await prisma.shares.findFirst({
                  where: { memberId },
                  orderBy: { lastPurchase: 'desc' },
                  select: {
                    totalSharesAmount: true
                  }
                });

                return {
                  id: memberId,
                  erpId: latestSavings.erpId,
                  memberName: latestSavings.member.fullName,
                  department: latestSavings.member.department,
                  totalSavingsAmount: latestSavings.totalSavingsAmount,
                  totalSharesAmount: latestShares?.totalSharesAmount || new Prisma.Decimal(0),
                  totalGrossAmount: latestSavings.totalGrossAmount,
                  lastDeposit: latestSavings.lastDeposit,
                  status: latestSavings.status
                };
              })
            );

            // Filter out null values (in case any member doesn't have savings)
            const validMemberSavings = memberSavings.filter(item => item !== null) as Array<{
              id: string;
              erpId: string;
              memberName: string;
              department: string;
              totalSavingsAmount: Decimal;
              totalSharesAmount: Decimal;
              totalGrossAmount: Decimal;
              lastDeposit: Date | null;
              status: AccountStatus;
            }>;

            // Apply sorting
            const sortedMemberSavings = [...validMemberSavings].sort((a, b) => {
              if (sortBy === 'memberName') {
                return sortOrder === 'asc'
                  ? a.memberName.localeCompare(b.memberName)
                  : b.memberName.localeCompare(a.memberName);
              }
              
              if (sortBy === 'department') {
                return sortOrder === 'asc'
                  ? a.department.localeCompare(b.department)
                  : b.department.localeCompare(a.department);
              }
              
              if (sortBy === 'lastDeposit') {
                const dateA = a.lastDeposit ? new Date(a.lastDeposit).getTime() : 0;
                const dateB = b.lastDeposit ? new Date(b.lastDeposit).getTime() : 0;
                return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
              }
              
              // Default sorting for numeric fields
              const valA = a[sortBy as keyof typeof a];
              const valB = b[sortBy as keyof typeof b];
              
              // Handle decimals (Prisma.Decimal objects)
              if (valA instanceof Decimal && valB instanceof Decimal) {
                return sortOrder === 'asc' ? valA.cmp(valB) : valB.cmp(valA);
              }
              
              // Handle dates
              if (valA instanceof Date && valB instanceof Date) {
                return sortOrder === 'asc' 
                  ? valA.getTime() - valB.getTime() 
                  : valB.getTime() - valA.getTime();
              }
              
              // Handle strings
              if (typeof valA === 'string' && typeof valB === 'string') {
                return sortOrder === 'asc'
                  ? valA.localeCompare(valB)
                  : valB.localeCompare(valA);
              }
              
              // Handle numbers or convert to numbers for comparison if possible
              const numA = typeof valA === 'number' ? valA : 0;
              const numB = typeof valB === 'number' ? valB : 0;
              return sortOrder === 'asc' ? numA - numB : numB - numA;
            });

            return {
                data: sortedMemberSavings,
                meta: {
                    total: totalMembers,
                    page,
                    limit,
                    totalPages: Math.ceil(totalMembers / limit)
                }
            };
        } catch (error) {
            logger.error('Error fetching members summary:', error);
            throw new ApiError('Failed to fetch members savings summary', 500);
        }
    }
    
    async getTransactionHistory(params: ITransactionHistoryParams): Promise<IPaginatedTransactionResponse> {
        const {
            biodataId, // CRITICAL: Must filter by user's biodataId
            savingsId,
            page = 1,
            limit = 20,
            transactionType
        } = params;

        try {
            // Build where clause - MUST include biodataId to prevent leaking other users' data
            const where: any = {
                module: 'SAVINGS', // Only get savings-related transactions
                ...(transactionType && { transactionType }),
                // Filter by biodataId through the savings relation
                ...(biodataId && {
                    savings: {
                        memberId: biodataId
                    }
                }),
                // Optional: filter by specific savings record
                ...(savingsId && { savingsId })
            };

            const [total, transactions] = await Promise.all([
                prisma.transaction.count({ where }),
                prisma.transaction.findMany({
                    where,
                    select: {
                        id: true,
                        transactionType: true,
                        baseType: true,
                        amount: true,
                        balanceAfter: true,
                        status: true,
                        description: true,
                        createdAt: true,
                        module: true,
                        savingsId: true
                    },
                    orderBy: { createdAt: 'desc' },
                    skip: (page - 1) * limit,
                    take: limit
                })
            ]);

            return {
                data: transactions,
                meta: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            if (error instanceof ApiError) throw error;
            logger.error('Error fetching transaction history:', error);
            throw new ApiError('Failed to fetch transaction history', 500);
        }
    }
    
    async getMonthlySavings(year: number, month: number, biodataId?: string): Promise<IProcessedSavings | { data: IProcessedSavings[], meta: { total: number, page: number, limit: number, totalPages: number } }> {
        try {
            // If biodataId is provided, return a single record (existing behavior for members)
            if (biodataId) {
                const savings = await prisma.savings.findFirst({
                    where: {
                        year,
                        month,
                        memberId: biodataId
                    },
                    include: {
                        member: {
                            select: {
                                id: true,
                                fullName: true,
                                department: true
                            }
                        },
                        shares: {
                            select: {
                                id: true,
                                monthlyTarget: true,
                                totalValue: true
                            }
                        },
                        transactions: {
                            select: {
                                id: true,
                                amount: true,
                                transactionType: true,
                                status: true,
                                createdAt: true,
                                description: true
                            }
                        }
                    }
                });
                
                if (!savings) {
                    throw new ApiError('No savings record found for the specified period', 404);
                }
                
                return this.mapSavingsResponse(savings);
            }
            
            // If no biodataId is provided (admin view), return all records with pagination
            const page = 1;
            const limit = 50; // Default limit, can be adjusted or made configurable
            
            const [total, allSavings] = await Promise.all([
                prisma.savings.count({
                    where: { year, month }
                }),
                prisma.savings.findMany({
                    where: { year, month },
                    include: {
                        member: {
                            select: {
                                id: true,
                                fullName: true,
                                department: true,
                                erpId: true,
                                emailAddress: true,
                                phoneNumber: true
                            }
                        },
                        shares: {
                            select: {
                                id: true,
                                monthlyTarget: true,
                                totalValue: true
                            }
                        },
                        transactions: {
                            select: {
                                id: true,
                                amount: true,
                                transactionType: true,
                                status: true,
                                createdAt: true,
                                description: true
                            },
                            orderBy: { createdAt: 'desc' },
                            take: 5 // Limit transactions to avoid excessive data
                        }
                    },
                    orderBy: { erpId: 'asc' },
                    skip: (page - 1) * limit,
                    take: limit
                })
            ]);
            
            if (allSavings.length === 0) {
                throw new ApiError('No savings records found for the specified period', 404);
            }
            
            return {
                data: allSavings.map(savings => this.mapSavingsResponse(savings)),
                meta: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            if (error instanceof ApiError) throw error;
            logger.error('Error fetching monthly savings:', error);
            throw new ApiError('Failed to fetch monthly savings', 500);
        }
    }
    
    async getSavingsStats(year: number, biodataId?: string): Promise<ISavingsStats> {
        try {
            // First get all savings records for the specified year
            const savings = await prisma.savings.findMany({
                where: {
                    year,
                    ...(biodataId && { memberId: biodataId }) // Fixed: using memberId instead of biodataId
                },
                include: {
                    shares: {
                        select: {
                            monthlyTarget: true,
                            totalSharesAmount: true
                        }
                    },
                    transactions: {
                        select: {
                            amount: true,
                            transactionType: true,
                            createdAt: true,
                            baseType: true
                        }
                    }
                },
                orderBy: [
                    { year: 'asc' },
                    { month: 'asc' }
                ]
            });
            
            if (savings.length === 0) {
                throw new ApiError('No savings records found for the specified year', 404);
            }
            
            // Calculate total savings
            const totalSavings = savings.reduce((acc, curr) => acc.add(curr.totalSavingsAmount), new Prisma.Decimal(0));
            
            // Calculate total shares
            const totalShares = savings.reduce((acc, curr) => {
                const shareTotal = curr.shares.reduce((shareAcc, share) => 
                    shareAcc.add(share.totalSharesAmount), new Prisma.Decimal(0));
                return acc.add(shareTotal);
            }, new Prisma.Decimal(0));
            
            // Calculate monthly average savings
            const monthlyAverageSavings = savings.length > 0 
            ? totalSavings.div(savings.length)
            : new Prisma.Decimal(0);
            
            // Monthly contributions analysis
            const monthlyContributions = Array.from({ length: 12 }, (_, i) => {
                const monthSaving = savings.find(s => s.month === i + 1);
                return {
                    month: i + 1,
                    amount: monthSaving ? monthSaving.monthlyTarget : new Prisma.Decimal(0),
                    savings: monthSaving ? monthSaving.totalSavingsAmount : new Prisma.Decimal(0),
                    shares: monthSaving ? monthSaving.shares.reduce(
                        (acc, share) => acc.add(share.monthlyTarget), 
                        new Prisma.Decimal(0)
                    ) : new Prisma.Decimal(0),
                    hasContribution: !!monthSaving
                };
            });
            
            // Get transactions count
            const depositCount = savings.reduce((acc, saving) => {
                const deposits = saving.transactions.filter(
                    tx => tx.baseType === 'CREDIT'
                ).length;
                return acc + deposits;
            }, 0);
            
            const withdrawalCount = savings.reduce((acc, saving) => {
                const withdrawals = saving.transactions.filter(
                    tx => tx.baseType === 'DEBIT'
                ).length;
                return acc + withdrawals;
            }, 0);
            
            // Latest contribution
            const latestSaving = savings.sort((a, b) => {
                // Sort by year desc then month desc
                if (a.year !== b.year) return b.year - a.year;
                return b.month - a.month;
            })[0];
            
            return {
                totalSavings,
                totalShares,
                grossContributions: totalSavings.add(totalShares),
                monthlyAverageSavings,
                contributionMonths: savings.length,
                depositCount,
                withdrawalCount,
                monthlyBreakdown: monthlyContributions,
                latestContribution: latestSaving ? {
                    amount: latestSaving.monthlyTarget,
                    savingsAmount: latestSaving.totalSavingsAmount,
                    sharesAmount: latestSaving.shares.reduce(
                        (acc, share) => acc.add(share.totalSharesAmount), 
                        new Prisma.Decimal(0)
                    ),
                    month: latestSaving.month,
                    year: latestSaving.year,
                    date: latestSaving.lastDeposit
                } : null
            };
        } catch (error) {
            if (error instanceof ApiError) throw error;
            logger.error('Error getting savings stats:', error);
            throw new ApiError('Failed to fetch savings statistics', 500);
        }
    }
    
    async getShareAmount(erpId: string): Promise<Decimal> {
        try {
            // First try to get member-specific share amount
            const memberShares = await prisma.shares.findFirst({
                where: { erpId },
                orderBy: { createdAt: 'desc' },
                select: { monthlyTarget: true }
            });
            
            if (memberShares?.monthlyTarget) {
                return memberShares.monthlyTarget;
            }
            
            // If no member-specific amount, get from system settings
            const systemSettings = await prisma.systemSettings.findUnique({
                where: { key: 'DEFAULT_SHARE_AMOUNT' }
            });
            
            if (systemSettings) {
                return new Prisma.Decimal(JSON.parse(systemSettings.value));
            }
            
            // Fallback to default value
            return new Prisma.Decimal(5000);
        } catch (error) {
            logger.error('Error getting share amount:', error);
            // Fallback to default if anything goes wrong
            return new Prisma.Decimal(5000);
        }
    }
    
    async getAdminOverview(): Promise<IAdminOverview> {
        try {
            // Get distinct members with savings
            const memberGroups = await prisma.savings.groupBy({ by: ['memberId'] });

            // Fetch latest savings and shares record for each member in parallel
            const [latestSavingsRecords, latestSharesRecords] = await Promise.all([
                Promise.all(memberGroups.map(({ memberId }) =>
                    prisma.savings.findFirst({
                        where: { memberId },
                        orderBy: [{ year: 'desc' }, { month: 'desc' }],
                        select: { totalSavingsAmount: true }
                    })
                )),
                Promise.all(memberGroups.map(({ memberId }) =>
                    prisma.shares.findFirst({
                        where: { memberId },
                        orderBy: [{ year: 'desc' }, { month: 'desc' }],
                        select: { totalSharesAmount: true }
                    })
                ))
            ]);

            // Sum the latest totals
            const totalSavings = latestSavingsRecords.reduce(
                (sum, record) => sum.add(record?.totalSavingsAmount ?? 0),
                new Prisma.Decimal(0)
            );
            const totalShares = latestSharesRecords.reduce(
                (sum, record) => sum.add(record?.totalSharesAmount ?? 0),
                new Prisma.Decimal(0)
            );
            const totalMembers = memberGroups.length;
            const averageSavingsPerMember = totalMembers > 0
                ? totalSavings.div(totalMembers)
                : new Prisma.Decimal(0);

            return { totalSavings, totalShares, totalMembers, averageSavingsPerMember };
        } catch (error) {
            logger.error('Error getting admin overview:', error);
            throw new ApiError('Failed to fetch admin savings overview', 500);
        }
    }

    private mapSavingsResponse(savings: Savings & { member?: any, shares?: any[], transactions?: any[] }): IProcessedSavings {
        return {
            id: savings.id,
            erpId: savings.erpId,
            monthlyAmount: savings.monthlyTarget,
            totalAmount: savings.balance,
            month: savings.month,
            year: savings.year,
            description: savings.description,
            status: savings.status,
            biodata: savings.member,
            shares: savings.shares || [],
            transactions: savings.transactions || []
        };
    }
}
