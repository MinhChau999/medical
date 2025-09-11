import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Customer routes
router.get(
  '/my-orders',
  authenticate,
  OrderController.getMyOrders
);

router.post(
  '/',
  authenticate,
  OrderController.validateCreateOrder,
  OrderController.createOrder
);

router.get(
  '/statistics',
  authenticate,
  OrderController.getOrderStatistics
);

// General routes (with permission checks)
router.get(
  '/',
  authenticate,
  OrderController.validateGetOrders,
  OrderController.getOrders
);

router.get(
  '/:id',
  authenticate,
  OrderController.getOrderById
);

router.post(
  '/:id/cancel',
  authenticate,
  OrderController.cancelOrder
);

// Admin/Staff routes
router.patch(
  '/:id/status',
  authenticate,
  authorize('admin', 'manager', 'staff'),
  OrderController.validateUpdateStatus,
  OrderController.updateOrderStatus
);

export default router;