import app, { initializeApp } from './app';
import env from './config/env';
import logger from './utils/logger';

const PORT = env.PORT || 5001;
const APPLICATION_URL = `${env.APPLICATION_URL}:${PORT}` || `http://localhost:${PORT}`;

if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
}

// Initialize app before starting server
const startServer = async () => {
    try {
        await initializeApp();

        app.listen(PORT, () => {
            logger.info(`Server running on ${APPLICATION_URL}`);
            logger.info(`Swagger docs at ${APPLICATION_URL}/api-docs`);
        }).on('error', (error) => {
            logger.error('Failed to start server:', error);
            process.exit(1);
        });
    } catch (error) {
        logger.error('Failed to initialize application:', error);
        process.exit(1);
    }
};

startServer();