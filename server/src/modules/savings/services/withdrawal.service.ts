import {
    RequestType,
    RequestStatus,
    RequestModule,
    ApprovalStatus,
    TransactionType,
    TransactionStatus,
    TransactionModule
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { SavingsError, SavingsErrorCodes } from '../errors/savings.error';
import { TransactionService } from '../../transaction/services/transaction.service';
import { ApiError } from '../../../utils/apiError';
import { formatCurrency } from '../../../utils/formatters';
import logger from '../../../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import {
    WithdrawalRequestInput,
    WithdrawalQueryParams,
    UpdateWithdrawalStatusInput
} from '../interfaces/withdrawal.interface';
import { SavingsTransactionProcessor } from '../../transaction/services/processors/savings-transaction.processor';
import { prisma } from '../../../utils/prisma';

class SavingsWithdrawalService {
    private transactionService: TransactionService;
    
    constructor() {
        this.transactionService = new TransactionService();
    }

    /**
     * Check if member is eligible for withdrawal based on yearly limit
     * Members can only make one withdrawal request per year
     */
    private async checkYearlyWithdrawalLimit(biodataId: string): Promise<boolean> {
        const currentYear = new Date().getFullYear();
        const startOfYear = new Date(currentYear, 0, 1);
        
        // Check for any approved or pending withdrawals this year
        const withdrawalsThisYear = await prisma.request.count({
            where: {
                biodataId,
                type: RequestType.SAVINGS_WITHDRAWAL,
                createdAt: {
                    gte: startOfYear
                },
                status: {
                    in: [RequestStatus.PENDING, RequestStatus.IN_REVIEW, RequestStatus.APPROVED]
                }
            }
        });

        return withdrawalsThisYear === 0;
    }

    /**
     * Validate withdrawal amount against member's savings balance
     */
    private async validateWithdrawalAmount(biodataId: string, amount: number): Promise<void> {
        try {
            // Get latest savings record to check available balance
            const latestSavings = await prisma.savings.findFirst({
                where: { 
                    memberId: biodataId,
                    status: 'ACTIVE'
                },
                orderBy: [
                    { year: 'desc' },
                    { month: 'desc' }
                ]
            });

            if (!latestSavings) {
                throw new SavingsError(
                    SavingsErrorCodes.INSUFFICIENT_BALANCE,
                    'No active savings record found',
                    400
                );
            }

            // Check if user has unpaid regular loans
            const activeRegularLoan = await prisma.loan.findFirst({
                where: {
                    memberId: biodataId,
                    remainingBalance: { gt: 0 },
                    loanType: {
                        name: { contains: 'Regular', mode: 'insensitive' }
                    }
                }
            });

            if (activeRegularLoan) {
                throw new SavingsError(
                    SavingsErrorCodes.WITHDRAWAL_NOT_ALLOWED,
                    'Cannot withdraw while you have unpaid regular loans',
                    400
                );
            }

            // Ensure the withdrawal amount is not more than 80% of total savings
            // This maintains a minimum balance requirement
            const maxWithdrawalAmount = new Decimal(latestSavings.totalSavingsAmount).mul(0.8);
            if (new Decimal(amount).gt(maxWithdrawalAmount)) {
                throw new SavingsError(
                    SavingsErrorCodes.WITHDRAWAL_LIMIT_EXCEEDED,
                    `Maximum withdrawal amount is ${formatCurrency(maxWithdrawalAmount)} (80% of total savings)`,
                    400
                );
            }

            if (new Decimal(amount).gt(latestSavings.totalSavingsAmount)) {
                throw new SavingsError(
                    SavingsErrorCodes.INSUFFICIENT_BALANCE,
                    `Withdrawal amount exceeds available balance of ${formatCurrency(latestSavings.balance)}`,
                    400
                );
            }
        } catch (error) {
            if (error instanceof SavingsError) {
                throw error;
            }
            
            logger.error('Error validating withdrawal amount:', error);
            throw new SavingsError(
                SavingsErrorCodes.VALIDATION_ERROR,
                'Could not validate withdrawal amount',
                500
            );
        }
    }

    /**
     * Create a new withdrawal request with multi-level approval flow
     */
    async createWithdrawalRequest(data: WithdrawalRequestInput) {
        try {
            // First check if member has already made a withdrawal request this year
            const canWithdraw = await this.checkYearlyWithdrawalLimit(data.biodataId);
            if (!canWithdraw) {
                throw new SavingsError(
                    SavingsErrorCodes.WITHDRAWAL_LIMIT_EXCEEDED,
                    'You can only make one withdrawal request per year',
                    400
                );
            }

            // Validate withdrawal amount
            await this.validateWithdrawalAmount(data.biodataId, data.amount);

            // Fetch the member and latest savings data
            const member = await prisma.biodata.findUnique({
                where: { id: data.biodataId },
                include: {
                    savings: {
                        where: { status: 'ACTIVE' },
                        orderBy: [
                            { year: 'desc' },
                            { month: 'desc' }
                        ],
                        take: 1,
                    }
                }
            });

            if (!member) {
                throw new SavingsError(
                    SavingsErrorCodes.MEMBER_NOT_FOUND,
                    'Member profile not found',
                    404
                );
            }

            if (member.savings.length === 0) {
                throw new SavingsError(
                    SavingsErrorCodes.INSUFFICIENT_BALANCE,
                    'No active savings record found',
                    400
                );
            }

            const latestSavings = member.savings[0];

            // Create withdrawal request with approval workflow
            const withdrawalRequest = await prisma.$transaction(async (tx) => {
                // Define approval steps configuration (similar to loan approval flow)
                const approvalSteps = [
                    {
                        level: 1,
                        status: ApprovalStatus.PENDING,
                        approverRole: 'ADMIN',
                        notes: 'Initial withdrawal request review'
                    },
                    {
                        level: 2,
                        status: ApprovalStatus.PENDING,
                        approverRole: 'TREASURER',
                        notes: 'Financial verification and review'
                    },
                    {
                        level: 3,
                        status: ApprovalStatus.PENDING,
                        approverRole: 'CHAIRMAN',
                        notes: 'Final approval required'
                    },
                    {
                        level: 4,
                        status: ApprovalStatus.PENDING,
                        approverRole: 'TREASURER',
                        notes: 'Final review and disbursement'
                    }
                ];
                
                // Create the request with approval chain
                const request = await tx.request.create({
                    data: {
                        id: uuidv4(),
                        type: RequestType.SAVINGS_WITHDRAWAL,
                        module: RequestModule.SAVINGS,
                        status: RequestStatus.PENDING,
                        biodataId: data.biodataId,
                        savingsId: latestSavings.id,
                        initiatorId: data.userId,
                        nextApprovalLevel: 1,
                        content: {
                            amount: data.amount.toString(),
                            reason: data.reason,
                            erpId: data.erpId,
                            requestDate: new Date().toISOString()
                        },
                        metadata: {
                            member: {
                                id: member.id,
                                erpId: member.erpId,
                                fullName: member.fullName,
                                department: member.department
                            },
                            savings: {
                                id: latestSavings.id,
                                currentBalance: latestSavings.balance.toString(),
                                totalSavings: latestSavings.totalSavingsAmount.toString(),
                                remainingBalance: new Decimal(latestSavings.balance).minus(data.amount).toString()
                            }
                        },
                        approvalSteps: {
                            create: approvalSteps
                        }
                    },
                    include: {
                        approvalSteps: true,
                        biodata: {
                            select: {
                                fullName: true,
                                department: true,
                                erpId: true
                            }
                        }
                    }
                });

                // Create a notification for admins
                await tx.notification.create({
                    data: {
                        userId: data.userId, // Send to the requester
                        type: 'REQUEST_UPDATE',
                        title: 'Withdrawal Request Submitted',
                        message: `Your withdrawal request of ${formatCurrency(data.amount)} has been submitted and is pending review.`,
                        metadata: {
                            requestId: request.id,
                            amount: data.amount,
                            status: 'PENDING'
                        }
                    }
                });
                
                // Also notify admin users who need to review (first approver)
                // In a real application, you might want to find all users with ADMIN role
                // and required permissions, then create notifications for them
                
                return request;
            });

            return withdrawalRequest;
        } catch (error) {
            logger.error('Error creating withdrawal request:', error);
            if (error instanceof SavingsError) {
                throw error;
            }
            throw new SavingsError(
                SavingsErrorCodes.REQUEST_CREATION_FAILED,
                'Failed to create withdrawal request',
                500
            );
        }
    }

    /**
     * Update the status of a withdrawal request through the approval workflow
     */
    async updateWithdrawalStatus(data: UpdateWithdrawalStatusInput) {
        try {
            // Find the withdrawal request with approval steps
            const withdrawalRequest = await prisma.request.findFirst({
                where: { 
                    id: data.withdrawalId,
                    type: RequestType.SAVINGS_WITHDRAWAL
                },
                include: {
                    biodata: true,
                    savings: true,
                    approvalSteps: {
                        orderBy: { level: 'asc' }
                    }
                }
            });

            if (!withdrawalRequest) {
                throw new SavingsError(
                    SavingsErrorCodes.REQUEST_NOT_FOUND,
                    'Withdrawal request not found',
                    404
                );
            }

            // Validate the current step
            const currentApprovalStep = withdrawalRequest.approvalSteps.find(
                step => step.status === ApprovalStatus.PENDING
            );
            
            if (!currentApprovalStep) {
                throw new SavingsError(
                    SavingsErrorCodes.INVALID_STATUS_TRANSITION,
                    'No pending approval steps found',
                    400
                );
            }

            // Ensure the next approval level matches the current step
            if (withdrawalRequest.nextApprovalLevel !== currentApprovalStep.level) {
                throw new SavingsError(
                    SavingsErrorCodes.INVALID_STATUS_TRANSITION,
                    `Invalid approval level. Expected level ${withdrawalRequest.nextApprovalLevel}, found ${currentApprovalStep.level}`,
                    400
                );
            }

            // Define valid status transitions based on current status and level
            // Enhanced to match the full approval flow
            const validTransitions = this.getValidStatusTransitions(
                withdrawalRequest.status, 
                currentApprovalStep.level
            );

            if (!validTransitions.includes(data.status)) {
                throw new SavingsError(
                    SavingsErrorCodes.INVALID_STATUS_TRANSITION,
                    `Invalid status transition from ${withdrawalRequest.status} to ${data.status} at level ${currentApprovalStep.level}`,
                    400
                );
            }

            // Process the withdrawal through Prisma transaction
            return await prisma.$transaction(async (tx) => {
                // 1. Update the approval step
                await tx.requestApproval.update({
                    where: {
                        requestId_level: {
                            requestId: withdrawalRequest.id,
                            level: currentApprovalStep.level
                        }
                    },
                    data: {
                        status: data.status === RequestStatus.REJECTED 
                            ? ApprovalStatus.REJECTED 
                            : ApprovalStatus.APPROVED,
                        approverId: data.updatedBy,
                        notes: data.notes,
                        approvedAt: new Date()
                    }
                });

                // 2. Update the request status and next approval level
                const updatedData: any = {
                    status: data.status,
                    approverId: data.updatedBy
                };

                // Handle each status transition appropriately
                if (data.status === RequestStatus.REJECTED) {
                    // Handle rejection
                    updatedData.completedAt = new Date();
                    updatedData.nextApprovalLevel = withdrawalRequest.nextApprovalLevel;
                } else if (data.status === RequestStatus.COMPLETED) {
                    // Handle completion
                    updatedData.completedAt = new Date();
                    updatedData.nextApprovalLevel = withdrawalRequest.nextApprovalLevel;
                } else {
                    // Progress to next approval level
                    updatedData.nextApprovalLevel = withdrawalRequest.nextApprovalLevel + 1;
                }

                const updatedRequest = await tx.request.update({
                    where: { id: withdrawalRequest.id },
                    data: updatedData,
                    include: {
                        biodata: true,
                        savings: true
                    }
                });

                // 3. Handle status-specific actions
                switch (data.status) {
                    case RequestStatus.IN_REVIEW:
                        // Admin has reviewed and passed to treasurer
                        await this.handleInReviewTransition(tx, withdrawalRequest, data);
                        break;
                    
                    case RequestStatus.REVIEWED:
                        // This case is for when the admin has completed their review
                        // and the request is now pending Treasurer Review
                        if (currentApprovalStep.level === 1) {
                            await this.handleInReviewTransition(tx, withdrawalRequest, data);
                        }
                        break;
                    
                    case RequestStatus.APPROVED:
                        // Chairman has approved, ready for treasurer to process
                        if (currentApprovalStep.level === 3) {
                            await this.handleApprovalTransition(tx, withdrawalRequest, data);
                        }
                        break;
                    
                    case RequestStatus.COMPLETED:
                        // Treasurer has processed the withdrawal (final step)
                        if (currentApprovalStep.level === 2 && withdrawalRequest.status === RequestStatus.APPROVED) {
                            await this.handleCompletionTransition(tx, withdrawalRequest, data);
                        }
                        break;
                    
                    case RequestStatus.REJECTED:
                        // Rejection at any level
                        await this.handleRejectionTransition(tx, withdrawalRequest, data);
                        break;
                }

                return updatedRequest;
            });
        } catch (error) {
            logger.error('Error updating withdrawal status:', error);
            if (error instanceof SavingsError) {
                throw error;
            }
            throw new SavingsError(
                SavingsErrorCodes.STATUS_UPDATE_FAILED,
                'Failed to update withdrawal request status',
                500
            );
        }
    }

    /**
     * Get valid status transitions based on current status and approval level
     * This enforces our business rules for the approval flow
     */
    private getValidStatusTransitions(currentStatus: RequestStatus, approvalLevel: number): RequestStatus[] {
        const transitions: Record<RequestStatus, Record<number, RequestStatus[]>> = {
            PENDING: {
                1: [RequestStatus.IN_REVIEW, RequestStatus.REJECTED]
            },
            IN_REVIEW: {
                2: [RequestStatus.REVIEWED, RequestStatus.REJECTED]
            },
            REVIEWED: {
                3: [RequestStatus.APPROVED, RequestStatus.REJECTED]
            },
            APPROVED: {
                4: [RequestStatus.COMPLETED, RequestStatus.REJECTED]
            },
            REJECTED: {},
            COMPLETED: {},
            CANCELLED: {}
        };

        return transitions[currentStatus]?.[approvalLevel] || [];
    }

    /**
     * Handle transition to IN_REVIEW (Admin review completed)
     */
    private async handleInReviewTransition(
        tx: any,
        request: any,
        data: UpdateWithdrawalStatusInput
    ) {
        // Find the next approval step (Treasurer)
        const nextStep = request.approvalSteps.find(
            (step: any) => step.level === 2
        );

        if (nextStep) {
            // Notify treasurer(s) that a request needs their review
            // In a real app, you'd find all treasurers and notify them
            
            // Notify the member
            await tx.notification.create({
                data: {
                    userId: request.initiatorId,
                    type: 'REQUEST_UPDATE',
                    title: 'Withdrawal Request In Review',
                    message: `Your withdrawal request is now being reviewed by the Treasurer.`,
                    requestId: request.id,
                    metadata: {
                        status: 'IN_REVIEW',
                        currentApprovalLevel: request.nextApprovalLevel,
                        nextApprovalRole: nextStep.approverRole
                    }
                }
            });
        }
    }

    /**
     * Handle transition to APPROVED (Chairman approval completed)
     */
    private async handleApprovalTransition(
        tx: any,
        request: any,
        data: UpdateWithdrawalStatusInput
    ) {
        // Find treasurers to notify for disbursement
        // In a real app, you'd query users with TREASURER role
        
        // Notify the member
        await tx.notification.create({
            data: {
                userId: request.initiatorId,
                type: 'REQUEST_UPDATE',
                title: 'Withdrawal Request Approved',
                message: `Your withdrawal request has been approved by the Chairman and is awaiting disbursement.`,
                requestId: request.id,
                metadata: {
                    status: 'APPROVED',
                    amount: (request.content as any).amount
                }
            }
        });
    }

    /**
     * Handle transition to COMPLETED (Treasurer disbursement)
     */
    private async handleCompletionTransition(
        tx: any,
        request: any,
        data: UpdateWithdrawalStatusInput
    ) {
        const content = request.content || {};
        const amount = new Decimal((content as any).amount || '0');
        
        // Handle null savings check
        if (!request.savings) {
            throw new SavingsError(
                SavingsErrorCodes.REQUEST_CREATION_FAILED,
                'Savings record not found for withdrawal',
                400
            );
        }

        // Check sufficient balance before proceeding
        if (new Decimal(request.savings.balance).lessThan(amount)) {
            throw new SavingsError(
                SavingsErrorCodes.INSUFFICIENT_BALANCE,
                `Insufficient balance. Available: ${formatCurrency(request.savings.balance)}`,
                400
            );
        }

        // Log transaction creation attempt for debugging
        logger.debug('Creating withdrawal transaction', {
            savingsId: request.savings.id,
            amount: amount.toString(),
            requestId: request.id
        });

        // Create transaction record for the withdrawal with proper structure
        const transaction = await this.transactionService.createTransactionWithTx(tx, {
            transactionType: TransactionType.SAVINGS_WITHDRAWAL,
            module: TransactionModule.SAVINGS,
            amount: amount.negated(), // Store as negative amount for withdrawals
            balanceAfter: new Decimal(request.savings.balance).minus(amount),
            description: `Savings withdrawal: ${(request.content as any)?.reason || 'No reason provided'}`,
            relatedEntityType: 'SAVINGS',
            relatedEntityId: request.savings.id,
            initiatedBy: data.updatedBy,
            requestId: request.id,
            autoComplete: true, // Auto-complete the transaction
            metadata: {
                reason: (request.content as any)?.reason || 'No reason provided',
                erpId: request.biodata?.erpId || 'Unknown',
                memberName: request.biodata?.fullName || 'Unknown Member'
            }
        });

        // REMOVE THIS SECTION - Let the transaction processor handle the balance update
        // Don't manually update savings balance here!
        // The SavingsTransactionProcessor will handle this when the transaction is processed
        
        // Link the transaction to the request
        await tx.request.update({
            where: { id: request.id },
            data: {
                transactions: {
                    connect: { id: transaction.id }
                }
            }
        });

        // Manually invoke the transaction processor since we're in a transaction context
        const processor = new SavingsTransactionProcessor();
        await processor.processTransaction(transaction, tx);

        // Notify the member
        await tx.notification.create({
            data: {
                userId: request.initiatorId,
                type: 'TRANSACTION',
                title: 'Withdrawal Completed',
                message: `Your withdrawal request for ${formatCurrency(amount)} has been processed and completed.`,
                transactionId: transaction.id,
                metadata: {
                    amount: amount.toString(),
                    requestId: request.id,
                    transactionId: transaction.id
                }
            }
        });
    }

    /**
     * Handle transition to REJECTED (Rejection at any level)
     */
    private async handleRejectionTransition(
        tx: any,
        request: any,
        data: UpdateWithdrawalStatusInput
    ) {
        // Notify the member
        await tx.notification.create({
            data: {
                userId: request.initiatorId,
                type: 'REQUEST_UPDATE',
                title: 'Withdrawal Request Rejected',
                message: `Your withdrawal request for ${formatCurrency(new Decimal((request.content as any)?.amount || '0'))} has been rejected. Reason: ${data.notes || 'No reason provided'}`,
                requestId: request.id,
                metadata: {
                    status: 'REJECTED',
                    reason: data.notes,
                    requestId: request.id,
                    rejectedBy: data.updatedBy,
                    rejectionLevel: request.nextApprovalLevel
                }
            }
        });
    }

    /**
     * Get withdrawal requests with filtering and pagination
     */
    async getWithdrawalRequests(params: WithdrawalQueryParams) {
        try {
            const { 
                biodataId,
                status,
                startDate,
                endDate,
                page = 1,
                limit = 10,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = params;

            // Build where conditions
            const whereConditions: any = {
                type: RequestType.SAVINGS_WITHDRAWAL
            };

            // Filter by member
            if (biodataId) {
                whereConditions.biodataId = biodataId;
            }

            // Filter by status
            if (status) {
                whereConditions.status = status;
            }

            // Filter by date range
            if (startDate || endDate) {
                whereConditions.createdAt = {};
                
                if (startDate) {
                    whereConditions.createdAt.gte = startDate;
                }
                
                if (endDate) {
                    whereConditions.createdAt.lte = endDate;
                }
            }

            // Set up sorting
            const orderBy: any = {};
            orderBy[sortBy] = sortOrder;

            // Execute queries in parallel for better performance
            const [total, requests] = await Promise.all([
                prisma.request.count({ where: whereConditions }),
                prisma.request.findMany({
                    where: whereConditions,
                    include: {
                        biodata: {
                            select: {
                                fullName: true,
                                department: true,
                                erpId: true
                            }
                        },
                        transactions: {
                            where: {
                                transactionType: TransactionType.SAVINGS_WITHDRAWAL
                            },
                            take: 1,
                            include: {
                                initiator: {
                                    select: {
                                        username: true,
                                        adminProfile: {
                                            select: {
                                                firstName: true
                                            }
                                        }
                                    }
                                },
                                approver: {
                                    select: {
                                        username: true,
                                        adminProfile: {
                                            select: {
                                                firstName: true
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        approvalSteps: {
                            orderBy: {
                                level: 'asc'
                            },
                            include: {
                                approver: {
                                    select: {
                                        id: true,
                                        username: true,
                                        adminProfile: {
                                            select: {
                                                firstName: true,
                                                lastName: true
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        savings: {
                            select: {
                                balance: true,
                                totalSavingsAmount: true
                            }
                        },
                        initiator: {
                            select: {
                                id: true,
                                username: true,
                                adminProfile: {
                                    select: {
                                        firstName: true,
                                        lastName: true
                                    }
                                }
                            }
                        },
                        approver: {
                            select: {
                                id: true,
                                username: true,
                                adminProfile: {
                                    select: {
                                        firstName: true,
                                        lastName: true
                                    }
                                }
                            }
                        }
                    },
                    orderBy,
                    skip: (page - 1) * limit,
                    take: limit
                })
            ]);

            // Transform requests to include formatted data
            const formattedRequests = requests.map(request => {
                const content = request.content as any;
                const metadata = request.metadata as any;
                
                return {
                    id: request.id,
                    biodataId: request.biodataId,
                    status: request.status,
                    amount: formatCurrency(content.amount),
                    rawAmount: content.amount,
                    reason: content.reason,
                    member: request.biodata ? {
                        name: request.biodata.fullName,
                        department: request.biodata.department,
                        erpId: request.biodata.erpId
                    } : null,
                    requestDate: request.createdAt,
                    completedAt: request.completedAt,
                    currentApprovalLevel: request.nextApprovalLevel,
                    approvalSteps: request.approvalSteps.map(step => ({
                        level: step.level,
                        role: step.approverRole,
                        status: step.status,
                        approver: step.approver ? {
                            id: step.approver.id,
                            username: step.approver.username,
                            firstName: step.approver.adminProfile?.firstName || null,
                            lastName: step.approver.adminProfile?.lastName || null
                        } : null,
                        approvedAt: step.approvedAt,
                        notes: step.notes
                    })),
                    transaction: request.transactions.length > 0 ? {
                        id: request.transactions[0].id,
                        status: request.transactions[0].status,
                        amount: formatCurrency(request.transactions[0].amount),
                        date: request.transactions[0].createdAt,
                        initiator: request.transactions[0].initiator ? {
                            username: request.transactions[0].initiator.username,
                            firstName: request.transactions[0].initiator.adminProfile?.firstName || null
                        } : null,
                        approver: request.transactions[0].approver ? {
                            username: request.transactions[0].approver.username,
                            firstName: request.transactions[0].approver.adminProfile?.firstName || null
                        } : null
                    } : null,
                    savings: request.savings ? {
                        currentBalance: formatCurrency(request.savings.balance),
                        totalSavings: formatCurrency(request.savings.totalSavingsAmount),
                        remainingBalance: content.amount && request.savings ? 
                            formatCurrency(new Decimal(request.savings.balance).minus(content.amount)) : 
                            null
                    } : null,
                    initiator: request.initiator ? {
                        id: request.initiator.id,
                        username: request.initiator.username,
                        firstName: request.initiator.adminProfile?.firstName || null,
                        lastName: request.initiator.adminProfile?.lastName || null
                    } : null,
                    approver: request.approver ? {
                        id: request.approver.id,
                        username: request.approver.username,
                        firstName: request.approver.adminProfile?.firstName || null,
                        lastName: request.approver.adminProfile?.lastName || null
                    } : null
                };
            });

            return {
                data: formattedRequests,
                meta: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            logger.error('Error fetching withdrawal requests:', error);
            throw new SavingsError(
                SavingsErrorCodes.FETCH_ERROR,
                'Failed to fetch withdrawal requests',
                500
            );
        }
    }

    /**
     * Get a single withdrawal request by ID
     */
    async getWithdrawalRequestById(requestId: string) {
        try {
            const request = await prisma.request.findFirst({
                where: { 
                    id: requestId,
                    type: RequestType.SAVINGS_WITHDRAWAL
                },
                include: {
                    biodata: {
                        select: {
                            id: true,
                            fullName: true,
                            department: true,
                            erpId: true,
                            emailAddress: true,
                            phoneNumber: true
                        }
                    },
                    transactions: {
                        where: {
                            transactionType: TransactionType.SAVINGS_WITHDRAWAL
                        },
                        include: {
                            initiator: {
                                select: {
                                    id: true,
                                    username: true,
                                    biodata: true
                                }
                            },
                            approver: {
                                select: {
                                    id: true,
                                    username: true,
                                    adminProfile: true
                                }
                            }
                        }
                    },
                    approvalSteps: {
                        orderBy: {
                            level: 'asc'
                        },
                        include: {
                            approver: {
                                select: {
                                    id: true,
                                    username: true,
                                    adminProfile: true
                                }
                            },
                        }
                    },
                    savings: {
                        select: {
                            id: true,
                            balance: true,
                            totalSavingsAmount: true,
                            monthlyTarget: true
                        }
                    },
                    initiator: {
                        select: {
                            id: true,
                            username: true,
                            biodata: true
                        }
                    },
                    approver: {
                        select: {
                            id: true,
                            username: true,
                            adminProfile: true
                        }
                    }
                }
            });

            if (!request) {
                throw new SavingsError(
                    SavingsErrorCodes.REQUEST_NOT_FOUND,
                    'Withdrawal request not found',
                    404
                );
            }

            // Format the request data for response
            const content = request.content as any;
            const metadata = request.metadata as any;
            
            return {
                id: request.id,
                status: request.status,
                amount: {
                    formatted: formatCurrency(content.amount),
                    raw: content.amount
                },
                reason: content.reason,
                requestDate: request.createdAt,
                completedAt: request.completedAt,
                member: request.biodata ? {
                    id: request.biodata.id,
                    name: request.biodata.fullName,
                    department: request.biodata.department,
                    erpId: request.biodata.erpId,
                    email: request.biodata.emailAddress,
                    phone: request.biodata.phoneNumber
                } : null,
                currentApprovalLevel: request.nextApprovalLevel,
                approvalSteps: request.approvalSteps.map(step => ({
                    level: step.level,
                    role: step.approverRole,
                    status: step.status,
                    approver: step.approver ? {
                        id: step.approver.id,
                        username: step.approver.username,
                        firstName: step.approver.adminProfile?.firstName || null
                    } : null,
                    approvedAt: step.approvedAt,
                    notes: step.notes
                })),
                transaction: request.transactions.length > 0 ? {
                    id: request.transactions[0].id,
                    status: request.transactions[0].status,
                    amount: formatCurrency(request.transactions[0].amount),
                    date: request.transactions[0].createdAt,
                    initiator: request.transactions[0].initiator ? {
                        id: request.transactions[0].initiator.id,
                        username: request.transactions[0].initiator.username,
                        firstName: request.transactions[0].initiator.biodata?.firstName || null
                    } : null,
                    approver: request.transactions[0].approver ? {
                        id: request.transactions[0].approver.id,
                        username: request.transactions[0].approver.username,
                        firstName: request.transactions[0].approver.adminProfile?.firstName || null
                    } : null
                } : null,
                savings: request.savings ? {
                    id: request.savings.id,
                    currentBalance: formatCurrency(request.savings.balance),
                    totalSavings: formatCurrency(request.savings.totalSavingsAmount),
                    monthlyTarget: formatCurrency(request.savings.monthlyTarget),
                    remainingBalance: content.amount ? 
                        formatCurrency(new Decimal(request.savings.balance).minus(content.amount)) : 
                        null
                } : null,
                initiator: {
                    id: request.initiator.id,
                    username: request.initiator.username,
                    firstName: request.initiator.biodata?.firstName || null
                },
                approver: request.approver ? {
                    id: request.approver.id,
                    username: request.approver.username,
                    firstName: request.approver.adminProfile?.firstName || null
                } : null,
                notes: request.notes
            };
        } catch (error) {
            logger.error('Error fetching withdrawal request details:', error);
            if (error instanceof SavingsError) {
                throw error;
            }
            throw new SavingsError(
                SavingsErrorCodes.FETCH_ERROR,
                'Failed to fetch withdrawal request details',
                500
            );
        }
    }

    
    /**
     * Get savings withdrawal statistics
     */
    async getWithdrawalStatistics(filters: {
        startDate?: Date;
        endDate?: Date;
        biodataId?: string;
    }) {
        try {
            const { startDate, endDate, biodataId } = filters;
            
            // Build where conditions
            const whereConditions: any = {
                type: RequestType.SAVINGS_WITHDRAWAL
            };
            
            // Filter by member
            if (biodataId) {
                whereConditions.biodataId = biodataId;
            }
            
            // Filter by date range
            if (startDate || endDate) {
                whereConditions.createdAt = {};
                
                if (startDate) {
                    whereConditions.createdAt.gte = startDate;
                }
                
                if (endDate) {
                    whereConditions.createdAt.lte = endDate;
                }
            }
            
            // Get withdrawal statistics
            const [
                total,
                pendingCount,
                approvedCount,
                rejectedCount,
                totalAmount
            ] = await Promise.all([
                // Total requests
                prisma.request.count({
                    where: whereConditions
                }),
                // Pending requests
                prisma.request.count({
                    where: {
                        ...whereConditions,
                        status: { in: [RequestStatus.PENDING, RequestStatus.IN_REVIEW] }
                    }
                }),
                // Approved & completed requests
                prisma.request.count({
                    where: {
                        ...whereConditions,
                        status: { in: [RequestStatus.APPROVED, RequestStatus.COMPLETED] }
                    }
                }),
                // Rejected requests
                prisma.request.count({
                    where: {
                        ...whereConditions,
                        status: RequestStatus.REJECTED
                    }
                }),
                // Total amount withdrawn
                prisma.transaction.aggregate({
                    where: {
                        transactionType: TransactionType.SAVINGS_WITHDRAWAL,
                        status: TransactionStatus.COMPLETED,
                        ...(biodataId && {
                            request: {
                                biodataId
                            }
                        }),
                        ...(startDate || endDate ? {
                            createdAt: {
                                ...(startDate && { gte: startDate }),
                                ...(endDate && { lte: endDate })
                            }
                        } : {})
                    },
                    _sum: {
                        amount: true
                    }
                })
            ]);
            
            return {
                total,
                pending: pendingCount,
                approved: approvedCount,
                rejected: rejectedCount,
                totalAmount: totalAmount._sum.amount || new Decimal(0),
                formattedTotalAmount: formatCurrency(totalAmount._sum.amount || 0)
            };
        } catch (error) {
            logger.error('Error fetching withdrawal statistics:', error);
            throw new SavingsError(
                SavingsErrorCodes.FETCH_ERROR,
                'Failed to fetch withdrawal statistics',
                500
            );
        }
    }
}

export default new SavingsWithdrawalService();