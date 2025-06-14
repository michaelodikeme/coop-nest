import Redis from 'ioredis';
import env from './env';
import logger from '../utils/logger';

export const redisClient = new Redis(env.REDIS_URL || 'redis://localhost:6379');

redisClient.on('connect', () => {
  logger.info('Redis client connected');
});

redisClient.on('error', (err: Error) => {
  logger.error('Redis client error:', err);
});

export default redisClient;
