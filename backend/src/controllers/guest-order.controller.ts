import { Request, Response } from 'express';
import pool from '../config/database';

export class GuestOrderController {
  // Create guest order
  static async createOrder(req: Request, res: Response) {
    const client = await pool.connect();

    try {
      const {
        customerInfo,
        shippingAddress,
        items,
        paymentMethod,
        notes
      } = req.body;

      // Validate
      if (!customerInfo?.name || !customerInfo?.phone) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp tên và số điện thoại'
        });
      }

      if (!items || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Giỏ hàng trống'
        });
      }

      await client.query('BEGIN');

      // Calculate totals
      let subtotal = 0;
      const orderItems = [];

      for (const item of items) {
        // Get product and variant info
        const productQuery = `
          SELECT
            p.id, p.name,
            pv.id as variant_id, pv.price, pv.stock_quantity
          FROM products p
          JOIN product_variants pv ON p.id = pv.product_id
          WHERE pv.id = $1 AND p.status = 'active' AND pv.is_active = true
        `;

        const productResult = await client.query(productQuery, [item.variantId]);

        if (productResult.rows.length === 0) {
          throw new Error(`Sản phẩm không tồn tại hoặc không khả dụng`);
        }

        const product = productResult.rows[0];

        if (product.stock_quantity < item.quantity) {
          throw new Error(`Sản phẩm "${product.name}" không đủ số lượng trong kho`);
        }

        const itemTotal = parseFloat(product.price) * item.quantity;
        subtotal += itemTotal;

        orderItems.push({
          variantId: item.variantId,
          productName: product.name,
          quantity: item.quantity,
          price: product.price,
          total: itemTotal
        });
      }

      // Calculate shipping fee (simple logic: free if > 500k, else 30k)
      const shippingFee = subtotal >= 500000 ? 0 : 30000;
      const totalAmount = subtotal + shippingFee;

      // Generate order number
      const orderNumber = `ORD${Date.now()}`;

      // Create order
      const orderQuery = `
        INSERT INTO orders (
          order_number, subtotal, shipping_fee, total_amount,
          payment_method, payment_status, status, notes, metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const orderValues = [
        orderNumber,
        subtotal,
        shippingFee,
        totalAmount,
        paymentMethod || 'cod',
        'pending',
        'pending',
        notes || '',
        JSON.stringify({
          customerInfo,
          shippingAddress,
          isGuest: true
        })
      ];

      const orderResult = await client.query(orderQuery, orderValues);
      const order = orderResult.rows[0];

      // Create order items and update stock
      for (const item of orderItems) {
        // Insert order item
        await client.query(
          `INSERT INTO order_items (
            order_id, variant_id, product_name, quantity, price, subtotal
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [order.id, item.variantId, item.productName, item.quantity, item.price, item.total]
        );

        // Update stock
        await client.query(
          `UPDATE product_variants
           SET stock_quantity = stock_quantity - $1,
               reserved_quantity = reserved_quantity + $1
           WHERE id = $2`,
          [item.quantity, item.variantId]
        );
      }

      await client.query('COMMIT');

      res.status(201).json({
        success: true,
        message: 'Đặt hàng thành công',
        data: {
          orderId: order.id,
          orderNumber: order.order_number,
          totalAmount: order.total_amount,
          items: orderItems
        }
      });

    } catch (error: any) {
      await client.query('ROLLBACK');
      console.error('Error creating guest order:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Đặt hàng thất bại'
      });
    } finally {
      client.release();
    }
  }

  // Get order by order number (for tracking)
  static async getOrderByNumber(req: Request, res: Response) {
    try {
      const { orderNumber } = req.params;

      const query = `
        SELECT
          o.id,
          o.order_number as "orderNumber",
          o.status,
          o.subtotal,
          o.shipping_fee as "shippingFee",
          o.total_amount as "totalAmount",
          o.payment_method as "paymentMethod",
          o.payment_status as "paymentStatus",
          o.notes,
          o.metadata,
          o.created_at as "createdAt",
          json_agg(
            json_build_object(
              'productName', oi.product_name,
              'quantity', oi.quantity,
              'price', oi.price,
              'subtotal', oi.subtotal
            )
          ) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.order_number = $1
        GROUP BY o.id
      `;

      const result = await pool.query(query, [orderNumber]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy đơn hàng'
        });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });

    } catch (error: any) {
      console.error('Error fetching order:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thông tin đơn hàng'
      });
    }
  }
}
