import { PrismaClient, RequestStatus, RequestType, RequestModule } from '@prisma/client';
import { CreateRequestDTO, UpdateRequestDTO, FilterOptions } from '../types/request.types';
import { NotificationService } from './notificationService';
import { ApiError } from '../../../utils/apiError';
import logger from '../../../utils/logger';
import { Decimal } from 'decimal.js';

const prisma = new PrismaClient();
const notificationService = new NotificationService();

export class RequestService {
  async createRequest(data: CreateRequestDTO) {
    const { biodataId, type, details } = data;
    const userId = data.userId || '';

    try {
      // Validate that the biodata belongs to the user making the request
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { biodata: true }
      });

      if (!user || user.biodataId !== biodataId) {
        throw new ApiError('Unauthorized: User does not own this biodata', 403);
      }

      // Determine module based on type
      let module: RequestModule;
      switch (type) {
        case RequestType.LOAN_APPLICATION:
          module = RequestModule.LOAN;
          await this.validateLoanRequest(biodataId);
          break;
        case RequestType.SAVINGS_WITHDRAWAL:
          module = RequestModule.SAVINGS;
          await this.validateSavingsWithdrawal(biodataId, details);
          break;
        default:
          module = RequestModule.SYSTEM;
      }

      // Start a transaction for request creation and notification
      return await prisma.$transaction(async (tx) => {
        const request = await tx.request.create({
          data: {
            type,
            module,
            status: RequestStatus.PENDING,
            initiatorId: userId,
            biodataId: biodataId || undefined,
            content: details
          },
          include: {
            biodata: true,
            initiator: true
          }
        });

        // Create notification
        await notificationService.createRequestNotification(request);

        return request;
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Error creating request:', error);
      throw new ApiError(
        error instanceof Error ? error.message : 'Error creating request',
        500
      );
    }
  }

  private async validateLoanRequest(biodataId: string) {
    // Verify member has sufficient savings history
    const savings = await prisma.savings.findMany({
      where: { memberId: biodataId },
      orderBy: { createdAt: 'desc' },
      take: 6 // Last 6 months
    });

    if (savings.length < 6) {
      throw new ApiError('Insufficient savings history. Minimum 6 months required.', 400);
    }

    // Check for existing active loans
    const activeLoans = await prisma.loan.findFirst({
      where: {
        memberId: biodataId,
        status: {
          in: ['PENDING', 'APPROVED', 'DISBURSED', 'ACTIVE']
        }
      }
    });

    if (activeLoans) {
      throw new ApiError('Member has an active loan. Please settle existing loan before applying.', 400);
    }
  }

  private async validateSavingsWithdrawal(biodataId: string, details: any) {
    const { amount } = details;

    // Get member's total savings
    const savingsRecords = await prisma.savings.findMany({
      where: { memberId: biodataId }
    });

    if (!savingsRecords.length) {
      throw new ApiError('No savings records found for this member.', 404);
    }

    // Calculate total available balance
    const totalBalance = savingsRecords.reduce((sum, record) => {
      return sum.add(new Decimal(record.balance || 0));
    }, new Decimal(0));

    if (totalBalance.lessThan(amount)) {
      throw new ApiError('Insufficient savings balance for withdrawal.', 400);
    }
  }

  async updateRequest(requestId: string, data: UpdateRequestDTO, approverId: string) {
    try {
      const request = await prisma.request.findUnique({
        where: { id: requestId },
        include: {
          biodata: true,
          initiator: true
        }
      });

      if (!request) {
        throw new ApiError('Request not found', 404);
      }

      // Update request status
      const updatedRequest = await prisma.$transaction(async (tx) => {
        const updated = await tx.request.update({
          where: { id: requestId },
          data: {
            status: data.status,
            approverId: approverId,
            notes: data.adminNotes
          },
          include: {
            biodata: true,
            initiator: true
          }
        });

        // Handle approved requests
        if (data.status === RequestStatus.APPROVED) {
          await this.handleApprovedRequest(updated, tx);
        }

        // Create status update notification
        await notificationService.createStatusUpdateNotification(
          updated,
          data.status,
          data.adminNotes
        );

        return updated;
      });

      return updatedRequest;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Error updating request:', error);
      throw new ApiError(
        error instanceof Error ? error.message : 'Error updating request',
        500
      );
    }
  }

  private async handleApprovedRequest(request: any, tx: any) {
    switch (request.type) {
      case RequestType.LOAN_APPLICATION:
        await this.processLoanApproval(request, tx);
        break;
      case RequestType.SAVINGS_WITHDRAWAL:
        await this.processSavingsWithdrawal(request, tx);
        break;
      default:
        // No special processing needed
        break;
    }
  }

  private async processLoanApproval(request: any, tx: any) {
    // Update loan status
    if (request.loanId) {
      await tx.loan.update({
        where: { id: request.loanId },
        data: { status: 'APPROVED' }
      });
    }
  }

  private async processSavingsWithdrawal(request: any, tx: any) {
    const { amount } = request.content;

    // Get member's savings
    const savings = await tx.savings.findFirst({
      where: { memberId: request.biodataId },
      orderBy: { createdAt: 'desc' }
    });

    if (savings) {
      // Deduct withdrawal amount from balance
      const currentBalance = new Decimal(savings.balance || 0);
      const withdrawalAmount = new Decimal(amount);
      const newBalance = currentBalance.minus(withdrawalAmount);

      await tx.savings.update({
        where: { id: savings.id },
        data: { balance: newBalance.toNumber() }
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          biodataId: request.biodataId,
          amount: withdrawalAmount.toNumber(),
          type: 'DEBIT',
          module: 'SAVINGS',
          moduleType: 'SAVINGS_WITHDRAWAL',
          status: 'COMPLETED',
          requestId: request.id,
          description: 'Savings withdrawal',
          initiatedBy: request.initiatorId
        }
      });
    }
  }

  async getRequests(filters: FilterOptions) {
    const { type, status, biodataId, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    try {
      const where: any = {};

      if (type) where.type = type;
      if (status) where.status = status;
      if (biodataId) where.biodataId = biodataId;

      const [requests, total] = await Promise.all([
        prisma.request.findMany({
          where,
          include: {
            biodata: true,
            initiator: true,
            approver: true
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.request.count({ where })
      ]);

      return {
        data: requests,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error fetching requests:', error);
      throw new ApiError('Error fetching requests', 500);
    }
  }

  async getUserRequests(userId: string, filters: FilterOptions) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { biodataId: true }
      });

      if (!user?.biodataId) {
        throw new ApiError('User biodata not found', 404);
      }

      return this.getRequests({
        ...filters,
        biodataId: user.biodataId
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Error fetching user requests:', error);
      throw new ApiError('Error fetching user requests', 500);
    }
  }

  async getRequest(requestId: string) {
    try {
      const request = await prisma.request.findUnique({
        where: { id: requestId },
        include: {
          biodata: true,
          initiator: true,
          approver: true
        }
      });

      if (!request) {
        throw new ApiError('Request not found', 404);
      }

      return request;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Error fetching request:', error);
      throw new ApiError('Error fetching request', 500);
    }
  }

  async deleteRequest(requestId: string) {
    try {
      const request = await prisma.request.findUnique({
        where: { id: requestId }
      });

      if (!request) {
        throw new ApiError('Request not found', 404);
      }

      if (request.status !== RequestStatus.PENDING) {
        throw new ApiError('Only pending requests can be deleted', 400);
      }

      await prisma.request.delete({
        where: { id: requestId }
      });

      return { message: 'Request deleted successfully' };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Error deleting request:', error);
      throw new ApiError('Error deleting request', 500);
    }
  }

  async getPendingCount() {
    try {
      return await prisma.request.count({
        where: {
          status: RequestStatus.PENDING
        }
      });
    } catch (error) {
      logger.error('Error getting pending count:', error);
      throw new ApiError('Error getting pending count', 500);
    }
  }
}

export default new RequestService();
