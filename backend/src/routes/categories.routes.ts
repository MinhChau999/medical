import { Router } from 'express';
import { CategoriesController } from '../controllers/categories.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', CategoriesController.getCategories);
router.get('/:id', CategoriesController.getCategory);
router.post('/reorder', CategoriesController.updateCategoriesOrder); // Made public for drag-and-drop

// Admin routes
router.post('/', authenticate, authorize('admin', 'staff'), CategoriesController.createCategory);
router.put('/:id', authenticate, authorize('admin', 'staff'), CategoriesController.updateCategory);
router.delete('/:id', authenticate, authorize('admin'), CategoriesController.deleteCategory);

export default router;