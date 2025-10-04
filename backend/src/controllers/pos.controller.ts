import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import pool from '../config/database';
import { logger } from '../utils/logger';

export class POSController {
  // Create POS order (simplified for quick checkout)
  static async createPOSOrder(req: AuthRequest, res: Response): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const {
        items,
        customerId,
        customerInfo,
        paymentMethod,
        receivedAmount,
        discount,
        notes
      } = req.body;

      if (!items || items.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Cart is empty'
        });
        return;
      }

      // Calculate totals
      let subtotal = 0;
      const orderItems = [];

      for (const item of items) {
        const productResult = await client.query(
          'SELECT id, name, price, stock_quantity FROM products WHERE id = $1',
          [item.productId]
        );

        if (productResult.rows.length === 0) {
          throw new Error(`Product ${item.productId} not found`);
        }

        const product = productResult.rows[0];

        if (product.stock_quantity < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}`);
        }

        const itemTotal = parseFloat(product.price) * item.quantity;
        subtotal += itemTotal;

        orderItems.push({
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          price: parseFloat(product.price),
          subtotal: itemTotal,
          discount: item.discount || 0
        });

        // Update stock
        await client.query(
          'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
          [item.quantity, product.id]
        );
      }

      const discountAmount = discount || 0;
      const tax = (subtotal - discountAmount) * 0.1; // 10% VAT
      const total = subtotal - discountAmount + tax;
      const changeAmount = receivedAmount ? receivedAmount - total : 0;

      // Create order
      const orderResult = await client.query(
        `INSERT INTO orders (
          customer_id,
          total_amount,
          subtotal,
          tax_amount,
          discount_amount,
          payment_method,
          payment_status,
          order_status,
          order_type,
          notes,
          created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id, order_number, created_at`,
        [
          customerId || null,
          total,
          subtotal,
          tax,
          discountAmount,
          paymentMethod || 'cash',
          'paid',
          'completed',
          'pos',
          notes || '',
          req.user?.id
        ]
      );

      const order = orderResult.rows[0];

      // Create order items
      for (const item of orderItems) {
        await client.query(
          `INSERT INTO order_items (
            order_id,
            product_id,
            quantity,
            price,
            subtotal,
            discount_amount
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            order.id,
            item.productId,
            item.quantity,
            item.price,
            item.subtotal,
            item.discount
          ]
        );
      }

      // Update customer loyalty points if customer exists
      if (customerId) {
        const points = Math.floor(total / 10000); // 1 point per 10,000 VND
        await client.query(
          'UPDATE customers SET points = COALESCE(points, 0) + $1 WHERE id = $2',
          [points, customerId]
        );
      }

      await client.query('COMMIT');

      logger.info(`POS order created: ${order.order_number} by user ${req.user?.id}`);

      res.status(201).json({
        success: true,
        data: {
          orderId: order.id,
          orderNumber: order.order_number,
          items: orderItems,
          subtotal,
          discount: discountAmount,
          tax,
          total,
          receivedAmount,
          changeAmount,
          paymentMethod: paymentMethod || 'cash',
          createdAt: order.created_at,
          customerInfo
        },
        message: 'Order created successfully'
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      logger.error('Error creating POS order:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create order'
      });
    } finally {
      client.release();
    }
  }

  // Get today's orders
  static async getTodayOrders(req: AuthRequest, res: Response): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const result = await pool.query(
        `SELECT
          o.id,
          o.order_number,
          o.total_amount,
          o.subtotal,
          o.tax_amount,
          o.discount_amount,
          o.payment_method,
          o.payment_status,
          o.order_status,
          o.created_at,
          c.name as customer_name,
          c.phone as customer_phone,
          json_agg(
            json_build_object(
              'productName', oi.product_id,
              'quantity', oi.quantity,
              'price', oi.price,
              'subtotal', oi.subtotal
            )
          ) as items
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.created_at >= $1 AND o.created_at < $2
          AND o.order_type = 'pos'
        GROUP BY o.id, c.name, c.phone
        ORDER BY o.created_at DESC`,
        [today, tomorrow]
      );

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      logger.error('Error fetching today orders:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch orders'
      });
    }
  }

  // Get today's statistics
  static async getTodayStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const statsResult = await pool.query(
        `SELECT
          COUNT(DISTINCT o.id) as total_orders,
          COALESCE(SUM(o.total_amount), 0) as total_revenue,
          COALESCE(SUM(o.subtotal), 0) as total_subtotal,
          COALESCE(SUM(o.tax_amount), 0) as total_tax,
          COALESCE(SUM(o.discount_amount), 0) as total_discount,
          COALESCE(SUM(oi.quantity), 0) as total_items_sold,
          COUNT(DISTINCT o.customer_id) as total_customers
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.created_at >= $1 AND o.created_at < $2
          AND o.order_type = 'pos'
          AND o.payment_status = 'paid'`,
        [today, tomorrow]
      );

      const paymentMethodsResult = await pool.query(
        `SELECT
          payment_method,
          COUNT(*) as count,
          SUM(total_amount) as amount
        FROM orders
        WHERE created_at >= $1 AND created_at < $2
          AND order_type = 'pos'
          AND payment_status = 'paid'
        GROUP BY payment_method`,
        [today, tomorrow]
      );

      const topProductsResult = await pool.query(
        `SELECT
          p.id,
          p.name,
          SUM(oi.quantity) as quantity_sold,
          SUM(oi.subtotal) as revenue
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.created_at >= $1 AND o.created_at < $2
          AND o.order_type = 'pos'
          AND o.payment_status = 'paid'
        GROUP BY p.id, p.name
        ORDER BY quantity_sold DESC
        LIMIT 10`,
        [today, tomorrow]
      );

      const stats = statsResult.rows[0];

      res.json({
        success: true,
        data: {
          summary: {
            totalOrders: parseInt(stats.total_orders),
            totalRevenue: parseFloat(stats.total_revenue),
            totalSubtotal: parseFloat(stats.total_subtotal),
            totalTax: parseFloat(stats.total_tax),
            totalDiscount: parseFloat(stats.total_discount),
            totalItemsSold: parseInt(stats.total_items_sold),
            totalCustomers: parseInt(stats.total_customers),
            averageOrderValue: stats.total_orders > 0
              ? parseFloat(stats.total_revenue) / parseInt(stats.total_orders)
              : 0
          },
          paymentMethods: paymentMethodsResult.rows.map(row => ({
            method: row.payment_method,
            count: parseInt(row.count),
            amount: parseFloat(row.amount)
          })),
          topProducts: topProductsResult.rows.map(row => ({
            id: row.id,
            name: row.name,
            quantitySold: parseInt(row.quantity_sold),
            revenue: parseFloat(row.revenue)
          }))
        }
      });
    } catch (error) {
      logger.error('Error fetching today stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch statistics'
      });
    }
  }

  // Product autocomplete search
  static async searchProducts(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { q } = req.query;

      if (!q || (q as string).length < 2) {
        res.json({
          success: true,
          data: []
        });
        return;
      }

      const result = await pool.query(
        `SELECT
          p.id,
          p.name,
          p.sku,
          p.barcode,
          p.price,
          p.stock_quantity,
          p.unit,
          p.image,
          c.name as category_name,
          c.slug as category_slug
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.status = 'active'
          AND (
            p.name ILIKE $1
            OR p.sku ILIKE $1
            OR p.barcode ILIKE $1
          )
        ORDER BY p.name
        LIMIT 20`,
        [`%${q}%`]
      );

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      logger.error('Error searching products:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search products'
      });
    }
  }

  // Create refund/return
  static async createRefund(req: AuthRequest, res: Response): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const { orderId, items, reason, refundAmount } = req.body;

      if (!orderId || !items || items.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Order ID and items are required'
        });
        return;
      }

      // Verify order exists
      const orderResult = await client.query(
        'SELECT * FROM orders WHERE id = $1',
        [orderId]
      );

      if (orderResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Order not found'
        });
        return;
      }

      const order = orderResult.rows[0];

      // Restore stock for returned items
      for (const item of items) {
        await client.query(
          'UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2',
          [item.quantity, item.productId]
        );
      }

      // Update order status
      await client.query(
        `UPDATE orders
        SET order_status = 'refunded',
            payment_status = 'refunded',
            notes = CONCAT(COALESCE(notes, ''), '\nRefund: ', $1)
        WHERE id = $2`,
        [reason, orderId]
      );

      // Deduct loyalty points if customer exists
      if (order.customer_id) {
        const pointsToDeduct = Math.floor(refundAmount / 10000);
        await client.query(
          'UPDATE customers SET points = GREATEST(0, COALESCE(points, 0) - $1) WHERE id = $2',
          [pointsToDeduct, order.customer_id]
        );
      }

      await client.query('COMMIT');

      logger.info(`Refund created for order ${order.order_number} by user ${req.user?.id}`);

      res.json({
        success: true,
        message: 'Refund processed successfully',
        data: {
          orderId,
          refundAmount,
          reason
        }
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      logger.error('Error creating refund:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to process refund'
      });
    } finally {
      client.release();
    }
  }

  // Apply loyalty points discount
  static async applyLoyaltyPoints(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { customerId, points } = req.body;

      if (!customerId || !points) {
        res.status(400).json({
          success: false,
          message: 'Customer ID and points are required'
        });
        return;
      }

      const customerResult = await pool.query(
        'SELECT id, name, points FROM customers WHERE id = $1',
        [customerId]
      );

      if (customerResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
        return;
      }

      const customer = customerResult.rows[0];
      const availablePoints = customer.points || 0;

      if (availablePoints < points) {
        res.status(400).json({
          success: false,
          message: `Customer only has ${availablePoints} points available`
        });
        return;
      }

      // 1 point = 1,000 VND discount
      const discountAmount = points * 1000;

      res.json({
        success: true,
        data: {
          customerId,
          customerName: customer.name,
          pointsUsed: points,
          discountAmount,
          remainingPoints: availablePoints - points
        }
      });
    } catch (error) {
      logger.error('Error applying loyalty points:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to apply loyalty points'
      });
    }
  }
}
