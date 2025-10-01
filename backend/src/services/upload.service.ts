import { 
  PutObjectCommand, 
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, S3_BUCKET_NAME } from '../config/s3';
import { ImageProcessor, ImageVariant } from '../utils/imageProcessor';
import { v4 as uuidv4 } from 'uuid';

export interface UploadResult {
  key: string;
  url: string;
  size: number;
  contentType: string;
  variants?: {
    thumbnail?: string;
    small?: string;
    medium?: string;
    large?: string;
    original?: string;
  };
}

export class UploadService {
  /**
   * Upload single image with multiple variants to S3
   */
  static async uploadProductImage(
    file: Express.Multer.File,
    productId?: string
  ): Promise<UploadResult> {
    try {
      // Validate image
      const validation = ImageProcessor.validateImage(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Generate unique base key
      const baseKey = `${productId || uuidv4()}-${Date.now()}`;
      
      // Generate all image variants
      const variants = await ImageProcessor.generateImageVariants(
        file.buffer,
        baseKey
      );

      // Upload all variants to S3
      const uploadPromises = variants.map(variant => 
        this.uploadToS3(variant)
      );
      
      await Promise.all(uploadPromises);

      // Build response with public URLs for S3 Cloud Vietnam
      const variantUrls: any = {};
      for (const variant of variants) {
        const type = variant.key.split('/')[1]; // Get type from path
        variantUrls[type] = this.getPublicUrl(variant.key);
      }

      const originalVariant = variants.find(v => v.key.includes('original'));

      return {
        key: originalVariant?.key || `products/original/${Date.now()}-${baseKey}.webp`,
        url: variantUrls.original,
        size: originalVariant?.size || 0,
        contentType: 'image/webp',
        variants: {
          thumbnail: variantUrls.thumbnails,
          small: variantUrls.small,
          medium: variantUrls.medium,
          large: variantUrls.large,
          original: variantUrls.original
        }
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  /**
   * Upload buffer to S3
   */
  private static async uploadToS3(variant: ImageVariant): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: variant.key,
      Body: variant.buffer,
      ContentType: variant.contentType,
      Metadata: {
        size: variant.size.toString()
      }
    });

    await s3Client.send(command);
  }

  /**
   * Delete image from S3
   */
  static async deleteImage(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key
    });

    await s3Client.send(command);
  }

  /**
   * Delete multiple images (all variants)
   */
  static async deleteProductImages(baseKey: string): Promise<void> {
    const variants = [
      'thumbnails',
      'small', 
      'medium',
      'large',
      'original'
    ];

    const deletePromises = variants.map(variant => {
      const key = `products/${variant}/${baseKey}.webp`;
      return this.deleteImage(key);
    });

    await Promise.all(deletePromises);
  }

  /**
   * Get public URL for S3 Cloud Vietnam objects
   */
  static getPublicUrl(key: string): string {
    const endpoint = process.env.AWS_ENDPOINT;
    const bucket = S3_BUCKET_NAME;

    if (endpoint) {
      // For S3 Cloud Vietnam, construct public URL
      return `${endpoint}/${bucket}/${key}`;
    }

    // Fallback for standard AWS S3
    return `https://${bucket}.s3.amazonaws.com/${key}`;
  }

  /**
   * Get signed URL for private S3 objects
   */
  static async getSignedUrl(
    key: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  }

  /**
   * Check if object exists in S3
   */
  static async objectExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: key
      });
      
      await s3Client.send(command);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Upload multiple images
   */
  static async uploadMultipleImages(
    files: Express.Multer.File[],
    productId?: string
  ): Promise<UploadResult[]> {
    const uploadPromises = files.map(file => 
      this.uploadProductImage(file, productId)
    );

    return await Promise.all(uploadPromises);
  }
}