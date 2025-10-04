import express from 'express';
import homepageController from '../controllers/homepage.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

/**
 * @route   GET /api/v1/homepage/settings
 * @desc    Get homepage settings
 * @access  Public
 */
router.get('/settings', homepageController.getSettings);

/**
 * @route   PUT /api/v1/homepage/settings
 * @desc    Update homepage settings
 * @access  Private (Admin only)
 */
router.put(
  '/settings',
  authenticate,
  authorize('admin', 'manager'),
  homepageController.updateSettings
);

/**
 * @route   POST /api/v1/homepage/newsletter/subscribe
 * @desc    Subscribe to newsletter
 * @access  Public
 */
router.post('/newsletter/subscribe', homepageController.subscribeNewsletter);

/**
 * @route   POST /api/v1/homepage/upload/hero-images
 * @desc    Upload hero images
 * @access  Private (Admin only)
 */
router.post(
  '/upload/hero-images',
  authenticate,
  authorize('admin', 'manager'),
  homepageController.uploadHeroImages
);

export default router;
