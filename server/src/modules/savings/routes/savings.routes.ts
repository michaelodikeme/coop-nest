import { Router, Request, Response, NextFunction } from 'express';
import { SavingsController } from '../controllers/savings.controller';
import { 
    checkPermission, 
    authenticateUser, 
    checkApprovalLevel, 
    checkModuleAccess,
    authorizeRoles
} from '../../../middlewares/auth';
import { validateRequest as validate } from '../../../middlewares/validateRequest';
import { 
    listSavingsQuerySchema, 
    createSavingsSchema,
    monthlySavingsParamsSchema,
    transactionQuerySchema 
} from '../validations/savings.validation';
import { upload } from '../../../utils/upload';

type RouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<void> | void;

const router = Router();
const savingsController = new SavingsController();

router.use(checkModuleAccess('SAVINGS'));
router.use(authenticateUser);

// Member routes
router.get(
    '/my-savings',
    checkPermission('VIEW_SAVINGS'),
    savingsController.getMemberSavings.bind(savingsController) as RouteHandler
);

router.get(
    '/summary',
    checkPermission('VIEW_SAVINGS'),
    savingsController.getSavingsSummary.bind(savingsController) as RouteHandler
);

// Transaction history
router.get(
    '/transactions/:savingsId?',
    validate(transactionQuerySchema),
    checkPermission('VIEW_SAVINGS'),
    savingsController.getTransactionHistory.bind(savingsController) as RouteHandler
);


// Admin routes
router.get(
    '/',
    validate(listSavingsQuerySchema),
    checkPermission('VIEW_SAVINGS'),
    savingsController.getAllSavings.bind(savingsController) as RouteHandler
);

// Monthly savings
router.get(
    '/monthly/:year/:month',
    authorizeRoles(['ADMIN', 'TREASURER']),
    checkPermission('VIEW_SAVINGS'),
    savingsController.getMonthlySavings.bind(savingsController) as RouteHandler
);

// Stats routes
router.get(
    '/stats/:year',
    authorizeRoles(['ADMIN', 'TREASURER', 'CHAIRMAN', 'SUPER_ADMIN']),
    checkPermission('VIEW_SAVINGS_STATS'),
    savingsController.getSavingsStats.bind(savingsController) as RouteHandler
);

router.post(
    '/create',
    validate(createSavingsSchema),
    checkPermission('PROCESS_DEPOSITS'),
    savingsController.createMonthlySavings.bind(savingsController) as RouteHandler
);

// Bulk operations routes
router.post(
    '/upload', 
    upload,
    checkPermission('UPLOAD_SAVINGS'),
    savingsController.uploadBulkSavings.bind(savingsController) as RouteHandler
);

// Backup routes
router.get(
    '/backup', 
    checkPermission('PROCESS_SAVINGS'),
    checkApprovalLevel(3),
    savingsController.backupSavings.bind(savingsController) as RouteHandler
);

// Statement routes
router.get(
    '/statement/:erpId',
    validate(monthlySavingsParamsSchema),
    checkPermission('VIEW_SAVINGS'),
    savingsController.getSavingsStatement.bind(savingsController) as RouteHandler
);

router.get(
    '/statement/:erpId/download',
    checkPermission('VIEW_SAVINGS'),
    savingsController.downloadSavingsStatement.bind(savingsController) as RouteHandler
);

// Get members savings summary
router.get(
  '/members-summary',
  checkPermission('VIEW_SAVINGS'),
  savingsController.getMembersSummary.bind(savingsController) as RouteHandler
);


export default router;