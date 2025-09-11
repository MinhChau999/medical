import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/product.service';
import { AuthRequest } from '../middleware/auth';
import { body, query, validationResult } from 'express-validator';

const productService = new ProductService();

export class ProductController {
  static validateCreateProduct = [
    body('sku').notEmpty().trim(),
    body('name').notEmpty().trim(),
    body('description').optional().trim(),
    body('categoryId').optional().isUUID(),
    body('brandId').optional().isUUID(),
    body('supplierId').optional().isUUID(),
    body('price').isNumeric().isFloat({ min: 0 }),
    body('cost').optional().isNumeric().isFloat({ min: 0 }),
    body('stockQuantity').optional().isInt({ min: 0 })
  ];

  static validateUpdateProduct = [
    body('name').optional().trim(),
    body('description').optional().trim(),
    body('categoryId').optional().isUUID(),
    body('brandId').optional().isUUID(),
    body('status').optional().isIn(['active', 'inactive', 'draft', 'out_of_stock'])
  ];

  static validateGetProducts = [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('categoryId').optional().isUUID(),
    query('brandId').optional().isUUID(),
    query('minPrice').optional().isNumeric(),
    query('maxPrice').optional().isNumeric(),
    query('status').optional().isIn(['active', 'inactive', 'draft', 'out_of_stock'])
  ];

  static async createProduct(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const productData = req.body;
      const product = await productService.createProduct(productData, req.user!.id);

      if (productData.price) {
        const variantData = {
          sku: `${productData.sku}-DEFAULT`,
          name: 'Default',
          price: productData.price,
          cost: productData.cost,
          stockQuantity: productData.stockQuantity || 0,
          isDefault: true
        };
        await productService.createProductVariant(product.id, variantData);
      }

      res.status(201).json({
        success: true,
        data: product
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProduct(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const product = await productService.updateProduct(id, req.body);

      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const filters = {
        categoryId: req.query.categoryId,
        brandId: req.query.brandId,
        status: req.query.status,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
        tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
        search: req.query.search
      };

      const pagination = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        sortBy: req.query.sortBy || 'created_at',
        sortOrder: req.query.sortOrder || 'DESC'
      };

      const result = await productService.getProducts(filters, pagination);

      res.json({
        success: true,
        data: result.products,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProductById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const product = await productService.getProductById(id);

      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteProduct(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await productService.deleteProduct(id);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async searchProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const { q } = req.query;
      
      if (!q) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const products = await productService.searchProducts(q as string, limit);

      res.json({
        success: true,
        data: products
      });
    } catch (error) {
      next(error);
    }
  }

  static async createProductVariant(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const variant = await productService.createProductVariant(id, req.body);

      res.status(201).json({
        success: true,
        data: variant
      });
    } catch (error) {
      next(error);
    }
  }
}