import { PrismaClient, RequestStatus } from '@prisma/client';
import { RequestError, requestErrorCodes } from '../../../middlewares/errorHandlers/requestErrorHandler';
import logger from '../../../utils/logger';

const prisma = new PrismaClient();

export class NotificationService {
  async createRequestNotification(request: any) {
    try {
      const { id, type, userId, biodataId } = request;
      
      let title: string;
      let message: string;
      
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
        case 'SHARE_WITHDRAWAL':
          title = 'Share Withdrawal Request';
          message = 'Your share withdrawal request has been submitted for review.';
          break;
        default:
          title = 'New Request Submitted';
          message = 'Your request has been submitted for review.';
      }
      
      // Create user notification
      await prisma.notification.create({
        data: {
          biodataId,
          message: `${title}: ${message}`,
          isRead: false
        }
      });
      
      // Create admin notification for pending review
      await this.createAdminNotification(
        biodataId,
        `New ${type.toLowerCase().replace('_', ' ')} requires review.`
      );
      
      return true;
    } catch (error) {
      logger.error('Error creating request notification:', error);
      throw new RequestError(
        requestErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to create notification',
        500
      );
    }
  }
  
  async createStatusUpdateNotification(request: any, status: RequestStatus, notes?: string) {
    try {
      const { type, biodataId } = request;
      
      let message: string;
      
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
          biodataId,
          message,
          isRead: false
        }
      });
    } catch (error) {
      logger.error('Error creating status update notification:', error);
      throw new RequestError(
        requestErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to create status update notification',
        500
      );
    }
  }
  
  private async createAdminNotification(
    biodataId: string,
    message: string
  ) {
    try {
      // Find all admin users
      const adminUsers = await prisma.user.findMany({
        where: {
          Role: {
            permissions: {
              has: 'view_all_requests'
            }
          }
        },
        include: {
          biodata: true
        }
      });
      
      // Create a notification for each admin who has a biodata record
      const notifications = adminUsers
        .filter(admin => admin.biodata?.id)
        .map(admin => ({
          biodataId: admin.biodata!.id,
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
      throw new RequestError(
        requestErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to create admin notifications',
        500
      );
    }
  }
  
  async getUnreadNotifications(userId: string) {
    try {
      // Get biodata ID from user
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { biodataId: true }
      });
      
      if (!user?.biodataId) {
        throw new RequestError(
          requestErrorCodes.USER_NOT_FOUND,
          'User biodata not found',
          404
        );
      }
      
      return await prisma.notification.findMany({
        where: {
          biodataId: user.biodataId,
          isRead: false
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } catch (error) {
      logger.error('Error fetching unread notifications:', error);
      throw new RequestError(
        requestErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to fetch notifications',
        500
      );
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
      throw new RequestError(
        requestErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to mark notification as read',
        500
      );
    }
  }
  
  async markAllAsRead(userId: string) {
    try {
      // Get biodata ID from user
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { biodataId: true }
      });
      
      if (!user?.biodataId) {
        throw new RequestError(
          requestErrorCodes.USER_NOT_FOUND,
          'User biodata not found',
          404
        );
      }
      
      await prisma.notification.updateMany({
        where: {
          biodataId: user.biodataId,
          isRead: false
        },
        data: {
          isRead: true
        }
      });
      return true;
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      throw new RequestError(
        requestErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to mark all notifications as read',
        500
      );
    }
  }
}