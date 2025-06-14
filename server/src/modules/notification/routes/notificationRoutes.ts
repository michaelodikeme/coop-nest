import express from 'express';
import { NotificationController } from '../controllers/notificationController';
import authMiddleware from '../../../middlewares/authMiddleware';
import { checkPermission } from '../../../middlewares/permissionMiddleware';
import { handleRequestError } from '../../../middlewares/errorHandlers/requestErrorHandler';

const router = express.Router();
const notificationController = new NotificationController();

// Get unread notifications
router.get('/',
  authMiddleware,
  checkPermission(['view_own_profile']),
  notificationController.getUnreadNotifications
);

// Mark single notification as read
router.put('/:id/read',
  authMiddleware,
  checkPermission(['view_own_profile']),
  notificationController.markAsRead
);

// Mark all notifications as read
router.put('/mark-all-read',
  authMiddleware,
  checkPermission(['view_own_profile']),
  notificationController.markAllAsRead
);

// Error handler
router.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  handleRequestError(err, req, res, next);
});

export default router;