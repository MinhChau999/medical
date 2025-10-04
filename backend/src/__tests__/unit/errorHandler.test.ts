import { Request, Response, NextFunction } from 'express';
import { AppError, errorHandler } from '../../middleware/errorHandler';

describe('ErrorHandler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should handle AppError with custom status code and message', () => {
    const error = new AppError('Custom error message', 404);

    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: 'Custom error message',
    });
  });

  test('should handle generic Error with 500 status code', () => {
    const error = new Error('Generic error');

    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: 'Something went wrong!',
    });
  });

  test('should include stack trace in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const error = new AppError('Test error', 400);

    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Test error',
        stack: expect.any(String),
      })
    );

    process.env.NODE_ENV = originalEnv;
  });

  test('AppError should be operational', () => {
    const error = new AppError('Test', 400);
    expect(error.isOperational).toBe(true);
    expect(error.statusCode).toBe(400);
  });
});
