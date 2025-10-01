import { Request, Response } from 'express';
import pool from '../config/database';
import { AppError } from '../middleware/errorHandler';

export class ProductsRawController {
  static async getProducts(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        category,
        status,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        inStock
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const conditions: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (search) {
        conditions.push(`(p.name ILIKE $${paramCount} OR p.sku ILIKE $${paramCount})`);
        values.push(`%${search}%`);
        paramCount++;
      }

      if (category) {
        conditions.push(`p.category_id = $${paramCount}`);
        values.push(category);
        paramCount++;
      }

      if (status) {
        conditions.push(`p.status::text = $${paramCount}`);
        values.push(status);
        paramCount++;
      }

      if (inStock === 'true') {
        conditions.push(`pv.stock_quantity > 0`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Count query
      const countQuery = `
        SELECT COUNT(DISTINCT p.id) as total
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.is_default = true
        ${whereClause}
      `;
      const countResult = await pool.query(countQuery, values);
      const total = parseInt(countResult.rows[0].total);

      // Data query
      const dataQuery = `
        SELECT
          p.id,
          p.name,
          p.sku,
          p.description,
          p.category_id as "categoryId",
          COALESCE(pv.price, 0) as price,
          COALESCE(pv.stock_quantity, 0) as "stockQuantity",
          COALESCE(pv.low_stock_threshold, 10) as "reorderLevel",
          'piece' as unit,
          p.status,
          COALESCE(
            (SELECT json_agg(pi.url)
             FROM product_images pi
             WHERE pi.product_id = p.id
             LIMIT 5),
            '[]'::json
          ) as images,
          (SELECT pi.url
           FROM product_images pi
           WHERE pi.product_id = p.id
           ORDER BY pi.display_order
           LIMIT 1) as image,
          b.name as brand,
          pv.barcode,
          '' as manufacturer,
          NULL as "expiryDate",
          '' as "batchNumber",
          p.description as notes,
          p.created_at as "createdAt",
          p.updated_at as "updatedAt",
          c.id as "category.id",
          c.name as "category.name"
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.is_default = true
        ${whereClause}
        ORDER BY p.created_at ${sortOrder.toUpperCase()}
        LIMIT $${paramCount} OFFSET $${paramCount + 1}
      `;

      values.push(Number(limit), offset);
      const dataResult = await pool.query(dataQuery, values);

      // Transform flat results to nested structure
      const products = dataResult.rows.map(row => ({
        id: row.id,
        name: row.name,
        sku: row.sku,
        description: row.description,
        categoryId: row.categoryId,
        price: row.price,
        stockQuantity: row.stockQuantity,
        reorderLevel: row.reorderLevel,
        unit: row.unit,
        status: row.status,
        images: row.images,
        image: row.image,
        brand: row.brand,
        barcode: row.barcode,
        manufacturer: row.manufacturer,
        expiryDate: row.expiryDate,
        batchNumber: row.batchNumber,
        notes: row.notes,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        category: row['category.id'] ? {
          id: row['category.id'],
          name: row['category.name']
        } : null
      }));

      res.json({
        success: true,
        data: products,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error: any) {
      console.error('Error fetching products:', error);
      res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        stack: error.stack
      });
    }
  }

  static async getProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const query = `
        SELECT
          p.id,
          p.name,
          p.sku,
          p.description,
          p.category_id as "categoryId",
          COALESCE(pv.price, 0) as price,
          COALESCE(pv.stock_quantity, 0) as "stockQuantity",
          COALESCE(pv.low_stock_threshold, 10) as "reorderLevel",
          'piece' as unit,
          p.status,
          COALESCE(
            (SELECT json_agg(pi.url)
             FROM product_images pi
             WHERE pi.product_id = p.id),
            '[]'::json
          ) as images,
          (SELECT pi.url
           FROM product_images pi
           WHERE pi.product_id = p.id
           ORDER BY pi.display_order
           LIMIT 1) as image,
          b.name as brand,
          pv.barcode,
          p.created_at as "createdAt",
          p.updated_at as "updatedAt",
          c.id as "category.id",
          c.name as "category.name"
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.is_default = true
        WHERE p.id = $1
      `;

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      const row = result.rows[0];
      const product = {
        id: row.id,
        name: row.name,
        sku: row.sku,
        description: row.description,
        categoryId: row.categoryId,
        price: row.price,
        stockQuantity: row.stockQuantity,
        reorderLevel: row.reorderLevel,
        unit: row.unit,
        status: row.status,
        images: row.images,
        image: row.image,
        brand: row.brand,
        barcode: row.barcode,
        manufacturer: row.manufacturer,
        expiryDate: row.expiryDate,
        batchNumber: row.batchNumber,
        notes: row.notes,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        category: row['category.id'] ? {
          id: row['category.id'],
          name: row['category.name']
        } : null
      };

      res.json({
        success: true,
        data: product
      });
    } catch (error: any) {
      console.error('Error fetching product:', error);
      res.status(500).json({
        success: false,
        message: 'Something went wrong!'
      });
    }
  }

  static async getProductStats(req: Request, res: Response) {
    try {
      const query = `
        SELECT
          COUNT(DISTINCT p.id) as "totalProducts",
          COUNT(DISTINCT p.id) FILTER (WHERE p.status::text = 'active') as "activeProducts",
          COUNT(DISTINCT p.id) FILTER (WHERE pv.stock_quantity <= pv.low_stock_threshold) as "lowStockProducts",
          COUNT(DISTINCT p.id) FILTER (WHERE pv.stock_quantity = 0) as "outOfStockProducts",
          COALESCE(SUM(pv.price * pv.stock_quantity), 0) as "totalValue"
        FROM products p
        LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.is_default = true
      `;

      const result = await pool.query(query);
      const stats = result.rows[0];

      res.json({
        success: true,
        data: {
          total: parseInt(stats.totalProducts),
          active: parseInt(stats.activeProducts),
          lowStock: parseInt(stats.lowStockProducts),
          outOfStock: parseInt(stats.outOfStockProducts),
          totalValue: parseFloat(stats.totalValue)
        }
      });
    } catch (error: any) {
      console.error('Error fetching product stats:', error);
      res.status(500).json({
        success: false,
        message: 'Something went wrong!'
      });
    }
  }

  static async getLowStockProducts(req: Request, res: Response) {
    try {
      const query = `
        SELECT
          p.id,
          p.name,
          p.sku,
          pv.stock_quantity as "stockQuantity",
          pv.low_stock_threshold as "reorderLevel",
          c.id as "category.id",
          c.name as "category.name"
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.is_default = true
        WHERE pv.stock_quantity <= pv.low_stock_threshold
        ORDER BY pv.stock_quantity ASC
        LIMIT 50
      `;

      const result = await pool.query(query);
      const products = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        sku: row.sku,
        stockQuantity: row.stockQuantity,
        reorderLevel: row.reorderLevel,
        category: row['category.id'] ? {
          id: row['category.id'],
          name: row['category.name']
        } : null
      }));

      res.json({
        success: true,
        data: products
      });
    } catch (error: any) {
      console.error('Error fetching low stock products:', error);
      res.status(500).json({
        success: false,
        message: 'Something went wrong!'
      });
    }
  }

  static async getProductByBarcode(req: Request, res: Response) {
    try {
      const { barcode } = req.params;

      const query = `
        SELECT
          p.id,
          p.name,
          p.sku,
          pv.price,
          pv.stock_quantity as "stockQuantity",
          c.id as "category.id",
          c.name as "category.name"
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.is_default = true
        WHERE pv.barcode = $1
      `;

      const result = await pool.query(query, [barcode]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      const row = result.rows[0];
      const product = {
        id: row.id,
        name: row.name,
        sku: row.sku,
        price: row.price,
        stockQuantity: row.stockQuantity,
        category: row['category.id'] ? {
          id: row['category.id'],
          name: row['category.name']
        } : null
      };

      res.json({
        success: true,
        data: product
      });
    } catch (error: any) {
      console.error('Error fetching product by barcode:', error);
      res.status(500).json({
        success: false,
        message: 'Something went wrong!'
      });
    }
  }

  static async createProduct(req: Request, res: Response) {
    const client = await pool.connect();
    try {
      const {
        name,
        sku,
        description,
        categoryId,
        price,
        stockQuantity,
        reorderLevel,
        status,
        image,
        barcode
      } = req.body;

      await client.query('BEGIN');

      // Insert product
      const productQuery = `
        INSERT INTO products (
          name, sku, description, category_id, status
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

      const productValues = [
        name,
        sku,
        description,
        categoryId || null,
        status || 'draft'
      ];

      const productResult = await client.query(productQuery, productValues);
      const product = productResult.rows[0];

      // Insert default variant
      const variantQuery = `
        INSERT INTO product_variants (
          product_id, sku, barcode, price, stock_quantity,
          low_stock_threshold, is_default, is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, true, true)
        RETURNING *
      `;

      const variantValues = [
        product.id,
        sku,
        barcode || null,
        price || 0,
        stockQuantity || 0,
        reorderLevel || 10
      ];

      const variantResult = await client.query(variantQuery, variantValues);

      // Insert image if provided
      if (image) {
        await client.query(
          `INSERT INTO product_images (product_id, url, is_primary, display_order)
           VALUES ($1, $2, true, 0)`,
          [product.id, image]
        );
      }

      await client.query('COMMIT');

      res.status(201).json({
        success: true,
        data: {
          ...product,
          price: variantResult.rows[0].price,
          stockQuantity: variantResult.rows[0].stock_quantity,
          reorderLevel: variantResult.rows[0].low_stock_threshold,
          image
        }
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      console.error('Error creating product:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Something went wrong!'
      });
    } finally {
      client.release();
    }
  }

  static async updateProduct(req: Request, res: Response) {
    const client = await pool.connect();
    try {
      const { id } = req.params;
      const { name, description, categoryId, price, stockQuantity, reorderLevel, status, image } = req.body;

      await client.query('BEGIN');

      // Update product
      const productFields = [];
      const productValues = [];
      let paramCount = 1;

      if (name !== undefined) {
        productFields.push(`name = $${paramCount++}`);
        productValues.push(name);
      }
      if (description !== undefined) {
        productFields.push(`description = $${paramCount++}`);
        productValues.push(description);
      }
      if (categoryId !== undefined) {
        productFields.push(`category_id = $${paramCount++}`);
        productValues.push(categoryId);
      }
      if (status !== undefined) {
        productFields.push(`status = $${paramCount++}::product_status`);
        productValues.push(status);
      }

      if (productFields.length > 0) {
        productValues.push(id);
        const productQuery = `
          UPDATE products
          SET ${productFields.join(', ')}, updated_at = NOW()
          WHERE id = $${paramCount}
          RETURNING *
        `;
        await client.query(productQuery, productValues);
      }

      // Update variant
      const variantFields = [];
      const variantValues = [];
      paramCount = 1;

      if (price !== undefined) {
        variantFields.push(`price = $${paramCount++}`);
        variantValues.push(price);
      }
      if (stockQuantity !== undefined) {
        variantFields.push(`stock_quantity = $${paramCount++}`);
        variantValues.push(stockQuantity);
      }
      if (reorderLevel !== undefined) {
        variantFields.push(`low_stock_threshold = $${paramCount++}`);
        variantValues.push(reorderLevel);
      }

      if (variantFields.length > 0) {
        variantValues.push(id);
        const variantQuery = `
          UPDATE product_variants
          SET ${variantFields.join(', ')}, updated_at = NOW()
          WHERE product_id = $${paramCount} AND is_default = true
          RETURNING *
        `;
        await client.query(variantQuery, variantValues);
      }

      // Update image if provided
      if (image) {
        await client.query(
          `INSERT INTO product_images (product_id, url, is_primary, display_order)
           VALUES ($1, $2, true, 0)
           ON CONFLICT (product_id) WHERE is_primary = true
           DO UPDATE SET url = $2`,
          [id, image]
        );
      }

      await client.query('COMMIT');

      // Fetch updated product
      const result = await pool.query(`
        SELECT
          p.id, p.name, p.sku, p.description, p.category_id as "categoryId",
          p.status, pv.price, pv.stock_quantity as "stockQuantity",
          pv.low_stock_threshold as "reorderLevel",
          p.created_at as "createdAt", p.updated_at as "updatedAt"
        FROM products p
        LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.is_default = true
        WHERE p.id = $1
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      console.error('Error updating product:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Something went wrong!'
      });
    } finally {
      client.release();
    }
  }

  static async updateStock(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { stockQuantity } = req.body;

      const query = `
        UPDATE product_variants
        SET stock_quantity = $1, updated_at = NOW()
        WHERE product_id = $2 AND is_default = true
        RETURNING *
      `;

      const result = await pool.query(query, [stockQuantity, id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      res.json({
        success: true,
        data: {
          id,
          stockQuantity: result.rows[0].stock_quantity
        }
      });
    } catch (error: any) {
      console.error('Error updating stock:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Something went wrong!'
      });
    }
  }

  static async deleteProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Delete will cascade to variants and images
      const query = 'DELETE FROM products WHERE id = $1 RETURNING *';
      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      res.json({
        success: true,
        message: 'Product deleted successfully'
      });
    } catch (error: any) {
      console.error('Error deleting product:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Something went wrong!'
      });
    }
  }

  static async bulkUpdateProducts(req: Request, res: Response) {
    const client = await pool.connect();
    try {
      const { products } = req.body;

      await client.query('BEGIN');

      for (const product of products) {
        const { id, name, description, categoryId, price, stockQuantity, status } = product;

        // Update product table
        const productFields = [];
        const productValues = [];
        let paramCount = 1;

        if (name) {
          productFields.push(`name = $${paramCount++}`);
          productValues.push(name);
        }
        if (description !== undefined) {
          productFields.push(`description = $${paramCount++}`);
          productValues.push(description);
        }
        if (categoryId !== undefined) {
          productFields.push(`category_id = $${paramCount++}`);
          productValues.push(categoryId);
        }
        if (status) {
          productFields.push(`status = $${paramCount++}::product_status`);
          productValues.push(status);
        }

        if (productFields.length > 0) {
          productValues.push(id);
          await client.query(
            `UPDATE products SET ${productFields.join(', ')}, updated_at = NOW() WHERE id = $${paramCount}`,
            productValues
          );
        }

        // Update variant table
        if (price !== undefined || stockQuantity !== undefined) {
          const variantFields = [];
          const variantValues = [];
          paramCount = 1;

          if (price !== undefined) {
            variantFields.push(`price = $${paramCount++}`);
            variantValues.push(price);
          }
          if (stockQuantity !== undefined) {
            variantFields.push(`stock_quantity = $${paramCount++}`);
            variantValues.push(stockQuantity);
          }

          variantValues.push(id);
          await client.query(
            `UPDATE product_variants SET ${variantFields.join(', ')}, updated_at = NOW() WHERE product_id = $${paramCount} AND is_default = true`,
            variantValues
          );
        }
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Products updated successfully'
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      console.error('Error bulk updating products:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Something went wrong!'
      });
    } finally {
      client.release();
    }
  }

  static async bulkDeleteProducts(req: Request, res: Response) {
    try {
      const { ids } = req.body;

      const query = 'DELETE FROM products WHERE id = ANY($1)';
      await pool.query(query, [ids]);

      res.json({
        success: true,
        message: 'Products deleted successfully'
      });
    } catch (error: any) {
      console.error('Error bulk deleting products:', error);
      res.status(500).json({
        success: false,
        message: 'Something went wrong!'
      });
    }
  }
}