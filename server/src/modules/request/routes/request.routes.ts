import { Router, Request, Response, NextFunction } from 'express';
import { RequestController } from '../controllers/request.controller';
import { 
    authenticateUser, 
    authorizeRoles,
    checkPermissionAndLevel
} from '../../../middlewares/auth';
import { validateRequest as validate } from '../../../middlewares/validateRequest';
import { 
    createRequestSchema,
    updateRequestStatusSchema 
} from '../validations/request.validation';
import { ApiError } from '../../../utils/apiError';

type RouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<void> | void;

const router = Router();
const controller = new RequestController();

// All routes require authentication
router.use(authenticateUser);

// Create new request (all authenticated users)
router.post(
    '/',
    validate(createRequestSchema),
    controller.createRequest.bind(controller) as RouteHandler
);

// Get user's own requests
router.get(
    '/user',
    controller.getUserRequests.bind(controller) as RouteHandler
);

// Get pending request count
router.get(
    '/pending-count',
    controller.getPendingRequestCount.bind(controller) as RouteHandler
);

// Get request statistics (admin only)
router.get(
    '/statistics',
    authorizeRoles(['ADMIN', 'TREASURER', 'CHAIRMAN', 'SUPER_ADMIN']),
    controller.getRequestStatistics.bind(controller) as RouteHandler
);

// Get all requests (admin only)
router.get(
    '/',
    authorizeRoles(['ADMIN', 'TREASURER', 'CHAIRMAN', 'SUPER_ADMIN']),
    controller.getAllRequests.bind(controller) as RouteHandler
);

// Get a single request by ID
router.get(
    '/:id',
    controller.getRequestById.bind(controller) as RouteHandler
);

// Update request status
router.put(
    '/:id',
    // validate(updateRequestStatusSchema),
    (req, res, next) => {
        const status = req.body.status;
        let requiredPermission: string;
        let requiredLevel = 1;

        switch (status) {
            case 'IN_REVIEW':
                requiredPermission = 'REVIEW_REQUESTS';
                requiredLevel = 1; // Admin
                break;
            case 'REVIEWED':
                requiredPermission = 'VERIFY_REQUESTS';
                requiredLevel = 2; // Treasurer
                break;
            case 'APPROVED':
                requiredPermission = 'APPROVE_REQUESTS';
                requiredLevel = 3; // Chairman
                break;
            case 'COMPLETED':
                requiredPermission = 'PROCESS_REQUESTS';
                requiredLevel = 2; // Treasurer
                break;
            case 'REJECTED':
                requiredPermission = 'REVIEW_REQUESTS';
                requiredLevel = 1; // Anyone in approval chain can reject
                break;
            case 'CANCELLED':
                // Allow members to cancel their own requests
                return next();
            default:
                return next(new ApiError('Invalid status transition', 400));
        }

        // Use the combined middleware for a single check
        checkPermissionAndLevel(requiredPermission, requiredLevel)(req, res, next);
    },
    controller.updateRequestStatus.bind(controller) as RouteHandler
);

// Delete (cancel) a request
router.delete(
    '/:id',
    controller.deleteRequest.bind(controller) as RouteHandler
);

export default router;