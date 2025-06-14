import app from './app';
import env from './config/env';
import logger from './utils/logger';

const PORT = env.PORT || 5001;
const APPLICATION_URL = `${env.APPLICATION_URL}:${PORT}` || `http://localhost:${PORT}`;

// Add to your server startup code
if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  // Start the server
app.listen(PORT, () => {
    logger.info(`🚀 Server is running on ${APPLICATION_URL}`);
    logger.info(`📚 Swagger docs available at ${APPLICATION_URL}/api-docs`);
}).on('error', (error) => {
    logger.error('Failed to start server:', error);
    process.exit(1);
});