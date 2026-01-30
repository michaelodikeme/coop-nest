import { Router } from 'express';
import savingsRoutes from './routes/savings.routes';
import withdrawalRoutes from './routes/withdrawal.routes';

const router = Router();

router.use('/savings', savingsRoutes);
router.use('/withdrawal', withdrawalRoutes);

export default router;