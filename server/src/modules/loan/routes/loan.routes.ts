import { Router, Request, Response } from 'express';
import { LoanController } from '../controllers/loan.controller';
import { 
    authenticateUser, 
    checkPermission, 
    checkApprovalLevel,
    checkModuleAccess,
    authorizeRoles 
} from '../../../middlewares/auth';
import { validateRequest } from '../../../middlewares/validateRequest';
import { loanSummaryQuerySchema, loansQuerySchema } from '../validations/loan.validation';
import { ApiError } from '../../../utils/apiError';

type RouteHandler = (req: Request, res: Response) => Promise<void> | void;

const router = Router();
const controller = new LoanController();

// All routes require authentication
router.use(authenticateUser);
router.use(checkModuleAccess('LOAN'));

// Public routes (require basic authentication)
router.get(
    '/types',
    checkPermission('VIEW_LOANS'),
    controller.getLoanTypes.bind(controller) as RouteHandler
);

// Member routes
router.post(
    '/eligibility',
    authorizeRoles(['MEMBER', 'ADMIN']),
    checkPermission('INITIATE_LOAN'),
    controller.checkEligibility.bind(controller) as RouteHandler
);

router.post(
    '/calculate',
    authorizeRoles(['MEMBER', 'ADMIN']),
    // checkPermission('INITIATE_LOAN'),
    controller.calculateLoan.bind(controller) as RouteHandler
);

router.post(
    '/apply',
    checkPermission('INITIATE_LOAN'),
    controller.applyForLoan.bind(controller) as RouteHandler
);

// Add summary route - Admin only route
router.get(
    '/summary',
    // checkPermission('VIEW_LOANS'),
    checkModuleAccess('LOAN'),
    validateRequest(loanSummaryQuerySchema),
    controller.getLoansSummary.bind(controller) as RouteHandler
);

// Admin routes with approval levels
router.get(
    '/member/:biodataId',
    checkPermission('VIEW_LOANS'),
    controller.getMemberLoans.bind(controller) as RouteHandler
);

router.get(
    '/:id',
    checkPermission('VIEW_LOANS'),
    controller.getLoanDetails.bind(controller) as RouteHandler
);

// Status update routes with approval levels
router.patch(
    '/:id/status',
    authenticateUser,
    authorizeRoles(['ADMIN', 'CHAIRMAN', 'TREASURER', 'SUPER_ADMIN']),
    (req, res, next) => {
        const status = req.body.status;
        let requiredPermission: string;
        // let requiredLevel = 1;

        switch (status) {
            case 'IN_REVIEW':
                requiredPermission = 'REVIEW_LOAN_APPLICATIONS';
                // requiredLevel = 1; // Admin
                break;
            case 'REVIEWED':
                requiredPermission = 'REVIEW_LOAN';
                // requiredLevel = 2; // Treasurer
                break;
            case 'APPROVED':
                requiredPermission = 'APPROVE_LOANS';
                // requiredLevel = 3; // Chairman
            case 'REJECTED':
                requiredPermission = 'APPROVE_LOANS';
                // requiredLevel = 3; // Chairman
                break;
            case 'DISBURSED':
                requiredPermission = 'DISBURSE_LOAN';
                // requiredLevel = 2; // Treasurer
                break;
            default:
                throw new ApiError('Invalid loan status', 400);
        }

        // Run permission check and approval level check in parallel
        Promise.all([
            new Promise((resolve, reject) => {
                checkPermission(requiredPermission)(req, res, (err) => {
                    if (err) reject(err);
                    resolve(true);
                });
            }),
            // new Promise((resolve, reject) => {
            //     checkApprovalLevel(requiredLevel)(req, res, (err) => {
            //         if (err) reject(err);
            //         resolve(true);
            //     });
            // })
        ])
        .then(() => next())
        .catch(next);
    },
    controller.updateLoanStatus.bind(controller) as RouteHandler
);

// Get all loans (admin only)
router.get(
  '/',
  checkPermission('VIEW_LOANS'),
  validateRequest(loansQuerySchema),
  controller.getAllLoans.bind(controller) as RouteHandler
);

// Add this route with existing admin/treasurer routes
router.get(
    '/summary/enhanced',
    checkPermission('VIEW_LOANS'),
    authorizeRoles(['ADMIN', 'TREASURER', 'CHAIRMAN']),
    controller.getEnhancedLoansSummary.bind(controller) as unknown as RouteHandler
);

export default router;
