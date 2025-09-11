import { Pool } from 'pg';
import pool from '../config/database';
import logger from '../utils/logger';

interface PaginationOptions {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'ASC' | 'DESC';
}

interface QueryStats {
  executionTime: number;
  rowCount: number;
  cached: boolean;
}

class QueryOptimizerService {
  private queryStats: Map<string, QueryStats[]> = new Map();
  
  // Build optimized pagination query
  buildPaginationQuery(
    baseQuery: string,
    options: PaginationOptions,
    allowedSortFields: string[] = []
  ): { query: string; offset: number; limit: number } {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const offset = (page - 1) * limit;
    
    let query = baseQuery;
    
    // Add sorting if specified and allowed
    if (options.sort && allowedSortFields.includes(options.sort)) {
      const order = options.order || 'ASC';
      query += ` ORDER BY ${options.sort} ${order}`;
    }
    
    // Add pagination
    query += ` LIMIT $1 OFFSET $2`;
    
    return { query, offset, limit };
  }
  
  // Execute query with statistics tracking
  async executeWithStats<T>(
    query: string,
    params: any[] = [],
    queryName?: string
  ): Promise<{ rows: T[]; stats: QueryStats }> {
    const startTime = Date.now();
    
    try {
      const result = await pool.query(query, params);
      const executionTime = Date.now() - startTime;
      
      const stats: QueryStats = {
        executionTime,
        rowCount: result.rowCount || 0,
        cached: false
      };
      
      // Track query statistics
      if (queryName) {
        const existingStats = this.queryStats.get(queryName) || [];
        existingStats.push(stats);
        // Keep only last 100 stats
        if (existingStats.length > 100) {
          existingStats.shift();
        }
        this.queryStats.set(queryName, existingStats);
        
        // Log slow queries
        if (executionTime > 1000) {
          logger.warn(`Slow query detected: ${queryName} took ${executionTime}ms`);
        }
      }
      
      return { rows: result.rows, stats };
    } catch (error) {
      logger.error('Query execution error:', error);
      throw error;
    }
  }
  
  // Batch insert optimization
  async batchInsert(
    tableName: string,
    columns: string[],
    values: any[][],
    batchSize: number = 1000
  ): Promise<number> {
    let totalInserted = 0;
    
    for (let i = 0; i < values.length; i += batchSize) {
      const batch = values.slice(i, i + batchSize);
      const placeholders = batch.map((_, rowIndex) => 
        `(${columns.map((_, colIndex) => 
          `$${rowIndex * columns.length + colIndex + 1}`
        ).join(', ')})`
      ).join(', ');
      
      const query = `
        INSERT INTO ${tableName} (${columns.join(', ')})
        VALUES ${placeholders}
        ON CONFLICT DO NOTHING
      `;
      
      const flatValues = batch.flat();
      const result = await pool.query(query, flatValues);
      totalInserted += result.rowCount || 0;
    }
    
    return totalInserted;
  }
  
  // Build dynamic WHERE clause with parameterized queries
  buildWhereClause(
    conditions: Record<string, any>,
    allowedFields: string[],
    startParamIndex: number = 1
  ): { whereClause: string; params: any[]; nextParamIndex: number } {
    const whereParts: string[] = [];
    const params: any[] = [];
    let paramIndex = startParamIndex;
    
    for (const [field, value] of Object.entries(conditions)) {
      if (!allowedFields.includes(field) || value === undefined || value === null) {
        continue;
      }
      
      if (Array.isArray(value)) {
        // Handle IN clause
        const placeholders = value.map(() => `$${paramIndex++}`).join(', ');
        whereParts.push(`${field} IN (${placeholders})`);
        params.push(...value);
      } else if (typeof value === 'object' && value !== null) {
        // Handle range queries
        if (value.min !== undefined) {
          whereParts.push(`${field} >= $${paramIndex++}`);
          params.push(value.min);
        }
        if (value.max !== undefined) {
          whereParts.push(`${field} <= $${paramIndex++}`);
          params.push(value.max);
        }
      } else if (typeof value === 'string' && value.includes('%')) {
        // Handle LIKE queries
        whereParts.push(`${field} ILIKE $${paramIndex++}`);
        params.push(value);
      } else {
        // Handle exact match
        whereParts.push(`${field} = $${paramIndex++}`);
        params.push(value);
      }
    }
    
    const whereClause = whereParts.length > 0 
      ? `WHERE ${whereParts.join(' AND ')}` 
      : '';
    
    return { whereClause, params, nextParamIndex: paramIndex };
  }
  
  // Create database indexes for optimization
  async createIndexes(): Promise<void> {
    const indexes = [
      // Products indexes
      'CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku)',
      'CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)',
      'CREATE INDEX IF NOT EXISTS idx_products_price ON products(price)',
      'CREATE INDEX IF NOT EXISTS idx_products_status ON products(status)',
      'CREATE INDEX IF NOT EXISTS idx_products_search ON products USING gin(to_tsvector(\'english\', name || \' \' || COALESCE(description, \'\')))',
      
      // Orders indexes
      'CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id)',
      'CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)',
      'CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(created_at DESC)',
      'CREATE INDEX IF NOT EXISTS idx_orders_payment ON orders(payment_status)',
      
      // Order items indexes
      'CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id)',
      'CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id)',
      
      // Inventory indexes
      'CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id)',
      'CREATE INDEX IF NOT EXISTS idx_inventory_warehouse ON inventory(warehouse_id)',
      'CREATE INDEX IF NOT EXISTS idx_inventory_low_stock ON inventory(quantity) WHERE quantity < reorder_point',
      
      // Users indexes
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)',
      
      // Customers indexes
      'CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email)',
      'CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone)',
      
      // Analytics indexes
      'CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics_events(created_at DESC)',
      'CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type)',
      'CREATE INDEX IF NOT EXISTS idx_analytics_user ON analytics_events(user_id)'
    ];
    
    for (const indexQuery of indexes) {
      try {
        await pool.query(indexQuery);
        logger.info(`Index created/verified: ${indexQuery.match(/idx_\w+/)?.[0]}`);
      } catch (error) {
        logger.error(`Error creating index: ${error}`);
      }
    }
  }
  
  // Get query performance statistics
  getQueryStats(queryName?: string): Record<string, any> {
    if (queryName) {
      const stats = this.queryStats.get(queryName);
      if (!stats || stats.length === 0) {
        return { message: 'No statistics available for this query' };
      }
      
      const avgTime = stats.reduce((sum, s) => sum + s.executionTime, 0) / stats.length;
      const maxTime = Math.max(...stats.map(s => s.executionTime));
      const minTime = Math.min(...stats.map(s => s.executionTime));
      
      return {
        queryName,
        executionCount: stats.length,
        averageTime: `${avgTime.toFixed(2)}ms`,
        maxTime: `${maxTime}ms`,
        minTime: `${minTime}ms`,
        lastExecution: stats[stats.length - 1]
      };
    }
    
    // Return all stats
    const allStats: Record<string, any> = {};
    for (const [name, stats] of this.queryStats.entries()) {
      if (stats.length > 0) {
        const avgTime = stats.reduce((sum, s) => sum + s.executionTime, 0) / stats.length;
        allStats[name] = {
          executionCount: stats.length,
          averageTime: `${avgTime.toFixed(2)}ms`
        };
      }
    }
    
    return allStats;
  }
  
  // Connection pool optimization
  async optimizeConnectionPool(): Promise<void> {
    // Get current pool stats
    const poolStats = {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount
    };
    
    logger.info('Connection pool stats:', poolStats);
    
    // Adjust pool size if needed
    if (poolStats.waitingCount > 5) {
      logger.warn('High number of waiting connections, consider increasing pool size');
    }
  }
}

export const queryOptimizer = new QueryOptimizerService();

// Initialize indexes on startup
queryOptimizer.createIndexes().catch(error => {
  logger.error('Failed to create indexes:', error);
});