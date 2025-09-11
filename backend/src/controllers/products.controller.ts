import { Request, Response, NextFunction } from 'express';
import { Product } from '../models/product.model';
import { Category } from '../models/category.model';
import { Op } from 'sequelize';
import { logger } from '../utils/logger';
import { s3LiteService } from '../services/s3lite.service';

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export class ProductsController {
  // Get all products with filtering and pagination
  static async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        search,
        categoryId,
        status = 'active',
        minPrice,
        maxPrice,
        inStock,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      // Build where clause
      const where: any = {};

      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { sku: { [Op.iLike]: `%${search}%` } },
          { barcode: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } }
        ];
      }

      if (categoryId) {
        where.categoryId = categoryId;
      }

      if (status) {
        where.status = status;
      }

      if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice) where.price[Op.gte] = parseFloat(minPrice as string);
        if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice as string);
      }

      if (inStock === 'true') {
        where.stockQuantity = { [Op.gt]: 0 };
      }

      const { rows: products, count: total } = await Product.findAndCountAll({
        where,
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name']
          }
        ],
        order: [[sortBy as string, sortOrder as string]],
        limit: limitNum,
        offset,
        distinct: true
      });

      res.json({
        success: true,
        data: products,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      });
    } catch (error) {
      logger.error('Error fetching products:', error);
      next(error);
    }
  }

  // Get single product
  static async getProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const product = await Product.findByPk(id, {
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name']
          }
        ]
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      logger.error('Error fetching product:', error);
      next(error);
    }
  }

  // Create product
  static async createProduct(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const productData = {
        ...req.body,
        createdBy: req.user?.id
      };

      const product = await Product.create(productData);

      // Fetch with category
      const productWithCategory = await Product.findByPk(product.id, {
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name']
          }
        ]
      });

      res.status(201).json({
        success: true,
        data: productWithCategory,
        message: 'Product created successfully'
      });
    } catch (error) {
      logger.error('Error creating product:', error);
      next(error);
    }
  }

  // Update product
  static async updateProduct(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const product = await Product.findByPk(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      await product.update({
        ...req.body,
        updatedBy: req.user?.id
      });

      // Fetch with category
      const updatedProduct = await Product.findByPk(id, {
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name']
          }
        ]
      });

      res.json({
        success: true,
        data: updatedProduct,
        message: 'Product updated successfully'
      });
    } catch (error) {
      logger.error('Error updating product:', error);
      next(error);
    }
  }

  // Delete product
  static async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const product = await Product.findByPk(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Delete associated images from S3
      if (product.images && product.images.length > 0) {
        await s3LiteService.deleteMultipleFiles(product.images);
      }

      await product.destroy();

      res.json({
        success: true,
        message: 'Product deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting product:', error);
      next(error);
    }
  }

  // Update stock
  static async updateStock(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { quantity } = req.body;

      const product = await Product.findByPk(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      await product.update({ stockQuantity: quantity });

      res.json({
        success: true,
        data: product,
        message: 'Stock updated successfully'
      });
    } catch (error) {
      logger.error('Error updating stock:', error);
      next(error);
    }
  }

  // Bulk update products
  static async bulkUpdateProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const { ids, data } = req.body;

      await Product.update(data, {
        where: {
          id: { [Op.in]: ids }
        }
      });

      res.json({
        success: true,
        message: 'Products updated successfully'
      });
    } catch (error) {
      logger.error('Error bulk updating products:', error);
      next(error);
    }
  }

  // Bulk delete products
  static async bulkDeleteProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const { ids } = req.body;

      // Get products to delete images
      const products = await Product.findAll({
        where: {
          id: { [Op.in]: ids }
        }
      });

      // Delete associated images
      for (const product of products) {
        if (product.images && product.images.length > 0) {
          await s3LiteService.deleteMultipleFiles(product.images);
        }
      }

      await Product.destroy({
        where: {
          id: { [Op.in]: ids }
        }
      });

      res.json({
        success: true,
        message: 'Products deleted successfully'
      });
    } catch (error) {
      logger.error('Error bulk deleting products:', error);
      next(error);
    }
  }

  // Get low stock products
  static async getLowStockProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const products = await Product.findAll({
        where: {
          [Op.and]: [
            { status: 'active' },
            {
              stockQuantity: {
                [Op.lte]: sequelize.col('reorderLevel')
              }
            }
          ]
        },
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name']
          }
        ],
        order: [['stockQuantity', 'ASC']]
      });

      res.json({
        success: true,
        data: products
      });
    } catch (error) {
      logger.error('Error fetching low stock products:', error);
      next(error);
    }
  }

  // Get product by barcode
  static async getProductByBarcode(req: Request, res: Response, next: NextFunction) {
    try {
      const { barcode } = req.params;

      const product = await Product.findOne({
        where: { barcode },
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name']
          }
        ]
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      logger.error('Error fetching product by barcode:', error);
      next(error);
    }
  }

  // Get product statistics
  static async getProductStats(req: Request, res: Response, next: NextFunction) {
    try {
      const total = await Product.count();
      const active = await Product.count({ where: { status: 'active' } });
      const inactive = await Product.count({ where: { status: 'inactive' } });
      const outOfStock = await Product.count({ where: { stockQuantity: 0 } });
      
      const lowStock = await Product.count({
        where: {
          [Op.and]: [
            { stockQuantity: { [Op.gt]: 0 } },
            {
              stockQuantity: {
                [Op.lte]: sequelize.col('reorderLevel')
              }
            }
          ]
        }
      });

      const totalValue = await Product.sum('price', {
        where: { status: 'active' }
      }) || 0;

      res.json({
        success: true,
        data: {
          total,
          active,
          inactive,
          lowStock,
          outOfStock,
          totalValue
        }
      });
    } catch (error) {
      logger.error('Error fetching product stats:', error);
      next(error);
    }
  }
}

const sequelize = Product.sequelize!;