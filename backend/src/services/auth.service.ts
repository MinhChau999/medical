import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import redisClient from '../config/redis';
import { AppError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

interface RegisterData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export class AuthService {
  private generateTokens(payload: TokenPayload) {
    const accessToken = jwt.sign(
      payload,
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_ACCESS_EXPIRY || '100y' }
    );

    const refreshToken = jwt.sign(
      payload,
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_REFRESH_EXPIRY || '100y' }
    );

    return { accessToken, refreshToken };
  }

  async register(data: RegisterData) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [data.email]
      );

      if (existingUser.rows.length > 0) {
        throw new AppError('Email already registered', 400);
      }

      const hashedPassword = await bcrypt.hash(
        data.password,
        parseInt(process.env.BCRYPT_ROUNDS || '10')
      );

      const userId = uuidv4();
      const userResult = await client.query(
        `INSERT INTO users (id, email, password, first_name, last_name, phone, role, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, email, role`,
        [
          userId,
          data.email,
          hashedPassword,
          data.firstName,
          data.lastName,
          data.phone,
          'customer',
          'active'
        ]
      );

      await client.query(
        `INSERT INTO customers (id, customer_code)
         VALUES ($1, $2)`,
        [userId, `CUST${Date.now()}`]
      );

      await client.query('COMMIT');

      const user = userResult.rows[0];
      const tokens = this.generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      await redisClient.setex(
        `refresh_token:${user.id}`,
        100 * 365 * 24 * 60 * 60, // 100 years
        tokens.refreshToken
      );

      return {
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        },
        ...tokens
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async login(data: LoginData) {
    const userResult = await pool.query(
      `SELECT id, email, password, role, status 
       FROM users 
       WHERE email = $1`,
      [data.email]
    );

    if (userResult.rows.length === 0) {
      throw new AppError('Invalid credentials', 401);
    }

    const user = userResult.rows[0];

    if (user.status !== 'active') {
      throw new AppError('Account is not active', 401);
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    await redisClient.setex(
      `refresh_token:${user.id}`,
      100 * 365 * 24 * 60 * 60, // 100 years
      tokens.refreshToken
    );

    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      ...tokens
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as TokenPayload;
      
      const storedToken = await redisClient.get(`refresh_token:${decoded.userId}`);
      if (storedToken !== refreshToken) {
        throw new AppError('Invalid refresh token', 401);
      }

      const userResult = await pool.query(
        'SELECT id, email, role, status FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (userResult.rows.length === 0 || userResult.rows[0].status !== 'active') {
        throw new AppError('User not found or inactive', 401);
      }

      const user = userResult.rows[0];
      const tokens = this.generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      await redisClient.setex(
        `refresh_token:${user.id}`,
        100 * 365 * 24 * 60 * 60, // 100 years
        tokens.refreshToken
      );

      return tokens;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('Refresh token expired', 401);
      }
      throw error;
    }
  }

  async logout(userId: string) {
    await redisClient.del(`refresh_token:${userId}`);
    return { message: 'Logged out successfully' };
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const userResult = await pool.query(
      'SELECT password FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, userResult.rows[0].password);
    if (!isPasswordValid) {
      throw new AppError('Invalid old password', 401);
    }

    const hashedPassword = await bcrypt.hash(
      newPassword,
      parseInt(process.env.BCRYPT_ROUNDS || '10')
    );

    await pool.query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, userId]
    );

    await redisClient.del(`refresh_token:${userId}`);

    return { message: 'Password changed successfully' };
  }
}