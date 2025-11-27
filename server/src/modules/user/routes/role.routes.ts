import { Router } from 'express';
import { RoleController } from '../controllers/role.controller';
import { authenticateUser, authorizeRoles, checkPermission } from '../../../middlewares/auth';

const router = Router();
const roleController = new RoleController();

// Get all roles - requires MANAGE_ROLES permission
router.get('/',
  checkPermission('MANAGE_ROLES'),
  roleController.getAllRoles.bind(roleController)
);

// Get role by ID
router.get('/:id',
  checkPermission('MANAGE_ROLES'),
  roleController.getRoleById.bind(roleController)
);

// Get roles by approval level
router.get('/by-level/:level',
  checkPermission('MANAGE_ROLES'),
  roleController.getRolesByApprovalLevel.bind(roleController)
);

// Get approver roles for a specific level
router.get('/approvers/:level',
  checkPermission('MANAGE_ROLES'),
  roleController.getApproverRoles.bind(roleController)
);

// Create new role - SUPER_ADMIN only
router.post('/',
  checkPermission('MANAGE_ROLES'),
  authorizeRoles(['SUPER_ADMIN']),
  roleController.createRole.bind(roleController)
);

// Update role - SUPER_ADMIN only
router.put('/:id',
  checkPermission('MANAGE_ROLES'),
  authorizeRoles(['SUPER_ADMIN']),
  roleController.updateRole.bind(roleController)
);

// Delete role - SUPER_ADMIN only
router.delete('/:id',
  checkPermission('MANAGE_ROLES'),
  authorizeRoles(['SUPER_ADMIN']),
  roleController.deleteRole.bind(roleController)
);

export default router;
