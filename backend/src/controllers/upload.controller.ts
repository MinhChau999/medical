import { Request, Response, NextFunction } from 'express';
import { UploadService } from '../services/upload.service';
import { AppError } from '../middleware/errorHandler';

export class UploadController {
  /**
   * Upload single product image
   */
  static async uploadProductImage(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.file) {
        throw new AppError('No file uploaded', 400);
      }

      const productId = req.body.productId;
      const result = await UploadService.uploadProductImage(req.file, productId);

      res.json({
        success: true,
        url: result.url,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload multiple product images
   */
  static async uploadMultipleImages(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        throw new AppError('No files uploaded', 400);
      }

      const productId = req.body.productId;
      const results = await UploadService.uploadMultipleImages(files, productId);

      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete product image
   */
  static async deleteImage(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { key } = req.params;
      
      if (!key) {
        throw new AppError('Image key is required', 400);
      }

      await UploadService.deleteImage(key);

      res.json({
        success: true,
        message: 'Image deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get signed URL for image
   */
  static async getSignedUrl(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { key } = req.params;
      const expiresIn = parseInt(req.query.expiresIn as string) || 3600;
      
      if (!key) {
        throw new AppError('Image key is required', 400);
      }

      const url = await UploadService.getSignedUrl(key, expiresIn);

      res.json({
        success: true,
        data: { url }
      });
    } catch (error) {
      next(error);
    }
  }
}