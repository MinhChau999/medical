import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// S3 Cloud Vietnam Configuration
const S3_CONFIG = {
  accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || 'ISP3TW0OIQOU4G27DZW1',
  secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || 'weFXsUaki9IcNPGWrZzR6jaKfMUHCdYOkfY14Ena',
  bucket: import.meta.env.VITE_AWS_S3_BUCKET || 'medical',
  endpoint: import.meta.env.VITE_AWS_ENDPOINT || 'https://s3-hcm-r2.s3cloud.vn',
  region: import.meta.env.VITE_AWS_REGION || 'auto'
};

class S3UploadService {
  private s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      region: S3_CONFIG.region,
      endpoint: S3_CONFIG.endpoint,
      credentials: {
        accessKeyId: S3_CONFIG.accessKeyId,
        secretAccessKey: S3_CONFIG.secretAccessKey,
      },
      forcePathStyle: true, // Required for S3-compatible services
    });
  }

  // Generate unique filename
  generateFileName(originalName: string, folder: string = 'products'): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    const sanitizedName = originalName
      .replace(/[^a-zA-Z0-9.-]/g, '-')
      .toLowerCase()
      .substring(0, 50);

    return `${folder}/${timestamp}-${randomString}-${sanitizedName}`;
  }

  // Optimize image with canvas
  async optimizeImage(file: File, maxWidth: number = 800, quality: number = 0.85): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;

          // Calculate new dimensions
          if (width > maxWidth) {
            height = (maxWidth / width) * height;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            'image/webp',
            quality
          );
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  }

  // Upload file to S3
  async uploadFile(file: File, type: 'product' | 'avatar' | 'general' = 'product'): Promise<string> {
    try {
      // Optimize image
      const optimizedBlob = await this.optimizeImage(file);

      // Generate filename
      const fileName = this.generateFileName(file.name, `${type}s`) + '.webp';

      // Convert blob to buffer
      const arrayBuffer = await optimizedBlob.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: S3_CONFIG.bucket,
        Key: fileName,
        Body: buffer,
        ContentType: 'image/webp',
        ACL: 'public-read',
        Metadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
          type
        }
      });

      const response = await this.s3Client.send(command);

      if (!response.$metadata.httpStatusCode || response.$metadata.httpStatusCode >= 300) {
        throw new Error(`S3 upload failed with status: ${response.$metadata.httpStatusCode}`);
      }

      // Return public URL
      const publicUrl = `${S3_CONFIG.endpoint}/${S3_CONFIG.bucket}/${fileName}`;
      return publicUrl;
    } catch (error: any) {
      console.error('S3 upload error:', error);

      if (error.name === 'NoSuchBucket') {
        throw new Error(`S3 bucket '${S3_CONFIG.bucket}' does not exist`);
      } else if (error.name === 'AccessDenied') {
        throw new Error('Access denied to S3. Check credentials');
      }

      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  // Upload multiple files
  async uploadMultipleFiles(files: File[], type: 'product' | 'avatar' | 'general' = 'product'): Promise<string[]> {
    try {
      const uploadPromises = files.map(file => this.uploadFile(file, type));
      const urls = await Promise.all(uploadPromises);
      return urls;
    } catch (error) {
      console.error('Multiple files upload error:', error);
      throw error;
    }
  }

  // Validate image file
  validateImageFile(file: File, maxSizeInMB: number = 5): void {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp'
    ];

    if (!allowedMimeTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only images are allowed');
    }

    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      throw new Error(`File size exceeds ${maxSizeInMB}MB limit`);
    }
  }
}

export const s3UploadService = new S3UploadService();
export default s3UploadService;