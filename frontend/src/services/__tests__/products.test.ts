import { describe, it, expect, beforeEach, vi } from 'vitest';
import { productsService } from '../products';
import api from '../api';

// Mock the api module
vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('ProductsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProducts', () => {
    it('should fetch products with filters', async () => {
      const mockData = {
        data: [
          { id: '1', name: 'Product 1', price: 100 },
          { id: '2', name: 'Product 2', price: 200 },
        ],
        total: 2,
        page: 1,
        limit: 10,
      };

      vi.mocked(api.get).mockResolvedValue({ data: mockData });

      const filter = { search: 'test', page: 1, limit: 10 };
      const result = await productsService.getProducts(filter);

      expect(api.get).toHaveBeenCalledWith('/products', { params: filter });
      expect(result).toEqual(mockData);
    });

    it('should fetch products without filters', async () => {
      const mockData = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      };

      vi.mocked(api.get).mockResolvedValue({ data: mockData });

      const result = await productsService.getProducts();

      expect(api.get).toHaveBeenCalledWith('/products', { params: undefined });
      expect(result).toEqual(mockData);
    });
  });

  describe('getProduct', () => {
    it('should fetch single product by ID', async () => {
      const mockProduct = {
        data: { id: '1', name: 'Product 1', price: 100 },
      };

      vi.mocked(api.get).mockResolvedValue({ data: mockProduct });

      const result = await productsService.getProduct('1');

      expect(api.get).toHaveBeenCalledWith('/products/1');
      expect(result).toEqual(mockProduct.data);
    });
  });

  describe('createProduct', () => {
    it('should create a new product', async () => {
      const newProduct = {
        name: 'New Product',
        sku: 'SKU001',
        categoryId: 'cat-1',
        price: 150,
        stockQuantity: 10,
        status: 'active' as const,
      };

      const mockResponse = {
        data: { id: '999', ...newProduct },
      };

      vi.mocked(api.post).mockResolvedValue({ data: mockResponse });

      const result = await productsService.createProduct(newProduct);

      expect(api.post).toHaveBeenCalledWith('/products', newProduct);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('updateProduct', () => {
    it('should update an existing product', async () => {
      const updateData = { name: 'Updated Product', price: 200 };
      const mockResponse = {
        data: { id: '1', ...updateData },
      };

      vi.mocked(api.put).mockResolvedValue({ data: mockResponse });

      const result = await productsService.updateProduct('1', updateData);

      expect(api.put).toHaveBeenCalledWith('/products/1', updateData);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product', async () => {
      vi.mocked(api.delete).mockResolvedValue({ data: {} });

      await productsService.deleteProduct('1');

      expect(api.delete).toHaveBeenCalledWith('/products/1');
    });
  });

  describe('updateStock', () => {
    it('should update product stock', async () => {
      const mockResponse = {
        data: { id: '1', stockQuantity: 20 },
      };

      vi.mocked(api.patch).mockResolvedValue({ data: mockResponse });

      const result = await productsService.updateStock('1', 20);

      expect(api.patch).toHaveBeenCalledWith('/products/1/stock', { quantity: 20 });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('bulkUpdateProducts', () => {
    it('should bulk update products', async () => {
      const ids = ['1', '2', '3'];
      const data = { status: 'inactive' };

      vi.mocked(api.post).mockResolvedValue({ data: {} });

      await productsService.bulkUpdateProducts(ids, data);

      expect(api.post).toHaveBeenCalledWith('/products/bulk-update', { ids, data });
    });
  });

  describe('bulkDeleteProducts', () => {
    it('should bulk delete products', async () => {
      const ids = ['1', '2', '3'];

      vi.mocked(api.post).mockResolvedValue({ data: {} });

      await productsService.bulkDeleteProducts(ids);

      expect(api.post).toHaveBeenCalledWith('/products/bulk-delete', { ids });
    });
  });

  describe('getLowStockProducts', () => {
    it('should fetch low stock products', async () => {
      const mockProducts = {
        data: [{ id: '1', name: 'Low Stock Product', stockQuantity: 2 }],
      };

      vi.mocked(api.get).mockResolvedValue({ data: mockProducts });

      const result = await productsService.getLowStockProducts();

      expect(api.get).toHaveBeenCalledWith('/products/low-stock');
      expect(result).toEqual(mockProducts.data);
    });
  });

  describe('getProductByBarcode', () => {
    it('should fetch product by barcode', async () => {
      const mockProduct = {
        data: { id: '1', barcode: '123456789' },
      };

      vi.mocked(api.get).mockResolvedValue({ data: mockProduct });

      const result = await productsService.getProductByBarcode('123456789');

      expect(api.get).toHaveBeenCalledWith('/products/barcode/123456789');
      expect(result).toEqual(mockProduct.data);
    });
  });

  describe('exportProducts', () => {
    it('should export products to CSV', async () => {
      const mockBlob = new Blob(['test'], { type: 'text/csv' });
      vi.mocked(api.get).mockResolvedValue({ data: mockBlob });

      const filter = { status: 'active' as const };
      const result = await productsService.exportProducts(filter);

      expect(api.get).toHaveBeenCalledWith('/products/export', {
        params: filter,
        responseType: 'blob',
      });
      expect(result).toEqual(mockBlob);
    });
  });

  describe('importProducts', () => {
    it('should import products from CSV file', async () => {
      const mockResponse = {
        success: 10,
        failed: 2,
        errors: ['Error 1', 'Error 2'],
      };

      vi.mocked(api.post).mockResolvedValue({ data: mockResponse });

      const file = new File(['test'], 'products.csv', { type: 'text/csv' });
      const result = await productsService.importProducts(file);

      expect(api.post).toHaveBeenCalledWith(
        '/products/import',
        expect.any(FormData),
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getProductStats', () => {
    it('should fetch product statistics', async () => {
      const mockStats = {
        data: {
          total: 100,
          active: 80,
          inactive: 20,
          lowStock: 5,
          outOfStock: 2,
          totalValue: 1000000,
        },
      };

      vi.mocked(api.get).mockResolvedValue({ data: mockStats });

      const result = await productsService.getProductStats();

      expect(api.get).toHaveBeenCalledWith('/products/stats');
      expect(result).toEqual(mockStats.data);
    });
  });
});
