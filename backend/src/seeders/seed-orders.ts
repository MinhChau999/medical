import pool from '../config/database';

async function seedOrders() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get admin user
    const adminResult = await client.query(
      `SELECT id FROM users WHERE email = 'admin@medical.com' LIMIT 1`
    );

    if (adminResult.rows.length === 0) {
      console.error('Admin user not found');
      return;
    }

    const adminId = adminResult.rows[0].id;

    // Get some product variants
    const variantsResult = await client.query(`
      SELECT pv.id, p.name, pv.price, pv.sku
      FROM product_variants pv
      JOIN products p ON pv.product_id = p.id
      WHERE pv.is_active = true AND pv.stock_quantity > 0
      LIMIT 10
    `);

    const variants = variantsResult.rows;

    if (variants.length === 0) {
      console.error('No active product variants found');
      return;
    }

    // Clear existing orders
    await client.query('DELETE FROM order_items');
    await client.query('DELETE FROM orders');
    console.log('Cleared existing orders');

    // Create sample orders
    const orderStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    const paymentMethods = ['cash', 'card', 'bank_transfer', 'e_wallet'];
    const paymentStatuses = ['pending', 'paid', 'failed', 'refunded'];

    const orders = [];

    for (let i = 1; i <= 20; i++) {
      const orderNumber = `ORD-${String(i).padStart(6, '0')}`;
      const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      let paymentStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];

      // Adjust payment status based on order status
      if (status === 'delivered') {
        paymentStatus = 'paid';
      } else if (status === 'cancelled') {
        paymentStatus = Math.random() > 0.5 ? 'refunded' : 'failed';
      }

      // Random number of items (1-4)
      const itemCount = Math.floor(Math.random() * 4) + 1;
      const selectedVariants = [];
      for (let j = 0; j < itemCount; j++) {
        selectedVariants.push(variants[Math.floor(Math.random() * variants.length)]);
      }

      // Calculate totals
      let subtotal = 0;
      const items = selectedVariants.map(variant => {
        const quantity = Math.floor(Math.random() * 3) + 1;
        const price = parseFloat(variant.price);
        const itemTotal = price * quantity;
        subtotal += itemTotal;

        return {
          variant_id: variant.id,
          product_name: variant.name,
          sku: variant.sku,
          quantity,
          price,
          total_amount: itemTotal
        };
      });

      const discountAmount = Math.random() > 0.7 ? subtotal * 0.1 : 0; // 10% discount for 30% of orders
      const taxAmount = (subtotal - discountAmount) * 0.1; // 10% VAT
      const shippingFee = subtotal > 500000 ? 0 : 30000; // Free shipping over 500k
      const totalAmount = subtotal - discountAmount + taxAmount + shippingFee;

      // Create timestamps based on status
      const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Last 30 days
      let confirmedAt = null;
      let packedAt = null;
      let shippedAt = null;
      let deliveredAt = null;
      let cancelledAt = null;

      if (status !== 'pending' && status !== 'cancelled') {
        confirmedAt = new Date(createdAt.getTime() + 2 * 60 * 60 * 1000); // 2 hours after created
      }

      if (status === 'processing' || status === 'shipped' || status === 'delivered') {
        packedAt = new Date(confirmedAt!.getTime() + 4 * 60 * 60 * 1000); // 4 hours after confirmed
      }

      if (status === 'shipped' || status === 'delivered') {
        shippedAt = new Date(packedAt!.getTime() + 2 * 60 * 60 * 1000); // 2 hours after packed
      }

      if (status === 'delivered') {
        deliveredAt = new Date(shippedAt!.getTime() + 48 * 60 * 60 * 1000); // 2 days after shipped
      }

      if (status === 'cancelled') {
        cancelledAt = new Date(createdAt.getTime() + Math.random() * 24 * 60 * 60 * 1000);
      }

      // Insert order
      const orderResult = await client.query(`
        INSERT INTO orders (
          order_number, customer_id, status, subtotal, discount_amount,
          tax_amount, shipping_fee, total_amount, payment_method, payment_status,
          processed_by, confirmed_at, packed_at, shipped_at, delivered_at, cancelled_at,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $17
        ) RETURNING id
      `, [
        orderNumber,
        adminId, // Using admin as customer for now
        status,
        subtotal,
        discountAmount,
        taxAmount,
        shippingFee,
        totalAmount,
        paymentMethod,
        paymentStatus,
        adminId,
        confirmedAt,
        packedAt,
        shippedAt,
        deliveredAt,
        cancelledAt,
        createdAt
      ]);

      const orderId = orderResult.rows[0].id;

      // Insert order items
      for (const item of items) {
        await client.query(`
          INSERT INTO order_items (
            order_id, variant_id, product_name, sku,
            quantity, price, discount_amount, tax_amount, total_amount
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          orderId,
          item.variant_id,
          item.product_name,
          item.sku,
          item.quantity,
          item.price,
          0,
          0,
          item.total_amount
        ]);
      }

      orders.push({
        orderNumber,
        status,
        itemCount: items.length,
        total: totalAmount
      });
    }

    await client.query('COMMIT');
    console.log('✅ Successfully seeded orders:');
    console.log(`Created ${orders.length} orders`);
    orders.forEach(order => {
      console.log(`  ${order.orderNumber}: ${order.status} - ${order.itemCount} items - ${order.total.toLocaleString('vi-VN')}₫`);
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding orders:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  seedOrders()
    .then(() => {
      console.log('✅ Order seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Order seeding failed:', error);
      process.exit(1);
    });
}

export default seedOrders;
