import { Router } from 'express';
import { DatabaseController } from '../controllers/database.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All database routes require admin authentication
router.use(authenticate);
router.use(authorize('admin'));

/**
 * @route   GET /api/v1/database/stats
 * @desc    Get database statistics
 * @access  Admin only
 */
router.get('/stats', DatabaseController.getDatabaseStats);

/**
 * @route   GET /api/v1/database/health
 * @desc    Get database health status
 * @access  Admin only
 */
router.get('/health', DatabaseController.getDatabaseHealth);

/**
 * @route   GET /api/v1/database/tables/:tableName
 * @desc    Get detailed information about a specific table
 * @access  Admin only
 */
router.get('/tables/:tableName', DatabaseController.getTableInfo);

export default router;
