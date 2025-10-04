import express from 'express';
import { POSController } from '../controllers/pos.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// All POS routes require authentication
router.use(authenticate);

// POS Operations (staff and admin only)
router.post('/orders', authorize('staff', 'admin'), POSController.createPOSOrder);
router.get('/orders/today', authorize('staff', 'admin'), POSController.getTodayOrders);
router.get('/stats/today', authorize('staff', 'admin'), POSController.getTodayStats);
router.get('/products/search', authorize('staff', 'admin'), POSController.searchProducts);
router.post('/refunds', authorize('staff', 'admin'), POSController.createRefund);
router.post('/loyalty/apply', authorize('staff', 'admin'), POSController.applyLoyaltyPoints);

export default router;
