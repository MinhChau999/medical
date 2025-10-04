import { Router } from 'express';
import { GuestOrderController } from '../controllers/guest-order.controller';

const router = Router();

// Public routes for guest orders
router.post('/', GuestOrderController.createOrder);
router.get('/:orderNumber', GuestOrderController.getOrderByNumber);

export default router;
