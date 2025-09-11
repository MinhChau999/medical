import api from './api';

export interface UploadResponse {
  success: boolean;
  url: string;
  urls?: string[];
  message?: string;
}

class UploadService {
  /**
   * Upload single product image
   */
  async uploadProductImage(formData: FormData): Promise<UploadResponse> {
    const response = await api.post('/upload/product', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Upload multiple product images
   */
  async uploadMultipleImages(formData: FormData): Promise<UploadResponse> {
    const response = await api.post('/upload/products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Upload avatar image
   */
  async uploadAvatar(formData: FormData): Promise<UploadResponse> {
    const response = await api.post('/upload/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Upload cover image
   */
  async uploadCover(formData: FormData): Promise<UploadResponse> {
    const response = await api.post('/upload/cover', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Upload logo image
   */
  async uploadLogo(formData: FormData): Promise<UploadResponse> {
    const response = await api.post('/upload/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Delete image
   */
  async deleteImage(url: string): Promise<void> {
    await api.delete('/upload/image', { data: { url } });
  }

  /**
   * Delete multiple images
   */
  async deleteMultipleImages(urls: string[]): Promise<void> {
    await api.post('/upload/delete-multiple', { urls });
  }

  /**
   * Generate presigned upload URL for direct browser upload
   */
  async generateUploadUrl(fileName: string, contentType: string = 'image/jpeg') {
    const response = await api.post('/upload/generate-upload-url', {
      fileName,
      contentType,
    });
    return response.data;
  }

  /**
   * Generate presigned URL for temporary access
   */
  async generateAccessUrl(key: string, expiresIn: number = 3600) {
    const response = await api.post('/upload/generate-access-url', {
      key,
      expiresIn,
    });
    return response.data;
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(key: string) {
    const response = await api.get('/upload/metadata', {
      params: { key },
    });
    return response.data;
  }

  /**
   * Check if file exists
   */
  async fileExists(key: string): Promise<boolean> {
    const response = await api.get('/upload/exists', {
      params: { key },
    });
    return response.data.exists;
  }

  /**
   * Upload file directly to S3 using presigned URL
   */
  async uploadDirectToS3(file: File, uploadUrl: string): Promise<void> {
    await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });
  }

  /**
   * Optimize and compress image before upload
   */
  async optimizeImage(file: File, maxWidth: number = 1200, quality: number = 0.85): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

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
}

export const uploadService = new UploadService();