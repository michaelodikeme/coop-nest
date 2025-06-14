import { Router } from 'express';
import savingsRoutes from './savings.routes'
import configurationRoutes from '../../system/routes/shares.routes';
import withdrawalRoutes from './withdrawal.routes';
import personalSavings from '../../personal-savings/routes/personal-savings.routes'

const router = Router();

router.use('/', savingsRoutes);
router.use('/config', configurationRoutes);
router.use('/withdrawal', withdrawalRoutes);
router.use('/personal', personalSavings);

export default router;