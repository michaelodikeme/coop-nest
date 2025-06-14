import { Router } from 'express';
import savingsRoutes from './routes/savings.routes';
import sharesRoutes from './routes/shares.routes';
import withdrawalRoutes from './routes/withdrawal.routes';

const router = Router();

router.use('/savings', savingsRoutes);
router.use('/shares', sharesRoutes);
router.use('/withdrawal', withdrawalRoutes);

export default router;