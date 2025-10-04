import { Request, Response } from 'express';
import pool from '../config/database';

export class BlogController {
  // Get all blog posts with filtering
  static async getPosts(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        category,
        search,
        sortBy = 'published_at',
        sortOrder = 'desc'
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const conditions: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (status) {
        conditions.push(`bp.status = $${paramCount}`);
        values.push(status);
        paramCount++;
      }

      if (category) {
        conditions.push(`bp.category = $${paramCount}`);
        values.push(category);
        paramCount++;
      }

      if (search) {
        conditions.push(`(bp.title ILIKE $${paramCount} OR bp.excerpt ILIKE $${paramCount} OR bp.content ILIKE $${paramCount})`);
        values.push(`%${search}%`);
        paramCount++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Count query
      const countQuery = `
        SELECT COUNT(*) as total
        FROM blog_posts bp
        ${whereClause}
      `;
      const countResult = await pool.query(countQuery, values);
      const total = parseInt(countResult.rows[0].total);

      // Data query
      const dataQuery = `
        SELECT
          bp.id,
          bp.title,
          bp.slug,
          bp.excerpt,
          bp.content,
          bp.featured_image as "featuredImage",
          bp.author_id as "authorId",
          bp.category,
          bp.tags,
          bp.status,
          bp.published_at as "publishedAt",
          bp.views,
          bp.meta_title as "metaTitle",
          bp.meta_description as "metaDescription",
          bp.meta_keywords as "metaKeywords",
          bp.created_at as "createdAt",
          bp.updated_at as "updatedAt",
          u.email as "authorEmail",
          u.role as "authorRole"
        FROM blog_posts bp
        LEFT JOIN users u ON bp.author_id = u.id
        ${whereClause}
        ORDER BY bp.${sortBy} ${sortOrder.toUpperCase()}
        LIMIT $${paramCount} OFFSET $${paramCount + 1}
      `;

      values.push(Number(limit), offset);
      const dataResult = await pool.query(dataQuery, values);

      res.json({
        success: true,
        data: dataResult.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error: any) {
      console.error('Error fetching blog posts:', error);
      res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: error.message
      });
    }
  }

  // Get single blog post by slug or ID
  static async getPost(req: Request, res: Response) {
    try {
      const { slug } = req.params;

      const query = `
        SELECT
          bp.id,
          bp.title,
          bp.slug,
          bp.excerpt,
          bp.content,
          bp.featured_image as "featuredImage",
          bp.author_id as "authorId",
          bp.category,
          bp.tags,
          bp.status,
          bp.published_at as "publishedAt",
          bp.views,
          bp.meta_title as "metaTitle",
          bp.meta_description as "metaDescription",
          bp.meta_keywords as "metaKeywords",
          bp.created_at as "createdAt",
          bp.updated_at as "updatedAt",
          u.email as "authorEmail",
          u.role as "authorRole"
        FROM blog_posts bp
        LEFT JOIN users u ON bp.author_id = u.id
        WHERE bp.slug = $1 OR bp.id::text = $1
      `;

      const result = await pool.query(query, [slug]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Blog post not found'
        });
      }

      // Increment view count
      await pool.query(
        'UPDATE blog_posts SET views = views + 1 WHERE id = $1',
        [result.rows[0].id]
      );

      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error: any) {
      console.error('Error fetching blog post:', error);
      res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: error.message
      });
    }
  }

  // Create new blog post
  static async createPost(req: Request, res: Response) {
    try {
      const {
        title,
        slug,
        excerpt,
        content,
        featuredImage,
        category,
        tags,
        status,
        publishedAt,
        metaTitle,
        metaDescription,
        metaKeywords
      } = req.body;

      const authorId = (req as any).user?.id;

      const query = `
        INSERT INTO blog_posts (
          title, slug, excerpt, content, featured_image, author_id,
          category, tags, status, published_at, meta_title,
          meta_description, meta_keywords
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;

      const values = [
        title,
        slug,
        excerpt,
        content,
        featuredImage,
        authorId,
        category,
        tags,
        status || 'draft',
        publishedAt || (status === 'published' ? new Date() : null),
        metaTitle,
        metaDescription,
        metaKeywords
      ];

      const result = await pool.query(query, values);

      res.status(201).json({
        success: true,
        data: result.rows[0]
      });
    } catch (error: any) {
      console.error('Error creating blog post:', error);
      res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: error.message
      });
    }
  }

  // Update blog post
  static async updatePost(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        title,
        slug,
        excerpt,
        content,
        featuredImage,
        category,
        tags,
        status,
        publishedAt,
        metaTitle,
        metaDescription,
        metaKeywords
      } = req.body;

      const fields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (title !== undefined) {
        fields.push(`title = $${paramCount++}`);
        values.push(title);
      }
      if (slug !== undefined) {
        fields.push(`slug = $${paramCount++}`);
        values.push(slug);
      }
      if (excerpt !== undefined) {
        fields.push(`excerpt = $${paramCount++}`);
        values.push(excerpt);
      }
      if (content !== undefined) {
        fields.push(`content = $${paramCount++}`);
        values.push(content);
      }
      if (featuredImage !== undefined) {
        fields.push(`featured_image = $${paramCount++}`);
        values.push(featuredImage);
      }
      if (category !== undefined) {
        fields.push(`category = $${paramCount++}`);
        values.push(category);
      }
      if (tags !== undefined) {
        fields.push(`tags = $${paramCount++}`);
        values.push(tags);
      }
      if (status !== undefined) {
        fields.push(`status = $${paramCount++}`);
        values.push(status);

        // Auto set published_at if status changes to published
        if (status === 'published' && publishedAt === undefined) {
          fields.push(`published_at = $${paramCount++}`);
          values.push(new Date());
        }
      }
      if (publishedAt !== undefined) {
        fields.push(`published_at = $${paramCount++}`);
        values.push(publishedAt);
      }
      if (metaTitle !== undefined) {
        fields.push(`meta_title = $${paramCount++}`);
        values.push(metaTitle);
      }
      if (metaDescription !== undefined) {
        fields.push(`meta_description = $${paramCount++}`);
        values.push(metaDescription);
      }
      if (metaKeywords !== undefined) {
        fields.push(`meta_keywords = $${paramCount++}`);
        values.push(metaKeywords);
      }

      if (fields.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No fields to update'
        });
      }

      fields.push(`updated_at = NOW()`);
      values.push(id);

      const query = `
        UPDATE blog_posts
        SET ${fields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Blog post not found'
        });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error: any) {
      console.error('Error updating blog post:', error);
      res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: error.message
      });
    }
  }

  // Delete blog post
  static async deletePost(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const query = 'DELETE FROM blog_posts WHERE id = $1 RETURNING *';
      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Blog post not found'
        });
      }

      res.json({
        success: true,
        message: 'Blog post deleted successfully'
      });
    } catch (error: any) {
      console.error('Error deleting blog post:', error);
      res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: error.message
      });
    }
  }

  // Get blog categories
  static async getCategories(req: Request, res: Response) {
    try {
      const query = `
        SELECT DISTINCT category, COUNT(*) as count
        FROM blog_posts
        WHERE category IS NOT NULL AND status = 'published'
        GROUP BY category
        ORDER BY count DESC
      `;

      const result = await pool.query(query);

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error: any) {
      console.error('Error fetching blog categories:', error);
      res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: error.message
      });
    }
  }

  // Get blog stats
  static async getStats(req: Request, res: Response) {
    try {
      const query = `
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'published') as published,
          COUNT(*) FILTER (WHERE status = 'draft') as draft,
          SUM(views) as total_views
        FROM blog_posts
      `;

      const result = await pool.query(query);

      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error: any) {
      console.error('Error fetching blog stats:', error);
      res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: error.message
      });
    }
  }
}
