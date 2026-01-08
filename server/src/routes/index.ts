import { Router } from 'express';
import authRoutes from '../modules/user/routes/auth.routes';
// import adminRoutes from '../modules/user/routes/admin.routes';
import userRoutes from '../modules/user/routes';
import roleRoutes from '../modules/user/routes/role.routes';
import accountRoutes from '../modules/account/routes/account.routes';
import biodataRoutes from '../modules/biodata/routes/biodata.routes';
import savingsRoutes from '../modules/savings/routes';
import loanRoutes from '../modules/loan/routes';
import transactions from '../modules/transaction/routes/transaction.routes'
import routes from '../modules/request/routes';
import personalSavingsRouter from '../modules/personal-savings';

import { authenticateUser as authenticate } from '../middlewares/auth';
import adminRoutes from "../modules/user/routes/admin.routes";

const router = Router();

// Health check route
// router.get('/health', (req, res) => {
//   res.status(200).json({ message: 'API is running' });
// });

// Public routes (no authentication required)
router.use('/auth', authRoutes);
router.use('/biodata', biodataRoutes);
router.use('/users', userRoutes);
router.use('/requests', routes);

// Protected routes (require authentication)
router.use(authenticate);
router.use('/roles', roleRoutes);
router.use('/accounts', accountRoutes);
router.use('/savings', savingsRoutes);
router.use('/loan', loanRoutes);
router.use('/transactions', transactions);
router.use('/personal-savings', personalSavingsRouter);
router.use('/admin', adminRoutes);
export default router;