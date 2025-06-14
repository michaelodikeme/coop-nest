import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticateUser, authorizeRoles, checkPermission, checkModuleAccess, checkApprovalLevel } from '../../../middlewares/auth';

const router = Router();
const userController = new UserController();

// Protected routes - requires authentication
router.use(authenticateUser);

// User profile routes
router.get('/me', userController.getUserById.bind(userController));
router.get('/me/permissions', userController.getUserPermissions.bind(userController));
router.get('/me/module-access', userController.getUserModuleAccess.bind(userController));
router.post('/me/update-username', userController.updateUsername.bind(userController));
router.post('/me/change-password', userController.changePassword.bind(userController));

// Request management
router.get('/me/requests/assigned', userController.getAssignedRequests.bind(userController) as any);
router.get('/me/requests/initiated', userController.getInitiatedRequests.bind(userController));
router.get('/me/requests/approved', userController.getApprovedRequests.bind(userController));

// Role management routes - requires MANAGE_ROLES permission
router.post('/assign-role', 
  checkPermission('MANAGE_ROLES'),
  authorizeRoles(['SUPER_ADMIN']),
  userController.assignRole.bind(userController)
);

router.put('/roles/:userRoleId', 
  checkPermission('MANAGE_ROLES'),
  authorizeRoles(['SUPER_ADMIN']),
  userController.updateUserRole.bind(userController)
);

router.get('/by-role/:roleId',
  checkPermission('VIEW_USERS'),
  authorizeRoles(['SUPER_ADMIN']),
  userController.getUsersByRole.bind(userController)
);

// Approval chain routes
router.get('/approvers/:level',
  authorizeRoles(['SUPER_ADMIN']),
  userController.getApprovers.bind(userController)
);

router.get('/roles/by-level/:level',
  checkPermission('VIEW_ROLES'),
  authorizeRoles(['SUPER_ADMIN']),
  userController.getRolesByApprovalLevel.bind(userController)
);

// Admin routes - requires specific permissions
router.get('/', 
  checkPermission('VIEW_USERS'),
  checkModuleAccess('ADMIN'),
  userController.getUsers.bind(userController)
);

router.get('/:id', 
  checkPermission('VIEW_USERS'),
  authorizeRoles(['SUPER_ADMIN']),
  userController.getUserById.bind(userController)
);

router.get('/:id/permissions',
  checkPermission('VIEW_PERMISSIONS'),
  authorizeRoles(['SUPER_ADMIN']),
  userController.getUserPermissions.bind(userController)
);

router.get('/:id/module-access',
  checkPermission('VIEW_PERMISSIONS'),
  authorizeRoles(['SUPER_ADMIN']),
  userController.getUserModuleAccess.bind(userController)
);

// router.put('/:id', 
//   checkPermission('EDIT_USERS'),
//   authorizeRoles(['SUPER_ADMIN']),
//   userController.updateUsername.bind(userController)
// );

// User status management
router.post('/:id/deactivate', 
  checkPermission('MANAGE_USERS'),
  authorizeRoles(['SUPER_ADMIN']),
  userController.deactivateUser.bind(userController)
);

// Username update approval route
router.post('/requests/:requestId/approve-username',
    authenticateUser,
    checkPermission('APPROVE_ACCOUNTS'),
    checkApprovalLevel(2), // Ensure approver has sufficient level
    userController.approveUsernameUpdate.bind(userController)
);

export default router;