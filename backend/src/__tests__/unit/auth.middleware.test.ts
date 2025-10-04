import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate, authorize, AuthRequest } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';
import pool from '../../config/database';

// Mock dependencies
jest.mock('../../config/database');
jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    test('should reject request without token', async () => {
      await authenticate(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Authentication required',
          statusCode: 401,
        })
      );
    });

    test('should reject request with invalid token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid_token',
      };

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.JsonWebTokenError('Invalid token');
      });

      await authenticate(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid token',
          statusCode: 401,
        })
      );
    });

    test('should reject expired token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer expired_token',
      };

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.TokenExpiredError('Token expired', new Date());
      });

      await authenticate(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Token expired',
          statusCode: 401,
        })
      );
    });

    test('should authenticate valid token and attach user to request', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        role: 'admin',
      };

      mockRequest.headers = {
        authorization: 'Bearer valid_token',
      };

      (jwt.verify as jest.Mock).mockReturnValue({ userId: '123' });
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [mockUser],
      });

      await authenticate(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('authorize', () => {
    test('should reject request without user', () => {
      const middleware = authorize('admin');

      middleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Authentication required',
          statusCode: 401,
        })
      );
    });

    test('should reject request with insufficient permissions', () => {
      mockRequest.user = {
        id: '123',
        email: 'test@example.com',
        role: 'user',
      };

      const middleware = authorize('admin');

      middleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Insufficient permissions',
          statusCode: 403,
        })
      );
    });

    test('should allow request with correct role', () => {
      mockRequest.user = {
        id: '123',
        email: 'test@example.com',
        role: 'admin',
      };

      const middleware = authorize('admin', 'user');

      middleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
    });
  });
});
