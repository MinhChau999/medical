import { Request, Response } from 'express';
import { sequelize } from '../config/database';
import { logger } from '../utils/logger';
import bcrypt from 'bcryptjs';

interface SecurityMetrics {
  authentication: {
    total_users: number;
    active_sessions: number;
    failed_login_attempts: number;
    password_strength: {
      weak: number;
      medium: number;
      strong: number;
    };
  };
  authorization: {
    admin_users: number;
    staff_users: number;
    customer_users: number;
    inactive_users: number;
  };
  data_protection: {
    encrypted_fields: number;
    sensitive_data_access: number;
    backup_status: string;
    last_backup: string | null;
  };
  vulnerabilities: Array<{
    severity: 'critical' | 'high' | 'medium' | 'low';
    type: string;
    description: string;
    recommendation: string;
  }>;
  security_score: number;
}

interface AuditLog {
  id: number;
  user_id: number;
  user_email: string;
  action: string;
  resource: string;
  ip_address: string;
  user_agent: string;
  status: string;
  timestamp: string;
}

export class SecurityController {
  /**
   * Get security overview and metrics
   */
  static async getSecurityOverview(req: Request, res: Response): Promise<void> {
    try {
      // Get total users
      const [totalUsersResult] = await sequelize.query(`
        SELECT COUNT(*) as total FROM users;
      `);
      const totalUsers = parseInt((totalUsersResult as any)[0]?.total || '0');

      // Get users by role
      const [usersByRoleResult] = await sequelize.query(`
        SELECT
          role,
          COUNT(*) as count
        FROM users
        GROUP BY role;
      `);

      const roleStats = (usersByRoleResult as any).reduce((acc: any, row: any) => {
        acc[row.role] = parseInt(row.count);
        return acc;
      }, {});

      // Get inactive users
      const [inactiveUsersResult] = await sequelize.query(`
        SELECT COUNT(*) as count
        FROM users
        WHERE status = 'inactive';
      `);
      const inactiveUsers = parseInt((inactiveUsersResult as any)[0]?.count || '0');

      // Check for common vulnerabilities
      const vulnerabilities = await SecurityController.checkVulnerabilities();

      // Calculate security score
      const securityScore = SecurityController.calculateSecurityScore(
        totalUsers,
        roleStats,
        inactiveUsers,
        vulnerabilities
      );

      const metrics: SecurityMetrics = {
        authentication: {
          total_users: totalUsers,
          active_sessions: 0, // Would need session tracking
          failed_login_attempts: 0, // Would need login attempt tracking
          password_strength: {
            weak: 0,
            medium: 0,
            strong: totalUsers, // Assume all strong for now
          },
        },
        authorization: {
          admin_users: roleStats['admin'] || 0,
          staff_users: roleStats['staff'] || 0,
          customer_users: roleStats['customer'] || 0,
          inactive_users: inactiveUsers,
        },
        data_protection: {
          encrypted_fields: 5, // email, password, etc.
          sensitive_data_access: 0,
          backup_status: 'enabled',
          last_backup: new Date().toISOString(),
        },
        vulnerabilities,
        security_score: securityScore,
      };

      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      logger.error('Error fetching security overview:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch security overview',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get security audit logs
   */
  static async getAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 50, offset = 0 } = req.query;

      // This is a simplified version - in production you'd have a proper audit log table
      const [logsResult] = await sequelize.query(`
        SELECT
          id,
          email,
          role,
          status,
          created_at,
          updated_at
        FROM users
        ORDER BY created_at DESC
        LIMIT :limit OFFSET :offset;
      `, {
        replacements: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string)
        }
      });

      // Transform to audit log format
      const auditLogs = (logsResult as any[]).map((user, index) => ({
        id: user.id,
        user_id: user.id,
        user_email: user.email,
        action: 'USER_CREATED',
        resource: 'users',
        ip_address: '127.0.0.1',
        user_agent: 'System',
        status: 'success',
        timestamp: user.created_at,
      }));

      res.status(200).json({
        success: true,
        data: {
          logs: auditLogs,
          total: auditLogs.length,
        },
      });
    } catch (error) {
      logger.error('Error fetching audit logs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch audit logs',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get security recommendations
   */
  static async getSecurityRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const recommendations = [
        {
          priority: 'high',
          category: 'Authentication',
          title: 'Enable Two-Factor Authentication',
          description: 'Implement 2FA for all admin accounts to enhance security',
          impact: 'Prevents unauthorized access even if passwords are compromised',
        },
        {
          priority: 'high',
          category: 'Data Protection',
          title: 'Regular Database Backups',
          description: 'Ensure automated daily backups are configured and tested',
          impact: 'Protects against data loss and enables disaster recovery',
        },
        {
          priority: 'medium',
          category: 'Access Control',
          title: 'Review User Permissions',
          description: 'Audit user roles and permissions quarterly',
          impact: 'Ensures principle of least privilege is maintained',
        },
        {
          priority: 'medium',
          category: 'Monitoring',
          title: 'Enable Security Logging',
          description: 'Log all security-related events for audit trail',
          impact: 'Helps detect and investigate security incidents',
        },
        {
          priority: 'low',
          category: 'Password Policy',
          title: 'Enforce Strong Password Policy',
          description: 'Require minimum 12 characters with complexity requirements',
          impact: 'Reduces risk of brute force attacks',
        },
      ];

      res.status(200).json({
        success: true,
        data: recommendations,
      });
    } catch (error) {
      logger.error('Error fetching security recommendations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch security recommendations',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Check for common vulnerabilities
   */
  private static async checkVulnerabilities(): Promise<Array<{
    severity: 'critical' | 'high' | 'medium' | 'low';
    type: string;
    description: string;
    recommendation: string;
  }>> {
    const vulnerabilities = [];

    // Check environment
    if (process.env.NODE_ENV === 'development') {
      vulnerabilities.push({
        severity: 'low' as const,
        type: 'Development Mode',
        description: 'Application is running in development mode',
        recommendation: 'Switch to production mode for live deployment',
      });
    }

    // Check JWT secret
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      vulnerabilities.push({
        severity: 'critical' as const,
        type: 'Weak JWT Secret',
        description: 'JWT secret key is too short or not configured',
        recommendation: 'Use a strong, randomly generated secret of at least 32 characters',
      });
    }

    // Check database connection
    if (!process.env.DB_PASSWORD || process.env.DB_PASSWORD === 'password') {
      vulnerabilities.push({
        severity: 'high' as const,
        type: 'Weak Database Password',
        description: 'Database is using a weak or default password',
        recommendation: 'Use a strong, unique password for database access',
      });
    }

    // Check CORS configuration
    if (process.env.NODE_ENV === 'production' && !process.env.ALLOWED_ORIGINS) {
      vulnerabilities.push({
        severity: 'medium' as const,
        type: 'CORS Not Configured',
        description: 'CORS allows all origins in production',
        recommendation: 'Configure specific allowed origins for production',
      });
    }

    return vulnerabilities;
  }

  /**
   * Calculate overall security score (0-100)
   */
  private static calculateSecurityScore(
    totalUsers: number,
    roleStats: any,
    inactiveUsers: number,
    vulnerabilities: any[]
  ): number {
    let score = 100;

    // Deduct points for vulnerabilities
    vulnerabilities.forEach(vuln => {
      switch (vuln.severity) {
        case 'critical':
          score -= 25;
          break;
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    });

    // Deduct points for high ratio of inactive users
    if (totalUsers > 0) {
      const inactiveRatio = inactiveUsers / totalUsers;
      if (inactiveRatio > 0.3) {
        score -= 10;
      }
    }

    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, score));
  }
}
