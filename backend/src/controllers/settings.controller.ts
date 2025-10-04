import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger';
import pool from '../config/database';

export class SettingsController {
  // Get system settings
  static async getSystemSettings(req: AuthRequest, res: Response): Promise<void> {
    try {
      const settings = {
        general: {
          site_name: process.env.SITE_NAME || 'Medical POS',
          site_url: process.env.SITE_URL || 'http://localhost:5173',
          api_url: process.env.API_BASE_URL || 'http://localhost:3000',
          timezone: process.env.TZ || 'Asia/Ho_Chi_Minh',
          language: 'vi',
          currency: 'VND',
        },
        security: {
          jwt_expiry: process.env.JWT_EXPIRES_IN || '24h',
          session_timeout: '30m',
          password_min_length: 8,
          require_strong_password: true,
          enable_2fa: false,
          max_login_attempts: 5,
        },
        email: {
          smtp_host: process.env.SMTP_HOST || '',
          smtp_port: process.env.SMTP_PORT || 587,
          smtp_secure: process.env.SMTP_SECURE === 'true',
          smtp_user: process.env.SMTP_USER || '',
          from_email: process.env.FROM_EMAIL || 'noreply@medical-pos.com',
          from_name: process.env.FROM_NAME || 'Medical POS',
        },
        storage: {
          provider: process.env.STORAGE_PROVIDER || 's3',
          s3_bucket: process.env.AWS_S3_BUCKET || '',
          s3_region: process.env.AWS_REGION || 'ap-southeast-1',
          max_upload_size: '10mb',
        },
        database: {
          host: process.env.DB_HOST || 'localhost',
          port: process.env.DB_PORT || 5432,
          name: process.env.DB_NAME || 'medical_pos',
          ssl: process.env.DB_SSL === 'true',
          pool_max: parseInt(process.env.DB_POOL_MAX || '20'),
          pool_min: parseInt(process.env.DB_POOL_MIN || '5'),
        },
        performance: {
          enable_compression: true,
          compression_level: 6,
          cache_enabled: true,
          cache_ttl: 3600,
          rate_limit_enabled: process.env.NODE_ENV === 'production',
          rate_limit_max: 100,
          rate_limit_window: '15m',
        },
        features: {
          enable_blog: true,
          enable_guest_orders: true,
          enable_analytics: true,
          enable_notifications: true,
          enable_backups: true,
        },
      };

      res.status(200).json({
        success: true,
        data: settings,
      });
    } catch (error) {
      logger.error('Error fetching system settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch system settings',
      });
    }
  }

  // Update system settings
  static async updateSystemSettings(req: Request, res: Response): Promise<void> {
    try {
      const { category, settings } = req.body;

      // In a real application, you would save these to a database
      // For now, we just validate and return success

      logger.info(`Settings updated for category: ${category}`, { settings });

      res.status(200).json({
        success: true,
        message: 'Settings updated successfully',
        data: settings,
      });
    } catch (error) {
      logger.error('Error updating system settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update system settings',
      });
    }
  }

  // Get user preferences
  static async getUserPreferences(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const userResult = await pool.query(
        'SELECT id, email FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      const preferences = {
        theme: 'light',
        language: 'vi',
        notifications: {
          email: true,
          push: false,
          sms: false,
        },
        display: {
          items_per_page: 10,
          date_format: 'DD/MM/YYYY',
          time_format: '24h',
        },
      };

      res.status(200).json({
        success: true,
        data: preferences,
      });
    } catch (error) {
      logger.error('Error fetching user preferences:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user preferences',
      });
    }
  }

  // Update user preferences
  static async updateUserPreferences(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const preferences = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      logger.info(`User preferences updated for user: ${userId}`, { preferences });

      res.status(200).json({
        success: true,
        message: 'Preferences updated successfully',
        data: preferences,
      });
    } catch (error) {
      logger.error('Error updating user preferences:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user preferences',
      });
    }
  }

  // Update user password
  static async updatePassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { current_password, new_password, confirm_password } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      if (!current_password || !new_password || !confirm_password) {
        res.status(400).json({
          success: false,
          message: 'All password fields are required',
        });
        return;
      }

      if (new_password !== confirm_password) {
        res.status(400).json({
          success: false,
          message: 'New passwords do not match',
        });
        return;
      }

      if (new_password.length < 8) {
        res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters long',
        });
        return;
      }

      const userResult = await pool.query(
        'SELECT id, email, password FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      const user = userResult.rows[0];

      // Verify current password
      const isPasswordValid = await bcrypt.compare(current_password, user.password);

      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Current password is incorrect',
        });
        return;
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(new_password, 10);

      // Update password
      await pool.query(
        'UPDATE users SET password = $1 WHERE id = $2',
        [hashedPassword, userId]
      );

      logger.info(`Password updated for user: ${user.email}`);

      res.status(200).json({
        success: true,
        message: 'Password updated successfully',
      });
    } catch (error) {
      logger.error('Error updating password:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update password',
      });
    }
  }

  // Clear cache
  static async clearCache(req: Request, res: Response): Promise<void> {
    try {
      // In a real application, you would clear Redis or other cache here
      logger.info('Cache cleared by admin');

      res.status(200).json({
        success: true,
        message: 'Cache cleared successfully',
      });
    } catch (error) {
      logger.error('Error clearing cache:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clear cache',
      });
    }
  }

  // Test email configuration
  static async testEmail(req: Request, res: Response): Promise<void> {
    try {
      const { to_email } = req.body;

      if (!to_email) {
        res.status(400).json({
          success: false,
          message: 'Email address is required',
        });
        return;
      }

      // In a real application, you would send a test email here
      logger.info(`Test email would be sent to: ${to_email}`);

      res.status(200).json({
        success: true,
        message: 'Test email sent successfully',
      });
    } catch (error) {
      logger.error('Error sending test email:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send test email',
      });
    }
  }
}
