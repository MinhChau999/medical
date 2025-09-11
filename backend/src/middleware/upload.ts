import multer from 'multer';
import { Request } from 'express';
import { S3_CONFIG } from '../config/s3';

// Configure memory storage (we'll process images in memory before uploading to S3)
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Check if file type is allowed
  if (S3_CONFIG.allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP and GIF images are allowed'));
  }
};

// Create multer upload instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: S3_CONFIG.maxFileSize, // 10MB limit
    files: 10 // Maximum 10 files at once
  }
});

// Middleware for single file upload
export const uploadSingle = (fieldName: string) => upload.single(fieldName);

// Middleware for multiple files upload
export const uploadMultiple = (fieldName: string, maxCount: number = 10) => 
  upload.array(fieldName, maxCount);

// Middleware for multiple fields
export const uploadFields = (fields: multer.Field[]) => upload.fields(fields);