import express from 'express';
import { SettingsController } from '../controllers/settings.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Protect all settings routes
router.use(authenticate);

// System settings (admin only)
router.get('/system', authorize('admin'), SettingsController.getSystemSettings);
router.put('/system', authorize('admin'), SettingsController.updateSystemSettings);

// User preferences (all authenticated users)
router.get('/preferences', SettingsController.getUserPreferences);
router.put('/preferences', SettingsController.updateUserPreferences);

// Password management
router.put('/password', SettingsController.updatePassword);

// Admin actions
router.post('/cache/clear', authorize('admin'), SettingsController.clearCache);
router.post('/email/test', authorize('admin'), SettingsController.testEmail);

export default router;
