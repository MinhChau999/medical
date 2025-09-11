import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { ProductsController } from '../controllers/products.controller';

const router = Router();

// Public routes
router.get('/', ProductsController.getProducts);
router.get('/stats', ProductsController.getProductStats);
router.get('/low-stock', ProductsController.getLowStockProducts);
router.get('/barcode/:barcode', ProductsController.getProductByBarcode);
router.get('/:id', ProductsController.getProduct);

// Protected routes
router.use(authenticate);

// Admin and Manager routes
router.post('/', authorize(['admin', 'manager']), ProductsController.createProduct);
router.put('/:id', authorize(['admin', 'manager']), ProductsController.updateProduct);
router.patch('/:id/stock', authorize(['admin', 'manager', 'staff']), ProductsController.updateStock);
router.delete('/:id', authorize(['admin']), ProductsController.deleteProduct);

// Bulk operations
router.post('/bulk-update', authorize(['admin', 'manager']), ProductsController.bulkUpdateProducts);
router.post('/bulk-delete', authorize(['admin']), ProductsController.bulkDeleteProducts);

export default router;