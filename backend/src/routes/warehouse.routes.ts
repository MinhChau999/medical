import { Router } from 'express';
import { WarehouseController } from '../controllers/warehouse.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Get all warehouses (all authenticated users can view)
router.get(
  '/',
  authenticate,
  authorize('admin', 'manager', 'staff'),
  WarehouseController.validateGetWarehouses,
  WarehouseController.getAllWarehouses
);

// Get warehouse by ID
router.get(
  '/:id',
  authenticate,
  authorize('admin', 'manager', 'staff'),
  WarehouseController.getWarehouseById
);

// Get inventory for specific warehouse
router.get(
  '/:id/inventory',
  authenticate,
  authorize('admin', 'manager', 'staff'),
  WarehouseController.getWarehouseInventory
);

export default router;
