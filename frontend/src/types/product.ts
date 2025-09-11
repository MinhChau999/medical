export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  category?: {
    id: string;
    name: string;
  };
  categoryId?: string;
  price: number;
  stockQuantity: number;
  reorderLevel: number;
  unit?: string;
  status: 'active' | 'inactive';
  images?: string[];
  brand?: string;
  barcode?: string;
  manufacturer?: string;
  expiryDate?: string;
  batchNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku: string;
  price: number;
  stockQuantity: number;
  attributes: Record<string, any>;
  image?: string;
  status: 'active' | 'inactive';
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  thumbnail?: string;
  isPrimary: boolean;
  order: number;
  createdAt: string;
}

export interface ProductStock {
  productId: string;
  quantity: number;
  reserved: number;
  available: number;
  lastUpdated: string;
}