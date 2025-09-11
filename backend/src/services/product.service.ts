import pool from '../config/database';
// import elasticsearchClient from '../config/elasticsearch';
import { AppError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import slugify from 'slugify';

interface ProductData {
  sku: string;
  name: string;
  description?: string;
  categoryId?: string;
  brandId?: string;
  supplierId?: string;
  status?: string;
  features?: string[];
  tags?: string[];
  warrantyMonths?: number;
  weight?: number;
  dimensions?: any;
  metadata?: any;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
}

interface VariantData {
  sku: string;
  barcode?: string;
  name?: string;
  attributes?: any;
  price: number;
  cost?: number;
  compareAtPrice?: number;
  stockQuantity?: number;
  lowStockThreshold?: number;
  isDefault?: boolean;
}

export class ProductService {
  async createProduct(data: ProductData, createdBy: string) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const productId = uuidv4();
      const slug = slugify(data.name, { lower: true, strict: true });

      const existingSlug = await client.query(
        'SELECT id FROM products WHERE slug = $1',
        [slug]
      );

      const finalSlug = existingSlug.rows.length > 0 
        ? `${slug}-${Date.now()}`
        : slug;

      const productResult = await client.query(
        `INSERT INTO products (
          id, sku, name, slug, description, category_id, brand_id, 
          supplier_id, status, features, tags, warranty_months, 
          weight, dimensions, metadata, seo_title, seo_description, 
          seo_keywords, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING *`,
        [
          productId,
          data.sku,
          data.name,
          finalSlug,
          data.description,
          data.categoryId,
          data.brandId,
          data.supplierId,
          data.status || 'draft',
          data.features,
          data.tags,
          data.warrantyMonths || 12,
          data.weight,
          data.dimensions,
          data.metadata || {},
          data.seoTitle || data.name,
          data.seoDescription || data.description,
          data.seoKeywords,
          createdBy
        ]
      );

      await client.query('COMMIT');

      await this.indexProductInElasticsearch(productResult.rows[0]);

      return productResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async createProductVariant(productId: string, data: VariantData) {
    const variantId = uuidv4();

    const result = await pool.query(
      `INSERT INTO product_variants (
        id, product_id, sku, barcode, name, attributes, 
        price, cost, compare_at_price, stock_quantity, 
        low_stock_threshold, is_default
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        variantId,
        productId,
        data.sku,
        data.barcode,
        data.name,
        data.attributes || {},
        data.price,
        data.cost,
        data.compareAtPrice,
        data.stockQuantity || 0,
        data.lowStockThreshold || 10,
        data.isDefault || false
      ]
    );

    return result.rows[0];
  }

  async updateProduct(productId: string, data: Partial<ProductData>) {
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        const snakeCase = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        updateFields.push(`${snakeCase} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (updateFields.length === 0) {
      throw new AppError('No fields to update', 400);
    }

    values.push(productId);
    const query = `
      UPDATE products 
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new AppError('Product not found', 404);
    }

    await this.indexProductInElasticsearch(result.rows[0]);

    return result.rows[0];
  }

  async getProducts(filters: any = {}, pagination: any = {}) {
    const {
      categoryId,
      brandId,
      status = 'active',
      minPrice,
      maxPrice,
      tags,
      search
    } = filters;

    const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'DESC' } = pagination;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        p.*,
        c.name as category_name,
        b.name as brand_name,
        COUNT(*) OVER() as total_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE 1=1
    `;

    const values = [];
    let paramCount = 1;

    if (categoryId) {
      query += ` AND p.category_id = $${paramCount}`;
      values.push(categoryId);
      paramCount++;
    }

    if (brandId) {
      query += ` AND p.brand_id = $${paramCount}`;
      values.push(brandId);
      paramCount++;
    }

    if (status) {
      query += ` AND p.status = $${paramCount}`;
      values.push(status);
      paramCount++;
    }

    if (tags && tags.length > 0) {
      query += ` AND p.tags && $${paramCount}`;
      values.push(tags);
      paramCount++;
    }

    if (search) {
      query += ` AND (p.name ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`;
      values.push(`%${search}%`);
      paramCount++;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query += ` AND EXISTS (
        SELECT 1 FROM product_variants pv 
        WHERE pv.product_id = p.id
      `;
      if (minPrice !== undefined) {
        query += ` AND pv.price >= $${paramCount}`;
        values.push(minPrice);
        paramCount++;
      }
      if (maxPrice !== undefined) {
        query += ` AND pv.price <= $${paramCount}`;
        values.push(maxPrice);
        paramCount++;
      }
      query += ')';
    }

    query += ` ORDER BY p.${sortBy} ${sortOrder}`;
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    const totalCount = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;
    const products = result.rows.map(row => {
      const { total_count, ...product } = row;
      return product;
    });

    return {
      products,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  }

  async getProductById(productId: string) {
    const productResult = await pool.query(
      `SELECT 
        p.*,
        c.name as category_name,
        b.name as brand_name,
        s.name as supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.id = $1`,
      [productId]
    );

    if (productResult.rows.length === 0) {
      throw new AppError('Product not found', 404);
    }

    const variantsResult = await pool.query(
      'SELECT * FROM product_variants WHERE product_id = $1 ORDER BY is_default DESC, created_at',
      [productId]
    );

    const imagesResult = await pool.query(
      'SELECT * FROM product_images WHERE product_id = $1 ORDER BY display_order, created_at',
      [productId]
    );

    const specificationsResult = await pool.query(
      'SELECT * FROM product_specifications WHERE product_id = $1 ORDER BY display_order',
      [productId]
    );

    return {
      ...productResult.rows[0],
      variants: variantsResult.rows,
      images: imagesResult.rows,
      specifications: specificationsResult.rows
    };
  }

  async deleteProduct(productId: string) {
    const result = await pool.query(
      'DELETE FROM products WHERE id = $1 RETURNING id',
      [productId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Product not found', 404);
    }

    // await elasticsearchClient.delete({
    //   index: 'products',
    //   id: productId
    // }).catch(() => {});

    return { message: 'Product deleted successfully' };
  }

  async searchProducts(searchTerm: string, limit = 10) {
    // try {
    //   const response = await elasticsearchClient.search({
    //     index: 'products',
    //     body: {
    //       query: {
    //         multi_match: {
    //           query: searchTerm,
    //           fields: ['name^3', 'description', 'tags^2', 'sku'],
    //           type: 'best_fields',
    //           fuzziness: 'AUTO'
    //         }
    //       },
    //       size: limit
    //     }
    //   });

    //   return response.hits.hits.map((hit: any) => hit._source);
    // } catch (error) {
      const result = await pool.query(
        `SELECT * FROM products 
         WHERE name ILIKE $1 OR description ILIKE $1 OR sku ILIKE $1
         AND status = 'active'
         LIMIT $2`,
        [`%${searchTerm}%`, limit]
      );

      return result.rows;
    // }
  }

  private async indexProductInElasticsearch(product: any) {
    // try {
    //   await elasticsearchClient.index({
    //     index: 'products',
    //     id: product.id,
    //     body: {
    //       id: product.id,
    //       sku: product.sku,
    //       name: product.name,
    //       description: product.description,
    //       tags: product.tags,
    //       status: product.status,
    //       categoryId: product.category_id,
    //       brandId: product.brand_id,
    //       createdAt: product.created_at,
    //       updatedAt: product.updated_at
    //     }
    //   });
    // } catch (error) {
    //   console.error('Failed to index product in Elasticsearch:', error);
    // }
  }
}