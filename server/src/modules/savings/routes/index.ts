import { Router } from 'express';
import savingsRoutes from './savings.routes'
import configurationRoutes from '../../system/routes/shares.routes';
import withdrawalRoutes from './withdrawal.routes';

const router = Router();

router.use('/', savingsRoutes);
router.use('/config', configurationRoutes);
router.use('/withdrawal', withdrawalRoutes);

export default router;