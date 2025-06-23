import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import routes from '../routes';
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import logger from '../utils/logger';
import { errorHandler } from '../middlewares/errorHandler';
import { securityHeaders } from '../middlewares/rateLimiter';
import { requestLogger, requestContextMiddleware } from '../middlewares/request.middleware';
import swaggerDocs from '../docs/swaggerDocs';
import { PermissionSyncService } from '../utils/permissionSync';
import { SystemSettingsService } from '../modules/system/services/systemSettings.service';
import { authenticateUser } from '../middlewares/auth';
import { generateCsrfToken, validateCsrfToken } from '../middlewares/csrf';
import { authRateLimiter } from '../middlewares/rateLimit';
import { healthService } from '../services/health.service';


const app = express();
const prisma = new PrismaClient();
const permissionSync = new PermissionSyncService(prisma);

// Middleware setup
app.use(cors({
    origin: process.env.CORS_ORIGINS?.split(',') || [
        'http://localhost:3000', 
        'http://168.231.116.82:3000',
        'http://172.16.0.2:3000', 
        'http://192.168.158.126:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(securityHeaders);
app.use(requestLogger);
app.use(requestContextMiddleware);

// Initialize application
const initializeApp = async (): Promise<void> => {
    try {
        // Sync permissions before starting the app
        await permissionSync.syncPermissions();
        
        // Initialize system settings with singleton
        const systemSettings = SystemSettingsService.getInstance();
        await systemSettings.initializeDefaultSettings();
        
        // Verify DEFAULT_SHARE_AMOUNT was created
        const shareAmount = await systemSettings.getSetting<Decimal>('DEFAULT_SHARE_AMOUNT');
        logger.info('System settings initialized successfully', { shareAmount });
        
        // Health check endpoint
        app.get('/api/health', async (_req, res) => {
            const health = await healthService.checkHealth();
            const statusCode = health.status === 'healthy' ? 200 : 
            health.status === 'degraded' ? 200 : 503;
            
            res.status(statusCode).json(health);
        });
        
        // API routes
        app.use('/api', routes);
        
        // Swagger documentation
        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs, {
            swaggerOptions: {
                persistAuthorization: true
            }
        }));
        
        // Apply rate limiting to auth routes
        // Commented out during development as requested
        // app.use('/api/auth', authRateLimiter);
        
        // Apply authentication middleware to protected routes
        app.use('/api/protected', authenticateUser);
        
        // Generate CSRF token for authenticated users
        app.use(generateCsrfToken);
        
        // Validate CSRF token for mutating operations
        app.use('/api/protected', validateCsrfToken);
        
        // Error handling
        app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction): void => {
            errorHandler(err, req, res, next);
        });
        
        logger.info('Application initialized successfully');
    } catch (error) {
        logger.error('Application initialization failed:', error);
        throw error;
    }
};

// Call initializeApp immediately
initializeApp().catch(error => {
    logger.error('Failed to initialize application:', error);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    await prisma.$disconnect();
    process.exit(0);
});

export default app;
