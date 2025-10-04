import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { ProductsRawController } from '../controllers/products-raw.controller';

const router = Router();

// Public routes
router.get('/', ProductsRawController.getProducts);
router.get('/stats', ProductsRawController.getProductStats);
router.get('/low-stock', ProductsRawController.getLowStockProducts);
router.get('/barcode/:barcode', ProductsRawController.getProductByBarcode);
router.get('/:id', ProductsRawController.getProduct);

// Protected routes
router.use(authenticate);

// Admin and Manager routes
router.post('/', authorize('admin', 'manager'), ProductsRawController.createProduct);
router.put('/:id', authorize('admin', 'manager'), ProductsRawController.updateProduct);
router.patch('/:id/stock', authorize('admin', 'manager', 'staff'), ProductsRawController.updateStock);
router.delete('/:id', authorize('admin'), ProductsRawController.deleteProduct);

// Bulk operations
router.post('/bulk-update', authorize('admin', 'manager'), ProductsRawController.bulkUpdateProducts);
router.post('/bulk-delete', authorize('admin'), ProductsRawController.bulkDeleteProducts);

export default router;