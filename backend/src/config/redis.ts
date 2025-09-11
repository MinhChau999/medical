import Redis from 'ioredis';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

dotenv.config();

class RedisClient {
  private client: Redis | null = null;
  private isConnected: boolean = false;

  constructor() {
    if (process.env.REDIS_HOST) {
      try {
        this.client = new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD,
          retryStrategy: (times) => {
            if (times > 3) {
              logger.warn('Redis connection failed after 3 attempts, running without cache');
              return null;
            }
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
          maxRetriesPerRequest: 3,
          lazyConnect: true,
        });

        this.client.on('error', (err) => {
          logger.error('Redis Client Error', err);
          this.isConnected = false;
        });

        this.client.on('connect', () => {
          logger.info('Connected to Redis');
          this.isConnected = true;
        });

        // Try to connect
        this.client.connect().catch((err) => {
          logger.warn('Could not connect to Redis, running without cache:', err.message);
          this.isConnected = false;
        });
      } catch (error) {
        logger.warn('Redis initialization failed, running without cache');
        this.client = null;
      }
    } else {
      logger.info('Redis not configured, running without cache');
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.client || !this.isConnected) return null;
    try {
      return await this.client.get(key);
    } catch (error) {
      logger.error('Redis get error:', error);
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (!this.client || !this.isConnected) return;
    try {
      if (ttl) {
        await this.client.setex(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      logger.error('Redis set error:', error);
    }
  }

  async setex(key: string, ttl: number, value: string): Promise<void> {
    await this.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    if (!this.client || !this.isConnected) return;
    try {
      await this.client.del(key);
    } catch (error) {
      logger.error('Redis del error:', error);
    }
  }
}

const redisClient = new RedisClient();
export default redisClient;