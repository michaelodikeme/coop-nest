import { PrismaClient, RequestStatus, NotificationType } from '@prisma/client';
import { ApiError } from '../../../utils/apiError';
import logger from '../../../utils/logger';

const prisma = new PrismaClient();

export class NotificationService {
  async createRequestNotification(request: any) {
    try {
      const { id, type, userId } = request;

      let title: string;
      let message: string;
      let notificationType: NotificationType = NotificationType.REQUEST_UPDATE;

      switch (type) {
        case 'BIODATA_APPROVAL':
          title = 'Biodata Approval Request';
          message = 'Your biodata approval request has been submitted for review.';
          break;
        case 'LOAN_APPLICATION':
          title = 'Loan Application';
          message = 'Your loan application has been submitted for review.';
          break;
        case 'SAVINGS_WITHDRAWAL':
          title = 'Savings Withdrawal Request';
          message = 'Your savings withdrawal request has been submitted for review.';
          break;
        default:
          title = 'New Request Submitted';
          message = 'Your request has been submitted for review.';
      }

      // Create user notification
      await prisma.notification.create({
        data: {
          userId,
          type: notificationType,
          title,
          message,
          isRead: false,
          requestId: id
        }
      });

      // Create admin notification for pending review
      await this.createAdminNotification(
        title,
        `New ${type.toLowerCase().replace('_', ' ')} requires review.`
      );

      return true;
    } catch (error) {
      logger.error('Error creating request notification:', error);
      throw new ApiError('Failed to create notification', 500);
    }
  }

  async createStatusUpdateNotification(request: any, status: RequestStatus, notes?: string) {
    try {
      const { type, userId } = request;

      let message: string;
      let title: string = 'Request Status Update';

      switch (status) {
        case RequestStatus.APPROVED:
          message = `Your ${type.toLowerCase().replace('_', ' ')} has been approved.`;
          break;
        case RequestStatus.REJECTED:
          message = `Your ${type.toLowerCase().replace('_', ' ')} has been rejected.`;
          break;
        default:
          message = `Your ${type.toLowerCase().replace('_', ' ')} status has been updated to ${status.toLowerCase()}.`;
      }

      if (notes) {
        message += ` Notes: ${notes}`;
      }

      // Create user notification
      return await prisma.notification.create({
        data: {
          userId,
          type: NotificationType.REQUEST_UPDATE,
          title,
          message,
          isRead: false
        }
      });
    } catch (error) {
      logger.error('Error creating status update notification:', error);
      throw new ApiError('Failed to create status update notification', 500);
    }
  }

  private async createAdminNotification(
    title: string,
    message: string
  ) {
    try {
      // Find all admin users with proper role assignment
      const adminUsers = await prisma.user.findMany({
        where: {
          roleAssignment: {
            role: {
              permissions: {
                has: 'VIEW_ALL_REQUESTS'
              }
            }
          }
        }
      });

      // Create a notification for each admin
      const notifications = adminUsers.map(admin => ({
        userId: admin.id,
        type: NotificationType.REQUEST_UPDATE,
        title,
        message,
        isRead: false
      }));

      if (notifications.length > 0) {
        await prisma.notification.createMany({
          data: notifications
        });
      }

      return true;
    } catch (error) {
      logger.error('Error creating admin notifications:', error);
      throw new ApiError('Failed to create admin notifications', 500);
    }
  }

  async getUnreadNotifications(userId: string) {
    try {
      return await prisma.notification.findMany({
        where: {
          userId,
          isRead: false
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } catch (error) {
      logger.error('Error fetching unread notifications:', error);
      throw new ApiError('Failed to fetch notifications', 500);
    }
  }

  async markNotificationAsRead(id: string) {
    try {
      return await prisma.notification.update({
        where: { id },
        data: { isRead: true }
      });
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      throw new ApiError('Failed to mark notification as read', 500);
    }
  }

  async markAllAsRead(userId: string) {
    try {
      await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false
        },
        data: {
          isRead: true
        }
      });
      return true;
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      throw new ApiError('Failed to mark all notifications as read', 500);
    }
  }
}