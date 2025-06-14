import { Router, Request, Response, NextFunction } from 'express';
import { WithdrawalController } from '../controllers/withdrawal.controller';
import { 
    authenticateUser, 
    checkPermission, 
    checkModuleAccess,
    authorizeRoles,
    checkPermissionAndLevel // New combined middleware
} from '../../../middlewares/auth';
import { ApiError } from '../../../utils/apiError';

type RouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<void> | void;

const router = Router();
const controller = new WithdrawalController();

// All routes require authentication
router.use(authenticateUser);
router.use(checkModuleAccess('SAVINGS'));

// Create withdrawal request (all authenticated users)
router.post(
    '/',
    checkPermission('REQUEST_WITHDRAWAL'),
    controller.createWithdrawalRequest.bind(controller) as RouteHandler
);

// Get withdrawal requests (with role-based filtering)
router.get(
    '/',
    checkPermission('VIEW_WITHDRAWAL_REQUESTS'),
    controller.getWithdrawalRequests.bind(controller) as RouteHandler
);

// Get withdrawal statistics (admins only)
router.get(
    '/stats',
    authorizeRoles(['ADMIN', 'TREASURER', 'CHAIRMAN', 'SUPER_ADMIN']),
    checkPermission('VIEW_SAVINGS_STATS'),
    controller.getWithdrawalStatistics.bind(controller) as RouteHandler
);

// Get withdrawal by ID
router.get(
    '/:id',
    checkPermission('VIEW_WITHDRAWAL_REQUESTS'),
    controller.getWithdrawalRequestById.bind(controller) as RouteHandler
);

// Update withdrawal status (multi-level approval flow)
router.patch(
    '/:id/status',
    authenticateUser,
    authorizeRoles(['ADMIN', 'TREASURER', 'CHAIRMAN', 'SUPER_ADMIN']),
    (req, res, next) => {
        const status = req.body.status;
        let requiredPermission: string;
        let requiredLevel = 1;

        switch (status) {
            case 'IN_REVIEW':
                requiredPermission = 'REVIEW_WITHDRAWAL';
                // requiredLevel = 1; // Admin
                break;
            case 'REVIEWED':
                // Treasurer can review
                requiredPermission = 'REVIEW_WITHDRAWAL';
                requiredLevel = 2; // Treasurer
                break;
            case 'APPROVED':
                // Chairman for approval (level 3) or Treasurer for disbursement (level 2)
                const isLastApproval = req.body.isLastApproval === true;
                requiredPermission = isLastApproval ? 'APPROVE_WITHDRAWAL' : 'VERIFY_WITHDRAWAL';
                requiredLevel = isLastApproval ? 3 : 2;
                break;
            case 'REJECTED':
                // Anyone in approval chain can reject
                requiredPermission = 'REVIEW_WITHDRAWAL';
                requiredLevel = 2;
                break;
            case 'COMPLETED':
                // Only Treasurer can process completed withdrawals
                requiredPermission = 'PROCESS_WITHDRAWAL';
                requiredLevel = 2; // Treasurer
                break;
            default:
                return next(new ApiError('Invalid status transition', 400));
        }

        // Use the combined middleware for a single check
        checkPermissionAndLevel(requiredPermission, requiredLevel)(req, res, next);
    },
    controller.updateWithdrawalStatus.bind(controller) as RouteHandler
);

export default router;