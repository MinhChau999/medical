import pool from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

interface InventoryAdjustmentData {
  warehouseId: string;
  variantId: string;
  quantity: number;
  type: 'in' | 'out' | 'adjustment';
  notes?: string;
  referenceType?: string;
  referenceId?: string;
}

interface InventoryTransferData {
  fromWarehouseId: string;
  toWarehouseId: string;
  variantId: string;
  quantity: number;
  notes?: string;
}

interface StockAlertData {
  variantId: string;
  currentStock: number;
  threshold: number;
  warehouseId?: string;
}

export class InventoryService {
  async getInventory(filters: any = {}, pagination: any = {}) {
    const {
      warehouseId,
      variantId,
      productId,
      lowStock,
      search
    } = filters;

    const { page = 1, limit = 20, sortBy = 'updated_at', sortOrder = 'DESC' } = pagination;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        i.*,
        w.name as warehouse_name,
        w.code as warehouse_code,
        pv.sku as variant_sku,
        pv.name as variant_name,
        pv.barcode,
        pv.price,
        pv.low_stock_threshold,
        p.name as product_name,
        p.id as product_id,
        COUNT(*) OVER() as total_count
      FROM inventory i
      JOIN warehouses w ON i.warehouse_id = w.id
      JOIN product_variants pv ON i.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      WHERE w.is_active = true
    `;

    const values = [];
    let paramCount = 1;

    if (warehouseId) {
      query += ` AND i.warehouse_id = $${paramCount}`;
      values.push(warehouseId);
      paramCount++;
    }

    if (variantId) {
      query += ` AND i.variant_id = $${paramCount}`;
      values.push(variantId);
      paramCount++;
    }

    if (productId) {
      query += ` AND pv.product_id = $${paramCount}`;
      values.push(productId);
      paramCount++;
    }

    if (lowStock) {
      query += ` AND i.quantity <= pv.low_stock_threshold`;
    }

    if (search) {
      query += ` AND (p.name ILIKE $${paramCount} OR pv.sku ILIKE $${paramCount} OR pv.barcode = $${paramCount + 1})`;
      values.push(`%${search}%`, search);
      paramCount += 2;
    }

    query += ` ORDER BY ${sortBy === 'quantity' ? 'i.quantity' : `i.${sortBy}`} ${sortOrder}`;
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    const totalCount = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;
    const inventory = result.rows.map(row => {
      const { total_count, ...item } = row;
      return {
        ...item,
        isLowStock: item.quantity <= item.low_stock_threshold
      };
    });

    return {
      inventory,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  }

  async adjustInventory(data: InventoryAdjustmentData, userId: string) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if inventory record exists
      const inventoryResult = await client.query(
        `SELECT * FROM inventory 
         WHERE warehouse_id = $1 AND variant_id = $2`,
        [data.warehouseId, data.variantId]
      );

      let currentQuantity = 0;
      let inventoryId: string;

      if (inventoryResult.rows.length === 0) {
        // Create new inventory record
        inventoryId = uuidv4();
        await client.query(
          `INSERT INTO inventory (id, warehouse_id, variant_id, quantity, reserved_quantity)
           VALUES ($1, $2, $3, $4, $5)`,
          [inventoryId, data.warehouseId, data.variantId, 0, 0]
        );
      } else {
        inventoryId = inventoryResult.rows[0].id;
        currentQuantity = inventoryResult.rows[0].quantity;
      }

      // Calculate new quantity
      let newQuantity = currentQuantity;
      if (data.type === 'in') {
        newQuantity += data.quantity;
      } else if (data.type === 'out') {
        if (currentQuantity < data.quantity) {
          throw new AppError('Insufficient inventory', 400);
        }
        newQuantity -= data.quantity;
      } else if (data.type === 'adjustment') {
        newQuantity = data.quantity;
      }

      // Update inventory
      await client.query(
        `UPDATE inventory 
         SET quantity = $1, updated_at = NOW()
         WHERE warehouse_id = $2 AND variant_id = $3`,
        [newQuantity, data.warehouseId, data.variantId]
      );

      // Update product variant stock (sum of all warehouses)
      await client.query(
        `UPDATE product_variants 
         SET stock_quantity = (
           SELECT COALESCE(SUM(quantity), 0) 
           FROM inventory 
           WHERE variant_id = $1
         )
         WHERE id = $1`,
        [data.variantId]
      );

      // Record transaction
      await client.query(
        `INSERT INTO inventory_transactions (
          id, warehouse_id, variant_id, type, quantity,
          reference_type, reference_id, notes, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          uuidv4(),
          data.warehouseId,
          data.variantId,
          data.type,
          data.quantity,
          data.referenceType,
          data.referenceId,
          data.notes,
          userId
        ]
      );

      // Check for low stock alert
      const variantResult = await client.query(
        `SELECT low_stock_threshold FROM product_variants WHERE id = $1`,
        [data.variantId]
      );

      if (variantResult.rows[0] && newQuantity <= variantResult.rows[0].low_stock_threshold) {
        // Create low stock alert (implement notification service later)
        await this.createStockAlert({
          variantId: data.variantId,
          currentStock: newQuantity,
          threshold: variantResult.rows[0].low_stock_threshold,
          warehouseId: data.warehouseId
        });
      }

      await client.query('COMMIT');

      return {
        inventoryId,
        warehouseId: data.warehouseId,
        variantId: data.variantId,
        previousQuantity: currentQuantity,
        newQuantity,
        adjustment: data.quantity,
        type: data.type
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async transferInventory(data: InventoryTransferData, userId: string) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check source inventory
      const sourceResult = await client.query(
        `SELECT * FROM inventory 
         WHERE warehouse_id = $1 AND variant_id = $2`,
        [data.fromWarehouseId, data.variantId]
      );

      if (sourceResult.rows.length === 0 || sourceResult.rows[0].quantity < data.quantity) {
        throw new AppError('Insufficient inventory in source warehouse', 400);
      }

      // Deduct from source warehouse
      await this.adjustInventory({
        warehouseId: data.fromWarehouseId,
        variantId: data.variantId,
        quantity: data.quantity,
        type: 'out',
        notes: `Transfer to warehouse ${data.toWarehouseId}`,
        referenceType: 'transfer',
        referenceId: uuidv4()
      }, userId);

      // Add to destination warehouse
      await this.adjustInventory({
        warehouseId: data.toWarehouseId,
        variantId: data.variantId,
        quantity: data.quantity,
        type: 'in',
        notes: `Transfer from warehouse ${data.fromWarehouseId}`,
        referenceType: 'transfer',
        referenceId: uuidv4()
      }, userId);

      await client.query('COMMIT');

      return {
        success: true,
        message: 'Inventory transferred successfully',
        fromWarehouse: data.fromWarehouseId,
        toWarehouse: data.toWarehouseId,
        variantId: data.variantId,
        quantity: data.quantity
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getLowStockItems(warehouseId?: string) {
    let query = `
      SELECT 
        i.*,
        w.name as warehouse_name,
        pv.sku,
        pv.name as variant_name,
        pv.low_stock_threshold,
        p.name as product_name,
        p.id as product_id,
        s.name as supplier_name,
        s.email as supplier_email
      FROM inventory i
      JOIN warehouses w ON i.warehouse_id = w.id
      JOIN product_variants pv ON i.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE i.quantity <= pv.low_stock_threshold
        AND w.is_active = true
        AND pv.is_active = true
    `;

    const values = [];
    if (warehouseId) {
      query += ' AND i.warehouse_id = $1';
      values.push(warehouseId);
    }

    query += ' ORDER BY (i.quantity::float / NULLIF(pv.low_stock_threshold, 0)) ASC';

    const result = await pool.query(query, values);

    return result.rows.map(item => ({
      ...item,
      stockPercentage: item.low_stock_threshold > 0 
        ? Math.round((item.quantity / item.low_stock_threshold) * 100)
        : 0,
      urgency: item.quantity === 0 ? 'critical' : 
               item.quantity <= item.low_stock_threshold / 2 ? 'high' : 'medium'
    }));
  }

  async getInventoryTransactions(filters: any = {}, pagination: any = {}) {
    const {
      warehouseId,
      variantId,
      type,
      dateFrom,
      dateTo,
      userId
    } = filters;

    const { page = 1, limit = 50, sortBy = 'created_at', sortOrder = 'DESC' } = pagination;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        it.*,
        w.name as warehouse_name,
        pv.sku,
        pv.name as variant_name,
        p.name as product_name,
        u.email as created_by_email,
        u.first_name || ' ' || u.last_name as created_by_name,
        COUNT(*) OVER() as total_count
      FROM inventory_transactions it
      JOIN warehouses w ON it.warehouse_id = w.id
      JOIN product_variants pv ON it.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      LEFT JOIN users u ON it.created_by = u.id
      WHERE 1=1
    `;

    const values = [];
    let paramCount = 1;

    if (warehouseId) {
      query += ` AND it.warehouse_id = $${paramCount}`;
      values.push(warehouseId);
      paramCount++;
    }

    if (variantId) {
      query += ` AND it.variant_id = $${paramCount}`;
      values.push(variantId);
      paramCount++;
    }

    if (type) {
      query += ` AND it.type = $${paramCount}`;
      values.push(type);
      paramCount++;
    }

    if (dateFrom) {
      query += ` AND it.created_at >= $${paramCount}`;
      values.push(dateFrom);
      paramCount++;
    }

    if (dateTo) {
      query += ` AND it.created_at <= $${paramCount}`;
      values.push(dateTo);
      paramCount++;
    }

    if (userId) {
      query += ` AND it.created_by = $${paramCount}`;
      values.push(userId);
      paramCount++;
    }

    query += ` ORDER BY it.${sortBy} ${sortOrder}`;
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    const totalCount = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;
    const transactions = result.rows.map(row => {
      const { total_count, ...transaction } = row;
      return transaction;
    });

    return {
      transactions,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  }

  async getInventoryValuation(warehouseId?: string) {
    let query = `
      SELECT 
        SUM(i.quantity * pv.cost) as total_cost_value,
        SUM(i.quantity * pv.price) as total_retail_value,
        SUM(i.quantity) as total_units,
        COUNT(DISTINCT pv.id) as total_variants,
        COUNT(DISTINCT p.id) as total_products
      FROM inventory i
      JOIN product_variants pv ON i.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      WHERE i.quantity > 0
    `;

    const values = [];
    if (warehouseId) {
      query += ' AND i.warehouse_id = $1';
      values.push(warehouseId);
    }

    const result = await pool.query(query, values);

    // Get valuation by category
    let categoryQuery = `
      SELECT 
        c.name as category_name,
        SUM(i.quantity * pv.cost) as cost_value,
        SUM(i.quantity * pv.price) as retail_value,
        SUM(i.quantity) as units
      FROM inventory i
      JOIN product_variants pv ON i.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE i.quantity > 0
    `;

    if (warehouseId) {
      categoryQuery += ' AND i.warehouse_id = $1';
    }

    categoryQuery += ' GROUP BY c.id, c.name ORDER BY retail_value DESC';

    const categoryResult = await pool.query(categoryQuery, values);

    return {
      summary: result.rows[0],
      byCategory: categoryResult.rows,
      potentialProfit: result.rows[0] 
        ? parseFloat(result.rows[0].total_retail_value) - parseFloat(result.rows[0].total_cost_value)
        : 0
    };
  }

  private async createStockAlert(alert: StockAlertData) {
    // This would integrate with notification service
    // For now, just log the alert
    console.log('Low stock alert:', alert);
    
    // Could also:
    // - Send email to inventory manager
    // - Create notification in system
    // - Send SMS alert
    // - Create purchase order suggestion
  }

  async performStockCount(warehouseId: string, counts: Array<{ variantId: string; actualCount: number }>, userId: string) {
    const client = await pool.connect();
    const discrepancies = [];

    try {
      await client.query('BEGIN');

      for (const count of counts) {
        // Get current inventory
        const inventoryResult = await client.query(
          `SELECT quantity FROM inventory 
           WHERE warehouse_id = $1 AND variant_id = $2`,
          [warehouseId, count.variantId]
        );

        if (inventoryResult.rows.length > 0) {
          const currentQuantity = inventoryResult.rows[0].quantity;
          const difference = count.actualCount - currentQuantity;

          if (difference !== 0) {
            // Record discrepancy
            discrepancies.push({
              variantId: count.variantId,
              expected: currentQuantity,
              actual: count.actualCount,
              difference: difference
            });

            // Adjust inventory
            await this.adjustInventory({
              warehouseId,
              variantId: count.variantId,
              quantity: count.actualCount,
              type: 'adjustment',
              notes: `Stock count adjustment: Expected ${currentQuantity}, Actual ${count.actualCount}`,
              referenceType: 'stock_count'
            }, userId);
          }
        }
      }

      await client.query('COMMIT');

      return {
        success: true,
        itemsCounted: counts.length,
        discrepanciesFound: discrepancies.length,
        discrepancies
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}