import { Router } from 'express';
import { accountController } from '../controllers/account.controller';
import { validateRequest } from '../../../middlewares/validateRequest';
import { authenticateUser, checkPermission, checkApprovalLevel } from '../../../middlewares/auth';
import {
  createAccountSchema,
  updateAccountSchema,
  verifyAccountSchema,
  getAccountSchema,
  getAccountsQuerySchema,
  processRequestSchema
} from '../validations/account.validation';

const router = Router();

// Apply authentication middleware to all account routes
router.use(authenticateUser);

// Member routes
router.post(
  '/',
  validateRequest(createAccountSchema),
  accountController.createAccount.bind(accountController)
);

router.get(
  '/me',
  accountController.getMyAccount.bind(accountController)
);

router.post(
  '/:id/update-request',
  validateRequest(updateAccountSchema),
  accountController.requestAccountUpdate.bind(accountController)
);

// Admin routes
router.get(
  '/',
  checkPermission('VIEW_ACCOUNTS'),
  validateRequest(getAccountsQuerySchema),
  accountController.getAccounts.bind(accountController)
);

router.get(
  '/:id',
  checkPermission('VIEW_ACCOUNTS'),
  validateRequest(getAccountSchema),
  accountController.getAccount.bind(accountController)
);

// Account verification routes - restricted to verifiers
router.post(
  '/verify',
  checkPermission('VERIFY_ACCOUNTS'),
  validateRequest(verifyAccountSchema),
  accountController.verifyAccount.bind(accountController)
);

// Request processing routes
router.post(
  '/requests/:requestId/process',
  checkPermission('APPROVE_ACCOUNTS'),
  checkApprovalLevel(2),
  validateRequest(processRequestSchema),
  accountController.processAccountUpdateRequest.bind(accountController)
);

export default router;