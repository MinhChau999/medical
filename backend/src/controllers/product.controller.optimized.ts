import { Request, Response } from 'express';
import pool from '../config/database';
import { cacheService, cacheMiddleware } from '../services/cache.service';
import { queryOptimizer } from '../services/queryOptimizer.service';
import { logger } from '../utils/logger';

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products with pagination
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: category
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: min_price
 *         schema:
 *           type: number
 *       - in: query
 *         name: max_price
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: List of products
 */
export const getProducts = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, category, search, min_price, max_price, sort = 'created_at', order = 'DESC' } = req.query;
    
    // Build cache key
    const cacheKey = `products:${JSON.stringify(req.query)}`;
    
    // Try to get from cache
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    
    // Build optimized query
    let baseQuery = `
      SELECT p.*, c.name as category_name,
             COALESCE(i.quantity, 0) as stock_quantity,
             array_agg(DISTINCT pi.image_url) FILTER (WHERE pi.image_url IS NOT NULL) as images
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id
      LEFT JOIN product_images pi ON p.id = pi.product_id
    `;
    
    const conditions: any = {};
    const allowedFields = ['category_id', 'status'];
    
    if (category) conditions.category_id = category;
    if (search) {
      baseQuery += ` WHERE to_tsvector('english', p.name || ' ' || COALESCE(p.description, '')) @@ plainto_tsquery('english', $${Object.keys(conditions).length + 1})`;
    }
    
    // Add price range
    if (min_price || max_price) {
      conditions.price = {};
      if (min_price) conditions.price.min = min_price;
      if (max_price) conditions.price.max = max_price;
    }
    
    // Build WHERE clause
    const { whereClause, params } = queryOptimizer.buildWhereClause(
      conditions,
      allowedFields,
      search ? 2 : 1
    );
    
    if (search) {
      params.unshift(search);
    }
    
    baseQuery += ` ${whereClause} GROUP BY p.id, c.name, i.quantity`;
    
    // Add pagination
    const paginationOptions = {
      page: Number(page),
      limit: Number(limit),
      sort: String(sort),
      order: order as 'ASC' | 'DESC'
    };
    
    const { query, offset, limit: queryLimit } = queryOptimizer.buildPaginationQuery(
      baseQuery,
      paginationOptions,
      ['name', 'price', 'created_at', 'stock_quantity']
    );
    
    // Execute optimized query
    const { rows, stats } = await queryOptimizer.executeWithStats<any>(
      query,
      [...params, queryLimit, offset],
      'getProducts'
    );
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM products p
      ${whereClause}
    `;
    
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0]?.total || '0');
    
    const response = {
      data: rows,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
        queryTime: stats.executionTime
      }
    };
    
    // Cache the response
    await cacheService.set(cacheKey, response, { 
      ttl: 300, // 5 minutes
      tags: ['products'] 
    });
    
    res.json(response);
  } catch (error) {
    logger.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 */
export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Try cache first
    const cacheKey = `product:${id}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    
    const query = `
      SELECT p.*, c.name as category_name,
             COALESCE(i.quantity, 0) as stock_quantity,
             array_agg(DISTINCT pi.image_url) FILTER (WHERE pi.image_url IS NOT NULL) as images,
             json_agg(DISTINCT jsonb_build_object(
               'attribute', pa.attribute_name,
               'value', pa.attribute_value
             )) FILTER (WHERE pa.attribute_name IS NOT NULL) as attributes
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id
      LEFT JOIN product_images pi ON p.id = pi.product_id
      LEFT JOIN product_attributes pa ON p.id = pa.product_id
      WHERE p.id = $1
      GROUP BY p.id, c.name, i.quantity
    `;
    
    const { rows, stats } = await queryOptimizer.executeWithStats<any>(
      query,
      [id],
      'getProductById'
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const product = {
      ...rows[0],
      queryTime: stats.executionTime
    };
    
    // Cache the product
    await cacheService.set(cacheKey, product, { 
      ttl: 600, // 10 minutes
      tags: ['products', `product-${id}`] 
    });
    
    res.json(product);
  } catch (error) {
    logger.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 */
export const createProduct = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { name, sku, price, category_id, description, stock_quantity = 0, images = [], attributes = [] } = req.body;
    
    // Insert product
    const productQuery = `
      INSERT INTO products (name, sku, price, category_id, description, status)
      VALUES ($1, $2, $3, $4, $5, 'active')
      RETURNING *
    `;
    
    const productResult = await client.query(productQuery, [name, sku, price, category_id, description]);
    const product = productResult.rows[0];
    
    // Insert inventory record
    const inventoryQuery = `
      INSERT INTO inventory (product_id, quantity, warehouse_id, reorder_point, reorder_quantity)
      VALUES ($1, $2, 1, 10, 50)
    `;
    await client.query(inventoryQuery, [product.id, stock_quantity]);
    
    // Insert images if provided
    if (images.length > 0) {
      const imageValues = images.map((url: string, index: number) => 
        `($1, $${index + 2}, ${index === 0})`
      ).join(', ');
      
      const imageQuery = `
        INSERT INTO product_images (product_id, image_url, is_primary)
        VALUES ${imageValues}
      `;
      await client.query(imageQuery, [product.id, ...images]);
    }
    
    // Insert attributes if provided
    if (attributes.length > 0) {
      const attrValues = attributes.map((attr: any, index: number) => 
        `($1, $${index * 2 + 2}, $${index * 2 + 3})`
      ).join(', ');
      
      const attrParams = attributes.flatMap((attr: any) => [attr.name, attr.value]);
      
      const attrQuery = `
        INSERT INTO product_attributes (product_id, attribute_name, attribute_value)
        VALUES ${attrValues}
      `;
      await client.query(attrQuery, [product.id, ...attrParams]);
    }
    
    await client.query('COMMIT');
    
    // Invalidate product cache
    await cacheService.invalidateByTags(['products']);
    
    // Log analytics event
    const analyticsQuery = `
      INSERT INTO analytics_events (event_type, event_data, user_id)
      VALUES ('product_created', $1, $2)
    `;
    await pool.query(analyticsQuery, [
      JSON.stringify({ product_id: product.id, name, sku }),
      (req as any).user?.id || null
    ]);
    
    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  } finally {
    client.release();
  }
};

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 */
export const updateProduct = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const updates = req.body;
    
    // Build dynamic update query
    const updateFields = Object.keys(updates)
      .filter(key => ['name', 'price', 'description', 'status', 'category_id'].includes(key))
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    if (!updateFields) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    const updateQuery = `
      UPDATE products 
      SET ${updateFields}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    const updateValues = Object.keys(updates)
      .filter(key => ['name', 'price', 'description', 'status', 'category_id'].includes(key))
      .map(key => updates[key]);
    
    const result = await client.query(updateQuery, [id, ...updateValues]);
    
    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Update inventory if stock_quantity provided
    if (updates.stock_quantity !== undefined) {
      const inventoryQuery = `
        UPDATE inventory 
        SET quantity = $1, updated_at = CURRENT_TIMESTAMP
        WHERE product_id = $2
      `;
      await client.query(inventoryQuery, [updates.stock_quantity, id]);
    }
    
    await client.query('COMMIT');
    
    // Invalidate caches
    await cacheService.invalidateByTags(['products', `product-${id}`]);
    
    res.json({
      message: 'Product updated successfully',
      product: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  } finally {
    client.release();
  }
};

/**
 * @swagger
 * /products/search:
 *   get:
 *     summary: Search products with full-text search
 *     tags: [Products]
 */
export const searchProducts = async (req: Request, res: Response) => {
  try {
    const { q, category, min_price, max_price, page = 1, limit = 20 } = req.query;
    
    if (!q || String(q).length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }
    
    const cacheKey = `search:${JSON.stringify(req.query)}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    
    // Full-text search query with ranking
    const searchQuery = `
      SELECT p.*, 
             ts_rank(to_tsvector('english', p.name || ' ' || COALESCE(p.description, '')), 
                     plainto_tsquery('english', $1)) as rank,
             c.name as category_name,
             array_agg(DISTINCT pi.image_url) FILTER (WHERE pi.image_url IS NOT NULL) as images
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_images pi ON p.id = pi.product_id
      WHERE to_tsvector('english', p.name || ' ' || COALESCE(p.description, '')) 
            @@ plainto_tsquery('english', $1)
      ${category ? 'AND p.category_id = $2' : ''}
      ${min_price ? `AND p.price >= $${category ? 3 : 2}` : ''}
      ${max_price ? `AND p.price <= $${min_price ? 4 : (category ? 3 : 2)}` : ''}
      GROUP BY p.id, c.name
      ORDER BY rank DESC
      LIMIT $${[q, category, min_price, max_price].filter(Boolean).length + 1} 
      OFFSET $${[q, category, min_price, max_price].filter(Boolean).length + 2}
    `;
    
    const params = [q, category, min_price, max_price].filter(Boolean);
    const offset = (Number(page) - 1) * Number(limit);
    params.push(Number(limit), offset);
    
    const { rows, stats } = await queryOptimizer.executeWithStats<any>(
      searchQuery,
      params,
      'searchProducts'
    );
    
    const response = {
      results: rows,
      query: q,
      count: rows.length,
      queryTime: stats.executionTime
    };
    
    // Cache search results for shorter time
    await cacheService.set(cacheKey, response, { ttl: 60 }); // 1 minute
    
    res.json(response);
  } catch (error) {
    logger.error('Error searching products:', error);
    res.status(500).json({ error: 'Search failed' });
  }
};