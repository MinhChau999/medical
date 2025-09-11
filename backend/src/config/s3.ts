import { S3Client } from '@aws-sdk/client-s3';

export const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'medical-app-images';

export const S3_CONFIG = {
  bucket: S3_BUCKET_NAME,
  region: process.env.AWS_REGION || 'us-east-1',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif'
  ],
  imageQuality: {
    thumbnail: { width: 150, height: 150, quality: 80 },
    small: { width: 300, height: 300, quality: 85 },
    medium: { width: 600, height: 600, quality: 85 },
    large: { width: 1200, height: 1200, quality: 90 },
    original: { quality: 90 }
  }
};