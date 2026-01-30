import { Router, Request, Response, NextFunction } from 'express';
import { PersonalSavingsController } from '../controllers/personal-savings.controller';
import { 
    checkPermission, 
    authenticateUser, 
    checkApprovalLevel, 
    checkModuleAccess,
    authorizeRoles
} from '../../../middlewares/auth';

type RouteHandler = (req: Request, res: Response) => Promise<void> | void;

const router = Router();
const personalSavingsController = new PersonalSavingsController();

router.use(authenticateUser);
router.use(checkModuleAccess('SAVINGS')); // Using existing savings module access

// Member routes - Create and view personal savings plans
// Route for members to request new personal savings plan
router.post(
    '/request',
    checkPermission('CREATE_PERSONAL_SAVINGS'),
    personalSavingsController.requestPersonalSavingsCreation.bind(personalSavingsController) as unknown as RouteHandler
);

// Get all personal savings plans (filtered by member if not admin)
router.get(
    '/',
    checkPermission('VIEW_PERSONAL_SAVINGS'),
    personalSavingsController.getAllPersonalSavings.bind(personalSavingsController) as unknown as RouteHandler
);

// Get all available personal savings plan types
router.get(
    '/plans',
    checkPermission('VIEW_PERSONAL_SAVINGS'),
    personalSavingsController.getPersonalSavingsPlans.bind(personalSavingsController) as unknown as RouteHandler
);

// Get member summary - MUST be before /:id to avoid matching "member" as an ID
router.get(
    '/member/:erpId/summary',
    checkPermission('VIEW_PERSONAL_SAVINGS'),
    personalSavingsController.getMemberSummary.bind(personalSavingsController) as unknown as RouteHandler
);

// Admin dashboard route - MUST be before /:id to avoid matching "admin" as an ID
router.get(
    '/admin/dashboard',
    checkPermission('VIEW_PERSONAL_SAVINGS'),
    authorizeRoles(['ADMIN', 'TREASURER', 'CHAIRMAN']),
    personalSavingsController.getAdminDashboard.bind(personalSavingsController) as unknown as RouteHandler
);

// Get specific personal savings plan
router.get(
    '/:id',
    checkPermission('VIEW_PERSONAL_SAVINGS'),
    personalSavingsController.getPersonalSavingsById.bind(personalSavingsController) as unknown as RouteHandler
);

// Admin route for making deposits (only admin/treasurers can record deposits)
router.post(
    '/:id/deposit',
    checkPermission('PROCESS_PERSONAL_SAVINGS_DEPOSITS'),
    authorizeRoles(['ADMIN', 'TREASURER', 'CHAIRMAN', 'SUPER_ADMIN']),
    personalSavingsController.processDeposit.bind(personalSavingsController) as unknown as RouteHandler
);

// Request withdrawal
router.post(
    '/:id/withdraw',
    checkPermission('REQUEST_WITHDRAWAL'),
    personalSavingsController.requestWithdrawal.bind(personalSavingsController) as unknown as RouteHandler
);

// Close personal savings plan
router.patch(
    '/:id/close',
    checkPermission('MANAGE_PERSONAL_SAVINGS'),
    personalSavingsController.closePlan.bind(personalSavingsController) as unknown as RouteHandler
);

// Get transaction history
router.get(
    '/:id/transactions',
    checkPermission('VIEW_PERSONAL_SAVINGS'),
    personalSavingsController.getTransactionHistory.bind(personalSavingsController) as unknown as RouteHandler
);

// Get balance history for charts
router.get(
    '/:id/balance-history',
    checkPermission('VIEW_PERSONAL_SAVINGS'),
    personalSavingsController.getBalanceHistory.bind(personalSavingsController) as unknown as RouteHandler
);

export default router;