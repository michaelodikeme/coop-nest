import {
  RequestType,
  RequestStatus,
  RequestModule,
  ApprovalStatus,
  TransactionType,
  TransactionStatus,
  TransactionModule,
} from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { SavingsError, SavingsErrorCodes } from "../errors/savings.error";
import { TransactionService } from "../../transaction/services/transaction.service";
import { formatCurrency } from "../../../utils/formatters";
import logger from "../../../utils/logger";
import { v4 as uuidv4 } from "uuid";
import {
  WithdrawalRequestInput,
  WithdrawalQueryParams,
  UpdateWithdrawalStatusInput,
} from "../interfaces/withdrawal.interface";
import { SavingsTransactionProcessor } from "../../transaction/services/processors/savings-transaction.processor";
import { prisma } from "../../../utils/prisma";

class SavingsWithdrawalService {
  private transactionService: TransactionService;

  constructor() {
    this.transactionService = new TransactionService();
  }

  private isPersonalSavingsWithdrawal(data: WithdrawalRequestInput): boolean {
    return !!data.personalSavingsId;
  }

  private async checkActiveLoan(biodataId: string): Promise<boolean> {
    const activeLoan = await prisma.loan.findFirst({
      where: {
        memberId: biodataId,
        status: "ACTIVE",
      },
    });

    return activeLoan === null;
  }

  private async checkYearlyWithdrawalLimit(
    biodataId: string,
    isPersonalSavings: boolean
  ): Promise<boolean> {
    if (isPersonalSavings) {
      return true;
    }
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);

    const withdrawalsThisYear = await prisma.request.count({
      where: {
        biodataId,
        type: RequestType.SAVINGS_WITHDRAWAL,
        savingsId: { not: null },
        personalSavingsId: null,
        createdAt: {
          gte: startOfYear,
        },
        status: {
          in: [
            RequestStatus.PENDING,
            RequestStatus.IN_REVIEW,
            RequestStatus.APPROVED,
            RequestStatus.COMPLETED,  // FIXED: Must count completed withdrawals!
          ],
        },
      },
    });

    return withdrawalsThisYear === 0;
  }

  private async validateWithdrawalAmount(
    biodataId: string,
    amount: number,
    isPersonalSavings: boolean,
    savingsId?: string,
    personalSavingsId?: string
  ): Promise<void> {
    try {
      let balance: Decimal;
      let recordType: string;

      if (isPersonalSavings && personalSavingsId) {
        const personalSavings = await prisma.personalSavings.findUnique({
          where: { id: personalSavingsId },
        });

        if (!personalSavings) {
          throw new SavingsError(
            SavingsErrorCodes.REQUEST_NOT_FOUND,
            "Personal savings record not found",
            400
          );
        }

        balance = personalSavings.currentBalance;
        recordType = "personal savings";
      } else {
        const latestSavings = await prisma.savings.findFirst({
          where: {
            memberId: biodataId,
            status: "ACTIVE",
          },
          orderBy: [{ year: "desc" }, { month: "desc" }],
        });

        if (!latestSavings) {
          throw new SavingsError(
            SavingsErrorCodes.INSUFFICIENT_BALANCE,
            "No active savings record found",
            400
          );
        }

        // Use totalSavingsAmount for withdrawal validation (cumulative total, not monthly balance)
        balance = latestSavings.totalSavingsAmount;
        recordType = "savings";
      }

      const maxPercentage = isPersonalSavings ? 1.0 : 0.8;
      const percentageText = isPersonalSavings ? "100%" : "80%";
      const maxWithdrawalAmount = balance.mul(maxPercentage);

      const activeRegularLoan = await prisma.loan.findFirst({
        where: {
          memberId: biodataId,
          remainingBalance: { gt: 0 },
          loanType: {
            name: { contains: "Regular", mode: "insensitive" },
          },
        },
      });

      if (activeRegularLoan) {
        throw new SavingsError(
          SavingsErrorCodes.ACTIVE_LOAN_EXISTS,
          "Cannot withdraw while you have unpaid regular loans",
          400
        );
      }

      if (new Decimal(amount).gt(maxWithdrawalAmount)) {
        throw new SavingsError(
          SavingsErrorCodes.WITHDRAWAL_LIMIT_EXCEEDED,
          `Maximum withdrawal amount is ${formatCurrency(
            maxWithdrawalAmount
          )} (${percentageText} of available ${recordType} balance)`,
          400
        );
      }

      if (new Decimal(amount).gt(balance)) {
        throw new SavingsError(
          SavingsErrorCodes.INSUFFICIENT_BALANCE,
          `Withdrawal amount exceeds available ${recordType} balance of ${formatCurrency(
            balance
          )}`,
          400
        );
      }
    } catch (error) {
      if (error instanceof SavingsError) {
        throw error;
      }

      logger.error("Error validating withdrawal amount:", error);
      throw new SavingsError(
        SavingsErrorCodes.VALIDATION_ERROR,
        "Could not validate withdrawal amount",
        500
      );
    }
  }

  async createWithdrawalRequest(data: WithdrawalRequestInput) {
    try {
      const isPersonalSavings = this.isPersonalSavingsWithdrawal(data);

      const canWithdrawDueToLoan = await this.checkActiveLoan(data.biodataId);
      if (!canWithdrawDueToLoan) {
        throw new SavingsError(
          SavingsErrorCodes.ACTIVE_LOAN_EXISTS,
          "Cannot process withdrawal request. You have an active loan that must be cleared first.",
          400
        );
      }

      const canWithdraw = await this.checkYearlyWithdrawalLimit(
        data.biodataId,
        isPersonalSavings
      );
      if (!canWithdraw) {
        throw new SavingsError(
          SavingsErrorCodes.WITHDRAWAL_LIMIT_EXCEEDED,
          "You can only make one savings withdrawal request per year",
          400
        );
      }

      await this.validateWithdrawalAmount(
        data.biodataId,
        data.amount,
        isPersonalSavings,
        data.savingsId,
        data.personalSavingsId
      );

      const member = await prisma.biodata.findUnique({
        where: { id: data.biodataId },
      });

      if (!member) {
        throw new SavingsError(
          SavingsErrorCodes.MEMBER_NOT_FOUND,
          "Member profile not found",
          404
        );
      }

      let savingsData: any;
      let savingsRecordId: string;
      let balance: Decimal;

      if (isPersonalSavings && data.personalSavingsId) {
        const personalSavings = await prisma.personalSavings.findUnique({
          where: { id: data.personalSavingsId },
          include: { planType: true },
        });

        if (!personalSavings) {
          throw new SavingsError(
            SavingsErrorCodes.INSUFFICIENT_BALANCE,
            "Personal savings record not found",
            400
          );
        }

        savingsData = personalSavings;
        savingsRecordId = personalSavings.id;
        balance = personalSavings.currentBalance;
      } else {
        const latestSavings = await prisma.savings.findFirst({
          where: {
            memberId: data.biodataId,
            status: "ACTIVE",
          },
          orderBy: [{ year: "desc" }, { month: "desc" }],
        });

        if (!latestSavings) {
          throw new SavingsError(
            SavingsErrorCodes.INSUFFICIENT_BALANCE,
            "No active savings record found",
            400
          );
        }

        savingsData = latestSavings;
        savingsRecordId = latestSavings.id;
        // Use totalSavingsAmount for withdrawal (cumulative total, not monthly balance)
        balance = latestSavings.totalSavingsAmount;
      }

      const withdrawalRequest = await prisma.$transaction(async (tx) => {
        const approvalSteps = [
          {
            level: 1,
            status: ApprovalStatus.PENDING,
            approverRole: "TREASURER",
            notes: "Financial verification and review",
          },
          {
            level: 2,
            status: ApprovalStatus.PENDING,
            approverRole: "CHAIRMAN",
            notes: "Final approval required",
          },
          {
            level: 3,
            status: ApprovalStatus.PENDING,
            approverRole: "TREASURER",
            notes: "Final review and disbursement",
          },
        ];

        const requestData: any = {
          id: uuidv4(),
          type: isPersonalSavings ? RequestType.PERSONAL_SAVINGS_WITHDRAWAL : RequestType.SAVINGS_WITHDRAWAL,
          module: RequestModule.SAVINGS,
          status: RequestStatus.PENDING,
          biodataId: data.biodataId,
          initiatorId: data.userId,
          nextApprovalLevel: 1,
          content: {
            amount: data.amount.toString(),
            reason: data.reason,
            erpId: data.erpId,
            requestDate: new Date().toISOString(),
            withdrawalType: isPersonalSavings ? "PERSONAL_SAVINGS" : "SAVINGS",
          },
          metadata: {
            member: {
              id: member.id,
              erpId: member.erpId,
              fullName: member.fullName,
              department: member.department,
            },
          },
        };

        if (isPersonalSavings) {
          requestData.personalSavingsId = savingsRecordId;
          requestData.metadata.personalSavings = {
            id: savingsRecordId,
            currentBalance: balance.toString(),
            planName:
              savingsData.planName || savingsData.planType?.name || "Unknown",
            remainingBalance: new Decimal(balance)
              .minus(data.amount)
              .toString(),
          };
        } else {
          requestData.savingsId = savingsRecordId;
          requestData.metadata.savings = {
            id: savingsRecordId,
            currentBalance: balance.toString(),
            totalSavings: savingsData.totalSavingsAmount?.toString() || "0",
            remainingBalance: new Decimal(balance)
              .minus(data.amount)
              .toString(),
          };
        }

        const request = await tx.request.create({
          data: {
            ...requestData,
            approvalSteps: {
              create: approvalSteps,
            },
          },
          include: {
            approvalSteps: true,
            biodata: {
              select: {
                fullName: true,
                department: true,
                erpId: true,
              },
            },
          },
        });

        const withdrawalTypeText = isPersonalSavings
          ? "personal savings"
          : "savings";
        await tx.notification.create({
          data: {
            userId: data.userId,
            type: "REQUEST_UPDATE",
            title: `${
              isPersonalSavings ? "Personal Savings " : ""
            }Withdrawal Request Submitted`,
            message: `Your ${withdrawalTypeText} withdrawal request of ${formatCurrency(
              data.amount
            )} has been submitted and is pending review.`,
            metadata: {
              requestId: request.id,
              amount: data.amount,
              status: "PENDING",
              withdrawalType: isPersonalSavings
                ? "PERSONAL_SAVINGS"
                : "SAVINGS",
            },
          },
        });

        return request;
      });

      return withdrawalRequest;
    } catch (error) {
      logger.error("Error creating withdrawal request:", error);
      if (error instanceof SavingsError) {
        throw error;
      }
      throw new SavingsError(
        SavingsErrorCodes.REQUEST_CREATION_FAILED,
        "Failed to create withdrawal request",
        500
      );
    }
  }

  async updateWithdrawalStatus(data: UpdateWithdrawalStatusInput) {
    try {
      const initialRequest = await prisma.request.findUnique({
        where: { id: data.withdrawalId },
      });

      if (!initialRequest) {
        throw new SavingsError(
          SavingsErrorCodes.REQUEST_NOT_FOUND,
          "Withdrawal request not found",
          404
        );
      }

      if (
        initialRequest.status === RequestStatus.REJECTED &&
        data.status !== RequestStatus.REJECTED
      ) {
        await prisma.$transaction(async (tx) => {
          await tx.requestApproval.updateMany({
            where: { requestId: initialRequest.id },
            data: {
              status: ApprovalStatus.PENDING,
              approverId: null,
              notes: "Reset for re-approval.",
              approvedAt: null,
            },
          });

          await tx.request.update({
            where: { id: initialRequest.id },
            data: {
              status: RequestStatus.PENDING,
              nextApprovalLevel: 1,
              completedAt: null,
              approverId: null,
            },
          });
        });
      }

      return await prisma.$transaction(async (tx) => {
        const withdrawalRequest = await tx.request.findFirst({
          where: {
            id: data.withdrawalId,
          },
          include: {
            biodata: true,
            savings: true,
            personalSavings: true,
            approvalSteps: {
              orderBy: { level: "asc" },
            },
          },
        });

        if (!withdrawalRequest) {
          throw new SavingsError(
            SavingsErrorCodes.REQUEST_NOT_FOUND,
            "Withdrawal request not found after potential reset.",
            404
          );
        }

        const currentApprovalStep = withdrawalRequest.approvalSteps.find(
          (step) => step.status === ApprovalStatus.PENDING
        );

        if (!currentApprovalStep) {
          throw new SavingsError(
            SavingsErrorCodes.INVALID_STATUS_TRANSITION,
            "No pending approval steps found. The request might be fully processed or in an inconsistent state.",
            400
          );
        }

        if (withdrawalRequest.nextApprovalLevel !== currentApprovalStep.level) {
          throw new SavingsError(
            SavingsErrorCodes.INVALID_STATUS_TRANSITION,
            `Invalid approval level. Expected level ${withdrawalRequest.nextApprovalLevel}, found ${currentApprovalStep.level}`,
            400
          );
        }

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

        await tx.requestApproval.update({
          where: {
            requestId_level: {
              requestId: withdrawalRequest.id,
              level: currentApprovalStep.level,
            },
          },
          data: {
            status:
              data.status === RequestStatus.REJECTED
                ? ApprovalStatus.REJECTED
                : ApprovalStatus.APPROVED,
            approverId: data.updatedBy,
            notes: data.notes,
            approvedAt: new Date(),
          },
        });

        const updatedData: any = {
          status: data.status,
          approverId: data.updatedBy,
        };

        if (data.status === RequestStatus.REJECTED) {
          updatedData.completedAt = new Date();
          updatedData.nextApprovalLevel = 1;
        } else if (data.status === RequestStatus.COMPLETED) {
          updatedData.completedAt = new Date();
          updatedData.nextApprovalLevel = withdrawalRequest.nextApprovalLevel;
        } else {
          updatedData.nextApprovalLevel =
            withdrawalRequest.nextApprovalLevel + 1;
        }

        const updatedRequest = await tx.request.update({
          where: { id: withdrawalRequest.id },
          data: updatedData,
          include: {
            biodata: true,
            savings: true,
            personalSavings: true,
            approvalSteps: {
              orderBy: { level: "asc" },
            },
          },
        });

        switch (data.status) {
          case RequestStatus.IN_REVIEW:
            if (currentApprovalStep.level === 1) {
              await this.handleInReviewTransition(tx, updatedRequest, data);
            }
            break;

          case RequestStatus.APPROVED:
            if (currentApprovalStep.level === 2) {
              await this.handleApprovalTransition(tx, updatedRequest, data);
            }
            break;

          case RequestStatus.COMPLETED:
            if (currentApprovalStep.level === 3) {
              await this.handleCompletionTransition(tx, updatedRequest, data);
            }
            break;

          case RequestStatus.REJECTED:
            await this.handleRejectionTransition(tx, updatedRequest, data);
            break;
        }

        return updatedRequest;
      });
    } catch (error) {
      logger.error("Error updating withdrawal status:", error);
      if (error instanceof SavingsError) {
        throw error;
      }
      throw new SavingsError(
        SavingsErrorCodes.STATUS_UPDATE_FAILED,
        "Failed to update withdrawal request status",
        500
      );
    }
  }

  private getValidStatusTransitions(
    currentStatus: RequestStatus,
    approvalLevel: number
  ): RequestStatus[] {
    const transitions: Record<
      RequestStatus,
      Record<number, RequestStatus[]>
    > = {
      PENDING: {
        1: [RequestStatus.IN_REVIEW, RequestStatus.REJECTED],
      },
      IN_REVIEW: {
        2: [RequestStatus.APPROVED, RequestStatus.REJECTED],
      },
      APPROVED: {
        3: [RequestStatus.COMPLETED, RequestStatus.REJECTED],
      },
      REVIEWED: {},
      REJECTED: {},
      COMPLETED: {},
      CANCELLED: {},
    };

    return transitions[currentStatus]?.[approvalLevel] || [];
  }

  private async handleInReviewTransition(
    tx: any,
    request: any,
    data: UpdateWithdrawalStatusInput
  ) {
    const nextStep = request.approvalSteps.find(
      (step: any) => step.level === 2
    );

    if (nextStep) {
      await tx.notification.create({
        data: {
          userId: request.initiatorId,
          type: "REQUEST_UPDATE",
          title: "Withdrawal Request In Review",
          message: `Your withdrawal request is now being reviewed by the Chairman.`,
          requestId: request.id,
          metadata: {
            status: "IN_REVIEW",
            currentApprovalLevel: request.nextApprovalLevel,
            nextApprovalRole: nextStep.approverRole,
          },
        },
      });
    }
  }

  private async handleApprovalTransition(
    tx: any,
    request: any,
    data: UpdateWithdrawalStatusInput
  ) {
    await tx.notification.create({
      data: {
        userId: request.initiatorId,
        type: "REQUEST_UPDATE",
        title: "Withdrawal Request Approved",
        message: `Your withdrawal request has been approved by the Chairman and is awaiting final processing.`,
        requestId: request.id,
        metadata: {
          status: "APPROVED",
          amount: (request.content as any).amount,
        },
      },
    });
  }

  private async handleCompletionTransition(
    tx: any,
    request: any,
    data: UpdateWithdrawalStatusInput
  ) {
    const content = request.content || {};
    const amount = new Decimal((content as any).amount || "0");

    let currentBalance: Decimal;
    let savingsRecordId: string;
    let transactionType: TransactionType;
    let relatedEntityType: "SAVINGS" | "PERSONAL_SAVINGS";

    if (request.personalSavingsId && request.personalSavings) {
      currentBalance = request.personalSavings.currentBalance;
      savingsRecordId = request.personalSavings.id;
      transactionType = TransactionType.PERSONAL_SAVINGS_WITHDRAWAL;
      relatedEntityType = "PERSONAL_SAVINGS";
    } else if (request.savingsId && request.savings) {
      // Use totalSavingsAmount for withdrawal (cumulative total, not monthly balance)
      currentBalance = request.savings.totalSavingsAmount;
      savingsRecordId = request.savings.id;
      transactionType = TransactionType.SAVINGS_WITHDRAWAL;
      relatedEntityType = "SAVINGS";
    } else {
      throw new SavingsError(
        SavingsErrorCodes.REQUEST_CREATION_FAILED,
        "Savings record not found for withdrawal",
        400
      );
    }

    if (currentBalance.lessThan(amount)) {
      throw new SavingsError(
        SavingsErrorCodes.INSUFFICIENT_BALANCE,
        `Insufficient balance. Available: ${formatCurrency(currentBalance)}`,
        400
      );
    }

    logger.debug("Creating withdrawal transaction", {
      savingsRecordId,
      amount: amount.toString(),
      requestId: request.id,
      transactionType,
    });

    const transaction = await this.transactionService.createTransactionWithTx(
      tx,
      {
        transactionType: transactionType,
        module: TransactionModule.SAVINGS,
        amount: amount.negated(),
        balanceAfter: currentBalance.minus(amount),
        description: `Withdrawal: ${
          (request.content as any)?.reason || "No reason provided"
        }`,
        relatedEntityType: relatedEntityType,
        relatedEntityId: savingsRecordId,
        initiatedBy: data.updatedBy,
        requestId: request.id,
        autoComplete: true,
        metadata: {
          reason: (request.content as any)?.reason || "No reason provided",
          erpId: request.biodata?.erpId || "Unknown",
          memberName: request.biodata?.fullName || "Unknown Member",
          withdrawalType:
            relatedEntityType === "PERSONAL_SAVINGS"
              ? "PERSONAL_SAVINGS"
              : "SAVINGS",
        },
      }
    );

    await tx.request.update({
      where: { id: request.id },
      data: {
        transactions: {
          connect: { id: transaction.id },
        },
        ...(relatedEntityType === "PERSONAL_SAVINGS" && {
          personalSavings: { connect: { id: savingsRecordId } },
        }),
      },
    });

    const processor = new SavingsTransactionProcessor();
    await processor.processTransaction(transaction, tx);

    await tx.notification.create({
      data: {
        userId: request.initiatorId,
        type: "TRANSACTION",
        title: "Withdrawal Completed",
        message: `Your withdrawal request for ${formatCurrency(
          amount
        )} has been processed and completed.`,
        transactionId: transaction.id,
        metadata: {
          amount: amount.toString(),
          requestId: request.id,
          transactionId: transaction.id,
          withdrawalType:
            relatedEntityType === "PERSONAL_SAVINGS"
              ? "PERSONAL_SAVINGS"
              : "SAVINGS",
        },
      },
    });
  }

  private async handleRejectionTransition(
    tx: any,
    request: any,
    data: UpdateWithdrawalStatusInput
  ) {
    await tx.notification.create({
      data: {
        userId: request.initiatorId,
        type: "REQUEST_UPDATE",
        title: "Withdrawal Request Rejected",
        message: `Your withdrawal request for ${formatCurrency(
          new Decimal((request.content as any)?.amount || "0")
        )} has been rejected. Reason: ${data.notes || "No reason provided"}`,
        requestId: request.id,
        metadata: {
          status: "REJECTED",
          reason: data.notes,
          requestId: request.id,
          rejectedBy: data.updatedBy,
          rejectionLevel: request.nextApprovalLevel,
        },
      },
    });
  }

  async getWithdrawalRequests(params: WithdrawalQueryParams) {
    try {
      const {
        biodataId,
        status,
        startDate,
        endDate,
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = params;

      const whereConditions: any = {
        type: {
          in: [
            RequestType.SAVINGS_WITHDRAWAL,
            RequestType.PERSONAL_SAVINGS_WITHDRAWAL,
          ],
        },
      };

      if (biodataId && biodataId.trim() !== "") {
        whereConditions.biodataId = biodataId;
      }

      if (status) {
        whereConditions.status = status;
      }

      if (startDate || endDate) {
        whereConditions.createdAt = {};

        if (startDate) {
          whereConditions.createdAt.gte = startDate;
        }

        if (endDate) {
          whereConditions.createdAt.lte = endDate;
        }
      }

      const orderBy: any = {};
      orderBy[sortBy] = sortOrder;

      const [total, requests] = await Promise.all([
        prisma.request.count({ where: whereConditions }),
        prisma.request.findMany({
          where: whereConditions,
          include: {
            biodata: {
              select: {
                fullName: true,
                department: true,
                erpId: true,
              },
            },
            transactions: {
              where: {
                transactionType: {
                  in: [
                    TransactionType.SAVINGS_WITHDRAWAL,
                    TransactionType.PERSONAL_SAVINGS_WITHDRAWAL,
                  ],
                },
              },
              take: 1,
              include: {
                initiator: {
                  select: {
                    username: true,
                    adminProfile: {
                      select: {
                        firstName: true,
                      },
                    },
                    biodata: {
                      select: {
                        firstName: true,
                        lastName: true,
                      },
                    },
                  },
                },
                approver: {
                  select: {
                    username: true,
                    adminProfile: {
                      select: {
                        firstName: true,
                      },
                    },
                    biodata: {
                      select: {
                        firstName: true,
                        lastName: true,
                      },
                    },
                  },
                },
              },
            },
            approvalSteps: {
              orderBy: {
                level: "asc",
              },
              include: {
                approver: {
                  select: {
                    id: true,
                    username: true,
                    adminProfile: {
                      select: {
                        firstName: true,
                        lastName: true,
                      },
                    },
                    biodata: {
                      select: {
                        firstName: true,
                        lastName: true,
                      },
                    },
                  },
                },
              },
            },
            savings: {
              select: {
                balance: true,
                totalSavingsAmount: true,
              },
            },
            personalSavings: {
              select: {
                currentBalance: true,
                planName: true,
                planType: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            initiator: {
              select: {
                id: true,
                username: true,
                adminProfile: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
                biodata: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
            approver: {
              select: {
                id: true,
                username: true,
                adminProfile: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
                biodata: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
        }),
      ]);

      const formattedRequests = requests.map((request) => {
        const content = request.content as any;
        const initiator = (request as any).initiator;
        const initiatorFirstName =
          initiator?.adminProfile?.firstName ||
          initiator?.biodata?.firstName ||
          null;
        const initiatorLastName =
          initiator?.adminProfile?.lastName ||
          initiator?.biodata?.lastName ||
          null;

        let savingsInfo = null;
        if (
          request.type === RequestType.PERSONAL_SAVINGS_WITHDRAWAL &&
          (request as any).personalSavings
        ) {
          const personalSavings = (request as any).personalSavings;
          const currentBalanceNum = Number(personalSavings.currentBalance);
          const withdrawalAmount = Number(content.amount || 0);

          // If withdrawal is COMPLETED, currentBalance has already been reduced
          // So don't subtract the withdrawal amount again
          const remainingBalanceNum = request.status === RequestStatus.COMPLETED
            ? currentBalanceNum
            : currentBalanceNum - withdrawalAmount;

          savingsInfo = {
            type: "personal",
            currentBalance: {
              formatted: formatCurrency(currentBalanceNum),
              raw: currentBalanceNum
            },
            totalSavings: {
              formatted: formatCurrency(currentBalanceNum),
              raw: currentBalanceNum
            },
            planName:
              personalSavings.planName ||
              personalSavings.planType?.name ||
              null,
            remainingBalance: {
              formatted: formatCurrency(remainingBalanceNum),
              raw: remainingBalanceNum
            }
          };
        } else if (
          request.type === RequestType.SAVINGS_WITHDRAWAL &&
          (request as any).savings
        ) {
          const savings = (request as any).savings;
          const currentBalanceNum = Number(savings.balance);
          const totalSavingsNum = Number(savings.totalSavingsAmount);
          const withdrawalAmount = Number(content.amount || 0);

          // If withdrawal is COMPLETED, totalSavingsAmount has already been reduced
          // So don't subtract the withdrawal amount again
          const remainingBalanceNum = request.status === RequestStatus.COMPLETED
            ? totalSavingsNum
            : totalSavingsNum - withdrawalAmount;

          savingsInfo = {
            type: "regular",
            currentBalance: {
              formatted: formatCurrency(currentBalanceNum),
              raw: currentBalanceNum
            },
            totalSavings: {
              formatted: formatCurrency(totalSavingsNum),
              raw: totalSavingsNum
            },
            remainingBalance: {
              formatted: formatCurrency(remainingBalanceNum),
              raw: remainingBalanceNum
            }
          };
        }

        let transactionInfo = null;
        if (request.transactions.length > 0) {
          const transaction = request.transactions[0];
          const txInitiatorFirstName =
            transaction.initiator?.adminProfile?.firstName ||
            transaction.initiator?.biodata?.firstName ||
            null;
          const txApproverFirstName =
            transaction.approver?.adminProfile?.firstName ||
            transaction.approver?.biodata?.firstName ||
            null;

          transactionInfo = {
            id: transaction.id,
            type: transaction.transactionType,
            status: transaction.status,
            amount: formatCurrency(transaction.amount),
            date: transaction.createdAt,
            initiator: transaction.initiator
              ? {
                  username: transaction.initiator.username,
                  firstName: txInitiatorFirstName,
                }
              : null,
            approver: transaction.approver
              ? {
                  username: transaction.approver.username,
                  firstName: txApproverFirstName,
                }
              : null,
          };
        }

        const formattedApprovalSteps = request.approvalSteps.map((step) => {
          const approverFirstName =
            step.approver?.adminProfile?.firstName ||
            step.approver?.biodata?.firstName ||
            null;
          const approverLastName =
            step.approver?.adminProfile?.lastName ||
            step.approver?.biodata?.lastName ||
            null;

          return {
            level: step.level,
            role: step.approverRole,
            status: step.status,
            approver: step.approver
              ? {
                  id: step.approver.id,
                  username: step.approver.username,
                  firstName: approverFirstName,
                  lastName: approverLastName,
                }
              : null,
            approvedAt: step.approvedAt,
            notes: step.notes,
          };
        });

        const approverFirstName =
          request.approver?.adminProfile?.firstName ||
          request.approver?.biodata?.firstName ||
          null;
        const approverLastName =
          request.approver?.adminProfile?.lastName ||
          request.approver?.biodata?.lastName ||
          null;

        return {
          id: request.id,
          type: request.type,
          biodataId: request.biodataId,
          status: request.status,
          amount: formatCurrency(content.amount),
          rawAmount: content.amount,
          reason: content.reason,
          member: request.biodata
            ? {
                name: request.biodata.fullName,
                department: request.biodata.department,
                erpId: request.biodata.erpId,
              }
            : null,
          requestDate: request.createdAt,
          completedAt: request.completedAt,
          currentApprovalLevel: request.nextApprovalLevel,
          approvalSteps: formattedApprovalSteps,
          transaction: transactionInfo,
          savings: savingsInfo,
          initiator: request.initiator
            ? {
                id: request.initiator.id,
                username: request.initiator.username,
                firstName: initiatorFirstName,
                lastName: initiatorLastName,
              }
            : null,
          approver: request.approver
            ? {
                id: request.approver.id,
                username: request.approver.username,
                firstName: approverFirstName,
                lastName: approverLastName,
              }
            : null,
        };
      });

      return {
        data: formattedRequests,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error("Error fetching withdrawal requests:", error);
      throw new SavingsError(
        SavingsErrorCodes.FETCH_ERROR,
        "Failed to fetch withdrawal requests",
        500
      );
    }
  }

  async getWithdrawalRequestById(requestId: string) {
    try {
      const request = await prisma.request.findFirst({
        where: {
          id: requestId,
          type: {
            in: [
              RequestType.SAVINGS_WITHDRAWAL,
              RequestType.PERSONAL_SAVINGS_WITHDRAWAL,
            ],
          },
        },
        include: {
          biodata: {
            select: {
              id: true,
              fullName: true,
              department: true,
              erpId: true,
              emailAddress: true,
              phoneNumber: true,
            },
          },
          transactions: {
            where: {
              transactionType: {
                in: [
                  TransactionType.SAVINGS_WITHDRAWAL,
                  TransactionType.PERSONAL_SAVINGS_WITHDRAWAL,
                ],
              },
            },
            include: {
              initiator: {
                select: {
                  id: true,
                  username: true,
                  biodata: true,
                  adminProfile: {
                    select: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
              approver: {
                select: {
                  id: true,
                  username: true,
                  adminProfile: true,
                  biodata: {
                    select: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
          },
          approvalSteps: {
            orderBy: {
              level: "asc",
            },
            include: {
              approver: {
                select: {
                  id: true,
                  username: true,
                  adminProfile: true,
                  biodata: {
                    select: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
          },
          savings: {
            select: {
              id: true,
              balance: true,
              totalSavingsAmount: true,
              monthlyTarget: true,
            },
          },
          personalSavings: {
            select: {
              id: true,
              currentBalance: true,
              planName: true,
              targetAmount: true,
              planType: {
                select: {
                  name: true,
                },
              },
            },
          },
          initiator: {
            select: {
              id: true,
              username: true,
              biodata: true,
              adminProfile: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          approver: {
            select: {
              id: true,
              username: true,
              adminProfile: true,
              biodata: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

      if (!request) {
        throw new SavingsError(
          SavingsErrorCodes.REQUEST_NOT_FOUND,
          "Withdrawal request not found",
          404
        );
      }

      const requestWithRelations = request as any;
      const content = request.content as any;

      const initiatorFirstName =
        requestWithRelations.initiator?.adminProfile?.firstName ||
        requestWithRelations.initiator?.biodata?.firstName ||
        null;
      const initiatorLastName =
        requestWithRelations.initiator?.adminProfile?.lastName ||
        requestWithRelations.initiator?.biodata?.lastName ||
        null;

      let savingsInfo = null;
      if (request.type === RequestType.PERSONAL_SAVINGS_WITHDRAWAL && requestWithRelations.personalSavings) {
        const personalSavings = requestWithRelations.personalSavings;
        const currentBalanceNum = Number(personalSavings.currentBalance);
        const withdrawalAmount = Number(content.amount || 0);

        // If withdrawal is COMPLETED, currentBalance has already been reduced
        // So don't subtract the withdrawal amount again
        const remainingBalanceNum = request.status === RequestStatus.COMPLETED
          ? currentBalanceNum
          : currentBalanceNum - withdrawalAmount;

        savingsInfo = {
          type: 'personal',
          id: personalSavings.id,
          currentBalance: {
            formatted: formatCurrency(currentBalanceNum),
            raw: currentBalanceNum
          },
          totalSavings: {
            formatted: formatCurrency(currentBalanceNum),
            raw: currentBalanceNum
          },
          planName: personalSavings.planName || personalSavings.planType?.name || null,
          targetAmount: personalSavings.targetAmount ? {
            formatted: formatCurrency(Number(personalSavings.targetAmount)),
            raw: Number(personalSavings.targetAmount)
          } : null,
          remainingBalance: {
            formatted: formatCurrency(remainingBalanceNum),
            raw: remainingBalanceNum
          }
        };
      } else if (request.type === RequestType.SAVINGS_WITHDRAWAL && requestWithRelations.savings) {
        const savings = requestWithRelations.savings;
        const currentBalanceNum = Number(savings.balance);
        const totalSavingsNum = Number(savings.totalSavingsAmount);
        const withdrawalAmount = Number(content.amount || 0);

        // If withdrawal is COMPLETED, totalSavingsAmount has already been reduced
        // So don't subtract the withdrawal amount again
        const remainingBalanceNum = request.status === RequestStatus.COMPLETED
          ? totalSavingsNum
          : totalSavingsNum - withdrawalAmount;

        savingsInfo = {
          type: 'regular',
          id: savings.id,
          currentBalance: {
            formatted: formatCurrency(currentBalanceNum),
            raw: currentBalanceNum
          },
          totalSavings: {
            formatted: formatCurrency(totalSavingsNum),
            raw: totalSavingsNum
          },
          monthlyTarget: {
            formatted: formatCurrency(Number(savings.monthlyTarget)),
            raw: Number(savings.monthlyTarget)
          },
          remainingBalance: {
            formatted: formatCurrency(remainingBalanceNum),
            raw: remainingBalanceNum
          }
        };
      }

      let transactionInfo = null;
      if (
        requestWithRelations.transactions &&
        requestWithRelations.transactions.length > 0
      ) {
        const transaction = requestWithRelations.transactions[0];
        const txInitiatorFirstName =
          transaction.initiator?.adminProfile?.firstName ||
          transaction.initiator?.biodata?.firstName ||
          null;
        const txApproverFirstName =
          transaction.approver?.adminProfile?.firstName ||
          transaction.approver?.biodata?.firstName ||
          null;

        transactionInfo = {
          id: transaction.id,
          type: transaction.transactionType,
          status: transaction.status,
          amount: formatCurrency(transaction.amount),
          date: transaction.createdAt,
          initiator: transaction.initiator
            ? {
                id: transaction.initiator.id,
                username: transaction.initiator.username,
                firstName: txInitiatorFirstName,
              }
            : null,
          approver: transaction.approver
            ? {
                id: transaction.approver.id,
                username: transaction.approver.username,
                firstName: txApproverFirstName,
              }
            : null,
        };
      }

      const formattedApprovalSteps = (
        requestWithRelations.approvalSteps || []
      ).map((step: any) => {
        const approverFirstName =
          step.approver?.adminProfile?.firstName ||
          step.approver?.biodata?.firstName ||
          null;

        return {
          level: step.level,
          role: step.approverRole,
          status: step.status,
          approver: step.approver
            ? {
                id: step.approver.id,
                username: step.approver.username,
                firstName: approverFirstName,
              }
            : null,
          approvedAt: step.approvedAt,
          notes: step.notes,
        };
      });

      const approverFirstName =
        requestWithRelations.approver?.adminProfile?.firstName ||
        requestWithRelations.approver?.biodata?.firstName ||
        null;
      const approverLastName =
        requestWithRelations.approver?.adminProfile?.lastName ||
        requestWithRelations.approver?.biodata?.lastName ||
        null;

      return {
        id: request.id,
        type: request.type,
        status: request.status,
        amount: {
          formatted: formatCurrency(content.amount),
          raw: content.amount,
        },
        reason: content.reason,
        requestDate: request.createdAt,
        completedAt: request.completedAt,
        member: requestWithRelations.biodata
          ? {
              id: requestWithRelations.biodata.id,
              name: requestWithRelations.biodata.fullName,
              department: requestWithRelations.biodata.department,
              erpId: requestWithRelations.biodata.erpId,
              email: requestWithRelations.biodata.emailAddress,
              phone: requestWithRelations.biodata.phoneNumber,
            }
          : null,
        currentApprovalLevel: request.nextApprovalLevel,
        approvalSteps: formattedApprovalSteps,
        transaction: transactionInfo,
        savings: savingsInfo,
        initiator: requestWithRelations.initiator
          ? {
              id: requestWithRelations.initiator.id,
              username: requestWithRelations.initiator.username,
              firstName: initiatorFirstName,
              lastName: initiatorLastName,
            }
          : null,
        approver: requestWithRelations.approver
          ? {
              id: requestWithRelations.approver.id,
              username: requestWithRelations.approver.username,
              firstName: approverFirstName,
              lastName: approverLastName,
            }
          : null,
        notes: request.notes,
      };
    } catch (error) {
      logger.error("Error fetching withdrawal request details:", error);
      if (error instanceof SavingsError) {
        throw error;
      }
      throw new SavingsError(
        SavingsErrorCodes.FETCH_ERROR,
        "Failed to fetch withdrawal request details",
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

      const whereConditions: any = {
        type: {
          in: [
            RequestType.SAVINGS_WITHDRAWAL,
            RequestType.PERSONAL_SAVINGS_WITHDRAWAL,
          ],
        },
      };

      if (biodataId) {
        whereConditions.biodataId = biodataId;
      }

      if (startDate || endDate) {
        whereConditions.createdAt = {};
        if (startDate) {
          whereConditions.createdAt.gte = startDate;
        }
        if (endDate) {
          whereConditions.createdAt.lte = endDate;
        }
      }

      const [
        total,
        pendingCount,
        approvedCount,
        rejectedCount,
        totalAmount,
      ] = await Promise.all([
        prisma.request.count({
          where: whereConditions,
        }),
        prisma.request.count({
          where: {
            ...whereConditions,
            status: { in: [RequestStatus.PENDING, RequestStatus.IN_REVIEW] },
          },
        }),
        prisma.request.count({
          where: {
            ...whereConditions,
            status: { in: [RequestStatus.APPROVED, RequestStatus.COMPLETED] },
          },
        }),
        prisma.request.count({
          where: {
            ...whereConditions,
            status: RequestStatus.REJECTED,
          },
        }),
        prisma.transaction.aggregate({
          where: {
            transactionType: {
              in: [
                TransactionType.SAVINGS_WITHDRAWAL,
                TransactionType.PERSONAL_SAVINGS_WITHDRAWAL,
              ],
            },
            status: TransactionStatus.COMPLETED,
            ...(biodataId && {
              request: {
                biodataId,
              },
            }),
            ...(startDate ||
              (endDate && {
                createdAt: {
                  ...(startDate && { gte: startDate }),
                  ...(endDate && { lte: endDate }),
                },
              })),
          },
          _sum: {
            amount: true,
          },
        }),
      ]);

      return {
        total,
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        totalAmount: totalAmount._sum.amount?.abs() || new Decimal(0),
        formattedTotalAmount: formatCurrency(
          totalAmount._sum.amount?.abs() || 0
        ),
      };
    } catch (error) {
      logger.error("Error fetching withdrawal statistics:", error);
      throw new SavingsError(
        SavingsErrorCodes.FETCH_ERROR,
        "Failed to fetch withdrawal statistics",
        500
      );
    }
  }
}

export default new SavingsWithdrawalService();
