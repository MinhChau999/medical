import { Request, Response } from 'express';
import { sequelize } from '../config/database';
import { logger } from '../utils/logger';

export class DatabaseController {
  /**
   * Get database statistics
   */
  static async getDatabaseStats(req: Request, res: Response): Promise<void> {
    try {
      // Get database size
      const [dbSizeResult] = await sequelize.query(`
        SELECT pg_database_size(current_database()) as db_size;
      `);
      const dbSize = (dbSizeResult as any)[0]?.db_size || 0;

      // Get total tables count
      const [tablesCountResult] = await sequelize.query(`
        SELECT COUNT(*) as total_tables
        FROM information_schema.tables
        WHERE table_schema = 'public';
      `);
      const totalTables = parseInt((tablesCountResult as any)[0]?.total_tables || '0');

      // Get table sizes from information_schema
      const [tableSizesResult] = await sequelize.query(`
        SELECT
          table_name as tablename,
          pg_size_pretty(pg_total_relation_size(quote_ident(table_schema) || '.' || quote_ident(table_name))) AS size,
          pg_total_relation_size(quote_ident(table_schema) || '.' || quote_ident(table_name)) AS size_bytes
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        ORDER BY pg_total_relation_size(quote_ident(table_schema) || '.' || quote_ident(table_name)) DESC
        LIMIT 20;
      `);

      // Get database operations stats
      const [operationsResult] = await sequelize.query(`
        SELECT
          SUM(n_tup_ins) as total_inserts,
          SUM(n_tup_upd) as total_updates,
          SUM(n_tup_del) as total_deletes
        FROM pg_stat_user_tables;
      `);
      const operations = (operationsResult as any)[0] || {};

      // Get table row counts
      const [tableRowsResult] = await sequelize.query(`
        SELECT
          schemaname,
          relname as tablename,
          n_live_tup as row_count
        FROM pg_stat_user_tables
        WHERE schemaname = 'public'
        ORDER BY n_live_tup DESC
        LIMIT 20;
      `);

      // Get connection info
      const [connectionsResult] = await sequelize.query(`
        SELECT
          COUNT(*) as total_connections,
          COUNT(*) FILTER (WHERE state = 'active') as active_connections,
          COUNT(*) FILTER (WHERE state = 'idle') as idle_connections
        FROM pg_stat_activity
        WHERE datname = current_database();
      `);
      const connections = (connectionsResult as any)[0] || {};

      // Get database version
      const [versionResult] = await sequelize.query(`SELECT version();`);
      const version = (versionResult as any)[0]?.version || '';

      res.status(200).json({
        success: true,
        data: {
          database_name: process.env.DB_NAME || 'medical',
          database_size: dbSize,
          database_size_pretty: formatBytes(parseInt(dbSize)),
          total_tables: totalTables,
          version: version,
          connections: {
            total: parseInt(connections.total_connections || '0'),
            active: parseInt(connections.active_connections || '0'),
            idle: parseInt(connections.idle_connections || '0'),
          },
          operations: {
            inserts: parseInt(operations.total_inserts || '0'),
            updates: parseInt(operations.total_updates || '0'),
            deletes: parseInt(operations.total_deletes || '0'),
            total: parseInt(operations.total_inserts || '0') +
                   parseInt(operations.total_updates || '0') +
                   parseInt(operations.total_deletes || '0'),
          },
          table_sizes: tableSizesResult,
          table_rows: tableRowsResult,
        }
      });
    } catch (error) {
      logger.error('Error fetching database stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch database statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get detailed table information
   */
  static async getTableInfo(req: Request, res: Response): Promise<void> {
    try {
      const { tableName } = req.params;

      // Validate table exists
      const [tableExists] = await sequelize.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = :tableName
        );
      `, {
        replacements: { tableName }
      });

      if (!(tableExists as any)[0]?.exists) {
        res.status(404).json({
          success: false,
          message: 'Table not found'
        });
        return;
      }

      // Get table columns
      const [columnsResult] = await sequelize.query(`
        SELECT
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = :tableName
        ORDER BY ordinal_position;
      `, {
        replacements: { tableName }
      });

      // Get table stats
      const [statsResult] = await sequelize.query(`
        SELECT
          n_live_tup as row_count,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          last_vacuum,
          last_autovacuum,
          last_analyze,
          last_autoanalyze
        FROM pg_stat_user_tables
        WHERE schemaname = 'public'
        AND relname = :tableName;
      `, {
        replacements: { tableName }
      });

      // Get table size
      const [sizeResult] = await sequelize.query(`
        SELECT
          pg_size_pretty(pg_total_relation_size('public.' || :tableName)) as size,
          pg_total_relation_size('public.' || :tableName) as size_bytes
      `, {
        replacements: { tableName }
      });

      res.status(200).json({
        success: true,
        data: {
          table_name: tableName,
          columns: columnsResult,
          stats: (statsResult as any)[0] || {},
          size: (sizeResult as any)[0] || {},
        }
      });
    } catch (error) {
      logger.error(`Error fetching table info for ${req.params.tableName}:`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch table information',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get database health status
   */
  static async getDatabaseHealth(req: Request, res: Response): Promise<void> {
    try {
      // Test database connection
      await sequelize.authenticate();

      // Get cache hit ratio
      const [cacheHitResult] = await sequelize.query(`
        SELECT
          ROUND(100.0 * sum(blks_hit) / NULLIF(sum(blks_hit + blks_read), 0), 2) as cache_hit_ratio
        FROM pg_stat_database
        WHERE datname = current_database();
      `);
      const cacheHitRatio = (cacheHitResult as any)[0]?.cache_hit_ratio || 0;

      // Get index usage
      const [indexUsageResult] = await sequelize.query(`
        SELECT
          ROUND(100.0 * sum(idx_scan) / NULLIF(sum(idx_scan + seq_scan), 0), 2) as index_usage_ratio
        FROM pg_stat_user_tables;
      `);
      const indexUsageRatio = (indexUsageResult as any)[0]?.index_usage_ratio || 0;

      // Get table bloat info
      const [bloatResult] = await sequelize.query(`
        SELECT
          COUNT(*) as tables_needing_vacuum
        FROM pg_stat_user_tables
        WHERE n_dead_tup > 1000;
      `);
      const tablesNeedingVacuum = parseInt((bloatResult as any)[0]?.tables_needing_vacuum || '0');

      // Get long running queries
      const [longQueriesResult] = await sequelize.query(`
        SELECT COUNT(*) as long_queries
        FROM pg_stat_activity
        WHERE state = 'active'
        AND query_start < NOW() - INTERVAL '5 minutes'
        AND query NOT LIKE '%pg_stat_activity%';
      `);
      const longQueries = parseInt((longQueriesResult as any)[0]?.long_queries || '0');

      // Calculate overall health score
      let healthScore = 100;
      if (cacheHitRatio < 90) healthScore -= 10;
      if (cacheHitRatio < 80) healthScore -= 10;
      if (indexUsageRatio < 70) healthScore -= 10;
      if (tablesNeedingVacuum > 5) healthScore -= 15;
      if (longQueries > 0) healthScore -= 10;

      const status = healthScore >= 80 ? 'healthy' : healthScore >= 60 ? 'warning' : 'critical';

      res.status(200).json({
        success: true,
        data: {
          status,
          health_score: healthScore,
          metrics: {
            cache_hit_ratio: parseFloat(cacheHitRatio) || 0,
            index_usage_ratio: parseFloat(indexUsageRatio) || 0,
            tables_needing_vacuum: tablesNeedingVacuum,
            long_running_queries: longQueries,
          },
          recommendations: getHealthRecommendations(cacheHitRatio, indexUsageRatio, tablesNeedingVacuum, longQueries)
        }
      });
    } catch (error) {
      logger.error('Error checking database health:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check database health',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

// Helper function to format bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Helper function to get health recommendations
function getHealthRecommendations(
  cacheHitRatio: number,
  indexUsageRatio: number,
  tablesNeedingVacuum: number,
  longQueries: number
): string[] {
  const recommendations: string[] = [];

  if (parseFloat(cacheHitRatio as any) < 90) {
    recommendations.push('Consider increasing shared_buffers to improve cache hit ratio');
  }
  if (parseFloat(indexUsageRatio as any) < 70) {
    recommendations.push('Some queries might benefit from additional indexes');
  }
  if (tablesNeedingVacuum > 5) {
    recommendations.push('Run VACUUM ANALYZE on tables with high dead tuple counts');
  }
  if (longQueries > 0) {
    recommendations.push('Investigate and optimize long-running queries');
  }
  if (recommendations.length === 0) {
    recommendations.push('Database is performing well. Keep monitoring regularly.');
  }

  return recommendations;
}
