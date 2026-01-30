import {
  Prisma,
  PersonalSavingsStatus,
  TransactionType,
  RequestType,
  RequestStatus,
  TransactionModule,
  TransactionStatus,
  RequestModule,
  MembershipStatus,
} from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { ApiError } from "../../../utils/apiError";
import logger from "../../../utils/logger";
import RequestService from "../../request/services/request.service";
import {
  IPersonalSavingsQueryParams,
  IPersonalSavingsResponse,
  IPersonalSavingsTransactionQueryParams,
  IPersonalSavingsBalanceHistory,
  IBalanceHistoryItem,
} from "../interfaces/personal-savings.interface";
import { prisma } from "../../../utils/prisma";

export class PersonalSavingsService {
  constructor() {}

  /**
   * Request creation of a new personal savings plan through the approval workflow
   * Once approved, the plan will be automatically created
   */
  async requestPersonalSavingsCreation(data: {
    erpId: string;
    planTypeId: string;
    planName?: string;
    targetAmount?: number;
    userId: string;
    notes?: string;
  }): Promise<any> {
    try {
      // Check if member exists
      const member = await prisma.biodata.findUnique({
        where: { erpId: data.erpId },
        select: {
          id: true,
          fullName: true,
          department: true,
          membershipStatus: true,
        },
      });

      if (!member) {
        throw new ApiError("Member not found", 404);
      }

      // Verify that member status is ACTIVE
      if (member.membershipStatus !== MembershipStatus.ACTIVE) {
        throw new ApiError(
          "Only members with ACTIVE status can request for personal savings plans",
          403
        );
      }

      // Validate plan type
      const planType = await prisma.personalSavingsPlan.findUnique({
        where: { id: data.planTypeId },
      });

      if (!planType) {
        throw new ApiError("Invalid savings plan type", 400);
      }

      if (!planType.isActive) {
        throw new ApiError(
          "This savings plan type is no longer available",
          400
        );
      }

      // Create a request for personal savings plan creation
      const request = await RequestService.createRequest({
        type: RequestType.PERSONAL_SAVINGS_CREATION,
        module: RequestModule.SAVINGS,
        biodataId: member.id,
        userId: data.userId,
        content: {
          erpId: data.erpId,
          planTypeId: data.planTypeId,
          planName: data.planName || planType.name, // Use plan type name as default if not provided
          targetAmount: data.targetAmount,
        },
        metadata: {
          memberName: member.fullName,
          department: member.department,
          planTypeName: planType.name,
          planTypeDescription: planType.description || undefined,
          planTypeAmount: data.targetAmount || undefined,
        },
        notes: data.notes,
      });

      return {
        message:
          "Personal savings plan creation request submitted successfully",
        requestId: request.id,
        status: request.status,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      logger.error(
        `Error requesting personal savings plan creation: ${errorMessage}`,
        { error }
      );
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        "Failed to request personal savings plan creation",
        500
      );
    }
  }

  /**
   * Get all personal savings plans with filtering
   * Implements automatic filtering based on user role:
   * - Admins can see all savings plans
   * - Regular members can only see their own savings plans
   * - Includes pending approval requests and their status
   */
  async getAllPersonalSavings(
    queryParams: IPersonalSavingsQueryParams,
    userId: string,
    isAdmin: boolean
  ) {
    try {
      const {
        page = 1,
        limit = 12,
        erpId,
        status,
        sort = "desc",
        includePending = true,
      } = queryParams;
      const skip = (page - 1) * limit;

      // Build base filter conditions
      let where: any = {
        ...(erpId && { erpId }),
        ...(status && { status }),
      };

      // If not admin, restrict to user's own plans
      if (!isAdmin) {
        // Get user's erpId from their biodata
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            biodata: {
              select: { erpId: true },
            },
          },
        });

        if (!user?.biodata?.erpId) {
          throw new ApiError("User profile not found", 404);
        }

        // Add erpId filter to only show user's own plans
        where.erpId = user.biodata.erpId;
      }

      // Get existing personal savings plans
      const [total, plans] = await Promise.all([
        prisma.personalSavings.count({ where }),
        prisma.personalSavings.findMany({
          where,
          include: {
            member: {
              select: {
                id: true,
                fullName: true,
                department: true,
              },
            },
            planType: {
              select: {
                name: true,
                description: true,
              },
            },
            transactions: {
              orderBy: {
                createdAt: "desc",
              },
              take: 5,
            },
            requests: {
              where: {
                type: RequestType.PERSONAL_SAVINGS_WITHDRAWAL,
                status: {
                  in: [
                    RequestStatus.PENDING,
                    RequestStatus.IN_REVIEW,
                    RequestStatus.REVIEWED,
                    RequestStatus.APPROVED,
                  ],
                },
              },
              orderBy: {
                createdAt: "desc",
              },
              include: {
                approvalSteps: {
                  orderBy: {
                    level: "asc",
                  },
                },
              },
              take: 1, // Get most recent pending withdrawal request
            },
          },
          orderBy: {
            createdAt: sort,
          },
          skip,
          take: limit,
        }),
      ]);

      // Get pending creation requests if requested
      let pendingCreationRequests: any[] = [];
      if (includePending) {
        // Build where conditions for pending requests
        const pendingWhere: any = {
          type: RequestType.PERSONAL_SAVINGS_CREATION,
          status: {
            in: [
              RequestStatus.PENDING,
              RequestStatus.IN_REVIEW,
              RequestStatus.REVIEWED,
            ],
          },
        };

        // For non-admins, restrict to their own requests
        if (!isAdmin) {
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
              biodata: {
                select: { id: true },
              },
            },
          });

          if (user?.biodata?.id) {
            pendingWhere.biodataId = user.biodata.id;
          }
        } else if (erpId) {
          // Admin filtering by specific erpId
          const member = await prisma.biodata.findUnique({
            where: { erpId },
            select: { id: true },
          });

          if (member?.id) {
            pendingWhere.biodataId = member.id;
          }
        }

        pendingCreationRequests = await prisma.request.findMany({
          where: pendingWhere,
          include: {
            biodata: {
              select: {
                id: true,
                fullName: true,
                department: true,
                erpId: true,
              },
            },
            approvalSteps: {
              orderBy: {
                level: "asc",
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: limit,
        });
      }

      // Format existing plans
      const formattedPlans = plans.map((plan) => ({
        id: plan.id,
        erpId: plan.erpId,
        planTypeId: plan.planTypeId,
        planType: {
          name: plan.planType?.name || "Unknown",
          description: plan.planType?.description || null,
        },
        planName: plan.planName || undefined,
        targetAmount: plan.targetAmount || undefined,
        currentBalance: plan.currentBalance,
        status: plan.status,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
        member: {
          id: plan.member.id,
          name: plan.member.fullName,
          department: plan.member.department,
        },
        transactions: plan.transactions.map((transaction) => ({
          id: transaction.id,
          amount: transaction.amount,
          transactionType: transaction.transactionType,
          transactionBaseType: transaction.baseType,
          status: transaction.status,
          description: transaction.description,
          createdAt: transaction.createdAt,
        })),
        pendingWithdrawal:
          plan.requests.length > 0
            ? {
                requestId: plan.requests[0].id,
                status: plan.requests[0].status,
                requestedAt: plan.requests[0].createdAt,
                amount:
                  typeof plan.requests[0].content === "object" &&
                  plan.requests[0].content !== null
                    ? (plan.requests[0].content as any).amount || null
                    : null,
                currentApprovalLevel: plan.requests[0].nextApprovalLevel,
                approvalSteps: plan.requests[0].approvalSteps.map((step) => ({
                  level: step.level,
                  status: step.status,
                  approverRole: step.approverRole,
                  approvedAt: step.approvedAt,
                })),
              }
            : null,
      }));

      // Format pending creation requests
      const formattedPendingRequests = pendingCreationRequests.map(
        (request) => {
          const content = request.content || {};

          return {
            requestId: request.id,
            type: "PENDING_CREATION",
            erpId: request.biodata?.erpId,
            planTypeId: content.planTypeId,
            planName: content.planName,
            targetAmount: content.targetAmount,
            status: request.status,
            createdAt: request.createdAt,
            updatedAt: request.updatedAt,
            currentApprovalLevel: request.nextApprovalLevel,
            member: request.biodata
              ? {
                  id: request.biodata.id,
                  name: request.biodata.fullName,
                  department: request.biodata.department,
                }
              : null,
            approvalSteps: request.approvalSteps.map(
              (step: {
                level: any;
                status: any;
                approverRole: any;
                approvedAt: any;
              }) => ({
                level: step.level,
                status: step.status,
                approverRole: step.approverRole,
                approvedAt: step.approvedAt,
              })
            ),
          };
        }
      );

      // Combine results
      const combinedData = [...formattedPendingRequests, ...formattedPlans];

      // Sort combined results by date
      if (sort === "desc") {
        combinedData.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      } else {
        combinedData.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      }

      // Calculate total combined count for pagination
      const totalCombined =
        total + (includePending ? pendingCreationRequests.length : 0);

      // Return paginated results
      return {
        data: combinedData,
        meta: {
          total: totalCombined,
          page,
          limit,
          totalPages: Math.ceil(totalCombined / limit),
          pendingCreationCount: pendingCreationRequests.length,
          activeCount: plans.filter(
            (p) => p.status === PersonalSavingsStatus.ACTIVE
          ).length,
          closedCount: plans.filter(
            (p) => p.status === PersonalSavingsStatus.CLOSED
          ).length,
        },
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      logger.error(`Error fetching personal savings plans: ${errorMessage}`, {
        error,
      });
      throw new ApiError("Failed to fetch personal savings plans", 500);
    }
  }
  /**
   * Get personal savings plan by ID with ownership validation
   * Only admins can access any plan, regular members can only access their own plans
   */
  async getPersonalSavingsById(
    id: string,
    userId: string,
    isAdmin: boolean
  ): Promise<IPersonalSavingsResponse> {
    try {
      const plan = await prisma.personalSavings.findUnique({
        where: { id },
        include: {
          member: {
            select: {
              id: true,
              fullName: true,
              department: true,
              erpId: true,
              users: {
                select: {
                  id: true,
                },
              },
            },
          },
          transactions: {
            orderBy: {
              createdAt: "desc",
            },
            take: 10,
          },
        },
      });

      if (!plan) {
        throw new ApiError("Personal savings plan not found", 404);
      }

      // Check if user has access to this plan
      // Admins can access any plan, regular members can only access their own plans
      if (
        !isAdmin &&
        (!Array.isArray(plan.member.users) ||
          !plan.member.users.some((user: { id: string }) => user.id === userId))
      ) {
        throw new ApiError(
          "You do not have permission to access this plan",
          403
        );
      }

      return {
        id: plan.id,
        erpId: plan.erpId,
        planTypeId: plan.planTypeId,
        planName: plan.planName || undefined,
        targetAmount: plan.targetAmount || undefined,
        currentBalance: plan.currentBalance,
        status: plan.status,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
        member: {
          id: plan.member.id,
          name: plan.member.fullName,
          department: plan.member.department,
        },
        transactions: plan.transactions.map((transaction) => ({
          id: transaction.id,
          amount: transaction.amount,
          transactionType: transaction.transactionType,
          transactionBaseType: transaction.baseType,
          status: transaction.status,
          description: transaction.description,
          createdAt: transaction.createdAt,
        })),
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      logger.error(`Error fetching personal savings plan: ${errorMessage}`, {
        error,
      });
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError("Failed to fetch personal savings plan", 500);
    }
  }
  /**
   * Process a deposit to personal savings
   * Note: This method is only accessible to admins/treasurers through role-based permission checks in the route
   */
  async processDeposit(
    id: string,
    amount: number,
    userId: string,
    description?: string
  ): Promise<IPersonalSavingsResponse> {
    try {
      // Get the personal savings plan
      const plan = await prisma.personalSavings.findUnique({
        where: { id },
        include: {
          member: {
            select: {
              id: true,
              fullName: true,
              department: true,
            },
          },
        },
      });

      if (!plan) {
        throw new ApiError("Personal savings plan not found", 404);
      }

      // Check if user is authorized to make deposits (this is handled in the route middleware)
      // No ownership checks needed here as only admins with PROCESS_PERSONAL_SAVINGS_DEPOSITS can access

      if (plan.status !== PersonalSavingsStatus.ACTIVE) {
        throw new ApiError(
          "Cannot deposit to a closed or suspended savings plan",
          400
        );
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new ApiError("User not found", 404);
      }

      // Calculate new balance
      const newBalance = plan.currentBalance.add(new Decimal(amount));

      // Start transaction
      return await prisma.$transaction(async (tx) => {
        // Create transaction record
        const transaction = await tx.transaction.create({
          data: {
            transactionType: TransactionType.PERSONAL_SAVINGS_DEPOSIT,
            baseType: TransactionType.CREDIT,
            module: TransactionModule.SAVINGS,
            amount: new Decimal(amount),
            balanceAfter: newBalance,
            status: TransactionStatus.COMPLETED,
            description:
              description ||
              `Deposit to personal savings plan: ${
                plan.planName || "Unnamed plan"
              }`,
            initiatedBy: userId,
            personalSavingsId: plan.id,
          },
        });

        // Update personal savings balance
        const updatedPlan = await tx.personalSavings.update({
          where: { id },
          data: {
            currentBalance: newBalance,
            updatedAt: new Date(),
          },
          include: {
            member: {
              select: {
                id: true,
                fullName: true,
                department: true,
              },
            },
          },
        });

        return {
          id: updatedPlan.id,
          erpId: updatedPlan.erpId,
          planTypeId: updatedPlan.planTypeId,
          planName: updatedPlan.planName || undefined,
          targetAmount: updatedPlan.targetAmount || undefined,
          currentBalance: updatedPlan.currentBalance,
          status: updatedPlan.status,
          createdAt: updatedPlan.createdAt,
          updatedAt: updatedPlan.updatedAt,
          member: {
            id: updatedPlan.member.id,
            name: updatedPlan.member.fullName,
            department: updatedPlan.member.department,
          },
        };
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      logger.error(
        `Error processing personal savings deposit: ${errorMessage}`,
        { error }
      );
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError("Failed to process deposit", 500);
    }
  }

  /**
   * Request withdrawal from personal savings
   */
  async requestWithdrawal(
    id: string,
    amount: number,
    userId: string,
    reason?: string
  ): Promise<any> {
    try {
      const now = new Date();
      // Get the personal savings plan
    //   const plan = await prisma.personalSavings.findUnique({
    //     where: { id },
    //     include: {
    //       member: true,
    //       transactions: {
    //         where: {
    //           transactionType: TransactionType.PERSONAL_SAVINGS_DEPOSIT,
    //         },
    //         orderBy: {
    //           createdAt: "desc",
    //         },
    //         take: 1,
    //       },
    //     },
    //   });
        const plan = await prisma.personalSavings.findUnique({
  where: { id },
  include: {
    member: true,
    transactions: {
      where: {
        // Fetch BOTH deposits (for 7-day rule) and withdrawals (for 1-month rule)
        transactionType: {
          in: [
            TransactionType.PERSONAL_SAVINGS_DEPOSIT, 
            TransactionType.PERSONAL_SAVINGS_WITHDRAWAL
          ]
        },
        status: TransactionStatus.COMPLETED, // Only care about successful transactions
      },
      orderBy: {
        createdAt: "asc", // Sort Oldest -> Newest so we can find the "first" anything
      },
    },
  },
});
      if (!plan) {
        throw new ApiError("Personal savings plan not found", 404);
      }

      if (plan.status !== PersonalSavingsStatus.ACTIVE) {
        throw new ApiError(
          "Cannot withdraw from a closed or suspended savings plan",
          400
        );
      }

      // Check if sufficient balance
      if (plan.currentBalance.lessThan(amount)) {
        throw new ApiError("Insufficient balance for withdrawal", 400);
      }

      // Check if withdrawal meets 7-day rule
    //   if (plan.transactions.length > 0) {
    //     const latestDeposit = plan.transactions[0];
    //     const sevenDaysAgo = new Date();
    //     sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    //     if (latestDeposit.createdAt > sevenDaysAgo) {
    //       throw new ApiError(
    //         "Withdrawal not allowed within 7 days of the last deposit",
    //         400
    //       );
    //     }
    //   }

     const allTransactions = plan.transactions;

// --- 1. THE 7-DAY DEPOSIT RULE ---
// Find the newest deposit from the array
const newestDeposit = [...allTransactions]
  .reverse() // Reverse to find the latest one first
  .find(t => t.transactionType === TransactionType.PERSONAL_SAVINGS_DEPOSIT);

if (newestDeposit) {
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  if (newestDeposit.createdAt > sevenDaysAgo) {
    throw new ApiError('Withdrawal not allowed within 7 days of the last deposit', 400);
  }
}

// --- 2. THE 1-MONTH FIRST-WITHDRAWAL RULE ---
// Find the absolute first withdrawal ever made
const firstWithdrawal = allTransactions.find(
  t => t.transactionType === TransactionType.PERSONAL_SAVINGS_WITHDRAWAL || t.baseType === TransactionType.DEBIT
);

if (firstWithdrawal) {
  const oneMonthAgo = new Date(now);
  oneMonthAgo.setMonth(now.getMonth() - 1);

  if (firstWithdrawal.createdAt > oneMonthAgo) {
    const availableDate = new Date(firstWithdrawal.createdAt);
    availableDate.setMonth(availableDate.getMonth() + 1);

    throw new ApiError(
      `Further withdrawals are restricted until 1 month after your first withdrawal. Available from: ${availableDate.toLocaleDateString()}`,
      400
    );
  }
}

      // Create withdrawal request using RequestService
      const request = await RequestService.createRequest({
        type: RequestType.PERSONAL_SAVINGS_WITHDRAWAL,
        module: RequestModule.SAVINGS,
        biodataId: plan.memberId,
        personalSavingsId: id, // Add this line
        userId: userId,
        content: {
          amount,
          reason,
          planId: id,
          planName: plan.planName,
          currentBalance: plan.currentBalance.toString(),
        },
        metadata: {
          planId: id,
          amount: amount,
          personalSavingsId: id,
        },
      });

      return {
        message: "Withdrawal request submitted successfully",
        requestId: request.id,
        status: request.status,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      logger.error(
        `Error requesting personal savings withdrawal: ${errorMessage}`,
        { error }
      );
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError("Failed to process withdrawal request", 500);
    }
  }

  /**
   * Get transaction history for a personal savings plan with ownership validation
   * Only admins can access any transaction history, members can only access their own
   */
  async getTransactionHistory(
    planId: string,
    queryParams: IPersonalSavingsTransactionQueryParams,
    userId: string,
    isAdmin: boolean
  ) {
    try {
      const { page = 1, limit = 12, startDate, endDate, type } = queryParams;
      const skip = (page - 1) * limit;

      // First perform ownership validation
      if (!isAdmin) {
        const userBiodata = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            biodata: {
              select: {
                erpId: true,
              },
            },
          },
        });

        if (!userBiodata?.biodata?.erpId) {
          throw new ApiError("User profile not found", 404);
        }

        // Verify this plan belongs to the user
        const plan = await prisma.personalSavings.findUnique({
          where: { id: planId },
          select: { erpId: true },
        });

        if (!plan) {
          throw new ApiError("Personal savings plan not found", 404);
        }

        // If the plan doesn't belong to the current user, deny access
        if (plan.erpId !== userBiodata.biodata.erpId) {
          throw new ApiError(
            "You do not have permission to access this plan",
            403
          );
        }
      }

      // Build where clause
      const where: Prisma.TransactionWhereInput = {
        personalSavingsId: planId,
        ...(type && { transactionType: type }),
        ...((startDate || endDate) && {
          createdAt: {
            ...(startDate && { gte: new Date(startDate) }),
            ...(endDate && { lte: new Date(`${endDate}T23:59:59`) }),
          },
        }),
      };

      const [total, transactions] = await Promise.all([
        prisma.transaction.count({ where }),
        prisma.transaction.findMany({
          where,
          orderBy: {
            createdAt: "desc",
          },
          skip,
          take: limit,
          include: {
            initiator: {
              select: {
                id: true,
                username: true,
                adminProfile: true,
              },
            },
            approver: {
              select: {
                id: true,
                username: true,
                adminProfile: true,
              },
            },
          },
        }),
      ]);

      return {
        data: transactions,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      logger.error(`Error fetching transaction history: ${errorMessage}`, {
        error,
      });
      throw new ApiError("Failed to fetch transaction history", 500);
    }
  }
  /**
   * Get balance history for a specified period (for charts) with ownership validation
   */
  async getBalanceHistory(
    planId: string,
    startDate?: string,
    endDate?: string,
    userId?: string,
    isAdmin?: boolean
  ): Promise<IPersonalSavingsBalanceHistory> {
    try {
      // First, get the plan with member info
      const plan = await prisma.personalSavings.findUnique({
        where: { id: planId },
        select: {
          planName: true,
          currentBalance: true,
          erpId: true,
          member: {
            select: {
              fullName: true,
            },
          },
        },
      });

      if (!plan) {
        throw new ApiError("Personal savings plan not found", 404);
      }

      // Perform ownership validation if userId and isAdmin are provided
      if (userId && isAdmin !== undefined && !isAdmin) {
        // Get user's erpId from their biodata
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            biodata: {
              select: { erpId: true },
            },
          },
        });

        if (!user?.biodata?.erpId) {
          throw new ApiError("User profile not found", 404);
        }

        // If the plan doesn't belong to the current user, deny access
        if (plan.erpId !== user.biodata.erpId) {
          throw new ApiError(
            "You do not have permission to access this plan",
            403
          );
        }
      }

      // Set default date range if not provided (last 3 months)
      const end = endDate ? new Date(endDate) : new Date();
      const start = startDate ? new Date(startDate) : new Date();
      if (!startDate) {
        start.setMonth(start.getMonth() - 3);
      }

      // Get all transactions for the period
      const transactions = await prisma.transaction.findMany({
        where: {
          personalSavingsId: planId,
          createdAt: {
            gte: start,
            lte: end,
          },
        },
        orderBy: {
          createdAt: "asc",
        },
        select: {
          createdAt: true,
          balanceAfter: true,
          transactionType: true,
          amount: true,
        },
      });

      // Build balance history
      const history: IBalanceHistoryItem[] = [];

      // Add starting point if transactions exist
      if (transactions.length > 0) {
        // Get first transaction date
        const firstTxDate = new Date(transactions[0].createdAt);
        firstTxDate.setDate(firstTxDate.getDate() - 1); // day before first transaction

        // Get balance before first transaction
        const firstBalanceAfter = transactions[0].balanceAfter;
        const firstTxAmount = transactions[0].amount;
        const isDebit =
          transactions[0].transactionType ===
          TransactionType.PERSONAL_SAVINGS_WITHDRAWAL;

        // Calculate initial balance
        const initialBalance = isDebit
          ? Number(firstBalanceAfter) + Number(firstTxAmount)
          : Number(firstBalanceAfter) - Number(firstTxAmount);

        // Add initial point
        history.push({
          date: firstTxDate.toISOString().split("T")[0],
          balance: initialBalance,
        });
      }

      // Add transaction points
      transactions.forEach((tx) => {
        history.push({
          date: tx.createdAt.toISOString().split("T")[0],
          balance: Number(tx.balanceAfter),
        });
      });

      return {
        history,
        memberErpId: plan.erpId,
        memberName: plan.member ? plan.member.fullName : "Unknown Member",
        planName: plan.planName || undefined,
        currentBalance: Number(plan.currentBalance),
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      logger.error(`Error fetching balance history: ${errorMessage}`, {
        error,
      });
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError("Failed to fetch balance history", 500);
    }
  }

  /**
   * Close personal savings plan (zero balance required)
   */
  async closePlan(
    id: string,
    userId: string
  ): Promise<IPersonalSavingsResponse> {
    try {
      const plan = await prisma.personalSavings.findUnique({
        where: { id },
        include: {
          member: {
            select: {
              id: true,
              fullName: true,
              department: true,
            },
          },
        },
      });

      if (!plan) {
        throw new ApiError("Personal savings plan not found", 404);
      }

      // Check if balance is zero
      if (!plan.currentBalance.equals(0)) {
        throw new ApiError("Cannot close plan with non-zero balance", 400);
      }

      // Update plan status
      const updatedPlan = await prisma.personalSavings.update({
        where: { id },
        data: {
          status: PersonalSavingsStatus.CLOSED,
          updatedAt: new Date(),
        },
        include: {
          member: {
            select: {
              id: true,
              fullName: true,
              department: true,
            },
          },
        },
      });

      return {
        id: updatedPlan.id,
        erpId: updatedPlan.erpId,
        planTypeId: updatedPlan.planTypeId,
        planName: updatedPlan.planName || undefined,
        targetAmount: updatedPlan.targetAmount || undefined,
        currentBalance: updatedPlan.currentBalance,
        status: updatedPlan.status,
        createdAt: updatedPlan.createdAt,
        updatedAt: updatedPlan.updatedAt,
        member: {
          id: updatedPlan.member.id,
          name: updatedPlan.member.fullName,
          department: updatedPlan.member.department,
        },
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      logger.error(`Error closing personal savings plan: ${errorMessage}`, {
        error,
      });
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError("Failed to close personal savings plan", 500);
    }
  }

  /**
   * Get summary of personal savings for a member with ownership validation
   */
  async getMemberSummary(
    erpId: string,
    userId?: string,
    isAdmin?: boolean
  ): Promise<{
    totalSaved: number;
    totalWithdrawals: number;
    currentBalance: number;
    plansCount: number;
    activePlans: IPersonalSavingsResponse[];
    pendingRequests: any[]; // Added to return pending requests
  }> {
    try {
      // Get member details
      const member = await prisma.biodata.findUnique({
        where: { erpId },
      });

      if (!member) {
        throw new ApiError("Member not found", 404);
      }

      // Perform ownership validation if userId and isAdmin are provided
      if (userId && isAdmin !== undefined && !isAdmin) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            biodata: {
              select: { erpId: true },
            },
          },
        });

        if (!user?.biodata?.erpId) {
          throw new ApiError("User profile not found", 404);
        }

        if (erpId !== user.biodata.erpId) {
          throw new ApiError(
            "You do not have permission to access this member's summary",
            403
          );
        }
      }

      // Get active plans, total counts, current balance, total deposits, total withdrawals, and pending requests
      const [
        plans,
        plansCount,
        currentBalance,
        totalSaved,
        totalWithdrawals,
        pendingRequests,
      ] = await Promise.all([
        prisma.personalSavings.findMany({
          where: {
            erpId,
            status: PersonalSavingsStatus.ACTIVE,
          },
          include: {
            member: {
              select: {
                id: true,
                fullName: true,
                department: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        }),

        prisma.personalSavings.count({
          where: {
            erpId,
          },
        }),

        prisma.personalSavings.aggregate({
          where: {
            erpId,
            status: PersonalSavingsStatus.ACTIVE,
          },
          _sum: {
            currentBalance: true,
          },
        }),

        prisma.transaction.aggregate({
          where: {
            personalSavings: {
              erpId: erpId,
            },
            transactionType: TransactionType.PERSONAL_SAVINGS_DEPOSIT,
            baseType: "CREDIT",
            status: TransactionStatus.COMPLETED,
          },
          _sum: {
            amount: true,
          },
        }),

        prisma.transaction.aggregate({
          where: {
            personalSavings: {
              erpId: erpId,
            },
            transactionType: TransactionType.PERSONAL_SAVINGS_WITHDRAWAL,
            baseType: "DEBIT",
            status: TransactionStatus.COMPLETED,
          },
          _sum: {
            amount: true,
          },
        }),

        // Fetch pending creation and withdrawal requests
        prisma.request.findMany({
          where: {
            biodataId: member.id,
            type: {
              in: [
                RequestType.PERSONAL_SAVINGS_CREATION,
                RequestType.PERSONAL_SAVINGS_WITHDRAWAL,
              ],
            },
            status: {
              in: [
                RequestStatus.PENDING,
                RequestStatus.IN_REVIEW,
                RequestStatus.REVIEWED,
              ],
            },
          },
          include: {
            approvalSteps: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        }),
      ]);

      // Format active plans
      const formattedPlans = plans.map((plan) => ({
        id: plan.id,
        erpId: plan.erpId,
        planTypeId: plan.planTypeId,
        planName: plan.planName || undefined,
        targetAmount: plan.targetAmount || undefined,
        currentBalance: plan.currentBalance,
        status: plan.status,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
        member: {
          id: plan.member.id,
          name: plan.member.fullName,
          department: plan.member.department,
        },
      }));

      return {
        totalSaved: Number(totalSaved._sum.amount || 0),
        totalWithdrawals: Math.abs(Number(totalWithdrawals._sum.amount || 0)),
        currentBalance: Number(currentBalance._sum.currentBalance || 0),
        plansCount,
        activePlans: formattedPlans,
        pendingRequests: pendingRequests, // Include pending requests in the response
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      logger.error(`Error getting member savings summary: ${errorMessage}`, {
        error,
      });
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError("Failed to get member savings summary", 500);
    }
  }

  /**
   * Get admin dashboard statistics for personal savings
   */
  async getAdminDashboardData(userId: string) {
    try {
      // Get aggregated statistics
      const [
        totalActivePlans,
        totalSavingsAmount,
        totalWithdrawalAmount,
        totalPendingCreationRequests,
        totalPendingWithdrawalRequests,
        recentTransactions,
      ] = await Promise.all([
        // Count active plans
        prisma.personalSavings.count({
          where: { status: PersonalSavingsStatus.ACTIVE },
        }),

        // Sum of all current balances (active plans only)
        prisma.personalSavings.aggregate({
          where: { status: PersonalSavingsStatus.ACTIVE },
          _sum: { currentBalance: true },
        }),

        // Sum of all withdrawals across all personal savings plans
        prisma.transaction.aggregate({
          where: {
            transactionType: TransactionType.PERSONAL_SAVINGS_WITHDRAWAL,
            status: TransactionStatus.COMPLETED,
            module: TransactionModule.SAVINGS,
          },
          _sum: {
            amount: true,
          },
        }),

        // Count pending creation requests
        prisma.request.count({
          where: {
            type: RequestType.PERSONAL_SAVINGS_CREATION,
            status: {
              in: [
                RequestStatus.PENDING,
                RequestStatus.IN_REVIEW,
                RequestStatus.REVIEWED,
              ],
            },
          },
        }),

        // Count pending withdrawal requests
        prisma.request.count({
          where: {
            type: RequestType.PERSONAL_SAVINGS_WITHDRAWAL,
            status: {
              in: [
                RequestStatus.PENDING,
                RequestStatus.IN_REVIEW,
                RequestStatus.REVIEWED,
                RequestStatus.APPROVED,
              ],
            },
          },
        }),

        // Get recent transactions
        prisma.transaction.findMany({
          where: {
            module: TransactionModule.SAVINGS,
            transactionType: {
              in: [
                TransactionType.PERSONAL_SAVINGS_DEPOSIT,
                TransactionType.PERSONAL_SAVINGS_WITHDRAWAL,
              ],
            },
          },
          include: {
            personalSavings: {
              include: {
                member: {
                  select: {
                    fullName: true,
                    department: true,
                  },
                },
                planType: {
                  select: {
                    name: true,
                    description: true,
                  },
                },
              },
            },
            initiator: {
              select: {
                username: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
      ]);

      // Format transactions for the response
      const formattedTransactions = recentTransactions.map((tx) => ({
        id: tx.id,
        amount: tx.amount,
        transactionType: tx.transactionType,
        transactionBaseType: tx.baseType,
        status: tx.status,
        date: tx.createdAt,
        memberName: tx.personalSavings?.member?.fullName || "Unknown",
        department: tx.personalSavings?.member?.department || "Unknown",
        planName: tx.personalSavings?.planName || "Unnamed Plan",
        planDescription:
          tx.personalSavings?.planType?.description || "No description",
        initiator: tx.initiator?.username || "System",
      }));

      return {
        activePlansCount: totalActivePlans,
        totalSavingsAmount: Number(totalSavingsAmount._sum.currentBalance || 0),
        totalWithdrawalAmount: Number(totalWithdrawalAmount._sum.amount || 0),
        pendingCreationRequests: totalPendingCreationRequests,
        pendingWithdrawalRequests: totalPendingWithdrawalRequests,
        recentTransactions: formattedTransactions,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      logger.error(`Error getting admin dashboard data: ${errorMessage}`, {
        error,
      });
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError("Failed to get admin dashboard data", 500);
    }
  }

  /**
   * Get all available personal savings plan types
   * Returns active plan types that members can use when creating new savings plans
   */
  async getPersonalSavingsPlans(): Promise<
    {
      id: string;
      name: string;
      description: string | null;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    }[]
  > {
    try {
      // Fetch only active plan types
      const planTypes = await prisma.personalSavingsPlan.findMany({
        where: {
          isActive: true,
        },
        orderBy: {
          name: "asc",
        },
      });

      return planTypes;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      logger.error(
        `Error fetching personal savings plan types: ${errorMessage}`,
        { error }
      );
      throw new ApiError("Failed to fetch personal savings plan types", 500);
    }
  }
}
