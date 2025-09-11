import api from './api';
import type { Product } from '@/types/product';

export interface CreateProductDto {
  name: string;
  sku: string;
  categoryId: string;
  description?: string;
  price: number;
  stockQuantity: number;
  reorderLevel?: number;
  unit?: string;
  status: 'active' | 'inactive';
  images?: string[];
  brand?: string;
  barcode?: string;
  manufacturer?: string;
  expiryDate?: string;
  batchNumber?: string;
  notes?: string;
}

export interface UpdateProductDto extends Partial<CreateProductDto> {}

export interface ProductsFilter {
  search?: string;
  categoryId?: string;
  status?: 'active' | 'inactive';
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class ProductsService {
  /**
   * Get all products with filtering and pagination
   */
  async getProducts(filter?: ProductsFilter): Promise<{
    data: Product[];
    total: number;
    page: number;
    limit: number;
  }> {
    const response = await api.get('/products', { params: filter });
    return response.data;
  }

  /**
   * Get single product by ID
   */
  async getProduct(id: string): Promise<Product> {
    const response = await api.get(`/products/${id}`);
    return response.data.data;
  }

  /**
   * Create new product
   */
  async createProduct(data: CreateProductDto): Promise<Product> {
    const response = await api.post('/products', data);
    return response.data.data;
  }

  /**
   * Update product
   */
  async updateProduct(id: string, data: UpdateProductDto): Promise<Product> {
    const response = await api.put(`/products/${id}`, data);
    return response.data.data;
  }

  /**
   * Delete product
   */
  async deleteProduct(id: string): Promise<void> {
    await api.delete(`/products/${id}`);
  }

  /**
   * Update product stock
   */
  async updateStock(id: string, quantity: number): Promise<Product> {
    const response = await api.patch(`/products/${id}/stock`, { quantity });
    return response.data.data;
  }

  /**
   * Bulk update products
   */
  async bulkUpdateProducts(
    ids: string[],
    data: Partial<Product>
  ): Promise<void> {
    await api.post('/products/bulk-update', { ids, data });
  }

  /**
   * Bulk delete products
   */
  async bulkDeleteProducts(ids: string[]): Promise<void> {
    await api.post('/products/bulk-delete', { ids });
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts(): Promise<Product[]> {
    const response = await api.get('/products/low-stock');
    return response.data.data;
  }

  /**
   * Get product by barcode
   */
  async getProductByBarcode(barcode: string): Promise<Product> {
    const response = await api.get(`/products/barcode/${barcode}`);
    return response.data.data;
  }

  /**
   * Export products to CSV
   */
  async exportProducts(filter?: ProductsFilter): Promise<Blob> {
    const response = await api.get('/products/export', {
      params: filter,
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Import products from CSV
   */
  async importProducts(file: File): Promise<{
    success: number;
    failed: number;
    errors: string[];
  }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/products/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Get product statistics
   */
  async getProductStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    lowStock: number;
    outOfStock: number;
    totalValue: number;
  }> {
    const response = await api.get('/products/stats');
    return response.data.data;
  }
}

export const productsService = new ProductsService();