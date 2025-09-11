import { body, validationResult, query, param } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// Validation result handler
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      details: errors.array()
    });
  }
  next();
};

// Common validation rules
export const paginationRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('sort').optional().isIn(['asc', 'desc']).withMessage('Sort must be either asc or desc')
];

export const idParamRule = [
  param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer')
];

// Product validation rules
export const createProductRules = [
  body('name').trim().notEmpty().withMessage('Product name is required')
    .isLength({ min: 3, max: 255 }).withMessage('Name must be between 3 and 255 characters'),
  body('sku').trim().notEmpty().withMessage('SKU is required')
    .matches(/^[A-Z0-9-]+$/).withMessage('SKU must contain only uppercase letters, numbers, and hyphens'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category_id').isInt({ min: 1 }).withMessage('Valid category ID is required'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('stock_quantity').optional().isInt({ min: 0 }).withMessage('Stock quantity must be a non-negative integer')
];

export const updateProductRules = [
  ...idParamRule,
  body('name').optional().trim().isLength({ min: 3, max: 255 }).withMessage('Name must be between 3 and 255 characters'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category_id').optional().isInt({ min: 1 }).withMessage('Valid category ID is required'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('stock_quantity').optional().isInt({ min: 0 }).withMessage('Stock quantity must be a non-negative integer')
];

// Order validation rules
export const createOrderRules = [
  body('customer_id').isInt({ min: 1 }).withMessage('Valid customer ID is required'),
  body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
  body('items.*.product_id').isInt({ min: 1 }).withMessage('Valid product ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('payment_method').isIn(['cash', 'card', 'transfer', 'vnpay', 'momo']).withMessage('Invalid payment method'),
  body('shipping_address').optional().trim().notEmpty().withMessage('Shipping address cannot be empty if provided')
];

// User validation rules
export const registerUserRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number and special character'),
  body('full_name').trim().notEmpty().withMessage('Full name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Full name must be between 2 and 100 characters'),
  body('phone').optional().matches(/^[0-9]{10,15}$/).withMessage('Phone number must be 10-15 digits')
];

export const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

// Search validation
export const searchRules = [
  query('q').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Search query must be between 2 and 100 characters'),
  query('category').optional().isInt({ min: 1 }).withMessage('Category must be a valid ID'),
  query('min_price').optional().isFloat({ min: 0 }).withMessage('Minimum price must be non-negative'),
  query('max_price').optional().isFloat({ min: 0 }).withMessage('Maximum price must be non-negative'),
  ...paginationRules
];

// Sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize common XSS vectors
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    } else if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        obj[key] = sanitize(obj[key]);
      }
    }
    return obj;
  };

  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  
  next();
};