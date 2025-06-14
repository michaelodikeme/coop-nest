import { NotificationType, NotificationPriority, TransactionModule, PrismaClient } from '@prisma/client';
import { LoanStatus, PaymentStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export class LoanNotificationService {
  /**
   * Send notification for loan status change
   */
  static async notifyLoanStatusChange(
    loanId: string,
    newStatus: LoanStatus,
    memberId: string,
    notes?: string
  ) {
    try {
      const notification = await prisma.notification.create({
        data: {
          id: uuidv4(), // Ensure UUID is properly generated
          type: NotificationType.SYSTEM_ALERT,
          title: `Loan Status Updated`,
          message: `Loan status changed to ${newStatus}`,
          userId: memberId,
          metadata: {
            loanId,
            status: newStatus,
            notes
          },
          isRead: false
        }
      });

      return notification;
    } catch (error) {
      // Log error but don't fail the loan application
      console.error('Failed to create notification:', error);
      // Return null instead of throwing
      return null;
    }
  }

  /**
   * Notify approvers about pending loan approval
   */
  static async notifyApprovers(loanId: string, requiredApprovalLevel: number) {
    // Get users with required approval level
    const eligibleApprovers = await prisma.user.findMany({
      where: {
        roleAssignments: {
          some: {
            role: {
              approvalLevel: requiredApprovalLevel,
              canApprove: true
            }
          }
        }
      }
    });

    const notifications = await Promise.all(
      eligibleApprovers.map(approver =>
        prisma.notification.create({
          data: {
            userId: approver.id,
            type: NotificationType.APPROVAL_REQUIRED,
            priority: NotificationPriority.HIGH,
            title: 'Loan Approval Required',
            message: `A loan application requires your approval`,
            metadata: {
              loanId,
              approvalLevel: requiredApprovalLevel
            }
          }
        })
      )
    );

    return notifications;
  }

  /**
   * Notify member about upcoming loan payment
   */
  static async notifyUpcomingPayment(
    loanId: string,
    memberId: string,
    dueDate: Date,
    amount: number
  ) {
    const notification = await prisma.notification.create({
      data: {
        userId: memberId,
        type: NotificationType.SYSTEM_ALERT,
        priority: NotificationPriority.NORMAL,
        title: 'Upcoming Loan Payment',
        message: `You have a loan payment of ₦${amount.toLocaleString()} due on ${dueDate.toLocaleDateString()}`,
        metadata: {
          loanId,
          dueDate: dueDate.toISOString(),
          amount
        }
      }
    });

    return notification;
  }

  /**
   * Notify member about late payment
   */
  static async notifyLatePayment(
    loanId: string,
    memberId: string,
    daysLate: number,
    amount: number
  ) {
    const notification = await prisma.notification.create({
      data: {
        userId: memberId,
        type: NotificationType.SYSTEM_ALERT,
        priority: NotificationPriority.URGENT,
        title: 'Late Loan Payment',
        message: `Your loan payment of ₦${amount.toLocaleString()} is ${daysLate} days overdue`,
        metadata: {
          loanId,
          daysLate,
          amount
        }
      }
    });

    return notification;
  }

  /**
   * Notify about successful repayment processing
   */
  static async notifyRepaymentProcessed(
    loanId: string,
    memberId: string,
    amount: number,
    remainingBalance: number
  ) {
    const notification = await prisma.notification.create({
      data: {
        userId: memberId,
        type: NotificationType.TRANSACTION,
        priority: NotificationPriority.NORMAL,
        title: 'Loan Repayment Processed',
        message: `Your loan repayment of ₦${amount.toLocaleString()} has been processed. Remaining balance: ₦${remainingBalance.toLocaleString()}`,
        metadata: {
          loanId,
          amount,
          remainingBalance
        }
      }
    });

    return notification;
  }

  /**
   * Notify admin about failed bulk repayment upload
   */
  static async notifyBulkUploadFailure(
    uploadId: string,
    adminId: string,
    errorCount: number,
    details: any
  ) {
    const notification = await prisma.notification.create({
      data: {
        userId: adminId,
        type: NotificationType.SYSTEM_ALERT,
        priority: NotificationPriority.HIGH,
        title: 'Bulk Repayment Upload Failed',
        message: `${errorCount} errors occurred during bulk repayment upload`,
        metadata: {
          uploadId,
          errorCount,
          details
        }
      }
    });

    return notification;
  }
}
