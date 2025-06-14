import { Router } from 'express';
import loanRoutes from './loan.routes';
import repaymentRoutes from './repayment.routes';
import { authenticateUser } from '../../../middlewares/auth';

const router = Router();

// Apply authentication to all loan routes
router.use(authenticateUser);

// Mount sub-routes
router.use('/', loanRoutes);
router.use('/repayment', repaymentRoutes);

export default router;