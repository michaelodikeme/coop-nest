import { redisClient } from '../config/redis';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  redis: boolean;
  database: boolean;
  timestamp: Date;
  details?: Record<string, any>;
}

class HealthService {
  private lastStatus: HealthStatus | null = null;
  private checkInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    // Start periodic health checks
    this.startPeriodicChecks();
  }
  
  private startPeriodicChecks(intervalMs = 60000) {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    
    this.checkInterval = setInterval(async () => {
      try {
        await this.checkHealth();
      } catch (error) {
        logger.error('Health check failed', error);
      }
    }, intervalMs);
  }
  
  async checkRedis(): Promise<boolean> {
    try {
      await redisClient.ping();
      return true;
    } catch (error) {
      logger.error('Redis health check failed', error);
      return false;
    }
  }
  
  async checkDatabase(): Promise<boolean> {
    try {
      // Simple query to check if database is responsive
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      logger.error('Database health check failed', error);
      return false;
    }
  }
  
  async checkHealth(): Promise<HealthStatus> {
    const [redisStatus, dbStatus] = await Promise.all([
      this.checkRedis(),
      this.checkDatabase()
    ]);
    
    const status: HealthStatus = {
      status: redisStatus && dbStatus ? 'healthy' : 
              (redisStatus || dbStatus ? 'degraded' : 'unhealthy'),
      redis: redisStatus,
      database: dbStatus,
      timestamp: new Date()
    };
    
    // If status changed from last check, log it
    if (!this.lastStatus || 
        this.lastStatus.status !== status.status || 
        this.lastStatus.redis !== status.redis || 
        this.lastStatus.database !== status.database) {
      
      if (status.status !== 'healthy') {
        logger.warn('System health degraded', status);
      } else if (this.lastStatus && this.lastStatus.status !== 'healthy') {
        logger.info('System health recovered', status);
      }
    }
    
    this.lastStatus = status;
    return status;
  }
  
  // Get the last recorded health status
  getLastStatus(): HealthStatus | null {
    return this.lastStatus;
  }
  
  // Check if Redis is available with fallback handling
  async withRedisFallback<T>(
    redisOperation: () => Promise<T>,
    fallbackOperation: () => Promise<T>
  ): Promise<T> {
    try {
      // Attempt Redis operation
      return await redisOperation();
    } catch (error) {
      logger.warn('Redis operation failed, using fallback', error);
      // Fall back to alternative implementation
      return await fallbackOperation();
    }
  }
}

// Export singleton instance
export const healthService = new HealthService();