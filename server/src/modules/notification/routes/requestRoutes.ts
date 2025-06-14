import express from 'express';
import { RequestController } from '../controllers/requestController';
import authMiddleware from '../../../middlewares/authMiddleware';
import { checkPermission } from '../../../middlewares/permissionMiddleware';
import { validateCreateRequest, validateUpdateRequest, validateRequestQuery } from '../middleware/requestValidation';

const router = express.Router();
const requestController = new RequestController();

// Member routes (requires authentication)
router.get('/user', 
  authMiddleware, 
  checkPermission(['view_own_requests']),
  validateRequestQuery, 
  requestController.getUserRequests
);

// Create request based on type (each requires specific permissions)
router.post('/biodata-approval',
  authMiddleware,
  validateCreateRequest,
  checkPermission(['view_own_profile']),
  requestController.createRequest
);

router.post('/loan-application',
  authMiddleware,
  validateCreateRequest,
  checkPermission(['apply_for_loan']),
  requestController.createRequest
);

router.post('/savings-withdrawal',
  authMiddleware,
  validateCreateRequest,
  checkPermission(['create_withdrawal_request']),
  requestController.createRequest
);

router.post('/share-withdrawal',
  authMiddleware,
  validateCreateRequest,
  checkPermission(['create_share_withdrawal_request']),
  requestController.createRequest
);

// Admin routes (requires admin permissions)
router.get('/', 
  authMiddleware,
  checkPermission(['view_all_requests']),
  validateRequestQuery,
  requestController.getRequests
);

router.get('/pending-count',
  authMiddleware,
  checkPermission(['view_all_requests']),
  requestController.getPendingCount
);

router.get('/:id',
  authMiddleware,
  checkPermission(['view_all_requests']),
  requestController.getRequest
);

router.put('/:id',
  authMiddleware,
  checkPermission(['process_requests', 'approve_requests']),
  validateUpdateRequest,
  requestController.updateRequest
);

router.delete('/:id',
  authMiddleware,
  checkPermission(['process_requests']),
  requestController.deleteRequest
);

export default router;