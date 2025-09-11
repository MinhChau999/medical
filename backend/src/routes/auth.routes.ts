import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post(
  '/register',
  AuthController.validateRegister,
  AuthController.register
);

router.post(
  '/login',
  AuthController.validateLogin,
  AuthController.login
);

router.post('/refresh-token', AuthController.refreshToken);

router.post('/logout', authenticate, AuthController.logout);

router.post(
  '/change-password',
  authenticate,
  AuthController.validateChangePassword,
  AuthController.changePassword
);

router.get('/profile', authenticate, AuthController.getProfile);

export default router;