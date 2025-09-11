import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service';
import { AuthRequest } from '../middleware/auth';
import { body, query, validationResult } from 'express-validator';

const orderService = new OrderService();

export class OrderController {
  static validateCreateOrder = [
    body('items').isArray().withMessage('Items must be an array'),
    body('items.*.variantId').isUUID().withMessage('Invalid variant ID'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('paymentMethod').isIn(['cash', 'card', 'bank_transfer', 'e_wallet', 'cod']),
    body('shippingAddressId').optional().isUUID(),
    body('billingAddressId').optional().isUUID(),
    body('couponCode').optional().trim(),
    body('notes').optional().trim()
  ];

  static validateUpdateStatus = [
    body('status').isIn([
      'pending', 'confirmed', 'processing', 'packed', 
      'shipped', 'delivered', 'cancelled', 'refunded'
    ]),
    body('notes').optional().trim()
  ];

  static validateGetOrders = [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn([
      'pending', 'confirmed', 'processing', 'packed', 
      'shipped', 'delivered', 'cancelled', 'refunded'
    ]),
    query('paymentStatus').optional().isIn(['pending', 'paid', 'failed', 'refunded', 'cancelled']),
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601()
  ];

  static async createOrder(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const orderData = {
        ...req.body,
        customerId: req.user!.id
      };

      const order = await orderService.createOrder(orderData);

      res.status(201).json({
        success: true,
        data: order,
        message: 'Order created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async getOrders(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const filters: any = {
        status: req.query.status,
        paymentStatus: req.query.paymentStatus,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
        search: req.query.search
      };

      // If not admin/staff, only show user's own orders
      if (req.user!.role === 'customer') {
        filters.customerId = req.user!.id;
      } else if (req.query.customerId) {
        filters.customerId = req.query.customerId;
      }

      const pagination = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        sortBy: req.query.sortBy || 'created_at',
        sortOrder: req.query.sortOrder || 'DESC'
      };

      const result = await orderService.getOrders(filters, pagination);

      res.json({
        success: true,
        data: result.orders,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  static async getOrderById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const order = await orderService.getOrderById(id);

      // Check permission
      if (req.user!.role === 'customer' && order.customer_id !== req.user!.id) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view this order'
        });
      }

      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateOrderStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const updateData = {
        status: req.body.status,
        notes: req.body.notes
      };

      const order = await orderService.updateOrderStatus(id, updateData, req.user!.id);

      res.json({
        success: true,
        data: order,
        message: `Order status updated to ${req.body.status}`
      });
    } catch (error) {
      next(error);
    }
  }

  static async cancelOrder(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const reason = req.body.reason || 'Customer requested cancellation';

      // Check if user can cancel this order
      const order = await orderService.getOrderById(id);
      if (req.user!.role === 'customer') {
        if (order.customer_id !== req.user!.id) {
          return res.status(403).json({
            success: false,
            message: 'You do not have permission to cancel this order'
          });
        }
        if (!['pending', 'confirmed'].includes(order.status)) {
          return res.status(400).json({
            success: false,
            message: 'Order cannot be cancelled at this stage'
          });
        }
      }

      const cancelledOrder = await orderService.cancelOrder(id, reason, req.user!.id);

      res.json({
        success: true,
        data: cancelledOrder,
        message: 'Order cancelled successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async getOrderStatistics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const customerId = req.user!.role === 'customer' 
        ? req.user!.id 
        : req.query.customerId as string;

      const dateRange = {
        from: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        to: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined
      };

      const statistics = await orderService.getOrderStatistics(
        customerId,
        dateRange.from || dateRange.to ? dateRange : undefined
      );

      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMyOrders(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const filters = {
        customerId: req.user!.id,
        status: req.query.status,
        paymentStatus: req.query.paymentStatus
      };

      const pagination = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10
      };

      const result = await orderService.getOrders(filters, pagination);

      res.json({
        success: true,
        data: result.orders,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }
}