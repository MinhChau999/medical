import { Request, Response, NextFunction } from 'express';
import { InventoryService } from '../services/inventory.service';
import { AuthRequest } from '../middleware/auth';
import { body, query, validationResult } from 'express-validator';

const inventoryService = new InventoryService();

export class InventoryController {
  static validateAdjustInventory = [
    body('warehouseId').isUUID().withMessage('Invalid warehouse ID'),
    body('variantId').isUUID().withMessage('Invalid variant ID'),
    body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a positive integer'),
    body('type').isIn(['in', 'out', 'adjustment']).withMessage('Invalid adjustment type'),
    body('notes').optional().trim()
  ];

  static validateTransferInventory = [
    body('fromWarehouseId').isUUID().withMessage('Invalid source warehouse ID'),
    body('toWarehouseId').isUUID().withMessage('Invalid destination warehouse ID'),
    body('variantId').isUUID().withMessage('Invalid variant ID'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('notes').optional().trim()
  ];

  static validateGetInventory = [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('warehouseId').optional().isUUID(),
    query('variantId').optional().isUUID(),
    query('productId').optional().isUUID(),
    query('lowStock').optional().isBoolean()
  ];

  static validateStockCount = [
    body('warehouseId').isUUID().withMessage('Invalid warehouse ID'),
    body('counts').isArray().withMessage('Counts must be an array'),
    body('counts.*.variantId').isUUID().withMessage('Invalid variant ID'),
    body('counts.*.actualCount').isInt({ min: 0 }).withMessage('Count must be non-negative')
  ];

  static async getInventory(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const filters = {
        warehouseId: req.query.warehouseId,
        variantId: req.query.variantId,
        productId: req.query.productId,
        lowStock: req.query.lowStock === 'true',
        search: req.query.search
      };

      const pagination = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        sortBy: req.query.sortBy || 'updated_at',
        sortOrder: req.query.sortOrder || 'DESC'
      };

      const result = await inventoryService.getInventory(filters, pagination);

      res.json({
        success: true,
        data: result.inventory,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  static async adjustInventory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const adjustmentData = {
        warehouseId: req.body.warehouseId,
        variantId: req.body.variantId,
        quantity: req.body.quantity,
        type: req.body.type as 'in' | 'out' | 'adjustment',
        notes: req.body.notes,
        referenceType: req.body.referenceType,
        referenceId: req.body.referenceId
      };

      const result = await inventoryService.adjustInventory(adjustmentData, req.user!.id);

      res.json({
        success: true,
        data: result,
        message: 'Inventory adjusted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async transferInventory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const transferData = {
        fromWarehouseId: req.body.fromWarehouseId,
        toWarehouseId: req.body.toWarehouseId,
        variantId: req.body.variantId,
        quantity: req.body.quantity,
        notes: req.body.notes
      };

      if (transferData.fromWarehouseId === transferData.toWarehouseId) {
        return res.status(400).json({
          success: false,
          message: 'Source and destination warehouses cannot be the same'
        });
      }

      const result = await inventoryService.transferInventory(transferData, req.user!.id);

      res.json({
        success: true,
        data: result,
        message: 'Inventory transferred successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async getLowStockItems(req: Request, res: Response, next: NextFunction) {
    try {
      const warehouseId = req.query.warehouseId as string;
      const items = await inventoryService.getLowStockItems(warehouseId);

      res.json({
        success: true,
        data: items,
        count: items.length
      });
    } catch (error) {
      next(error);
    }
  }

  static async getInventoryTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        warehouseId: req.query.warehouseId,
        variantId: req.query.variantId,
        type: req.query.type,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
        userId: req.query.userId
      };

      const pagination = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        sortBy: req.query.sortBy || 'created_at',
        sortOrder: req.query.sortOrder || 'DESC'
      };

      const result = await inventoryService.getInventoryTransactions(filters, pagination);

      res.json({
        success: true,
        data: result.transactions,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  static async getInventoryValuation(req: Request, res: Response, next: NextFunction) {
    try {
      const warehouseId = req.query.warehouseId as string;
      const valuation = await inventoryService.getInventoryValuation(warehouseId);

      res.json({
        success: true,
        data: valuation
      });
    } catch (error) {
      next(error);
    }
  }

  static async performStockCount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { warehouseId, counts } = req.body;
      const result = await inventoryService.performStockCount(
        warehouseId,
        counts,
        req.user!.id
      );

      res.json({
        success: true,
        data: result,
        message: 'Stock count completed'
      });
    } catch (error) {
      next(error);
    }
  }

  static async getInventoryReport(req: Request, res: Response, next: NextFunction) {
    try {
      const warehouseId = req.query.warehouseId as string;
      
      // Get current inventory
      const inventoryResult = await inventoryService.getInventory(
        { warehouseId },
        { limit: 1000 }
      );

      // Get low stock items
      const lowStockItems = await inventoryService.getLowStockItems(warehouseId);

      // Get valuation
      const valuation = await inventoryService.getInventoryValuation(warehouseId);

      // Get recent transactions
      const recentTransactions = await inventoryService.getInventoryTransactions(
        { warehouseId },
        { limit: 10 }
      );

      res.json({
        success: true,
        data: {
          summary: {
            totalItems: inventoryResult.inventory.length,
            lowStockItems: lowStockItems.length,
            ...valuation.summary
          },
          lowStockAlerts: lowStockItems.slice(0, 10),
          valuationByCategory: valuation.byCategory,
          recentTransactions: recentTransactions.transactions
        }
      });
    } catch (error) {
      next(error);
    }
  }
}