import { Router, NextFunction, Request, Response } from 'express';
import { TransactionController } from '../controllers/transaction.controller';
import { 
  authenticateUser,
  authorizeRoles,
  checkPermission
} from '../../../middlewares/auth';

const router = Router();
const transactionController = new TransactionController();
type RouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<void> | void;

// Apply authentication to all transaction routes
router.use(authenticateUser);

// Transaction creation endpoints
router.post(
  '/',
  authorizeRoles(['ADMIN', 'TREASURER', 'CHAIRMAN', 'SUPER_ADMIN']),
  checkPermission('CREATE_TRANSACTION'),
  transactionController.createTransaction.bind(transactionController) as RouteHandler
);

router.get(
  '/',
  authorizeRoles(['ADMIN', 'TREASURER', 'CHAIRMAN', 'SUPER_ADMIN']),
  checkPermission('VIEW_TRANSACTIONS'),
  transactionController.getAllTransactions.bind(transactionController) as RouteHandler
);

router.post(
  '/batch',
  authorizeRoles(['ADMIN', 'TREASURER', 'CHAIRMAN', 'SUPER_ADMIN']),
  checkPermission('CREATE_TRANSACTION'),
  transactionController.createBatchTransactions.bind(transactionController) as RouteHandler
);

// Analytics & Reporting endpoints
router.get(
  '/summary',
  authorizeRoles(['ADMIN', 'TREASURER', 'CHAIRMAN', 'SUPER_ADMIN']),
  checkPermission('VIEW_TRANSACTION_ANALYTICS'),
  transactionController.getTransactionSummary.bind(transactionController) as RouteHandler
);

router.get(
  '/reports',
  authorizeRoles(['ADMIN', 'TREASURER', 'CHAIRMAN', 'SUPER_ADMIN']),
  checkPermission('GENERATE_REPORTS'),
  transactionController.generateReport.bind(transactionController) as RouteHandler
);

router.get(
  '/counts',
  authorizeRoles(['ADMIN', 'TREASURER', 'CHAIRMAN', 'SUPER_ADMIN']),
  checkPermission('VIEW_TRANSACTION_ANALYTICS'),
  transactionController.getTransactionCounts.bind(transactionController) as RouteHandler
);

// Search endpoint
router.get(
  '/search',
  authorizeRoles(['ADMIN', 'TREASURER', 'CHAIRMAN', 'SUPER_ADMIN']),
  checkPermission('VIEW_TRANSACTIONS'),
  transactionController.searchTransactions.bind(transactionController) as RouteHandler
);

// Entity & User specific transactions
router.get(
  '/entity/:entityType/:entityId',
  checkPermission('VIEW_TRANSACTIONS'),
  transactionController.getEntityTransactions.bind(transactionController) as RouteHandler
);

router.get(
  '/user/:userId?',
  checkPermission('VIEW_TRANSACTIONS'),
  transactionController.getUserTransactions.bind(transactionController) as RouteHandler
);

// Single transaction operations - needs to be after other GET routes
router.get(
  '/:id',
  checkPermission('VIEW_TRANSACTIONS'),
  transactionController.getTransaction.bind(transactionController) as RouteHandler
);

router.patch(
  '/:id/status',
  authorizeRoles(['ADMIN', 'TREASURER', 'CHAIRMAN', 'SUPER_ADMIN']),
  checkPermission('UPDATE_TRANSACTION'),
  transactionController.updateTransactionStatus.bind(transactionController) as RouteHandler
);

router.post(
  '/:id/reverse',
  authorizeRoles(['TREASURER', 'CHAIRMAN', 'SUPER_ADMIN']),
  checkPermission('REVERSE_TRANSACTION'),
  transactionController.reverseTransaction.bind(transactionController) as RouteHandler
);

export default router;
