import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Mock data
const mockProducts = [
  {
    id: '1',
    name: 'Paracetamol 500mg',
    sku: 'MED-001',
    description: 'Pain reliever and fever reducer',
    price: 5.99,
    stockQuantity: 500,
    reorderLevel: 100,
    unit: 'box',
    status: 'active',
    brand: 'PharmaCare',
    category: { id: '1', name: 'Pain Relief' },
    images: []
  },
  {
    id: '2',
    name: 'Ibuprofen 400mg',
    sku: 'MED-002',
    description: 'Anti-inflammatory pain reliever',
    price: 8.99,
    stockQuantity: 350,
    reorderLevel: 75,
    unit: 'box',
    status: 'active',
    brand: 'MediRelief',
    category: { id: '1', name: 'Pain Relief' },
    images: []
  },
  {
    id: '3',
    name: 'Amoxicillin 500mg',
    sku: 'ANT-001',
    description: 'Broad-spectrum antibiotic',
    price: 15.99,
    stockQuantity: 150,
    reorderLevel: 30,
    unit: 'box',
    status: 'active',
    brand: 'AntiBac',
    category: { id: '2', name: 'Antibiotics' },
    images: []
  },
  {
    id: '4',
    name: 'Vitamin C 1000mg',
    sku: 'VIT-001',
    description: 'Immune system support',
    price: 12.99,
    stockQuantity: 300,
    reorderLevel: 60,
    unit: 'bottle',
    status: 'active',
    brand: 'VitaBoost',
    category: { id: '3', name: 'Vitamins' },
    images: []
  },
  {
    id: '5',
    name: 'Adhesive Bandages Pack',
    sku: 'FA-001',
    description: 'Assorted sizes sterile adhesive bandages',
    price: 4.99,
    stockQuantity: 400,
    reorderLevel: 80,
    unit: 'pack',
    status: 'active',
    brand: 'QuickHeal',
    category: { id: '4', name: 'First Aid' },
    images: []
  },
  {
    id: '6',
    name: 'Digital Thermometer',
    sku: 'DEV-001',
    description: 'Fast and accurate temperature measurement',
    price: 19.99,
    stockQuantity: 50,
    reorderLevel: 10,
    unit: 'piece',
    status: 'active',
    brand: 'TempCheck',
    category: { id: '5', name: 'Medical Devices' },
    images: []
  },
  {
    id: '7',
    name: 'Cough Syrup 200ml',
    sku: 'CF-001',
    description: 'Relieves cough and soothes throat',
    price: 9.99,
    stockQuantity: 0,
    reorderLevel: 30,
    unit: 'bottle',
    status: 'active',
    brand: 'CoughRelief',
    category: { id: '6', name: 'Cold & Flu' },
    images: []
  },
  {
    id: '8',
    name: 'Antacid Tablets',
    sku: 'DIG-001',
    description: 'Fast relief from heartburn',
    price: 8.99,
    stockQuantity: 5,
    reorderLevel: 40,
    unit: 'bottle',
    status: 'active',
    brand: 'AcidRelief',
    category: { id: '7', name: 'Digestive Health' },
    images: []
  }
];

// Get all products with filtering
router.get('/', (req: Request, res: Response) => {
  const {
    search,
    categoryId,
    status = 'active',
    page = 1,
    limit = 10
  } = req.query;

  let filtered = [...mockProducts];

  // Apply filters
  if (search) {
    const searchStr = String(search).toLowerCase();
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(searchStr) ||
      p.sku.toLowerCase().includes(searchStr) ||
      p.description.toLowerCase().includes(searchStr)
    );
  }

  if (categoryId) {
    filtered = filtered.filter(p => p.category.id === categoryId);
  }

  if (status) {
    filtered = filtered.filter(p => p.status === status);
  }

  // Pagination
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const startIndex = (pageNum - 1) * limitNum;
  const endIndex = startIndex + limitNum;
  const paginated = filtered.slice(startIndex, endIndex);

  res.json({
    success: true,
    data: paginated,
    total: filtered.length,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(filtered.length / limitNum)
  });
});

// Get product stats
router.get('/stats', (req: Request, res: Response) => {
  const active = mockProducts.filter(p => p.status === 'active').length;
  const inactive = mockProducts.filter(p => p.status === 'inactive').length;
  const lowStock = mockProducts.filter(p => p.stockQuantity > 0 && p.stockQuantity <= p.reorderLevel).length;
  const outOfStock = mockProducts.filter(p => p.stockQuantity === 0).length;
  const totalValue = mockProducts.reduce((sum, p) => sum + (p.price * p.stockQuantity), 0);

  res.json({
    success: true,
    data: {
      total: mockProducts.length,
      active,
      inactive,
      lowStock,
      outOfStock,
      totalValue
    }
  });
});

// Get low stock products
router.get('/low-stock', (req: Request, res: Response) => {
  const lowStock = mockProducts.filter(p => 
    p.status === 'active' && p.stockQuantity <= p.reorderLevel
  );

  res.json({
    success: true,
    data: lowStock
  });
});

// Get product by barcode
router.get('/barcode/:barcode', (req: Request, res: Response) => {
  const { barcode } = req.params;
  const product = mockProducts.find(p => p.sku === barcode);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  res.json({
    success: true,
    data: product
  });
});

// Get single product
router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const product = mockProducts.find(p => p.id === id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  res.json({
    success: true,
    data: product
  });
});

// Protected routes - commented out for testing
// router.use(authenticate);

// Create product
router.post('/', /* authorize(['admin', 'manager']), */ (req: Request, res: Response) => {
  const newProduct = {
    id: String(mockProducts.length + 1),
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  mockProducts.push(newProduct);
  
  res.status(201).json({
    success: true,
    data: newProduct,
    message: 'Product created successfully'
  });
});

// Update product
router.put('/:id', /* authorize(['admin', 'manager']), */ (req: Request, res: Response) => {
  const { id } = req.params;
  const index = mockProducts.findIndex(p => p.id === id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  mockProducts[index] = {
    ...mockProducts[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  res.json({
    success: true,
    data: mockProducts[index],
    message: 'Product updated successfully'
  });
});

// Update stock
router.patch('/:id/stock', /* authorize(['admin', 'manager', 'staff']), */ (req: Request, res: Response) => {
  const { id } = req.params;
  const { quantity } = req.body;
  const index = mockProducts.findIndex(p => p.id === id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  mockProducts[index].stockQuantity = quantity;

  res.json({
    success: true,
    data: mockProducts[index],
    message: 'Stock updated successfully'
  });
});

// Delete product
router.delete('/:id', /* authorize(['admin']), */ (req: Request, res: Response) => {
  const { id } = req.params;
  const index = mockProducts.findIndex(p => p.id === id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  mockProducts.splice(index, 1);

  res.json({
    success: true,
    message: 'Product deleted successfully'
  });
});

// Bulk operations
router.post('/bulk-update', /* authorize(['admin', 'manager']), */ (req: Request, res: Response) => {
  const { ids, data } = req.body;

  ids.forEach((id: string) => {
    const index = mockProducts.findIndex(p => p.id === id);
    if (index !== -1) {
      mockProducts[index] = {
        ...mockProducts[index],
        ...data
      };
    }
  });

  res.json({
    success: true,
    message: 'Products updated successfully'
  });
});

router.post('/bulk-delete', /* authorize(['admin']), */ (req: Request, res: Response) => {
  const { ids } = req.body;

  ids.forEach((id: string) => {
    const index = mockProducts.findIndex(p => p.id === id);
    if (index !== -1) {
      mockProducts.splice(index, 1);
    }
  });

  res.json({
    success: true,
    message: 'Products deleted successfully'
  });
});

export default router;