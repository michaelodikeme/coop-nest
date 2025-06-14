import { 
    PrismaClient, 
    Loan, 
    LoanStatus, 
    TransactionType, 
    TransactionModule,
    RequestStatus, 
    ApprovalStatus 
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { v4 as uuidv4 } from 'uuid'; // Add this import at the top
import { EligibilityService } from './eligibility.service';
import { CalculatorService } from './calculator.service';
import { LoanApplication } from '../interfaces/loan.interface';
// import { determineBaseType } from '../../transaction/utils/transactionUtils';
import { ApiError } from '../../../utils/apiError';
import { isUUID } from 'validator';
import logger from '../../../utils/logger';
import { LoanNotificationService } from './notification.service';
import { TransactionService } from '../../transaction/services/transaction.service';
// import { LoanSummary } from '../interfaces/loan.interface';


export interface LoanQueryFilters {
    page?: number;
    limit?: number;
    status?: LoanStatus | LoanStatus[];
    loanTypeId?: string;
    erpId?: string;
    startDate?: Date;
    endDate?: Date;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    biodataId?: string;
    minAmount?: number;
    maxAmount?: number;
}

export interface LoanSummary {
    totalRepaid: any;
    activeLoansCount: any;
    completedLoansCount: any;
    defaultedLoansCount: any;
    averageLoanAmount: any;
    defaultRate: any;
    totalOutstanding: number;
    totalDisbursed: number;
    newLoansCount: number;
    pendingLoans: number;
    repaymentsCount: number;
    overdueLoans: number;
}

export class LoanService {
    private prisma: PrismaClient;
    private transactionService: TransactionService;
    private eligibilityService: EligibilityService;
    private calculatorService: CalculatorService;
    
    constructor() {
        this.prisma = new PrismaClient();
        this.transactionService = new TransactionService();
        this.eligibilityService = new EligibilityService();
        this.calculatorService = new CalculatorService();
    }
    
    async applyForLoan(data: LoanApplication): Promise<Loan> {
        // 1. Get loan type first to determine rules
        const loanType = await this.prisma.loanType.findUnique({
            where: { id: data.loanTypeId }
        });
        
        if (!loanType) {
            throw new ApiError('Invalid loan type', 404);
        }
        
        // 2. Get member profile with related data
        const biodata = await this.prisma.biodata.findUnique({
            where: { id: data.biodataId },
            include: { 
                loans: {
                    where: {
                        status: {
                            in: ['ACTIVE', 'DEFAULTED', 'PENDING', 'IN_REVIEW']
                        }
                    },
                    include: {
                        loanType: true  // Include loan type for cross-loan checks
                    }
                },
                users: true,
                savings: {
                    where: { status: 'ACTIVE' },
                    orderBy: [
                        { year: 'desc' },
                        { month: 'desc' }
                    ],
                    take: 1,
                    select: {
                        totalSavingsAmount: true,
                        totalGrossAmount: true,
                        balance: true,
                        monthlyTarget: true,
                        status: true,
                        createdAt: true
                    }
                }
            }
        });
        
        // 3. Basic validations
        if (!biodata) {
            throw new ApiError('Member profile not found', 404);
        }
        
        const savingsSummary = biodata.savings[0];
        if (savingsSummary.status !== 'ACTIVE') {
            throw new ApiError('Savings account is not active', 400);
        }
        
        // 4. Check previous loan performance
        const hasDefaultedLoans = biodata.loans.some(loan => loan.status === 'DEFAULTED');
        if (hasDefaultedLoans) {
            throw new ApiError('Cannot apply for new loan with defaulted loans', 400);
        }
        
        // 5. Check concurrent loans
        const hasActiveLoans = biodata.loans.some(loan => 
            ['ACTIVE', 'PENDING', 'IN_REVIEW'].includes(loan.status)
        );
        
        if (data.loanTenure < loanType.minDuration || data.loanTenure > loanType.maxDuration) {
            throw new ApiError(
                `Loan tenure must be between ${loanType.minDuration} and ${loanType.maxDuration} months`,
                400
            );
        }
        
        // 7. Check eligibility with updated response format
        const eligibilityResponse = await this.eligibilityService.checkLoanEligibility(
            data.biodataId,
            data.loanTypeId,
            Number(data.loanAmount),
            data.loanTenure  // Add tenure for proper validation
        );
        
        if (!eligibilityResponse.success || !eligibilityResponse.data.isEligible) {
            throw new ApiError(
                eligibilityResponse.data.reason || 'Not eligible for loan', 
                400
            );
        }
        
        // 8. Validate against loan type rules
        const isSoftLoan = loanType.name.toLowerCase().includes('soft');
        if (isSoftLoan && Number(data.loanAmount) > 500000) {
            throw new ApiError('Soft loan cannot exceed ₦500,000', 400);
        }
        
        // For regular loans, check against savings multiplier
        if (!isSoftLoan) {
            const maxLoanAmount = new Decimal(biodata.savings[0].totalSavingsAmount).mul(3);
            if (new Decimal(data.loanAmount).gt(maxLoanAmount)) {
                throw new ApiError(
                    `Regular loan cannot exceed 3x total savings (₦${maxLoanAmount.toFixed(2)})`, 
                    400
                );
            }
        }
        
        // 9. Validate tenure based on loan type
        if (isSoftLoan && (data.loanTenure < 1 || data.loanTenure > 6)) {
            throw new ApiError('Soft loan tenure must be between 1-6 months', 400);
        } else if (loanType.name.toLowerCase().includes('1 year plus')) {
            if (data.loanTenure < 12 || data.loanTenure > 36) {
                throw new ApiError('1 Year Plus loan tenure must be between 12-36 months', 400);
            }
        } else {
            if (data.loanTenure < 1 || data.loanTenure > 12) {
                throw new ApiError('Regular loan tenure must be between 1-12 months', 400);
            }
        }
        
        // 10. Calculate loan schedule
        const calculation = await this.calculatorService.calculateLoan(
            data.loanTypeId,
            Number(data.loanAmount),
            data.loanTenure,
            data.biodataId
        );
        
        // Create loan application with payment schedule
        const loan = await this.prisma.$transaction(async (tx) => {
            // Fetch latest savings record within transaction
            const latestSavings = await tx.savings.findFirst({
                where: { 
                    memberId: data.biodataId,
                    status: 'ACTIVE'
                },
                orderBy: [
                    { year: 'desc' },
                    { month: 'desc' }
                ],
                select: {
                    totalSavingsAmount: true,
                    totalGrossAmount: true,
                    balance: true,
                    monthlyTarget: true
                }
            });
            
            if (!latestSavings) {
                throw new ApiError('No active savings record found', 400);
            }
            
            // Create loan with enhanced data
            const loan = await tx.loan.create({
                data: {
                    memberId: data.biodataId,
                    erpId: data.erpId,
                    loanTypeId: data.loanTypeId,
                    principalAmount: data.loanAmount,
                    interestAmount: calculation.totalInterest,
                    totalAmount: calculation.totalRepayment,
                    remainingBalance: calculation.totalRepayment,
                    tenure: data.loanTenure,
                    purpose: data.loanPurpose,
                    status: 'PENDING',
                    paidAmount: 0,
                    savingsSnapshot: {
                        totalSavingsAmount: latestSavings.totalSavingsAmount,
                        totalGrossAmount: latestSavings.totalGrossAmount,
                        monthlyTarget: latestSavings.monthlyTarget
                    }
                }
            });
            
            // Create payment schedule
            await Promise.all(
                calculation.schedule.map((payment) =>
                    tx.loanSchedule.create({
                    data: {
                        loanId: loan.id,
                        dueDate: payment.paymentDate,
                        expectedAmount: payment.totalPayment,
                        principalAmount: payment.principalAmount,
                        interestAmount: payment.interestAmount,
                        remainingBalance: payment.remainingBalance,
                        paidAmount: 0,
                        status: 'PENDING'
                    }
                })
            )
        );
        
        // Approval steps configuration
        const approvalSteps = [
            {
                level: 1,
                status: ApprovalStatus.PENDING,
                approverRole: 'ADMIN',
                notes: 'Initial loan application review'
            },
            {
                level: 2,
                status: ApprovalStatus.PENDING,
                approverRole: 'TREASURER',
                notes: 'Financial review and assessment'
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
                notes: 'Loan disbursement approval'
            }
        ];
        
        // Create initial loan request with approval chain
        await tx.request.create({
            data: {
                type: 'LOAN_APPLICATION',
                status: 'PENDING',
                priority: 'MEDIUM',
                module: 'LOAN',
                biodataId: data.biodataId,
                initiatorId: biodata.users[0].id,
                loanId: loan.id,  // Add this to link the request to the loan
                nextApprovalLevel: 1,
                content: {
                    loanId: loan.id,
                    erpId: data.erpId,
                    amount: data.loanAmount.toString(),
                    tenure: data.loanTenure,
                    purpose: data.loanPurpose,
                    totalRepayment: calculation.totalRepayment.toString(),
                    monthlyPayment: calculation.schedule[0]?.totalPayment.toString() || '0'
                },
                metadata: {
                    loanType: {
                        id: loanType.id,
                        name: loanType.name,
                        description: loanType.description,
                        interestRate: loanType.interestRate.toString()
                    },
                    member: {
                        erpId: biodata.erpId,
                        fullName: biodata.fullName,
                        department: biodata.department
                    },
                    savings: {
                        totalSavings: latestSavings.totalSavingsAmount.toString(),
                        monthlyTarget: latestSavings.monthlyTarget.toString()
                    }
                },
                approvalSteps: {
                    create: approvalSteps
                }
            },
            include: {
                approvalSteps: true
            }
        });
        
        // Create initial status history
        await tx.loanStatusHistory.create({
            data: {
                loanId: loan.id,
                fromStatus: 'PENDING',
                toStatus: 'PENDING',
                changedBy: biodata.users[0].id,
                reason: 'Initial loan application'
            }
        });
        
        return loan;
    });
    
    // Handle notification separately after transaction
    try {
        await LoanNotificationService.notifyLoanStatusChange(
            loan.id, 
            'PENDING', 
            biodata.users[0].id,
            'New loan application submitted'
        );
    } catch (error) {
        // Log notification error but don't fail the loan application
        logger.error('Failed to create loan notification:', error);
    }
    
    return loan;
}

// Enhance updateLoanStatus with proper status flow validation
async updateLoanStatus(
    loanId: string,
    status: LoanStatus,
    notes?: string,
    updatedBy?: string
): Promise<Loan> {
    if (!isUUID(loanId)) {
        throw new ApiError('Invalid loan ID format', 400);
    }
    
    const loan = await this.prisma.loan.findUnique({
            where: { id: loanId },
            include: {
                member: true,
                paymentSchedules: {
                    orderBy: { dueDate: 'asc' }
                },
                requests: {
                    where: {
                        type: 'LOAN_APPLICATION',
                        loanId: loanId  // Add this to ensure we get the correct request
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    include: {
                        approvalSteps: {
                            orderBy: { level: 'asc' }
                        }
                    }
                }
            }
        });
    
    if (!loan) {
        throw new ApiError('Loan not found', 404);
    }
    
    if (!loan.requests || !loan.requests?.[0]) {
        throw new ApiError('No loan request found for this loan', 404);
    }

    const currentRequest = loan.requests[0];
    const currentApprovalStep = currentRequest.approvalSteps.find(
        step => step.status === 'PENDING'
    );
    
    if (!currentApprovalStep) {
        throw new ApiError('No pending approval step found', 400);
    }
    
    // Validate approval level
    if (currentRequest.nextApprovalLevel !== currentApprovalStep.level) {
        throw new ApiError(
            `Invalid approval level. Expected level ${currentRequest.nextApprovalLevel}`,
            400
        );
    }

    // Define valid status transitions
    const validTransitions: Record<LoanStatus, LoanStatus[]> = {
        PENDING: ['IN_REVIEW', 'REJECTED'],
        IN_REVIEW: ['REVIEWED', 'REJECTED'],
        REVIEWED: ['APPROVED', 'REJECTED'],
        APPROVED: ['DISBURSED', 'REJECTED'],
        DISBURSED: ['ACTIVE'],
        ACTIVE: ['COMPLETED', 'DEFAULTED'],
        DEFAULTED: ['ACTIVE', 'COMPLETED'],
        COMPLETED: [],
        REJECTED: []
    };
    
    if (!validTransitions[loan.status]?.includes(status)) {
        throw new ApiError(
            `Invalid status transition from ${loan.status} to ${status}`,
            400
        );
    }
    
    // Calculate request status before transaction
    const requestStatus = this.mapLoanStatusToRequestStatus(status);
    
    return await this.prisma.$transaction(async (tx) => {
        // 1. Update loan status
        const updatedLoan = await tx.loan.update({
            where: { id: loanId },
            data: {
                status,
                disbursedAt: status === 'DISBURSED' ? new Date() : loan.disbursedAt,
                completedAt: status === 'COMPLETED' ? new Date() : loan.completedAt,
                statusHistory: {
                    create: {
                        id: uuidv4(),
                        fromStatus: loan.status,
                        toStatus: status,
                        changedBy: updatedBy || 'SYSTEM',
                        reason: notes
                    }
                }
            },
            include: { member: true }
        });
        
        // 2. Update request status
        await tx.request.update({
            where: { id: currentRequest.id },
            data: {
                status: requestStatus,
                nextApprovalLevel: currentRequest.nextApprovalLevel + 1,
                completedAt: ['APPROVED', 'REJECTED', 'COMPLETED'].includes(requestStatus) 
                    ? new Date() 
                    : undefined,
                assigneeId: updatedBy,
                notes: notes,
                approverId: ['APPROVED', 'REJECTED', 'COMPLETED'].includes(requestStatus) 
                    ? updatedBy 
                    : undefined
            }
        });
        
        // Log the status changes
        logger.info(`Loan ${loanId} status updated:`, {
            loanStatus: {
                from: loan.status,
                to: status
            },
            requestStatus: {
                from: loan.requests[0].status,
                to: requestStatus
            }
        });
        
        // 3. Create transaction record for loan disbursement
        if (status === 'DISBURSED') {
            await this.transactionService.createTransactionWithTx(tx, {
                transactionType: TransactionType.LOAN_DISBURSEMENT,
                module: TransactionModule.LOAN,
                amount: loan.totalAmount,
                description: `Loan disbursement for loan #${loan.id}`,
                initiatedBy: updatedBy || loan.member.id,
                relatedEntityId: loan.id,
                relatedEntityType: 'LOAN',
                autoComplete: true,
                metadata: {
                    loanType: loan.loanTypeId,
                    disbursementDate: new Date(),
                    dueDate: loan.paymentSchedules[0]?.dueDate || null
                }
            });
        }
        
        // Update the current approval step
        await tx.requestApproval.update({
            where: {
                requestId_level: {
                    requestId: currentRequest.id,
                    level: currentRequest.nextApprovalLevel
                }
            },
            data: {
                status: status === 'REJECTED' ? 'REJECTED' : 'APPROVED',
                approverId: updatedBy,
                notes: notes,
                approvedAt: new Date()
            }
        });
        
        return updatedLoan;
    });
}

// Updated mapping logic
private mapLoanStatusToRequestStatus(loanStatus: LoanStatus): RequestStatus {
    switch (loanStatus) {
        case 'IN_REVIEW': return 'PENDING';
        case 'REVIEWED': return 'IN_REVIEW';
        case 'APPROVED': return 'APPROVED';
        case 'REJECTED': return 'REJECTED';
        case 'DISBURSED': return 'COMPLETED';
        default: return 'PENDING';
    }
}

async getMemberLoans(biodataId: string): Promise<Loan[]> {
    if (!isUUID(biodataId)) {
        throw new ApiError('Invalid biodata ID format', 400);
    }
    
    try {
        // First check if the member exists
        const member = await this.prisma.biodata.findUnique({
            where: { id: biodataId },
            select: { id: true }
        });
        
        if (!member) {
            throw new ApiError('Member not found', 404);
        }
        
        // Get all loans for the member with enhanced details
        const loans = await this.prisma.loan.findMany({
            where: { memberId: biodataId },
            include: {
                loanType: true,
                paymentSchedules: {
                    orderBy: { dueDate: 'asc' }
                },
                repayments: {
                    orderBy: { repaymentDate: 'desc' }
                },
                statusHistory: {
                    orderBy: { changeDate: 'desc' },
                    take: 1
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        
        // Calculate additional data for each loan
        return loans.map(loan => {
            // Find the next upcoming payment date (if any)
            const nextPaymentSchedule = loan.paymentSchedules.find(
                schedule => schedule.status === 'PENDING' || schedule.status === 'PARTIAL'
            );
            
            const lastPayment = loan.repayments[0]; // First one due to desc ordering
            
            // Calculate payment progress as percentage
            const paymentProgress = loan.totalAmount.toNumber() > 0
                ? (loan.paidAmount.toNumber() / loan.totalAmount.toNumber()) * 100
                : 0;
                
            return {
                ...loan,
                nextPaymentDue: nextPaymentSchedule?.dueDate ?? null,
                lastPaymentDate: lastPayment?.repaymentDate ?? null,
                paymentProgress: Math.round(paymentProgress * 100) / 100 // Round to 2 decimal places
            };
        });
    } catch (error) {
        logger.error('Error fetching member loans:', error);
        throw error instanceof ApiError ? error : new ApiError('Failed to fetch member loans', 500);
    }
}

async getLoanDetails(loanId: string): Promise<Loan | null> {
    if (!isUUID(loanId)) {
        throw new ApiError('Invalid loan ID format', 400);
    }
    
    return this.prisma.loan.findUnique({
        where: { id: loanId },
        include: {
            loanType: true,
            paymentSchedules: true,
            repayments: true,
            member: {
                include: {
                    savings: {
                        where: { status: 'ACTIVE' },
                        orderBy: [
                            { year: 'desc' },
                            { month: 'desc' }
                        ],
                        take: 1,
                        select: {
                            totalSavingsAmount: true,
                            totalGrossAmount: true,
                            balance: true,
                            monthlyTarget: true
                        }
                    }
                }
            },
            statusHistory: {
                orderBy: { changeDate: 'desc' },
                select: {
                    fromStatus: true,
                    toStatus: true,
                    changedBy: true,
                    reason: true,
                    changeDate: true
                }
            }
        }
    });
}

async getLoanTypeById(id: string) {
    return this.prisma.loanType.findUnique({
        where: { id }
    });
}

async getAllLoanTypes() {
    return await this.prisma.loanType.findMany({
        where: {
            isActive: true
        },
        select: {
            id: true,
            name: true,
            description: true,
            interestRate: true,
            minDuration: true,
            maxDuration: true,
            maxLoanAmount: true,
            savingsMultiplier: true,
            isActive: true,
            requiresApproval: true,
            _count: {
                select: {
                    loans: true
                }
            }
        },
        orderBy: {
            name: 'asc'
        }
    });
}

/**
 * Get loan summary statistics with optional trend data and monthly breakdown
 * @param startDate Optional start date for filtering
 * @param endDate Optional end date for filtering
 * @param includeTrends Whether to include trend data
 * @param includeMonthlyBreakdown Whether to include monthly breakdown
 * @returns Enhanced summary statistics with optional trends and monthly data
 */
async getEnhancedLoansSummary(
    startDate?: Date,
    endDate?: Date,
    includeTrends = false,
    includeMonthlyBreakdown = true
): Promise<{
    totalOutstanding: string;
    totalDisbursed: string;
    totalRepaid: string;
    activeLoansCount: number;
    completedLoansCount: number;
    defaultedLoansCount: number;
    averageLoanAmount: string;
    disbursementMonths: number;
    repaymentMonths: number;
    defaultRate: number;
    monthlyBreakdown?: Array<{
        month: number;
        disbursedAmount: string;
        repaidAmount: string;
        loansCount: number;
        hasActivity: boolean;
    }>;
    latestActivity?: {
        disbursedAmount: string;
        repaidAmount: string;
        loansCount: number;
        month: number;
        year: number;
        date: string;
    } | null;
    trends?: any;
}> {
    try {
        // Get basic summary
        const summary = await this.getLoansSummary(startDate, endDate);
        
        const result: {
            totalOutstanding: string;
            totalDisbursed: string;
            totalRepaid: string;
            activeLoansCount: number;
            completedLoansCount: number;
            defaultedLoansCount: number;
            averageLoanAmount: string;
            disbursementMonths: number;
            repaymentMonths: number;
            defaultRate: number;
            monthlyBreakdown?: Array<{
                month: number;
                disbursedAmount: string;
                repaidAmount: string;
                loansCount: number;
                hasActivity: boolean;
            }>;
            latestActivity?: {
                disbursedAmount: string;
                repaidAmount: string;
                loansCount: number;
                month: number;
                year: number;
                date: string;
            } | null;
            trends?: any;
        } = {
            totalOutstanding: summary.totalOutstanding.toString(),
            totalDisbursed: summary.totalDisbursed.toString(),
            totalRepaid: summary.totalRepaid.toString(),
            activeLoansCount: summary.activeLoansCount,
            completedLoansCount: summary.completedLoansCount,
            defaultedLoansCount: summary.defaultedLoansCount,
            averageLoanAmount: summary.averageLoanAmount.toString(),
            disbursementMonths: 0,
            repaymentMonths: 0,
            defaultRate: summary.defaultRate,
            ...(includeMonthlyBreakdown && { monthlyBreakdown: [] }),
            ...(includeMonthlyBreakdown && { latestActivity: undefined })
        };

        // Add monthly breakdown if requested
        if (includeMonthlyBreakdown) {
            const currentYear = new Date().getFullYear();
            const yearStart = new Date(currentYear, 0, 1);
            const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59);

            // Get disbursement data by month using Prisma groupBy
            const disbursementData = await this.prisma.loan.groupBy({
                by: ['disbursedAt'],
                where: {
                    disbursedAt: {
                        gte: yearStart,
                        lte: yearEnd,
                        not: null
                    },
                    status: {
                        in: ['ACTIVE', 'COMPLETED', 'DISBURSED']
                    }
                },
                _sum: {
                    principalAmount: true
                },
                _count: {
                    id: true
                }
            });

            // Get repayment data by month using Prisma groupBy
            const repaymentData = await this.prisma.loanRepayment.groupBy({
                by: ['repaymentDate'],
                where: {
                    repaymentDate: {
                        gte: yearStart,
                        lte: yearEnd
                    }
                },
                _sum: {
                    amount: true
                }
            });

            // Process the data into monthly aggregates
            const monthlyAggregates: { [key: number]: { disbursed: number; repaid: number; count: number } } = {};

            // Initialize all months
            for (let month = 1; month <= 12; month++) {
                monthlyAggregates[month] = { disbursed: 0, repaid: 0, count: 0 };
            }

            // Process disbursement data
            disbursementData.forEach(item => {
                if (item.disbursedAt) {
                    const month = new Date(item.disbursedAt).getMonth() + 1;
                    monthlyAggregates[month].disbursed += Number(item._sum.principalAmount || 0);
                    monthlyAggregates[month].count += item._count.id;
                }
            });

            // Process repayment data
            repaymentData.forEach(item => {
                const month = new Date(item.repaymentDate).getMonth() + 1;
                monthlyAggregates[month].repaid += Number(item._sum.amount || 0);
            });

            // Create monthly breakdown array
            const monthlyBreakdown = Array.from({ length: 12 }, (_, index) => {
                const month = index + 1;
                const data = monthlyAggregates[month];
                return {
                    month,
                    disbursedAmount: data.disbursed.toString(),
                    repaidAmount: data.repaid.toString(),
                    loansCount: data.count,
                    hasActivity: data.disbursed > 0 || data.repaid > 0
                };
            });

            result.monthlyBreakdown = monthlyBreakdown;

            // Calculate activity months
            result.disbursementMonths = monthlyBreakdown.filter(m => Number(m.disbursedAmount) > 0).length;
            result.repaymentMonths = monthlyBreakdown.filter(m => Number(m.repaidAmount) > 0).length;

            // Get latest activity
            const latestMonth = monthlyBreakdown
                .slice()
                .reverse()
                .find(m => m.hasActivity);

            if (latestMonth) {
                result.latestActivity = {
                    disbursedAmount: latestMonth.disbursedAmount,
                    repaidAmount: latestMonth.repaidAmount,
                    loansCount: latestMonth.loansCount,
                    month: latestMonth.month,
                    year: currentYear,
                    date: new Date().toISOString()
                };
            } else {
                // Ensure latestActivity is undefined, not null
                result.latestActivity = undefined;
            }
        }

        // Add trends if requested
        if (includeTrends) {
            const trends = {
                disbursements: await this.calculateMonthlyTrends('disbursement'),
                repayments: await this.calculateMonthlyTrends('repayment'),
                applications: await this.calculateMonthlyTrends('application')
            };
            result.trends = trends;
        }

        return result;
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        logger.error(`Error getting enhanced loans summary: ${errorMessage}`, { error });
        throw new ApiError('Failed to get enhanced loans summary', 500);
    }
}

/**
* Calculate monthly trends for different loan metrics
* @param trendType Type of trend to calculate (disbursement, repayment, application)
* @returns Array of monthly data points
*/
private async calculateMonthlyTrends(trendType: 'disbursement' | 'repayment' | 'application'): Promise<{ month: string; value: number }[]> {
    // Get data for the last 6 months
    const months = 6;
    const results = [];
    
    for (let i = 0; i < months; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
        
        let value = 0;
        
        switch (trendType) {
            case 'disbursement':
            const disbursed = await this.prisma.loan.aggregate({
                where: {
                    disbursedAt: {
                        gte: startOfMonth,
                        lte: endOfMonth
                    },
                    status: {
                        in: ['DISBURSED', 'COMPLETED']
                    }
                },
                _sum: {
                    principalAmount: true
                }
            });
            value = Number(disbursed._sum.principalAmount || 0);
            break;
            case 'repayment':
            const repaid = await this.prisma.loanRepayment.aggregate({
                where: {
                    repaymentDate: {
                        gte: startOfMonth,
                        lte: endOfMonth
                    }
                },
                _sum: {
                    amount: true
                }
            });
            value = Number(repaid._sum.amount || 0);
            break;
            case 'application':
            const applications = await this.prisma.loan.count({
                where: {
                    createdAt: {
                        gte: startOfMonth,
                        lte: endOfMonth
                    }
                }
            });
            value = applications;
            break;
        }
        
        results.push({
            month: startOfMonth.toISOString().substring(0, 7),
            value
        });
    }
    
    return results.reverse();
}

/**
* Get comprehensive loan summary statistics
* @param startDate Optional start date for filtering
* @param endDate Optional end date for filtering
* @returns Summary statistics for loans
*/
async getLoansSummary(startDate?: Date, endDate?: Date): Promise<LoanSummary> {
    try {
        logger.debug('Generating loan summary', startDate ? `from ${startDate.toISOString()}` : '', 
        endDate ? `to ${endDate.toISOString()}` : '');
        
        // Base date filter for queries
        const dateFilter: { createdAt?: { gte?: Date; lte?: Date } } = {};
        if (startDate) {
            dateFilter['createdAt'] = { ...(dateFilter['createdAt'] || {}), gte: startDate };
        }
        if (endDate) {
            dateFilter['createdAt'] = { ...(dateFilter['createdAt'] || {}), lte: endDate };
        }
        
        // 1. Total outstanding loan balance (all active loans)
        const outstandingLoans = await this.prisma.loan.aggregate({
            where: {
                status: {
                    in: ['ACTIVE', 'DISBURSED', 'DEFAULTED']
                },
                ...dateFilter
            },
            _sum: {
                remainingBalance: true
            }
        });
        
        // 2. Total disbursed amount
        const disbursedLoans = await this.prisma.loan.aggregate({
            where: {
                status: {
                    in: ['ACTIVE', 'DISBURSED', 'COMPLETED', 'DEFAULTED']
                },
                disbursedAt: {
                    not: null,
                    ...(startDate && { gte: startDate }),
                    ...(endDate && { lte: endDate })
                }
            },
            _sum: {
                principalAmount: true
            }
        });
        
        // 3. Count of new loan applications (last 7 days if no date range provided)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const newLoansFilter = startDate || endDate ? dateFilter : {
            createdAt: {
                gte: sevenDaysAgo
            }
        };
        
        const newLoansCount = await this.prisma.loan.count({
            where: newLoansFilter
        });
        
        // 4. Count of pending loan applications
        const pendingLoans = await this.prisma.loan.count({
            where: {
                status: {
                    in: ['PENDING', 'IN_REVIEW', 'REVIEWED', 'APPROVED']
                }
            }
        });
        
        // 5. Count of repayments (last 30 days if no date range specified)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const repaymentsFilter = startDate || endDate ? {
            repaymentDate: {
                ...(startDate && { gte: startDate }),
                ...(endDate && { lte: endDate })
            }
        } : {
            repaymentDate: {
                gte: thirtyDaysAgo
            }
        };
        
        const repaymentsCount = await this.prisma.loanRepayment.count({
            where: repaymentsFilter
        });
        
        // 6. Count of overdue loans with at least one overdue schedule
        const currentDate = new Date();
        const overdueLoans = await this.prisma.loan.count({
            where: {
                status: 'ACTIVE',
                paymentSchedules: {
                    some: {
                        dueDate: {
                            lt: currentDate
                        },
                        status: {
                            in: ['PENDING', 'PARTIAL']
                        }
                    }
                }
            }
        });
        
        // Return the summary data
        return {
            totalRepaid: 0, // Placeholder, update with actual calculation if needed
            activeLoansCount: 0, // Placeholder, update with actual calculation if needed
            completedLoansCount: 0, // Placeholder, update with actual calculation if needed
            defaultedLoansCount: 0, // Placeholder, update with actual calculation if needed
            averageLoanAmount: 0, // Placeholder, update with actual calculation if needed
            defaultRate: 0, // Placeholder, update with actual calculation if needed
            totalOutstanding: Number(outstandingLoans._sum.remainingBalance || 0),
            totalDisbursed: Number(disbursedLoans._sum.principalAmount || 0),
            newLoansCount,
            pendingLoans,
            repaymentsCount,
            overdueLoans
        };
    } catch (error) {
        logger.error('Error generating loan summary:', error);
        throw error;
    }
}

/**
* Get all loans with filtering, pagination and sorting
* @param filters Query parameters and filters
* @returns Paginated list of loans with count
*/
async getAllLoans(filters: LoanQueryFilters = {}) {
    try {
        // Default values
        const {
            page = 1,
            limit = 10,
            status,
            loanTypeId,
            erpId,
            startDate,
            endDate,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            biodataId,
            minAmount,
            maxAmount
        } = filters;
        
        // Calculate pagination
        const skip = (page - 1) * limit;
        
        // Build where conditions
        const whereConditions: any = {};
        
        // Filter by status
        if (status) {
            if (status === 'ACTIVE') {
                // Consider both ACTIVE and DISBURSED loans as "active"
                whereConditions.status = { in: ['ACTIVE', 'DISBURSED'] };
            } else {
                whereConditions.status = Array.isArray(status) ? { in: status } : status;
            }
        }
        
        // Filter by loan type
        if (loanTypeId) {
            whereConditions.loanTypeId = loanTypeId;
        }
        
        // Filter by member ERP ID
        if (erpId) {
            whereConditions.erpId = erpId;
        }
        
        // Filter by member biodata ID
        if (biodataId) {
            whereConditions.memberId = biodataId;
        }
        
        // Filter by amount range
        if (minAmount !== undefined) {
            whereConditions.principalAmount = {
                ...(whereConditions.principalAmount || {}),
                gte: minAmount
            };
        }
        
        if (maxAmount !== undefined) {
            whereConditions.principalAmount = {
                ...(whereConditions.principalAmount || {}),
                lte: maxAmount
            };
        }
        
        // Date range filter
        if (startDate || endDate) {
            whereConditions.createdAt = {
                ...(startDate && { gte: startDate }),
                ...(endDate && { lte: endDate })
            };
        }
        
        // Get sorting direction
        const orderBy: any = {};
        orderBy[sortBy] = sortOrder;
        
        // Execute queries in parallel for better performance
        const [loans, totalCount] = await Promise.all([
            // Get paginated loans
            this.prisma.loan.findMany({
                where: whereConditions,
                include: {
                    loanType: true,
                    member: {
                        select: {
                            id: true,
                            erpId: true,
                            firstName: true,
                            lastName: true,
                            fullName: true,
                            department: true,
                            emailAddress: true,
                            phoneNumber: true
                        }
                    },
                    paymentSchedules: {
                        orderBy: { dueDate: 'asc' },
                        take: 1 // Include just the next payment for list view
                    },
                    _count: {
                        select: {
                            repayments: true,
                            paymentSchedules: true
                        }
                    }
                },
                orderBy,
                skip,
                take: Number(limit)
            }),
            // Get total count for pagination
            this.prisma.loan.count({
                where: whereConditions
            })
        ]);
        
        // Calculate additional data for each loan
        const enhancedLoans = loans.map(loan => {
            // Find the next upcoming payment date (if any)
            const nextPaymentDate = loan.paymentSchedules.find(
                schedule => schedule.status === 'PENDING' || schedule.status === 'PARTIAL'
            )?.dueDate;
            
            // Calculate if the loan is late
            const isLate = nextPaymentDate && nextPaymentDate < new Date();
            
            // Calculate days late
            const daysLate = isLate
            ? Math.floor((new Date().getTime() - nextPaymentDate.getTime()) / (1000 * 60 * 60 * 24))
            : 0;
            
            // Calculate payment progress as percentage
            const paymentProgress = loan.totalAmount.toNumber() > 0
            ? (loan.paidAmount.toNumber() / loan.totalAmount.toNumber()) * 100
            : 0;
            
            return {
                ...loan,
                nextPaymentDate,
                isLate,
                daysLate,
                paymentProgress
            };
        });
        
        return {
            data: enhancedLoans,
            meta: {
                totalCount,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(totalCount / Number(limit))
            }
        };
    } catch (error) {
        logger.error('Error fetching all loans:', error);
        throw error;
    }
}
}

