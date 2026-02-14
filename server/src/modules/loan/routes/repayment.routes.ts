import { Router, Request, Response } from 'express';
import { RepaymentController } from '../controllers/repayment.controller';
import { authenticateUser, checkPermission, checkApprovalLevel } from '../../../middlewares/auth';
import { upload } from '../../../utils/upload';
import { validateRequest as validate } from '../../../middlewares/validateRequest';
import { repaymentSchema } from '../validations/repayment.validation';

type RouteHandler = (req: Request, res: Response) => Promise<void> | void;

const router = Router();
const controller = new RepaymentController();

// All routes require authentication
router.use(authenticateUser);

// Process single repayment (Treasurer level)
router.post(
    '/process',
    checkPermission('PROCESS_LOANS_REPAYMENT'),
    checkApprovalLevel(2),
    validate(repaymentSchema),
    controller.processRepayment.bind(controller) as RouteHandler
);

// Process bulk repayments (Treasurer level)
router.post(
    '/bulk',
    checkPermission('PROCESS_LOANS_REPAYMENT'),
    // checkApprovalLevel(2),
    upload,
    controller.processBulkRepayments.bind(controller) as RouteHandler
);

// Upload bulk loan repayments (Treasurer level)
router.post(
    '/upload',
    upload,
    checkPermission('PROCESS_LOANS_REPAYMENT'),
    controller.uploadBulkLoanRepayments.bind(controller) as RouteHandler
);

// Download repayment template (Staff level)
router.get(
    '/template',
    // checkPermission('PROCESS_LOANS_REPAYMENT'), // Temporarily disabled
    // checkApprovalLevel(1), // Temporarily disabled
    controller.downloadRepaymentTemplate.bind(controller) as RouteHandler
);

// Download monthly repayment template by loan type
router.get(
    '/monthly-template',
    checkPermission('PROCESS_LOANS_REPAYMENT'),
    checkApprovalLevel(1),
    controller.downloadMonthlyRepaymentTemplate.bind(controller) as RouteHandler
);

// Get repayment history for a loan
router.get(
    '/loan/:loanId',
    checkPermission('VIEW_LOANS'),
    controller.getRepaymentHistory.bind(controller) as RouteHandler
);

// Get outstanding loans (Treasurer level)
router.get(
    '/outstanding',
    checkPermission('VIEW_LOANS'),
    checkApprovalLevel(2),
    controller.getOutstandingLoans.bind(controller) as RouteHandler
);

// Get member repayment history
router.get(
    '/member/:erpId',
    checkPermission('VIEW_LOANS'),
    controller.getMemberRepaymentHistory.bind(controller) as RouteHandler
);

// Add aging report route
router.get(
    '/aging-report',
    checkPermission('VIEW_LOANS'),
    checkApprovalLevel(2),
    controller.getLoanAgingReport.bind(controller) as RouteHandler
);

// Add check overdue payments route
router.post(
    '/check-overdue',
    checkPermission('MANAGE_LOANS'),
    checkApprovalLevel(2),
    controller.checkOverduePayments.bind(controller) as RouteHandler
);

// Add get monthly repayment report route
router.get(
    '/monthly-report',
    checkPermission('VIEW_LOANS'),
    checkApprovalLevel(1),
    controller.getMonthlyRepaymentReport.bind(controller) as RouteHandler
);

export default router;
