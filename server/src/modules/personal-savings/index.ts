import { Router } from 'express';
import personalSavingsRoutes from './routes/personal-savings.routes';

// Export PersonalSavings module routes
const personalSavingsRouter = Router();
personalSavingsRouter.use('/personal-savings', personalSavingsRoutes);

export default personalSavingsRouter;
