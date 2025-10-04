import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { BlogController } from '../controllers/blog.controller';

const router = Router();

// Public routes
router.get('/', BlogController.getPosts);
router.get('/categories', BlogController.getCategories);
router.get('/:slug', BlogController.getPost);

// Protected routes
router.use(authenticate);

// Admin and Manager routes
router.post('/', authorize('admin', 'manager'), BlogController.createPost);
router.put('/:id', authorize('admin', 'manager'), BlogController.updatePost);
router.delete('/:id', authorize('admin'), BlogController.deletePost);
router.get('/stats/overview', authorize('admin', 'manager'), BlogController.getStats);

export default router;
