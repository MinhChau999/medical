import { Router } from 'express';
import { InventoryController } from '../controllers/inventory.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// View inventory (all authenticated users)
router.get(
  '/',
  authenticate,
  authorize('admin', 'manager', 'staff'),
  InventoryController.validateGetInventory,
  InventoryController.getInventory
);

router.get(
  '/low-stock',
  authenticate,
  authorize('admin', 'manager', 'staff'),
  InventoryController.getLowStockItems
);

router.get(
  '/transactions',
  authenticate,
  authorize('admin', 'manager', 'staff'),
  InventoryController.getInventoryTransactions
);

router.get(
  '/valuation',
  authenticate,
  authorize('admin', 'manager'),
  InventoryController.getInventoryValuation
);

router.get(
  '/report',
  authenticate,
  authorize('admin', 'manager'),
  InventoryController.getInventoryReport
);

// Modify inventory (restricted)
router.post(
  '/adjust',
  authenticate,
  authorize('admin', 'manager'),
  InventoryController.validateAdjustInventory,
  InventoryController.adjustInventory
);

router.post(
  '/transfer',
  authenticate,
  authorize('admin', 'manager'),
  InventoryController.validateTransferInventory,
  InventoryController.transferInventory
);

router.post(
  '/stock-count',
  authenticate,
  authorize('admin', 'manager'),
  InventoryController.validateStockCount,
  InventoryController.performStockCount
);

export default router;