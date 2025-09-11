import sharp from 'sharp';
import { S3_CONFIG } from '../config/s3';

export interface ProcessedImage {
  buffer: Buffer;
  format: string;
  width?: number;
  height?: number;
  size: number;
}

export interface ImageVariant {
  key: string;
  buffer: Buffer;
  contentType: string;
  size: number;
}

export class ImageProcessor {
  /**
   * Process and optimize image - convert to WebP format
   */
  static async processImage(
    buffer: Buffer,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'webp' | 'jpeg' | 'png';
    } = {}
  ): Promise<ProcessedImage> {
    const {
      width,
      height,
      quality = 85,
      format = 'webp'
    } = options;

    let pipeline = sharp(buffer);

    // Resize if dimensions provided
    if (width || height) {
      pipeline = pipeline.resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    // Convert to specified format with quality settings
    switch (format) {
      case 'webp':
        pipeline = pipeline.webp({ quality, effort: 6 });
        break;
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality, progressive: true });
        break;
      case 'png':
        pipeline = pipeline.png({ quality, compressionLevel: 9 });
        break;
    }

    const processedBuffer = await pipeline.toBuffer();
    const metadata = await sharp(processedBuffer).metadata();

    return {
      buffer: processedBuffer,
      format: metadata.format || format,
      width: metadata.width,
      height: metadata.height,
      size: processedBuffer.length
    };
  }

  /**
   * Generate multiple image variants (thumbnail, small, medium, large)
   */
  static async generateImageVariants(
    buffer: Buffer,
    baseKey: string
  ): Promise<ImageVariant[]> {
    const variants: ImageVariant[] = [];
    const timestamp = Date.now();

    // Generate thumbnail
    const thumbnail = await this.processImage(buffer, {
      ...S3_CONFIG.imageQuality.thumbnail,
      format: 'webp'
    });
    variants.push({
      key: `products/thumbnails/${timestamp}-${baseKey}.webp`,
      buffer: thumbnail.buffer,
      contentType: 'image/webp',
      size: thumbnail.size
    });

    // Generate small version
    const small = await this.processImage(buffer, {
      ...S3_CONFIG.imageQuality.small,
      format: 'webp'
    });
    variants.push({
      key: `products/small/${timestamp}-${baseKey}.webp`,
      buffer: small.buffer,
      contentType: 'image/webp',
      size: small.size
    });

    // Generate medium version
    const medium = await this.processImage(buffer, {
      ...S3_CONFIG.imageQuality.medium,
      format: 'webp'
    });
    variants.push({
      key: `products/medium/${timestamp}-${baseKey}.webp`,
      buffer: medium.buffer,
      contentType: 'image/webp',
      size: medium.size
    });

    // Generate large version
    const large = await this.processImage(buffer, {
      ...S3_CONFIG.imageQuality.large,
      format: 'webp'
    });
    variants.push({
      key: `products/large/${timestamp}-${baseKey}.webp`,
      buffer: large.buffer,
      contentType: 'image/webp',
      size: large.size
    });

    // Original optimized version (still compressed)
    const original = await this.processImage(buffer, {
      quality: S3_CONFIG.imageQuality.original.quality,
      format: 'webp'
    });
    variants.push({
      key: `products/original/${timestamp}-${baseKey}.webp`,
      buffer: original.buffer,
      contentType: 'image/webp',
      size: original.size
    });

    return variants;
  }

  /**
   * Validate image file
   */
  static validateImage(
    file: Express.Multer.File
  ): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > S3_CONFIG.maxFileSize) {
      return {
        valid: false,
        error: `File size exceeds maximum allowed size of ${S3_CONFIG.maxFileSize / (1024 * 1024)}MB`
      };
    }

    // Check mime type
    if (!S3_CONFIG.allowedMimeTypes.includes(file.mimetype)) {
      return {
        valid: false,
        error: 'Invalid file type. Only JPEG, PNG, WebP and GIF images are allowed'
      };
    }

    return { valid: true };
  }

  /**
   * Get image metadata
   */
  static async getImageMetadata(buffer: Buffer) {
    const metadata = await sharp(buffer).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: buffer.length,
      density: metadata.density,
      hasAlpha: metadata.hasAlpha,
      orientation: metadata.orientation
    };
  }
}