import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';
import { query, validationResult } from 'express-validator';

export class WarehouseController {
  static validateGetWarehouses = [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('isActive').optional().isBoolean()
  ];

  static async getAllWarehouses(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;
      const isActive = req.query.isActive;

      let countQuery = 'SELECT COUNT(*) FROM warehouses';
      let dataQuery = `
        SELECT
          id,
          code,
          name,
          address,
          phone,
          is_active,
          created_at,
          updated_at
        FROM warehouses
      `;

      const params: any[] = [];
      const conditions: string[] = [];

      if (isActive !== undefined) {
        conditions.push(`is_active = $${params.length + 1}`);
        params.push(isActive === 'true');
      }

      if (conditions.length > 0) {
        const whereClause = ' WHERE ' + conditions.join(' AND ');
        countQuery += whereClause;
        dataQuery += whereClause;
      }

      dataQuery += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const [countResult, dataResult] = await Promise.all([
        pool.query(countQuery, params.slice(0, -2)),
        pool.query(dataQuery, params)
      ]);

      const totalCount = parseInt(countResult.rows[0].count);
      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        success: true,
        data: dataResult.rows,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages
        }
      });
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      next(error);
    }
  }

  static async getWarehouseById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `SELECT
          id,
          code,
          name,
          address,
          phone,
          is_active,
          created_at,
          updated_at
        FROM warehouses
        WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Warehouse not found'
        });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error fetching warehouse:', error);
      next(error);
    }
  }

  static async getWarehouseInventory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      // Check if warehouse exists
      const warehouseCheck = await pool.query(
        'SELECT id FROM warehouses WHERE id = $1',
        [id]
      );

      if (warehouseCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Warehouse not found'
        });
      }

      const countQuery = `
        SELECT COUNT(*)
        FROM inventory i
        WHERE i.warehouse_id = $1
      `;

      const dataQuery = `
        SELECT
          i.id,
          i.variant_id,
          i.warehouse_id,
          i.quantity,
          i.reserved_quantity,
          i.last_restocked_at,
          pv.sku as variant_sku,
          pv.name as variant_name,
          pv.price,
          pv.low_stock_threshold,
          p.id as product_id,
          p.name as product_name,
          p.sku as product_sku,
          w.code as warehouse_code,
          w.name as warehouse_name,
          CASE
            WHEN i.quantity <= pv.low_stock_threshold THEN true
            ELSE false
          END as "isLowStock"
        FROM inventory i
        JOIN product_variants pv ON i.variant_id = pv.id
        JOIN products p ON pv.product_id = p.id
        JOIN warehouses w ON i.warehouse_id = w.id
        WHERE i.warehouse_id = $1
        ORDER BY i.last_restocked_at DESC
        LIMIT $2 OFFSET $3
      `;

      const [countResult, dataResult] = await Promise.all([
        pool.query(countQuery, [id]),
        pool.query(dataQuery, [id, limit, offset])
      ]);

      const totalCount = parseInt(countResult.rows[0].count);
      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        success: true,
        data: dataResult.rows,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages
        }
      });
    } catch (error) {
      console.error('Error fetching warehouse inventory:', error);
      next(error);
    }
  }
}
