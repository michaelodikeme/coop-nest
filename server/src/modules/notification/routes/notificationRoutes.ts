import express from 'express';
import { NotificationController } from '../controllers/notificationController';
import { authenticateUser, checkPermission } from '../../../middlewares/auth';

const router = express.Router();
const notificationController = new NotificationController();

// Get unread notifications
router.get('/',
  authenticateUser,
  checkPermission('VIEW_OWN_PROFILE'),
  notificationController.getUnreadNotifications
);

// Mark single notification as read
router.put('/:id/read',
  authenticateUser,
  checkPermission('VIEW_OWN_PROFILE'),
  notificationController.markAsRead
);

// Mark all notifications as read
router.put('/mark-all-read',
  authenticateUser,
  checkPermission('VIEW_OWN_PROFILE'),
  notificationController.markAllAsRead
);

export default router;