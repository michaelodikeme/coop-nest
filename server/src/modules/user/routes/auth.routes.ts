import { Router, Request, Response, NextFunction } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticateUser } from '../../../middlewares/auth';

type RouteHandler = (req: Request, res: Response) => Promise<void> | void;

const router = Router();
const userController = new UserController();

// Public routes
router.post('/login', userController.loginUser.bind(userController));
router.post('/user', userController.createUser.bind(userController) as RouteHandler);
router.post('/refresh-token', userController.refreshToken.bind(userController)); // Add this line

// Protected routes
router.use(authenticateUser);

// Logout route
router.post('/logout', userController.logoutUser.bind(userController));

// Session management
router.get('/me/sessions', userController.getUserSessions.bind(userController));
router.post('/me/sessions/invalidate-all', userController.invalidateAllSessions.bind(userController));

export default router;