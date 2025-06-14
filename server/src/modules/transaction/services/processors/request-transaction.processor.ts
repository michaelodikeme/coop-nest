import { PrismaClient, Transaction, TransactionStatus, TransactionType, TransactionModule, RequestStatus } from '@prisma/client';
import { TransactionProcessor } from '../../interfaces/transaction-processor.interface';
import { CreateTransactionDto } from '../../dtos/create-transaction.dto';
import { TransactionError, TransactionErrorCodes } from '../../errors/transaction.error';
import logger from '../../../../utils/logger';

/**
 * Processor for request-related transactions
 */
export class RequestTransactionProcessor implements TransactionProcessor {
  private prisma: PrismaClient;
  
  constructor() {
    this.prisma = new PrismaClient();
  }
  
  /**
   * Validate a request transaction before processing
   */
  async validateTransaction(data: CreateTransactionDto): Promise<boolean> {
    try {
      // Request transactions should have a related request ID
      if (!data.requestId) {
        logger.error('Missing requestId for request-related transaction');
        return false;
      }
      
      // Check if request exists
      const request = await this.prisma.request.findUnique({
        where: { id: data.requestId }
      });
      
      if (!request) {
        logger.error(`Request not found: ${data.requestId}`);
        return false;
      }
      
      // For approval/rejection transactions, check request is in PENDING state
      if (data.transactionType === TransactionType.FEE && 
          request.status !== RequestStatus.PENDING) {
        logger.error(`Request is not in pending state: ${request.status}`);
        return false;
      }
      
      return true;
    } catch (error) {
      logger.error('Request transaction validation error', error);
      return false;
    }
  }
  
  /**
   * Process a request transaction
   * @param transaction Transaction to process
   * @param tx Optional transaction client for atomic operations
   */
  async processTransaction(transaction: Transaction, tx?: any): Promise<void> {
    try {
      const prisma = tx || this.prisma;
      
      // Check if this is a transaction related to request approval
      if (transaction.requestId) {
        await this.processRequestTransaction(transaction, prisma);
      }
    } catch (error) {
      logger.error(`Error processing request transaction ${transaction.id}:`, error);
      throw new TransactionError(
        'Failed to process request transaction',
        TransactionErrorCodes.PROCESSING_ERROR,
        500,
        error as Error
      );
    }
  }
  
  /**
   * Handle changes in transaction status
   * @param transaction Updated transaction
   * @param previousStatus Previous status before update
   */
  async onTransactionStatusChange(transaction: Transaction, previousStatus: TransactionStatus): Promise<void> {
    try {
      // Only handle transitions to COMPLETED status
      if (previousStatus !== TransactionStatus.COMPLETED && 
          transaction.status === TransactionStatus.COMPLETED) {
        
        // Create notification for the user if we have a requestId
        if (transaction.requestId) {
          await this.createNotification(transaction);
        }
      }
    } catch (error) {
      logger.error(`Error handling status change for request transaction ${transaction.id}:`, error);
      // Don't rethrow - this is a notification step and shouldn't break the main transaction
    }
  }
  
  /**
   * Process a request-related transaction
   * @param transaction Transaction to process
   * @param prisma Prisma client instance
   */
  private async processRequestTransaction(transaction: Transaction, prisma: any): Promise<void> {
    // Skip if not completed
    if (transaction.status !== TransactionStatus.COMPLETED || !transaction.requestId) {
      return;
    }
    
    // Get the request
    const request = await prisma.request.findUnique({
      where: { id: transaction.requestId }
    });
    
    if (!request) {
      logger.warn(`Request not found for transaction ${transaction.id}, requestId ${transaction.requestId}`);
      return;
    }
    
    // Get transaction metadata for approval info
    const metadata = transaction.metadata as any || {};
    const approvalStatus = metadata.approved === true ? 
      RequestStatus.APPROVED : RequestStatus.REJECTED;
    
    // Update the request status
    await prisma.request.update({
      where: { id: transaction.requestId },
      data: {
        status: approvalStatus,
        approverId: transaction.approvedBy || transaction.initiatedBy,
        notes: metadata.notes || transaction.description,
        updatedAt: new Date(),
        completedAt: new Date()
      }
    });
    
    // If approved, handle specific request types
    if (approvalStatus === RequestStatus.APPROVED) {
      await this.handleApprovedRequest(request, transaction, prisma);
    }
  }
  
  /**
   * Handle specific actions for approved requests based on their type
   * @param request The approved request
   * @param transaction The associated transaction
   * @param prisma Prisma client instance
   */
  private async handleApprovedRequest(
    request: any, 
    transaction: Transaction, 
    prisma: any
  ): Promise<void> {
    // Get the content of the request
    const content = request.content as any || {};
    
    switch (request.type) {
      case 'BIODATA_APPROVAL':
        // Update biodata approval status
        if (request.biodataId) {
          await prisma.biodata.update({
            where: { id: request.biodataId },
            data: { isApproved: true }
          });
          
          logger.info(`Updated biodata approval status for ${request.biodataId}`);
        }
        break;
        
      case 'SAVINGS_WITHDRAWAL':
        // Create a savings withdrawal transaction
        if (content.amount && request.savingsId) {
          // Create the actual withdrawal transaction
          await prisma.transaction.create({
            data: {
              transactionType: TransactionType.SAVINGS_WITHDRAWAL,
              baseType: TransactionType.DEBIT,
              module: TransactionModule.SAVINGS,
              amount: -Math.abs(content.amount), // Ensure it's negative for withdrawals
              description: content.reason || 'Approved savings withdrawal request',
              metadata: {
                reason: content.reason,
                requestId: request.id
              },
              initiatedBy: transaction.initiatedBy,
              approvedBy: transaction.approvedBy,
              status: TransactionStatus.COMPLETED,
              completedAt: new Date(),
              requestId: request.id,
              savingsId: request.savingsId,
              balanceAfter: 0 // Will be calculated during processing
            }
          });
          
          logger.info(`Created savings withdrawal transaction for request ${request.id}`);
        }
        break;
        
      case 'SHARE_WITHDRAWAL':
        // Create a shares liquidation transaction
        if (content.amount && request.biodataId) {
          // First, find the member's active shares record
          const shares = await prisma.shares.findFirst({
            where: {
              memberId: request.biodataId,
              status: 'ACTIVE'
            },
            orderBy: [
              { year: 'desc' },
              { month: 'desc' }
            ]
          });
          
          if (shares) {
            // Create the actual shares liquidation transaction
            await prisma.transaction.create({
              data: {
                transactionType: TransactionType.SHARES_LIQUIDATION,
                baseType: TransactionType.DEBIT,
                module: TransactionModule.SHARES,
                amount: -Math.abs(content.amount), // Ensure it's negative for liquidations
                description: content.reason || 'Approved shares withdrawal request',
                metadata: {
                  reason: content.reason,
                  requestId: request.id
                },
                initiatedBy: transaction.initiatedBy,
                approvedBy: transaction.approvedBy,
                status: TransactionStatus.COMPLETED,
                completedAt: new Date(),
                requestId: request.id,
                sharesId: shares.id,
                balanceAfter: 0 // Will be calculated during processing
              }
            });
            
            logger.info(`Created shares liquidation transaction for request ${request.id}`);
          }
        }
        break;
        
      case 'LOAN_APPLICATION':
        // For loan applications, update loan status to approved
        if (content.loanId) {
          await prisma.loan.update({
            where: { id: content.loanId },
            data: { 
              status: 'APPROVED',
              updatedAt: new Date()
            }
          });
          
          // Create loan status history entry
          await prisma.loanStatusHistory.create({
            data: {
              loanId: content.loanId,
              fromStatus: 'PENDING',
              toStatus: 'APPROVED',
              changedBy: transaction.initiatedBy,
              reason: transaction.description || 'Loan application approved'
            }
          });
          
          logger.info(`Updated loan status to APPROVED for loan ${content.loanId}`);
        }
        break;
        
      case 'LOAN_DISBURSEMENT':
        // For disbursement requests, create a disbursement transaction
        if (content.loanId && content.amount) {
          await prisma.transaction.create({
            data: {
              transactionType: TransactionType.LOAN_DISBURSEMENT,
              baseType: TransactionType.CREDIT,
              module: TransactionModule.LOAN,
              amount: content.amount,
              description: 'Loan disbursement',
              metadata: {
                requestId: request.id,
                disbursementDetails: content.disbursementDetails || {}
              },
              initiatedBy: transaction.initiatedBy,
              approvedBy: transaction.approvedBy,
              status: TransactionStatus.COMPLETED,
              completedAt: new Date(),
              requestId: request.id,
              loanId: content.loanId,
              balanceAfter: 0 // Will be updated during processing
            }
          });
          
          logger.info(`Created loan disbursement transaction for loan ${content.loanId}`);
        }
        break;
    }
  }
  
  /**
   * Create a notification for the request transaction
   */
  private async createNotification(transaction: Transaction): Promise<void> {
    try {
      // Find the request and associated user
      const request = await this.prisma.request.findUnique({
        where: { id: transaction.requestId! },
        include: { 
          initiator: true,
          biodata: true
        }
      });
      
      if (!request || !request.initiator) return;
      
      // Check if request has been approved or rejected
      const metadata = transaction.metadata as any || {};
      const isApproved = metadata.approved === true;
      
      // Create appropriate notification title and message
      let title = isApproved ? 'Request Approved' : 'Request Rejected';
      let message = this.createNotificationMessage(request, isApproved, metadata);
      
      // Create notification in the database
      await this.prisma.notification.create({
        data: {
          userId: request.initiator.id,
          title,
          type: 'REQUEST_UPDATE',
          message,
          requestId: request.id,
          transactionId: transaction.id,
          metadata: {
            requestType: request.type,
            approved: isApproved,
            notes: metadata.notes || transaction.description
          }
        }
      });
      
      logger.info(`Created ${isApproved ? 'approval' : 'rejection'} notification for request ${request.id}`);
    } catch (error) {
      // Don't let notification errors break the transaction
      logger.error('Failed to create request notification', error);
    }
  }
  
  /**
   * Create a notification message based on request type and approval status
   */
  private createNotificationMessage(request: any, isApproved: boolean, metadata: any): string {
    const reason = metadata.notes || 'No reason provided';
    
    if (isApproved) {
      switch (request.type) {
        case 'BIODATA_APPROVAL':
          return 'Your profile information has been approved.';
        case 'LOAN_APPLICATION':
          return 'Your loan application has been approved.';
        case 'SAVINGS_WITHDRAWAL':
          return 'Your savings withdrawal request has been approved.';
        case 'SHARE_WITHDRAWAL':
          return 'Your shares withdrawal request has been approved.';
        case 'LOAN_DISBURSEMENT':
          return 'Your loan disbursement request has been approved.';
        default:
          return `Your ${this.formatRequestType(request.type)} has been approved.`;
      }
    } else {
      switch (request.type) {
        case 'BIODATA_APPROVAL':
          return `Your profile information was not approved: ${reason}`;
        case 'LOAN_APPLICATION':
          return `Your loan application was rejected: ${reason}`;
        case 'SAVINGS_WITHDRAWAL':
          return `Your savings withdrawal request was rejected: ${reason}`;
        case 'SHARE_WITHDRAWAL':
          return `Your shares withdrawal request was rejected: ${reason}`;
        case 'LOAN_DISBURSEMENT':
          return `Your loan disbursement request was rejected: ${reason}`;
        default:
          return `Your ${this.formatRequestType(request.type)} was rejected: ${reason}`;
      }
    }
  }
  
  /**
   * Format request type for display in notifications
   */
  private formatRequestType(type: string): string {
    return type.toLowerCase().replace(/_/g, ' ') + ' request';
  }
}