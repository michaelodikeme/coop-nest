import { Response } from 'express';
import { NotificationService } from '../services/notificationService';
import { RequestError, requestErrorCodes } from '../../../middlewares/errorHandlers/requestErrorHandler';
import { AuthenticatedRequest } from '../../../types/express';

const notificationService = new NotificationService();

export class NotificationController {
  async getUnreadNotifications(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        throw new RequestError(requestErrorCodes.UNAUTHORIZED_REQUEST, 'User not authenticated', 401);
      }

      const notifications = await notificationService.getUnreadNotifications(userId);
      res.json(notifications);
    } catch (error) {
      if (error instanceof RequestError) {
        res.status(error.status).json({ error: { code: error.code, message: error.message } });
      } else {
        console.error('Error getting notifications:', error);
        res.status(500).json({ error: 'Failed to get notifications' });
      }
    }
  }

  async markAsRead(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      
      if (!userId) {
        throw new RequestError(requestErrorCodes.UNAUTHORIZED_REQUEST, 'User not authenticated', 401);
      }
      
      const notification = await notificationService.markNotificationAsRead(id);
      res.json(notification);
    } catch (error) {
      if (error instanceof RequestError) {
        res.status(error.status).json({ error: { code: error.code, message: error.message } });
      } else {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
      }
    }
  }

  async markAllAsRead(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        throw new RequestError(requestErrorCodes.UNAUTHORIZED_REQUEST, 'User not authenticated', 401);
      }

      await notificationService.markAllAsRead(userId);
      res.json({ message: 'All notifications marked as read' });
    } catch (error) {
      if (error instanceof RequestError) {
        res.status(error.status).json({ error: { code: error.code, message: error.message } });
      } else {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ error: 'Failed to mark notifications as read' });
      }
    }
  }
}