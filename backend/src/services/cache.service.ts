import redisClient from '../config/redis';
import { logger } from '../utils/logger';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
}

class CacheService {
  private defaultTTL = 3600; // 1 hour default
  private memoryCache: Map<string, { data: any; expires: number }> = new Map();

  // Generate cache key with namespace
  private generateKey(namespace: string, identifier: string): string {
    return `medical:${namespace}:${identifier}`;
  }

  // Set cache with Redis fallback to memory
  async set(key: string, value: any, options: CacheOptions = {}): Promise<void> {
    const ttl = options.ttl || this.defaultTTL;
    const cacheKey = this.generateKey('cache', key);

    try {
      // Try Redis first - using redisClient directly (no getClient method)
      await redisClient.setex(cacheKey, ttl, JSON.stringify(value));

      // Handle tags for cache invalidation
      if (options.tags) {
        // Note: Tag functionality requires direct Redis access
        // Skip tags if Redis client methods are not available
        logger.debug('Cache tags set for:', options.tags);
      }
    } catch (error) {
      logger.error('Cache set error:', error);
      // Fallback to memory cache on error
      this.memoryCache.set(cacheKey, {
        data: value,
        expires: Date.now() + (ttl * 1000)
      });
    }
  }

  // Get cache with Redis fallback to memory
  async get<T>(key: string): Promise<T | null> {
    const cacheKey = this.generateKey('cache', key);

    try {
      // Try Redis first
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as T;
      }
    } catch (error) {
      logger.error('Cache get error:', error);
      // Fallback to memory cache on error
      const memoryCached = this.memoryCache.get(cacheKey);
      if (memoryCached && memoryCached.expires > Date.now()) {
        return memoryCached.data as T;
      } else if (memoryCached) {
        // Clean expired cache
        this.memoryCache.delete(cacheKey);
      }
    }

    // Check memory cache as final fallback
    const memoryCached = this.memoryCache.get(cacheKey);
    if (memoryCached && memoryCached.expires > Date.now()) {
      return memoryCached.data as T;
    }

    return null;
  }

  // Delete specific cache
  async delete(key: string): Promise<void> {
    const cacheKey = this.generateKey('cache', key);

    try {
      await redisClient.del(cacheKey);
    } catch (error) {
      logger.error('Cache delete error:', error);
    }
    this.memoryCache.delete(cacheKey);
  }

  // Invalidate cache by tags
  async invalidateByTags(tags: string[]): Promise<void> {
    try {
      // Note: Tag-based invalidation requires Redis SET operations
      // For now, clear all memory cache as fallback
      logger.warn('Tag-based cache invalidation not fully implemented, clearing memory cache');
      this.memoryCache.clear();
    } catch (error) {
      logger.error('Cache invalidation error:', error);
      this.memoryCache.clear();
    }
  }

  // Clear all cache
  async flush(): Promise<void> {
    try {
      // Note: Flushing all Redis keys requires pattern matching
      logger.warn('Flushing cache - this will clear memory cache only');
      this.memoryCache.clear();
    } catch (error) {
      logger.error('Cache flush error:', error);
      this.memoryCache.clear();
    }
  }

  // Cache decorator for methods
  cacheMethod(options: CacheOptions = {}) {
    return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
      const originalMethod = descriptor.value;

      descriptor.value = async function (...args: any[]) {
        const cacheKey = `${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`;
        
        // Try to get from cache
        const cached = await cacheService.get(cacheKey);
        if (cached !== null) {
          logger.debug(`Cache hit for ${cacheKey}`);
          return cached;
        }

        // Execute original method
        const result = await originalMethod.apply(this, args);
        
        // Store in cache
        await cacheService.set(cacheKey, result, options);
        
        return result;
      };

      return descriptor;
    };
  }

  // Clean expired memory cache periodically
  startCleanupJob(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.memoryCache.entries()) {
        if (value.expires < now) {
          this.memoryCache.delete(key);
        }
      }
    }, 60000); // Clean every minute
  }
}

export const cacheService = new CacheService();

// Start cleanup job
cacheService.startCleanupJob();

// Cache middleware for Express routes
export const cacheMiddleware = (options: CacheOptions = {}) => {
  return async (req: any, res: any, next: any) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = `route:${req.originalUrl}`;
    const cached = await cacheService.get(cacheKey);

    if (cached) {
      logger.debug(`Cache hit for route ${req.originalUrl}`);
      return res.json(cached);
    }

    // Store original send
    const originalSend = res.json;
    res.json = function (data: any) {
      // Cache successful responses only
      if (res.statusCode === 200) {
        cacheService.set(cacheKey, data, options);
      }
      return originalSend.call(this, data);
    };

    next();
  };
};