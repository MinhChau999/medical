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
import { setupSwagger } from './config/swagger';
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
// import productRoutes from './routes/products-mock.routes';
import orderRoutes from './routes/order.routes';
import customerRoutes from './routes/customer.routes';
import inventoryRoutes from './routes/inventory.routes';
import warehouseRoutes from './routes/warehouse.routes';
import analyticsRoutes from './routes/analytics.routes';
import paymentRoutes from './routes/payment.routes';
import categoriesRoutes from './routes/categories.routes';
import uploadRoutes from './routes/upload.routes';
import homepageRoutes from './routes/homepage.routes';
import databaseRoutes from './routes/database.routes';
import apiStatusRoutes from './routes/api-status.routes';
import securityRoutes from './routes/security.routes';
import blogRoutes from './routes/blog.routes';
import guestOrderRoutes from './routes/guest-order.routes';
import settingsRoutes from './routes/settings.routes';
import posRoutes from './routes/pos.routes';
import { initializeModels } from './models';

// Load .env from root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Initialize Sequelize models
initializeModels();

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
setupSwagger(app);

// Apply rate limiters only in production
if (process.env.NODE_ENV === 'production') {
  // Apply general rate limiter to all API routes
  app.use(`/api/${API_VERSION}/`, generalLimiter);
  // Apply stricter rate limiting to auth routes
  app.use(`/api/${API_VERSION}/auth`, authLimiter);
}

// Auth routes
app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/categories`, categoriesRoutes);
app.use(`/api/${API_VERSION}/products`, productRoutes);
app.use(`/api/${API_VERSION}/orders`, orderRoutes);
app.use(`/api/${API_VERSION}/customers`, customerRoutes);
app.use(`/api/${API_VERSION}/inventory`, inventoryRoutes);
app.use(`/api/${API_VERSION}/warehouses`, warehouseRoutes);
app.use(`/api/${API_VERSION}/analytics`, analyticsRoutes);
app.use(`/api/${API_VERSION}/payment`, paymentRoutes);
app.use(`/api/${API_VERSION}/upload`, uploadRoutes);
app.use(`/api/${API_VERSION}/homepage`, homepageRoutes);
app.use(`/api/${API_VERSION}/database`, databaseRoutes);
app.use(`/api/${API_VERSION}/api-status`, apiStatusRoutes);
app.use(`/api/${API_VERSION}/security`, securityRoutes);
app.use(`/api/${API_VERSION}/blog`, blogRoutes);
app.use(`/api/${API_VERSION}/guest-orders`, guestOrderRoutes);
app.use(`/api/${API_VERSION}/settings`, settingsRoutes);
app.use(`/api/${API_VERSION}/pos`, posRoutes);

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
}).on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use. Please stop other instances or use a different port.`);
    process.exit(1);
  } else {
    logger.error('Server error:', err);
    throw err;
  }
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export default app;