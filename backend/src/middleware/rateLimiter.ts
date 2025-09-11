import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

// Completely disable rate limiting in development
const isDevelopment = process.env.NODE_ENV === 'development';

// Bypass middleware for development
const bypassInDev = (middleware: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (isDevelopment) {
      return next();
    }
    return middleware(req, res, next);
  };
};

// General rate limiter - 100 requests per 15 minutes (disabled in dev)
const generalLimiterMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: req.rateLimit?.resetTime
    });
  }
});

// Strict limiter for auth endpoints (disabled in dev)
const authLimiterMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
});

// API endpoint specific limiters (disabled in dev)
const createLimiterMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: 'Too many create requests, please try again later.'
});

const uploadLimiterMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many upload requests, please try again later.'
});

// Search endpoint limiter (disabled in dev)
const searchLimiterMiddleware = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30,
  message: 'Too many search requests, please try again later.'
});

// Export middlewares that are completely bypassed in development
export const generalLimiter = bypassInDev(generalLimiterMiddleware);
export const authLimiter = bypassInDev(authLimiterMiddleware);
export const createLimiter = bypassInDev(createLimiterMiddleware);
export const uploadLimiter = bypassInDev(uploadLimiterMiddleware);
export const searchLimiter = bypassInDev(searchLimiterMiddleware);