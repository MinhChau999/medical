import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';
import crypto from 'crypto';
import { logger } from '../utils/logger';

// S3 Cloud Vietnam Configuration
const S3_CONFIG = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'ISP3TW0OIQOU4G27DZW1',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'weFXsUaki9IcNPGWrZzR6jaKfMUHCdYOkfY14Ena',
  bucket: process.env.AWS_S3_BUCKET || 'medical',
  endpoint: process.env.AWS_ENDPOINT || 'https://s3-hcm-r2.s3cloud.vn',
  region: process.env.AWS_REGION || 'auto'
};

export class S3LiteService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.bucketName = S3_CONFIG.bucket;
    this.s3Client = new S3Client({
      region: S3_CONFIG.region,
      endpoint: S3_CONFIG.endpoint,
      credentials: {
        accessKeyId: S3_CONFIG.accessKeyId,
        secretAccessKey: S3_CONFIG.secretAccessKey
      },
      forcePathStyle: true // Required for S3-compatible services
    });
  }

  // Generate unique filename
  generateFileName(originalName: string, folder: string = 'images'): string {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const sanitizedName = originalName
      .replace(/[^a-zA-Z0-9.-]/g, '-')
      .toLowerCase()
      .substring(0, 50);
    
    return `${folder}/${timestamp}-${randomString}-${sanitizedName}`;
  }

  // Image optimization configurations
  private getImageConfig(type: 'avatar' | 'product' | 'cover' | 'logo' | 'general') {
    const configs = {
      avatar: { width: 500, height: 500, quality: 85 },
      product: { width: 800, height: 800, quality: 90 },
      cover: { width: 1200, height: 400, quality: 85 },
      logo: { width: 300, height: 300, quality: 90 },
      general: { width: 1024, height: 1024, quality: 85 }
    };
    return configs[type] || configs.general;
  }

  // Optimize image with Sharp
  async optimizeImage(
    buffer: Buffer, 
    type: 'avatar' | 'product' | 'cover' | 'logo' | 'general' = 'general'
  ): Promise<Buffer> {
    try {
      const config = this.getImageConfig(type);
      
      const optimized = await sharp(buffer)
        .resize(config.width, config.height, {
          fit: type === 'cover' ? 'cover' : 'inside',
          position: 'center',
          withoutEnlargement: true
        })
        .webp({
          quality: config.quality,
          effort: 6
        })
        .toBuffer();
      
      logger.info(`Image optimized: type=${type}, size reduced from ${buffer.length} to ${optimized.length} bytes`);
      return optimized;
    } catch (error) {
      logger.error('Error optimizing image:', error);
      throw new Error('Failed to optimize image');
    }
  }

  // Upload file to S3
  async uploadFile(
    buffer: Buffer,
    fileName: string,
    contentType: string = 'image/webp',
    metadata?: Record<string, string>
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'max-age=31536000', // 1 year cache
        ACL: 'public-read',
        Metadata: metadata
      });

      const response = await this.s3Client.send(command);
      
      if (!response.$metadata.httpStatusCode || response.$metadata.httpStatusCode >= 300) {
        throw new Error(`S3 upload failed with status: ${response.$metadata.httpStatusCode}`);
      }

      const url = this.getPublicUrl(fileName);
      logger.info(`File uploaded to S3: ${fileName} -> ${url}`);
      return url;
    } catch (error: any) {
      logger.error('Error uploading to S3:', error);
      
      if (error.name === 'NoSuchBucket') {
        throw new Error(`S3 bucket '${this.bucketName}' does not exist`);
      } else if (error.name === 'AccessDenied') {
        throw new Error('Access denied to S3. Check credentials');
      }
      
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  // Upload image with optimization
  async uploadImage(
    buffer: Buffer,
    originalName: string,
    type: 'avatar' | 'product' | 'cover' | 'logo' | 'general' = 'general'
  ): Promise<string> {
    try {
      // Generate file name with appropriate folder
      const folder = type === 'general' ? 'images' : `${type}s`;
      const fileName = this.generateFileName(originalName, folder);
      
      // Optimize image
      const optimizedBuffer = await this.optimizeImage(buffer, type);
      
      // Upload to S3
      const url = await this.uploadFile(
        optimizedBuffer,
        fileName + '.webp',
        'image/webp',
        {
          originalName,
          uploadedAt: new Date().toISOString(),
          type
        }
      );
      
      return url;
    } catch (error) {
      logger.error('Error uploading image:', error);
      throw error;
    }
  }

  // Upload multiple images
  async uploadMultipleImages(
    files: Array<{ buffer: Buffer; originalName: string }>,
    type: 'product' | 'general' = 'general'
  ): Promise<string[]> {
    try {
      const uploadPromises = files.map(file => 
        this.uploadImage(file.buffer, file.originalName, type)
      );
      
      const urls = await Promise.all(uploadPromises);
      logger.info(`Uploaded ${urls.length} images successfully`);
      return urls;
    } catch (error) {
      logger.error('Error uploading multiple images:', error);
      throw error;
    }
  }

  // Delete file from S3
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // Extract key from URL
      const key = this.extractKeyFromUrl(fileUrl);
      
      if (!key) {
        logger.warn('Could not extract key from URL:', fileUrl);
        return;
      }

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      await this.s3Client.send(command);
      logger.info(`File deleted from S3: ${key}`);
    } catch (error) {
      logger.error('Error deleting from S3:', error);
      // Don't throw error for deletion failures
    }
  }

  // Delete multiple files
  async deleteMultipleFiles(fileUrls: string[]): Promise<void> {
    try {
      const deletePromises = fileUrls.map(url => this.deleteFile(url));
      await Promise.all(deletePromises);
      logger.info(`Deleted ${fileUrls.length} files from S3`);
    } catch (error) {
      logger.error('Error deleting multiple files:', error);
    }
  }

  // Check if file exists
  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });
      
      await this.s3Client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  // Generate presigned URL for temporary access
  async generatePresignedUrl(
    fileName: string,
    expiresIn: number = 3600 // 1 hour default
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: fileName
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      return url;
    } catch (error) {
      logger.error('Error generating presigned URL:', error);
      throw new Error('Failed to generate presigned URL');
    }
  }

  // Generate presigned upload URL (for direct browser uploads)
  async generateUploadUrl(
    fileName: string,
    contentType: string = 'image/jpeg',
    expiresIn: number = 3600
  ): Promise<{ url: string; key: string }> {
    try {
      const key = this.generateFileName(fileName);
      
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: contentType,
        ACL: 'public-read'
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      
      return { url, key };
    } catch (error) {
      logger.error('Error generating upload URL:', error);
      throw new Error('Failed to generate upload URL');
    }
  }

  // Get public URL for a file
  getPublicUrl(fileName: string): string {
    const endpoint = S3_CONFIG.endpoint.replace(/\/$/, '');
    return `${endpoint}/${this.bucketName}/${fileName}`;
  }

  // Extract key from S3 URL
  private extractKeyFromUrl(fileUrl: string): string {
    try {
      const endpoint = S3_CONFIG.endpoint.replace(/\/$/, '');
      const baseUrl = `${endpoint}/${this.bucketName}/`;
      
      if (fileUrl.startsWith(baseUrl)) {
        return fileUrl.replace(baseUrl, '');
      }
      
      // Try to extract from different URL formats
      const urlParts = fileUrl.split('/');
      const bucketIndex = urlParts.indexOf(this.bucketName);
      
      if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
        return urlParts.slice(bucketIndex + 1).join('/');
      }
      
      // If URL doesn't match expected format, assume it's already a key
      return fileUrl;
    } catch (error) {
      logger.error('Error extracting key from URL:', error);
      return '';
    }
  }

  // Validate image file
  validateImageFile(
    file: Express.Multer.File,
    maxSizeInMB: number = 5
  ): void {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml'
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new Error('Invalid file type. Only images are allowed');
    }

    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      throw new Error(`File size exceeds ${maxSizeInMB}MB limit`);
    }
  }

  // Get file metadata
  async getFileMetadata(key: string): Promise<any> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });
      
      const response = await this.s3Client.send(command);
      
      return {
        size: response.ContentLength,
        contentType: response.ContentType,
        lastModified: response.LastModified,
        metadata: response.Metadata
      };
    } catch (error) {
      logger.error('Error getting file metadata:', error);
      throw new Error('Failed to get file metadata');
    }
  }
}

// Export singleton instance
export const s3LiteService = new S3LiteService();