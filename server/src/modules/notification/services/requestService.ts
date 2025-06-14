import { PrismaClient, RequestStatus, RequestType, Prisma } from '@prisma/client';
import { CreateRequestDTO, UpdateRequestDTO, FilterOptions } from '../types/request.types';
import { NotificationService } from './notificationService';
import { RequestError, requestErrorCodes } from '../../../middlewares/errorHandlers/requestErrorHandler';
import logger from '../../../utils/logger';
import { Decimal } from 'decimal.js';

const prisma = new PrismaClient();
const notificationService = new NotificationService();

export class RequestService {
  async createRequest(data: CreateRequestDTO) {
    const { biodataId, userId, type, details } = data;
    
    try {
      // Validate that the biodata belongs to the user making the request
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { biodata: true }
      });
      
      if (!user || user.biodataId !== biodataId) {
        throw new RequestError(
          requestErrorCodes.UNAUTHORIZED_REQUEST, 
          'Unauthorized: User does not own this biodata',
          403
        );
      }
      
      // Additional validation based on request type
      switch (type) {
        case RequestType.LOAN_APPLICATION:
          await this.validateLoanRequest(biodataId, details);
          break;
        case RequestType.SAVINGS_WITHDRAWAL:
          await this.validateSavingsWithdrawal(biodataId, details);
          break;
        case RequestType.SHARE_WITHDRAWAL:
          await this.validateShareWithdrawal(biodataId, details);
          break;
      }
      
      // Start a transaction for request creation and notification
      return await prisma.$transaction(async (tx) => {
        const request = await tx.request.create({
          data: {
            type,
            status: RequestStatus.PENDING,
            userId,
            biodataId,
            content: details
          },
          include: {
            Biodata: true,
            user: true
          }
        });
        
        // Create notification
        await notificationService.createRequestNotification(request);
        
        return request;
      });
    } catch (error) {
      if (error instanceof RequestError) {
        throw error;
      }
      logger.error('Error creating request:', error);
      throw new RequestError(
        requestErrorCodes.INTERNAL_SERVER_ERROR,
        error instanceof Error ? error.message : 'Error creating request',
        500
      );
    }
  }
  
  private async validateLoanRequest(biodataId: string, details: any) {
    // Verify member has sufficient savings history
    const savings = await prisma.savings.findMany({
      where: { biodataId },
      orderBy: { createdAt: 'desc' },
      take: 6 // Last 6 months
    });
    
    if (savings.length < 6) {
      throw new RequestError(
        requestErrorCodes.INSUFFICIENT_SAVINGS_HISTORY,
        'Insufficient savings history. Minimum 6 months required.',
        400
      );
    }
    
    // Check for existing active loans
    const activeLoans = await prisma.loans.findFirst({
      where: {
        biodataId,
        status: {
          in: ['PENDING', 'APPROVED', 'DISBURSED', 'ACTIVE']
        }
      }
    });
    
    if (activeLoans) {
      throw new RequestError(
        requestErrorCodes.ACTIVE_LOAN_EXISTS,
        'Cannot apply for a new loan while having an active loan',
        400
      );
    }
  }
  
  private async validateSavingsWithdrawal(biodataId: string, details: any) {
    const savings = await prisma.savings.findFirst({
      where: { 
        biodataId,
        status: 'ACTIVE'
      },
      orderBy: { createdAt: 'desc' }
    });
    
    if (!savings) {
      throw new RequestError(
        requestErrorCodes.INSUFFICIENT_BALANCE,
        'No active savings found',
        400
      );
    }
    
    if (details.amount > savings.totalAmount) {
      throw new RequestError(
        requestErrorCodes.INSUFFICIENT_BALANCE,
        'Insufficient savings balance',
        400
      );
    }
  }
  
  private async validateShareWithdrawal(biodataId: string, details: any) {
    const shares = await prisma.shares.findFirst({
      where: { biodataId },
      orderBy: { createdAt: 'desc' }
    });
    
    if (!shares) {
      throw new RequestError(
        requestErrorCodes.INVALID_SHARE_WITHDRAWAL,
        'No shares found',
        400
      );
    }
    
    if (details.amount > shares.totalAmount) {
      throw new RequestError(
        requestErrorCodes.INSUFFICIENT_BALANCE,
        'Insufficient shares balance',
        400
      );
    }
  }
  
  async updateRequest(id: string, data: UpdateRequestDTO, adminId: string) {
    const { status, adminNotes } = data;
    
    try {
      const request = await prisma.request.findUnique({
        where: { id },
        include: { Biodata: true }
      });
      
      if (!request) {
        throw new RequestError(
          requestErrorCodes.REQUEST_NOT_FOUND,
          'Request not found',
          404
        );
      }
      
      // Start a transaction for the update and notifications
      return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Update the request
        const updatedRequest = await tx.request.update({
          where: { id },
          data: {
            status,
            notes: adminNotes,
            reviewerId: adminId,
            updatedAt: new Date()
          },
          include: {
            Biodata: true
          }
        });
        
        // Create status update notification
        await notificationService.createStatusUpdateNotification(
          updatedRequest,
          status,
          adminNotes
        );
        
        // Handle post-approval actions based on request type
        if (status === RequestStatus.APPROVED) {
          switch (request.type) {
            case RequestType.BIODATA_APPROVAL:
              if (!request.biodataId) {
                throw new RequestError(
                  requestErrorCodes.INVALID_REQUEST_TYPE,
                  'Biodata ID is required',
                  400
                );
              }
              await tx.biodata.update({
                where: { id: request.biodataId },
                data: { isApproved: true }
              });
              break;
            case RequestType.LOAN_APPLICATION:
              await this.handleLoanApproval(tx, request);
              break;
            case RequestType.SAVINGS_WITHDRAWAL:
              await this.handleSavingsWithdrawal(tx, request);
              break;
            case RequestType.SHARE_WITHDRAWAL:
              await this.handleShareWithdrawal(tx, request);
              break;
          }
        }
        
        return updatedRequest;
      });
    } catch (error) {
      if (error instanceof RequestError) {
        throw error;
      }
      logger.error('Error updating request:', error);
      throw new RequestError(
        requestErrorCodes.INTERNAL_SERVER_ERROR,
        error instanceof Error ? error.message : 'Error updating request',
        500
      );
    }
  }
  
  private async handleLoanApproval(tx: Prisma.TransactionClient, request: any) {
    const { loanTypeId, loanAmount, loanTenure, purpose } = request.content;
    
    await tx.loans.create({
      data: {
        biodata: {
          connect: { id: request.biodataId }
        },
        loanType: {
          connect: { id: loanTypeId }
        },
        erpId: request.Biodata.erpId,
        loanAmount,
        loanTenure,
        loanPurpose: purpose,
        status: 'APPROVED',
        totalInterest: 0, // Set appropriate interest calculation
        totalRepayableAmount: loanAmount,
        remainingBalance: loanAmount
      }
    });
  }
  
  private async handleSavingsWithdrawal(tx: Prisma.TransactionClient, request: any) {
    // Create the transaction record
    await tx.savingsTransaction.create({
      data: {
        biodataId: request.biodataId,
        amount: request.content.amount,
        transactionType: 'SAVINGS_WITHDRAWAL',
        transactionStatus: 'APPROVED',
        description: request.content.reason || 'Withdrawal request approved'
      }
    });
    
    // Get the latest savings record for the user
    const latestSavings = await tx.savings.findFirst({
      where: { 
        biodataId: request.biodataId,
        status: 'ACTIVE'
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' }
      ]
    });
    
    if (!latestSavings) {
      throw new RequestError(
        requestErrorCodes.INSUFFICIENT_BALANCE,
        'No active savings found',
        400
      );
    }
    
    if (new Decimal(request.content.amount).gt(latestSavings.totalAmount)) {
      throw new RequestError(
        requestErrorCodes.INSUFFICIENT_BALANCE,
        'Withdrawal amount exceeds available balance',
        400
      );
    }
    
    // Update the latest savings record with the new balance
    await tx.savings.update({
      where: { id: latestSavings.id },
      data: {
        totalAmount: {
          decrement: request.content.amount
        }
      }
    });
  }
  
  private async handleShareWithdrawal(tx: Prisma.TransactionClient, request: any) {
    // Deduct shares from sender
    await tx.shares.update({
      where: {
        id: request.content.sharesId
      },
      data: {
        totalAmount: {
          decrement: request.content.amount
        }
      }
    });
    
    // Add shares to recipient if specified
    if (request.content.recipientBiodataId) {
      const recipientShares = await tx.shares.findFirst({
        where: {
          biodataId: request.content.recipientBiodataId
        }
      });

      if (recipientShares) {
        await tx.shares.update({
          where: {
            id: recipientShares.id
          },
          data: {
            totalAmount: {
              increment: request.content.amount
            }
          }
        });
      }
    }
    
    // Record the withdrawal transaction
    await tx.savingsTransaction.create({
      data: {
        biodataId: request.biodataId,
        amount: request.content.amount,
        transactionType: 'SHARES_WITHDRAWAL',
        transactionStatus: 'APPROVED',
        description: request.content.reason || 'Share withdrawal approved'
      }
    });
  }
  
  async getRequestById(id: string) {
    return prisma.request.findUnique({
      where: { id },
      include: {
        Biodata: true,
        user: true,
        reviewer: true
      }
    });
  }
  
  async getRequests(filters: FilterOptions) {
    const {
      type,
      status,
      biodataId,
      userId,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filters;
    
    const where: any = {};
    
    if (type) where.type = type;
    if (status) where.status = status;
    if (biodataId) where.biodataId = biodataId;
    if (userId) where.userId = userId;
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }
    
    const skip = (page - 1) * limit;
    
    const [total, requests] = await Promise.all([
      prisma.request.count({ where }),
      prisma.request.findMany({
        where,
        include: {
          Biodata: true,
          user: true,
          reviewer: true
        },
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder
        }
      })
    ]);
    
    return {
      requests,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }
  
  async getUserRequests(userId: string) {
    return prisma.request.findMany({
      where: { userId },
      include: {
        Biodata: true,
        reviewer: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }
  
  async getPendingRequestCount() {
    return prisma.request.count({
      where: { status: RequestStatus.PENDING }
    });
  }
  
  async deleteRequest(id: string) {
    return prisma.request.delete({
      where: { id }
    });
  }
}