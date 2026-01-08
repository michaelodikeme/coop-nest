import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticateUser, checkPermission, checkApprovalLevel } from '../../../middlewares/auth';

const router = Router();
const adminController = new AdminController();

// Admin profile verification routes (public)
router.post('/verify',
  adminController.verifyAdminProfile.bind(adminController)
);

router.post('/verify-otp',
  adminController.verifyAdminOtp.bind(adminController)
);

// Admin user creation (requires verified admin profile)
router.post('/user',
  adminController.createAdminUser.bind(adminController)
);

router.use(authenticateUser)

// Admin profile creation (requires high-level permission)
router.post('/profile',
  checkPermission('APPROVE_ACCOUNTS'),
  adminController.createAdminProfile.bind(adminController)
);

// Approve Admin profile creation
router.post('/:requestId/approve',
  checkPermission('APPROVE_ACCOUNTS'),
  adminController.processAdminProfileRequest.bind(adminController)
)

// Admin user management routes (protected)
router.post('/users/:userId/suspend',
    authenticateUser,
    checkPermission('MANAGE_ROLES'),
    checkApprovalLevel(2),
    adminController.suspendAdminUser.bind(adminController)
);

router.post('/users/:userId/reactivate',
    authenticateUser,
    checkPermission('MANAGE_ROLES'),
    checkApprovalLevel(2),
    adminController.reactivateAdminUser.bind(adminController)
);

router.delete('/users/:userId',
    authenticateUser,
    checkPermission('MANAGE_ROLES'),
    checkApprovalLevel(2),
    adminController.softDeleteAdminUser.bind(adminController)
);

router.post('/users/:userId/change-password',
    authenticateUser,
    checkPermission('MANAGE_ROLES'),
    checkApprovalLevel(2),
    adminController.changeUserPassword.bind(adminController)
);

export default router;