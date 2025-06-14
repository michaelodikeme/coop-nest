import { Router } from 'express';
import userRoutes from './user.routes';
import adminRoutes from './admin.routes';

const router = Router();

router.use('/admin', adminRoutes);
router.use('/', userRoutes);

export default router;