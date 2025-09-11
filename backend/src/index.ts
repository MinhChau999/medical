import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { generalLimiter, authLimiter } from './middleware/rateLimiter';
import { sanitizeInput } from './middleware/validation';
// import { setupSwagger } from './config/swagger';
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import orderRoutes from './routes/order.routes';
import customerRoutes from './routes/customer.routes';
import inventoryRoutes from './routes/inventory.routes';
import analyticsRoutes from './routes/analytics.routes';
import paymentRoutes from './routes/payment.routes';
// import uploadRoutes from './routes/upload.routes';

// Load .env from root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app: Express = express();
const PORT = process.env.BACKEND_PORT || 3000;
const API_VERSION = process.env.API_VERSION || 'v1';

// Security middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production',
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') 
    : true,
  credentials: true,
  maxAge: 86400, // 24 hours
}));

// Compression middleware
app.use(compression({
  level: 6,
  threshold: 100 * 1024, // 100kb
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization
app.use(sanitizeInput);

// Setup Swagger documentation
// setupSwagger(app);

// Apply rate limiters only in production
if (process.env.NODE_ENV === 'production') {
  // Apply general rate limiter to all API routes
  app.use(`/api/${API_VERSION}/`, generalLimiter);
  // Apply stricter rate limiting to auth routes
  app.use(`/api/${API_VERSION}/auth`, authLimiter);
}

// Auth routes
app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/products`, productRoutes);
app.use(`/api/${API_VERSION}/orders`, orderRoutes);
app.use(`/api/${API_VERSION}/customers`, customerRoutes);
app.use(`/api/${API_VERSION}/inventory`, inventoryRoutes);
app.use(`/api/${API_VERSION}/analytics`, analyticsRoutes);
app.use(`/api/${API_VERSION}/payment`, paymentRoutes);
// app.use(`/api/${API_VERSION}/upload`, uploadRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: API_VERSION
  });
});

// API stats endpoint
app.get(`/api/${API_VERSION}/stats`, (req, res) => {
  res.status(200).json({
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    cpuUsage: process.cpuUsage(),
    timestamp: new Date().toISOString()
  });
});

app.use(errorHandler);

const server = app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
  logger.info(`API Version: ${API_VERSION}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
  });
});

export default app;