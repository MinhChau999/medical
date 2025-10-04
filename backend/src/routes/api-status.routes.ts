import { Router } from 'express';
import { APIStatusController } from '../controllers/api-status.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All API status routes require admin authentication
router.use(authenticate);
router.use(authorize('admin'));

/**
 * @route   GET /api/v1/api-status
 * @desc    Get all API endpoints status
 * @access  Admin only
 */
router.get('/', APIStatusController.getAPIStatus);

/**
 * @route   GET /api/v1/api-status/metrics
 * @desc    Get API performance metrics
 * @access  Admin only
 */
router.get('/metrics', APIStatusController.getAPIMetrics);

export default router;
