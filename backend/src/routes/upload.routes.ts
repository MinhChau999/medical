import { Router } from 'express';
import multer from 'multer';
import { s3LiteService } from '../services/s3lite.service';
import { authenticate, authorize } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
    files: 10 // Max 10 files at once
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed'));
    }
  }
});

// Upload single avatar image
router.post('/avatar', authenticate, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate file
    s3LiteService.validateImageFile(req.file);

    // Upload to S3
    const url = await s3LiteService.uploadImage(
      req.file.buffer,
      req.file.originalname,
      'avatar'
    );

    res.json({
      success: true,
      url,
      message: 'Avatar uploaded successfully'
    });
  } catch (error: any) {
    logger.error('Avatar upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload avatar' });
  }
});

// Upload single product image
router.post('/product', authenticate, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate file
    s3LiteService.validateImageFile(req.file);

    // Upload to S3
    const url = await s3LiteService.uploadImage(
      req.file.buffer,
      req.file.originalname,
      'product'
    );

    res.json({
      success: true,
      url,
      message: 'Product image uploaded successfully'
    });
  } catch (error: any) {
    logger.error('Product image upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload product image' });
  }
});

// Upload multiple product images
router.post('/products', authenticate, upload.array('images', 10), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Validate all files
    files.forEach(file => s3LiteService.validateImageFile(file));

    // Upload all images
    const fileData = files.map(file => ({
      buffer: file.buffer,
      originalName: file.originalname
    }));

    const urls = await s3LiteService.uploadMultipleImages(fileData, 'product');

    res.json({
      success: true,
      urls,
      count: urls.length,
      message: `${urls.length} product images uploaded successfully`
    });
  } catch (error: any) {
    logger.error('Multiple product images upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload product images' });
  }
});

// Upload cover image
router.post('/cover', authenticate, authorize('admin', 'manager'), upload.single('cover'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate file
    s3LiteService.validateImageFile(req.file, 10); // Allow larger size for covers

    // Upload to S3
    const url = await s3LiteService.uploadImage(
      req.file.buffer,
      req.file.originalname,
      'cover'
    );

    res.json({
      success: true,
      url,
      message: 'Cover image uploaded successfully'
    });
  } catch (error: any) {
    logger.error('Cover upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload cover image' });
  }
});

// Upload logo image
router.post('/logo', authenticate, authorize('admin'), upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate file
    s3LiteService.validateImageFile(req.file);

    // Upload to S3
    const url = await s3LiteService.uploadImage(
      req.file.buffer,
      req.file.originalname,
      'logo'
    );

    res.json({
      success: true,
      url,
      message: 'Logo uploaded successfully'
    });
  } catch (error: any) {
    logger.error('Logo upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload logo' });
  }
});

// Upload general image
router.post('/image', authenticate, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate file
    s3LiteService.validateImageFile(req.file);

    // Upload to S3
    const url = await s3LiteService.uploadImage(
      req.file.buffer,
      req.file.originalname,
      'general'
    );

    res.json({
      success: true,
      url,
      message: 'Image uploaded successfully'
    });
  } catch (error: any) {
    logger.error('Image upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload image' });
  }
});

// Delete image
router.delete('/image', authenticate, async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    await s3LiteService.deleteFile(url);

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error: any) {
    logger.error('Image deletion error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete image' });
  }
});

// Delete multiple images
router.post('/delete-multiple', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { urls } = req.body;
    
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: 'Image URLs array is required' });
    }

    await s3LiteService.deleteMultipleFiles(urls);

    res.json({
      success: true,
      count: urls.length,
      message: `${urls.length} images deleted successfully`
    });
  } catch (error: any) {
    logger.error('Multiple images deletion error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete images' });
  }
});

// Generate presigned upload URL (for direct browser uploads)
router.post('/generate-upload-url', authenticate, async (req, res) => {
  try {
    const { fileName, contentType = 'image/jpeg' } = req.body;
    
    if (!fileName) {
      return res.status(400).json({ error: 'File name is required' });
    }

    const result = await s3LiteService.generateUploadUrl(fileName, contentType);

    res.json({
      success: true,
      uploadUrl: result.url,
      key: result.key,
      publicUrl: s3LiteService.getPublicUrl(result.key),
      expiresIn: 3600 // 1 hour
    });
  } catch (error: any) {
    logger.error('Generate upload URL error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate upload URL' });
  }
});

// Generate presigned URL for temporary access
router.post('/generate-access-url', authenticate, async (req, res) => {
  try {
    const { key, expiresIn = 3600 } = req.body;
    
    if (!key) {
      return res.status(400).json({ error: 'File key is required' });
    }

    const url = await s3LiteService.generatePresignedUrl(key, expiresIn);

    res.json({
      success: true,
      url,
      expiresIn
    });
  } catch (error: any) {
    logger.error('Generate access URL error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate access URL' });
  }
});

// Get file metadata
router.get('/metadata', authenticate, async (req, res) => {
  try {
    const { key } = req.query;
    
    if (!key) {
      return res.status(400).json({ error: 'File key is required' });
    }

    const metadata = await s3LiteService.getFileMetadata(key as string);

    res.json({
      success: true,
      metadata
    });
  } catch (error: any) {
    logger.error('Get metadata error:', error);
    res.status(500).json({ error: error.message || 'Failed to get file metadata' });
  }
});

// Check if file exists
router.get('/exists', authenticate, async (req, res) => {
  try {
    const { key } = req.query;
    
    if (!key) {
      return res.status(400).json({ error: 'File key is required' });
    }

    const exists = await s3LiteService.fileExists(key as string);

    res.json({
      success: true,
      exists
    });
  } catch (error: any) {
    logger.error('Check file exists error:', error);
    res.status(500).json({ error: error.message || 'Failed to check file existence' });
  }
});

export default router;