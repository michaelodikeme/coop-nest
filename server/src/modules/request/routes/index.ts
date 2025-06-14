import { Router } from 'express';
import requestRoutes from './request.routes';

const router = Router();

router.use('/', requestRoutes);

export default router;