import pool from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

interface OrderItemData {
  variantId: string;
  quantity: number;
  price?: number;
  discount?: number;
}

interface CreateOrderData {
  customerId: string;
  items: OrderItemData[];
  shippingAddressId?: string;
  billingAddressId?: string;
  paymentMethod: string;
  couponCode?: string;
  notes?: string;
  metadata?: any;
}

interface UpdateOrderStatusData {
  status: string;
  notes?: string;
}

export class OrderService {
  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    const countResult = await pool.query(
      `SELECT COUNT(*) as count FROM orders 
       WHERE DATE(created_at) = CURRENT_DATE`
    );
    
    const dailyCount = parseInt(countResult.rows[0].count) + 1;
    const orderNumber = `ORD${year}${month}${day}${String(dailyCount).padStart(4, '0')}`;
    
    return orderNumber;
  }

  private async validateAndCalculateItems(items: OrderItemData[], client: any) {
    const calculatedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const variantResult = await client.query(
        `SELECT pv.*, p.name as product_name, p.status as product_status
         FROM product_variants pv
         JOIN products p ON pv.product_id = p.id
         WHERE pv.id = $1 AND pv.is_active = true`,
        [item.variantId]
      );

      if (variantResult.rows.length === 0) {
        throw new AppError(`Product variant ${item.variantId} not found or inactive`, 404);
      }

      const variant = variantResult.rows[0];

      if (variant.stock_quantity < item.quantity) {
        throw new AppError(
          `Insufficient stock for ${variant.product_name}. Available: ${variant.stock_quantity}`,
          400
        );
      }

      const price = item.price || parseFloat(variant.price);
      const discount = item.discount || 0;
      const itemTotal = (price * item.quantity) - discount;

      calculatedItems.push({
        variantId: item.variantId,
        productName: variant.product_name,
        variantName: variant.name,
        sku: variant.sku,
        quantity: item.quantity,
        price: price,
        discount: discount,
        total: itemTotal
      });

      subtotal += itemTotal;
    }

    return { calculatedItems, subtotal };
  }

  private async applyCoupon(couponCode: string, customerId: string, subtotal: number, client: any) {
    const couponResult = await client.query(
      `SELECT * FROM coupons 
       WHERE code = $1 
       AND is_active = true 
       AND (valid_from IS NULL OR valid_from <= NOW())
       AND (valid_until IS NULL OR valid_until >= NOW())
       AND (usage_limit IS NULL OR used_count < usage_limit)`,
      [couponCode]
    );

    if (couponResult.rows.length === 0) {
      throw new AppError('Invalid or expired coupon', 400);
    }

    const coupon = couponResult.rows[0];

    // Check customer usage limit
    const usageResult = await client.query(
      `SELECT COUNT(*) as count FROM coupon_usage 
       WHERE coupon_id = $1 AND customer_id = $2`,
      [coupon.id, customerId]
    );

    if (parseInt(usageResult.rows[0].count) >= (coupon.customer_limit || 1)) {
      throw new AppError('Coupon usage limit exceeded for this customer', 400);
    }

    // Check minimum amount
    if (coupon.minimum_amount && subtotal < parseFloat(coupon.minimum_amount)) {
      throw new AppError(`Minimum order amount of ${coupon.minimum_amount} required`, 400);
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discount_type === 'percentage') {
      discountAmount = subtotal * (parseFloat(coupon.discount_value) / 100);
    } else {
      discountAmount = parseFloat(coupon.discount_value);
    }

    return {
      couponId: coupon.id,
      discountAmount: Math.min(discountAmount, subtotal)
    };
  }

  async createOrder(data: CreateOrderData) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const orderId = uuidv4();
      const orderNumber = await this.generateOrderNumber();

      // Validate and calculate items
      const { calculatedItems, subtotal } = await this.validateAndCalculateItems(
        data.items,
        client
      );

      // Apply coupon if provided
      let discountAmount = 0;
      let couponId = null;
      if (data.couponCode) {
        const couponResult = await this.applyCoupon(
          data.couponCode,
          data.customerId,
          subtotal,
          client
        );
        discountAmount = couponResult.discountAmount;
        couponId = couponResult.couponId;
      }

      // Calculate totals
      const taxRate = 0.1; // 10% VAT
      const taxAmount = (subtotal - discountAmount) * taxRate;
      const shippingFee = subtotal > 500000 ? 0 : 30000; // Free shipping for orders > 500k
      const totalAmount = subtotal - discountAmount + taxAmount + shippingFee;

      // Create order
      const orderResult = await client.query(
        `INSERT INTO orders (
          id, order_number, customer_id, status, 
          subtotal, discount_amount, tax_amount, shipping_fee, total_amount,
          payment_method, payment_status, 
          shipping_address_id, billing_address_id,
          notes, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *`,
        [
          orderId,
          orderNumber,
          data.customerId,
          'pending',
          subtotal,
          discountAmount,
          taxAmount,
          shippingFee,
          totalAmount,
          data.paymentMethod,
          'pending',
          data.shippingAddressId,
          data.billingAddressId || data.shippingAddressId,
          data.notes,
          data.metadata || {}
        ]
      );

      // Create order items
      for (const item of calculatedItems) {
        await client.query(
          `INSERT INTO order_items (
            id, order_id, variant_id, product_name, variant_name, sku,
            quantity, price, discount_amount, tax_amount, total_amount
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            uuidv4(),
            orderId,
            item.variantId,
            item.productName,
            item.variantName,
            item.sku,
            item.quantity,
            item.price,
            item.discount,
            item.total * taxRate,
            item.total + (item.total * taxRate)
          ]
        );

        // Update stock
        await client.query(
          `UPDATE product_variants 
           SET stock_quantity = stock_quantity - $1,
               reserved_quantity = reserved_quantity + $1
           WHERE id = $2`,
          [item.quantity, item.variantId]
        );

        // Update inventory
        await client.query(
          `UPDATE inventory 
           SET quantity = quantity - $1,
               reserved_quantity = reserved_quantity + $1
           WHERE variant_id = $2`,
          [item.quantity, item.variantId]
        );
      }

      // Record coupon usage
      if (couponId) {
        await client.query(
          `INSERT INTO coupon_usage (id, coupon_id, order_id, customer_id, discount_amount)
           VALUES ($1, $2, $3, $4, $5)`,
          [uuidv4(), couponId, orderId, data.customerId, discountAmount]
        );

        await client.query(
          `UPDATE coupons SET used_count = used_count + 1 WHERE id = $1`,
          [couponId]
        );
      }

      // Update customer stats
      await client.query(
        `UPDATE customers 
         SET total_spent = total_spent + $1,
             total_orders = total_orders + 1
         WHERE id = $2`,
        [totalAmount, data.customerId]
      );

      await client.query('COMMIT');

      return orderResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getOrders(filters: any = {}, pagination: any = {}) {
    const {
      customerId,
      status,
      paymentStatus,
      dateFrom,
      dateTo,
      search
    } = filters;

    const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'DESC' } = pagination;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        o.*,
        u.email as customer_email,
        u.first_name || ' ' || u.last_name as customer_name,
        COUNT(*) OVER() as total_count
      FROM orders o
      JOIN users u ON o.customer_id = u.id
      WHERE 1=1
    `;

    const values = [];
    let paramCount = 1;

    if (customerId) {
      query += ` AND o.customer_id = $${paramCount}`;
      values.push(customerId);
      paramCount++;
    }

    if (status) {
      query += ` AND o.status = $${paramCount}`;
      values.push(status);
      paramCount++;
    }

    if (paymentStatus) {
      query += ` AND o.payment_status = $${paramCount}`;
      values.push(paymentStatus);
      paramCount++;
    }

    if (dateFrom) {
      query += ` AND o.created_at >= $${paramCount}`;
      values.push(dateFrom);
      paramCount++;
    }

    if (dateTo) {
      query += ` AND o.created_at <= $${paramCount}`;
      values.push(dateTo);
      paramCount++;
    }

    if (search) {
      query += ` AND (o.order_number ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
      values.push(`%${search}%`);
      paramCount++;
    }

    query += ` ORDER BY o.${sortBy} ${sortOrder}`;
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    const totalCount = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;
    const orders = result.rows.map(row => {
      const { total_count, ...order } = row;
      return order;
    });

    return {
      orders,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  }

  async getOrderById(orderId: string) {
    const orderResult = await pool.query(
      `SELECT 
        o.*,
        u.email as customer_email,
        u.first_name || ' ' || u.last_name as customer_name,
        u.phone as customer_phone
      FROM orders o
      JOIN users u ON o.customer_id = u.id
      WHERE o.id = $1`,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      throw new AppError('Order not found', 404);
    }

    const itemsResult = await pool.query(
      `SELECT oi.*, pv.barcode, pv.attributes
       FROM order_items oi
       LEFT JOIN product_variants pv ON oi.variant_id = pv.id
       WHERE oi.order_id = $1
       ORDER BY oi.created_at`,
      [orderId]
    );

    const paymentResult = await pool.query(
      `SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at DESC`,
      [orderId]
    );

    const shippingAddress = orderResult.rows[0].shipping_address_id
      ? await pool.query(
          'SELECT * FROM addresses WHERE id = $1',
          [orderResult.rows[0].shipping_address_id]
        )
      : null;

    return {
      ...orderResult.rows[0],
      items: itemsResult.rows,
      payments: paymentResult.rows,
      shippingAddress: shippingAddress?.rows[0] || null
    };
  }

  async updateOrderStatus(orderId: string, data: UpdateOrderStatusData, userId: string) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check current order status
      const orderResult = await client.query(
        'SELECT * FROM orders WHERE id = $1',
        [orderId]
      );

      if (orderResult.rows.length === 0) {
        throw new AppError('Order not found', 404);
      }

      const order = orderResult.rows[0];
      const currentStatus = order.status;
      const newStatus = data.status;

      // Validate status transition
      const validTransitions: { [key: string]: string[] } = {
        'pending': ['confirmed', 'cancelled'],
        'confirmed': ['processing', 'cancelled'],
        'processing': ['packed', 'cancelled'],
        'packed': ['shipped', 'cancelled'],
        'shipped': ['delivered', 'cancelled'],
        'delivered': ['refunded'],
        'cancelled': [],
        'refunded': []
      };

      if (!validTransitions[currentStatus]?.includes(newStatus)) {
        throw new AppError(`Cannot change status from ${currentStatus} to ${newStatus}`, 400);
      }

      // Update order status
      const updateResult = await client.query(
        `UPDATE orders 
         SET status = $1, 
             ${newStatus}_at = NOW(),
             processed_by = $2,
             updated_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [newStatus, userId, orderId]
      );

      // Handle status-specific actions
      if (newStatus === 'cancelled' || newStatus === 'refunded') {
        // Restore stock
        const itemsResult = await client.query(
          'SELECT * FROM order_items WHERE order_id = $1',
          [orderId]
        );

        for (const item of itemsResult.rows) {
          await client.query(
            `UPDATE product_variants 
             SET stock_quantity = stock_quantity + $1,
                 reserved_quantity = GREATEST(0, reserved_quantity - $1)
             WHERE id = $2`,
            [item.quantity, item.variant_id]
          );

          await client.query(
            `UPDATE inventory 
             SET quantity = quantity + $1,
                 reserved_quantity = GREATEST(0, reserved_quantity - $1)
             WHERE variant_id = $2`,
            [item.quantity, item.variant_id]
          );
        }

        // Update payment status
        await client.query(
          `UPDATE orders SET payment_status = $1 WHERE id = $2`,
          [newStatus === 'refunded' ? 'refunded' : 'cancelled', orderId]
        );
      } else if (newStatus === 'shipped') {
        // Clear reserved quantity
        const itemsResult = await client.query(
          'SELECT * FROM order_items WHERE order_id = $1',
          [orderId]
        );

        for (const item of itemsResult.rows) {
          await client.query(
            `UPDATE product_variants 
             SET reserved_quantity = GREATEST(0, reserved_quantity - $1)
             WHERE id = $2`,
            [item.quantity, item.variant_id]
          );

          await client.query(
            `UPDATE inventory 
             SET reserved_quantity = GREATEST(0, reserved_quantity - $1)
             WHERE variant_id = $2`,
            [item.quantity, item.variant_id]
          );
        }
      }

      // Log activity
      await client.query(
        `INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, new_values)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          uuidv4(),
          userId,
          'order_status_update',
          'order',
          orderId,
          { from: currentStatus, to: newStatus, notes: data.notes }
        ]
      );

      await client.query('COMMIT');

      return updateResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async cancelOrder(orderId: string, reason: string, userId: string) {
    return this.updateOrderStatus(
      orderId,
      { status: 'cancelled', notes: reason },
      userId
    );
  }

  async getOrderStatistics(customerId?: string, dateRange?: { from: Date; to: Date }) {
    let query = `
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
        COUNT(CASE WHEN status NOT IN ('delivered', 'cancelled', 'refunded') THEN 1 END) as pending_orders,
        COALESCE(SUM(CASE WHEN status = 'delivered' THEN total_amount END), 0) as total_revenue,
        COALESCE(AVG(CASE WHEN status = 'delivered' THEN total_amount END), 0) as average_order_value
      FROM orders
      WHERE 1=1
    `;

    const values = [];
    let paramCount = 1;

    if (customerId) {
      query += ` AND customer_id = $${paramCount}`;
      values.push(customerId);
      paramCount++;
    }

    if (dateRange?.from) {
      query += ` AND created_at >= $${paramCount}`;
      values.push(dateRange.from);
      paramCount++;
    }

    if (dateRange?.to) {
      query += ` AND created_at <= $${paramCount}`;
      values.push(dateRange.to);
      paramCount++;
    }

    const result = await pool.query(query, values);
    return result.rows[0];
  }
}