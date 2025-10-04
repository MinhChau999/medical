import { Request, Response } from 'express';
import { sequelize } from '../config/database';
import { logger } from '../utils/logger';
import axios from 'axios';
import { getCategorizedEndpoints } from '../utils/route-scanner';

interface EndpointStatus {
  name: string;
  endpoint: string;
  method: string;
  status: 'healthy' | 'degraded' | 'down';
  response_time: number;
  last_checked: string;
  status_code?: number;
  error?: string;
}

interface APIMetrics {
  total_endpoints: number;
  healthy: number;
  degraded: number;
  down: number;
  average_response_time: number;
  uptime_percentage: number;
}

export class APIStatusController {
  /**
   * Get API endpoints status
   */
  static async getAPIStatus(req: Request, res: Response): Promise<void> {
    try {
      const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';

      // Get all endpoints automatically from route scanner
      const endpoints = getCategorizedEndpoints();

      const results: EndpointStatus[] = [];
      const token = req.headers.authorization?.split(' ')[1]; // Get token from request

      for (const endpoint of endpoints) {
        const startTime = Date.now();
        let status: 'healthy' | 'degraded' | 'down' = 'down';
        let statusCode: number | undefined;
        let error: string | undefined;

        try {
          const headers: any = {};
          if (endpoint.requiresAuth && token) {
            headers.Authorization = `Bearer ${token}`;
          }

          const response = await axios.get(`${baseUrl}${endpoint.endpoint}`, {
            headers,
            timeout: 5000,
          });

          const responseTime = Date.now() - startTime;
          statusCode = response.status;

          if (statusCode === 200) {
            status = responseTime < 1000 ? 'healthy' : 'degraded';
          }

          results.push({
            name: endpoint.name,
            endpoint: endpoint.endpoint,
            method: endpoint.method,
            status,
            response_time: responseTime,
            last_checked: new Date().toISOString(),
            status_code: statusCode,
          });
        } catch (err: any) {
          const responseTime = Date.now() - startTime;
          statusCode = err.response?.status;
          error = err.message;

          // If 401/403, API is working but requires auth
          if (statusCode === 401 || statusCode === 403) {
            status = 'healthy';
          }

          results.push({
            name: endpoint.name,
            endpoint: endpoint.endpoint,
            method: endpoint.method,
            status,
            response_time: responseTime,
            last_checked: new Date().toISOString(),
            status_code: statusCode,
            error: status === 'down' ? error : undefined,
          });
        }
      }

      // Calculate metrics
      const metrics: APIMetrics = {
        total_endpoints: results.length,
        healthy: results.filter(r => r.status === 'healthy').length,
        degraded: results.filter(r => r.status === 'degraded').length,
        down: results.filter(r => r.status === 'down').length,
        average_response_time: Math.round(
          results.reduce((sum, r) => sum + r.response_time, 0) / results.length
        ),
        uptime_percentage: Math.round(
          (results.filter(r => r.status !== 'down').length / results.length) * 100
        ),
      };

      res.status(200).json({
        success: true,
        data: {
          metrics,
          endpoints: results,
          checked_at: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error checking API status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check API status',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get API performance metrics
   */
  static async getAPIMetrics(req: Request, res: Response): Promise<void> {
    try {
      // Get system metrics
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      const uptime = process.uptime();

      // Test database response time
      const dbStartTime = Date.now();
      await sequelize.query('SELECT 1');
      const dbResponseTime = Date.now() - dbStartTime;

      res.status(200).json({
        success: true,
        data: {
          system: {
            uptime_seconds: Math.round(uptime),
            uptime_formatted: formatUptime(uptime),
            memory: {
              total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
              used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
              percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
            },
            cpu: {
              user: Math.round(cpuUsage.user / 1000),
              system: Math.round(cpuUsage.system / 1000),
            },
          },
          database: {
            response_time: dbResponseTime,
            status: dbResponseTime < 100 ? 'healthy' : dbResponseTime < 500 ? 'degraded' : 'slow',
          },
          environment: process.env.NODE_ENV,
          version: process.env.API_VERSION || 'v1',
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error fetching API metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch API metrics',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

// Helper function to format uptime
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}
