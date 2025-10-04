import { Router } from 'express';
import { SecurityController } from '../controllers/security.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All security routes require admin authentication
router.use(authenticate);
router.use(authorize('admin'));

/**
 * @route   GET /api/v1/security/overview
 * @desc    Get security overview and metrics
 * @access  Admin only
 */
router.get('/overview', SecurityController.getSecurityOverview);

/**
 * @route   GET /api/v1/security/audit-logs
 * @desc    Get security audit logs
 * @access  Admin only
 */
router.get('/audit-logs', SecurityController.getAuditLogs);

/**
 * @route   GET /api/v1/security/recommendations
 * @desc    Get security recommendations
 * @access  Admin only
 */
router.get('/recommendations', SecurityController.getSecurityRecommendations);

export default router;
