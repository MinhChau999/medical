import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get(
  '/',
  ProductController.validateGetProducts,
  ProductController.getProducts
);

router.get('/search', ProductController.searchProducts);

router.get('/:id', ProductController.getProductById);

router.post(
  '/',
  authenticate,
  authorize('admin', 'manager'),
  ProductController.validateCreateProduct,
  ProductController.createProduct
);

router.put(
  '/:id',
  authenticate,
  authorize('admin', 'manager'),
  ProductController.validateUpdateProduct,
  ProductController.updateProduct
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  ProductController.deleteProduct
);

router.post(
  '/:id/variants',
  authenticate,
  authorize('admin', 'manager'),
  ProductController.createProductVariant
);

export default router;