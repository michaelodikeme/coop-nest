import express from 'express';
import { RequestController } from '../controllers/requestController';
import { authenticateUser, checkPermission } from '../../../middlewares/auth';
import { validateCreateRequest, validateUpdateRequest, validateRequestQuery } from '../middleware/requestValidation';

const router = express.Router();
const requestController = new RequestController();

// Member routes (requires authentication)
router.get('/user',
  authenticateUser,
  checkPermission('VIEW_OWN_REQUESTS'),
  validateRequestQuery,
  requestController.getUserRequests
);

// Create request based on type (each requires specific permissions)
router.post('/biodata-approval',
  authenticateUser,
  validateCreateRequest,
  checkPermission('VIEW_OWN_PROFILE'),
  requestController.createRequest
);

router.post('/loan-application',
  authenticateUser,
  validateCreateRequest,
  checkPermission('APPLY_FOR_LOAN'),
  requestController.createRequest
);

router.post('/savings-withdrawal',
  authenticateUser,
  validateCreateRequest,
  checkPermission('CREATE_WITHDRAWAL_REQUEST'),
  requestController.createRequest
);

router.post('/share-withdrawal',
  authenticateUser,
  validateCreateRequest,
  checkPermission('CREATE_SHARE_WITHDRAWAL_REQUEST'),
  requestController.createRequest
);

// Admin routes (requires admin permissions)
router.get('/',
  authenticateUser,
  checkPermission('VIEW_ALL_REQUESTS'),
  validateRequestQuery,
  requestController.getRequests
);

router.get('/pending-count',
  authenticateUser,
  checkPermission('VIEW_ALL_REQUESTS'),
  requestController.getPendingCount
);

router.get('/:id',
  authenticateUser,
  checkPermission('VIEW_ALL_REQUESTS'),
  requestController.getRequest
);

router.put('/:id',
  authenticateUser,
  checkPermission('PROCESS_REQUESTS'),
  validateUpdateRequest,
  requestController.updateRequest
);

router.delete('/:id',
  authenticateUser,
  checkPermission('PROCESS_REQUESTS'),
  requestController.deleteRequest
);

export default router;