import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import slugify from 'slugify';

interface CreateCategoryDto {
  name: string;
  nameEn?: string;
  description?: string;
  parentId?: string | null;
  order?: number;
  status?: 'active' | 'inactive';
}

interface UpdateCategoryDto extends Partial<CreateCategoryDto> {}

export class CategoriesController {
  // Get all categories with tree structure
  static async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await pool.query(`
        WITH RECURSIVE category_tree AS (
          SELECT 
            c.*,
            0 as level,
            ARRAY[c.id] as path,
            ARRAY[COALESCE(c.display_order, 0)] as order_path
          FROM categories c
          WHERE c.parent_id IS NULL
          
          UNION ALL
          
          SELECT 
            c.*,
            ct.level + 1,
            ct.path || c.id,
            ct.order_path || COALESCE(c.display_order, 0)
          FROM categories c
          INNER JOIN category_tree ct ON c.parent_id = ct.id
        )
        SELECT 
          id,
          name,
          name as "nameEn",
          slug,
          description,
          parent_id as "parentId",
          display_order as "order",
          CASE WHEN is_active THEN 'active' ELSE 'inactive' END as status,
          image_url as image,
          level,
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM category_tree
        ORDER BY order_path
      `);

      // Build tree structure
      const categoriesMap = new Map();
      const rootCategories: any[] = [];

      result.rows.forEach(category => {
        category.children = [];
        categoriesMap.set(category.id, category);
      });

      result.rows.forEach(category => {
        if (category.parentId) {
          const parent = categoriesMap.get(category.parentId);
          if (parent) {
            parent.children.push(category);
          }
        } else {
          rootCategories.push(category);
        }
      });

      res.json({
        success: true,
        data: rootCategories
      });
    } catch (error) {
      next(error);
    }
  }

  // Get single category by ID
  static async getCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const result = await pool.query(`
        SELECT 
          id,
          name,
          name as "nameEn",
          slug,
          description,
          parent_id as "parentId",
          display_order as "order",
          CASE WHEN is_active THEN 'active' ELSE 'inactive' END as status,
          image_url as image,
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM categories
        WHERE id = $1
      `, [id]);

      if (result.rows.length === 0) {
        throw new AppError('Category not found', 404);
      }

      // Get children
      const childrenResult = await pool.query(`
        SELECT 
          id,
          name,
          name as "nameEn",
          slug,
          description,
          display_order as "order",
          CASE WHEN is_active THEN 'active' ELSE 'inactive' END as status,
          image_url as image
        FROM categories
        WHERE parent_id = $1
        ORDER BY display_order
      `, [id]);

      const category = result.rows[0];
      category.children = childrenResult.rows;

      res.json({
        success: true,
        data: category
      });
    } catch (error) {
      next(error);
    }
  }

  // Create new category
  static async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { 
        name, 
        nameEn, 
        description,
        parentId,
        order = 0,
        status = 'active'
      } = req.body;

      // Generate slug from name
      const slug = slugify(name, { lower: true, strict: true });

      // Check if slug already exists
      const existingSlug = await pool.query(
        'SELECT id FROM categories WHERE slug = $1',
        [slug]
      );

      if (existingSlug.rows.length > 0) {
        throw new AppError('Category with this name already exists', 400);
      }

      // Validate parent if provided
      if (parentId) {
        const parentExists = await pool.query(
          'SELECT id FROM categories WHERE id = $1',
          [parentId]
        );
        if (parentExists.rows.length === 0) {
          throw new AppError('Parent category not found', 404);
        }
      }

      const id = uuidv4();
      const result = await pool.query(`
        INSERT INTO categories (
          id, name, slug, description, 
          parent_id, display_order, is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING 
          id,
          name,
          name as "nameEn",
          slug,
          description,
          parent_id as "parentId",
          display_order as "order",
          CASE WHEN is_active THEN 'active' ELSE 'inactive' END as status,
          image_url as image,
          created_at as "createdAt",
          updated_at as "updatedAt"
      `, [
        id, name, slug, description,
        parentId, order, status === 'active'
      ]);

      res.status(201).json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      next(error);
    }
  }

  // Update category
  static async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { 
        name, 
        nameEn, 
        description,
        parentId,
        order,
        status
      } = req.body;

      // Check if category exists
      const categoryExists = await pool.query(
        'SELECT id, slug FROM categories WHERE id = $1',
        [id]
      );

      if (categoryExists.rows.length === 0) {
        throw new AppError('Category not found', 404);
      }

      let slug = categoryExists.rows[0].slug;
      
      // Generate new slug if name changed
      if (name) {
        slug = slugify(name, { lower: true, strict: true });
        
        // Check if new slug already exists (excluding current category)
        const existingSlug = await pool.query(
          'SELECT id FROM categories WHERE slug = $1 AND id != $2',
          [slug, id]
        );

        if (existingSlug.rows.length > 0) {
          throw new AppError('Category with this name already exists', 400);
        }
      }

      // Validate parent if provided
      if (parentId !== undefined) {
        if (parentId === id) {
          throw new AppError('Category cannot be its own parent', 400);
        }
        
        if (parentId) {
          const parentExists = await pool.query(
            'SELECT id FROM categories WHERE id = $1',
            [parentId]
          );
          if (parentExists.rows.length === 0) {
            throw new AppError('Parent category not found', 404);
          }
        }
      }

      // Build dynamic update query
      const updates = [];
      const values = [];
      let paramCount = 1;

      if (name !== undefined) {
        updates.push(`name = $${paramCount++}`);
        values.push(name);
        updates.push(`slug = $${paramCount++}`);
        values.push(slug);
      }
      if (description !== undefined) {
        updates.push(`description = $${paramCount++}`);
        values.push(description);
      }
      if (parentId !== undefined) {
        updates.push(`parent_id = $${paramCount++}`);
        values.push(parentId);
      }
      if (order !== undefined) {
        updates.push(`display_order = $${paramCount++}`);
        values.push(order);
      }
      if (status !== undefined) {
        updates.push(`is_active = $${paramCount++}`);
        values.push(status === 'active');
      }

      if (updates.length === 0) {
        throw new AppError('No fields to update', 400);
      }

      updates.push(`updated_at = NOW()`);
      values.push(id);

      const result = await pool.query(`
        UPDATE categories
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING 
          id,
          name,
          name as "nameEn",
          slug,
          description,
          parent_id as "parentId",
          display_order as "order",
          CASE WHEN is_active THEN 'active' ELSE 'inactive' END as status,
          image_url as image,
          created_at as "createdAt",
          updated_at as "updatedAt"
      `, values);

      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete category
  static async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // Check if category has products
      const productsResult = await pool.query(
        'SELECT COUNT(*) FROM products WHERE category_id = $1',
        [id]
      );

      if (parseInt(productsResult.rows[0].count) > 0) {
        throw new AppError('Cannot delete category with products', 400);
      }

      // Check if category has children
      const childrenResult = await pool.query(
        'SELECT COUNT(*) FROM categories WHERE parent_id = $1',
        [id]
      );

      if (parseInt(childrenResult.rows[0].count) > 0) {
        throw new AppError('Cannot delete category with subcategories', 400);
      }

      const result = await pool.query(
        'DELETE FROM categories WHERE id = $1 RETURNING id',
        [id]
      );

      if (result.rows.length === 0) {
        throw new AppError('Category not found', 404);
      }

      res.json({
        success: true,
        message: 'Category deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Update categories order (for drag and drop)
  static async updateCategoriesOrder(req: Request, res: Response, next: NextFunction) {
    const client = await pool.connect();
    
    try {
      const { categories } = req.body;

      if (!Array.isArray(categories)) {
        throw new AppError('Categories must be an array', 400);
      }

      await client.query('BEGIN');

      for (const category of categories) {
        await client.query(`
          UPDATE categories
          SET parent_id = $1, display_order = $2, updated_at = NOW()
          WHERE id = $3
        `, [category.parentId || null, category.order, category.id]);
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Categories order updated successfully'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      next(error);
    } finally {
      client.release();
    }
  }
}