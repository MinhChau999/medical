import pool from '../config/database';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subDays, subMonths } from 'date-fns';

interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface SalesMetrics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalCustomers: number;
  returningCustomers: number;
  conversionRate: number;
}

interface ProductMetrics {
  topProducts: any[];
  lowStockProducts: any[];
  productsByCategory: any[];
  inventoryValue: number;
}

export class AnalyticsService {
  async getSalesMetrics(dateRange?: DateRange): Promise<SalesMetrics> {
    const { startDate, endDate } = dateRange || this.getCurrentMonthRange();
    
    const salesQuery = await pool.query(
      `SELECT 
        COUNT(DISTINCT o.id) as total_orders,
        SUM(o.total_amount) as total_revenue,
        AVG(o.total_amount) as avg_order_value,
        COUNT(DISTINCT o.customer_id) as total_customers
       FROM orders o
       WHERE o.created_at BETWEEN $1 AND $2
         AND o.status NOT IN ('cancelled', 'refunded')`,
      [startDate, endDate]
    );

    const returningQuery = await pool.query(
      `SELECT COUNT(DISTINCT customer_id) as returning_customers
       FROM (
         SELECT customer_id, COUNT(*) as order_count
         FROM orders
         WHERE created_at BETWEEN $1 AND $2
           AND status NOT IN ('cancelled', 'refunded')
         GROUP BY customer_id
         HAVING COUNT(*) > 1
       ) as repeat_customers`,
      [startDate, endDate]
    );

    const visitsQuery = await pool.query(
      `SELECT COUNT(DISTINCT session_id) as total_visits
       FROM user_sessions
       WHERE created_at BETWEEN $1 AND $2`,
      [startDate, endDate]
    );

    const metrics = salesQuery.rows[0];
    const returning = returningQuery.rows[0];
    const visits = visitsQuery.rows[0];

    return {
      totalRevenue: parseFloat(metrics.total_revenue) || 0,
      totalOrders: parseInt(metrics.total_orders) || 0,
      averageOrderValue: parseFloat(metrics.avg_order_value) || 0,
      totalCustomers: parseInt(metrics.total_customers) || 0,
      returningCustomers: parseInt(returning.returning_customers) || 0,
      conversionRate: visits.total_visits > 0 
        ? (metrics.total_orders / visits.total_visits) * 100 
        : 0,
    };
  }

  async getSalesTrend(period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<any[]> {
    const endDate = new Date();
    let startDate: Date;
    let groupBy: string;
    let dateFormat: string;

    switch (period) {
      case 'daily':
        startDate = subDays(endDate, 30);
        groupBy = "DATE(created_at)";
        dateFormat = "DATE(created_at)";
        break;
      case 'weekly':
        startDate = subMonths(endDate, 3);
        groupBy = "DATE_TRUNC('week', created_at)";
        dateFormat = "DATE_TRUNC('week', created_at)";
        break;
      case 'monthly':
        startDate = subMonths(endDate, 12);
        groupBy = "DATE_TRUNC('month', created_at)";
        dateFormat = "DATE_TRUNC('month', created_at)";
        break;
    }

    const result = await pool.query(
      `SELECT 
        ${dateFormat} as date,
        COUNT(*) as orders,
        SUM(total_amount) as revenue,
        AVG(total_amount) as avg_order_value
       FROM orders
       WHERE created_at BETWEEN $1 AND $2
         AND status NOT IN ('cancelled', 'refunded')
       GROUP BY ${groupBy}
       ORDER BY date ASC`,
      [startDate, endDate]
    );

    return result.rows;
  }

  async getProductMetrics(): Promise<ProductMetrics> {
    const topProductsQuery = await pool.query(
      `SELECT 
        p.id,
        p.name,
        p.sku,
        SUM(oi.quantity) as total_sold,
        SUM(oi.quantity * oi.price) as total_revenue,
        COUNT(DISTINCT oi.order_id) as order_count
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       JOIN orders o ON oi.order_id = o.id
       WHERE o.created_at >= NOW() - INTERVAL '30 days'
         AND o.status NOT IN ('cancelled', 'refunded')
       GROUP BY p.id, p.name, p.sku
       ORDER BY total_sold DESC
       LIMIT 10`
    );

    const lowStockQuery = await pool.query(
      `SELECT 
        p.id,
        p.name,
        p.sku,
        i.quantity as current_stock,
        i.low_stock_threshold,
        (i.quantity::float / NULLIF(i.low_stock_threshold, 0)) as stock_ratio
       FROM products p
       JOIN inventory i ON p.id = i.product_id
       WHERE i.quantity <= i.low_stock_threshold * 1.5
       ORDER BY stock_ratio ASC
       LIMIT 20`
    );

    const categoryQuery = await pool.query(
      `SELECT 
        c.name as category,
        COUNT(DISTINCT p.id) as product_count,
        SUM(i.quantity) as total_stock,
        SUM(i.quantity * p.price) as inventory_value
       FROM products p
       JOIN categories c ON p.category_id = c.id
       LEFT JOIN inventory i ON p.id = i.product_id
       GROUP BY c.id, c.name
       ORDER BY inventory_value DESC`
    );

    const inventoryValueQuery = await pool.query(
      `SELECT SUM(i.quantity * p.price) as total_value
       FROM inventory i
       JOIN products p ON i.product_id = p.id`
    );

    return {
      topProducts: topProductsQuery.rows,
      lowStockProducts: lowStockQuery.rows,
      productsByCategory: categoryQuery.rows,
      inventoryValue: parseFloat(inventoryValueQuery.rows[0]?.total_value) || 0,
    };
  }

  async getCustomerMetrics(dateRange?: DateRange): Promise<any> {
    const { startDate, endDate } = dateRange || this.getCurrentMonthRange();

    const newCustomersQuery = await pool.query(
      `SELECT 
        COUNT(*) as new_customers,
        AVG(EXTRACT(EPOCH FROM (first_order.order_date - u.created_at))/86400) as avg_days_to_first_order
       FROM users u
       LEFT JOIN (
         SELECT customer_id, MIN(created_at) as order_date
         FROM orders
         GROUP BY customer_id
       ) first_order ON u.id = first_order.customer_id
       WHERE u.created_at BETWEEN $1 AND $2
         AND u.role = 'customer'`,
      [startDate, endDate]
    );

    const customerValueQuery = await pool.query(
      `SELECT 
        AVG(customer_total) as avg_customer_value,
        MAX(customer_total) as max_customer_value,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY customer_total) as median_customer_value
       FROM (
         SELECT customer_id, SUM(total_amount) as customer_total
         FROM orders
         WHERE status NOT IN ('cancelled', 'refunded')
         GROUP BY customer_id
       ) as customer_totals`
    );

    const segmentationQuery = await pool.query(
      `SELECT 
        CASE 
          WHEN order_count = 1 THEN 'One-time'
          WHEN order_count BETWEEN 2 AND 5 THEN 'Regular'
          WHEN order_count > 5 THEN 'VIP'
        END as segment,
        COUNT(*) as customer_count,
        AVG(total_spent) as avg_spent
       FROM (
         SELECT 
           customer_id,
           COUNT(*) as order_count,
           SUM(total_amount) as total_spent
         FROM orders
         WHERE status NOT IN ('cancelled', 'refunded')
         GROUP BY customer_id
       ) as customer_stats
       GROUP BY segment`
    );

    return {
      newCustomers: newCustomersQuery.rows[0],
      customerValue: customerValueQuery.rows[0],
      segmentation: segmentationQuery.rows,
    };
  }

  async getInventoryTurnover(): Promise<any> {
    const result = await pool.query(
      `WITH inventory_movements AS (
        SELECT 
          product_id,
          SUM(CASE WHEN type = 'out' THEN quantity ELSE 0 END) as total_sold,
          AVG(CASE WHEN type = 'in' THEN quantity ELSE 0 END) as avg_stock
        FROM inventory_transactions
        WHERE created_at >= NOW() - INTERVAL '90 days'
        GROUP BY product_id
      )
      SELECT 
        p.name,
        p.sku,
        im.total_sold,
        i.quantity as current_stock,
        CASE 
          WHEN i.quantity > 0 THEN (im.total_sold::float / i.quantity) * 4
          ELSE 0
        END as turnover_rate
      FROM products p
      JOIN inventory i ON p.id = i.product_id
      LEFT JOIN inventory_movements im ON p.id = im.product_id
      ORDER BY turnover_rate DESC`
    );

    return result.rows;
  }

  async getRevenueByChannel(): Promise<any[]> {
    const result = await pool.query(
      `SELECT 
        sales_channel,
        COUNT(*) as order_count,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as avg_order_value
       FROM orders
       WHERE created_at >= NOW() - INTERVAL '30 days'
         AND status NOT IN ('cancelled', 'refunded')
       GROUP BY sales_channel
       ORDER BY total_revenue DESC`
    );

    return result.rows;
  }

  async getOrderStatusDistribution(): Promise<any[]> {
    const result = await pool.query(
      `SELECT 
        status,
        COUNT(*) as count,
        SUM(total_amount) as total_value
       FROM orders
       WHERE created_at >= NOW() - INTERVAL '30 days'
       GROUP BY status
       ORDER BY count DESC`
    );

    return result.rows;
  }

  async getHourlyOrderPattern(): Promise<any[]> {
    const result = await pool.query(
      `SELECT 
        EXTRACT(HOUR FROM created_at) as hour,
        COUNT(*) as order_count,
        AVG(total_amount) as avg_value
       FROM orders
       WHERE created_at >= NOW() - INTERVAL '7 days'
         AND status NOT IN ('cancelled', 'refunded')
       GROUP BY hour
       ORDER BY hour`
    );

    return result.rows;
  }

  async generateSalesReport(startDate: Date, endDate: Date): Promise<any> {
    const [metrics, trend, products, customers, revenue] = await Promise.all([
      this.getSalesMetrics({ startDate, endDate }),
      this.getSalesTrend('daily'),
      this.getProductMetrics(),
      this.getCustomerMetrics({ startDate, endDate }),
      this.getRevenueByChannel(),
    ]);

    return {
      period: { startDate, endDate },
      summary: metrics,
      trend,
      products,
      customers,
      revenueByChannel: revenue,
      generatedAt: new Date(),
    };
  }

  async generateInventoryReport(): Promise<any> {
    const [products, turnover, lowStock] = await Promise.all([
      this.getProductMetrics(),
      this.getInventoryTurnover(),
      pool.query(
        `SELECT COUNT(*) as count
         FROM inventory
         WHERE quantity <= low_stock_threshold`
      ),
    ]);

    return {
      totalValue: products.inventoryValue,
      lowStockCount: parseInt(lowStock.rows[0].count),
      topProducts: products.topProducts,
      lowStockProducts: products.lowStockProducts,
      categoryBreakdown: products.productsByCategory,
      turnoverRates: turnover,
      generatedAt: new Date(),
    };
  }

  async exportReportToCSV(reportType: string, data: any): Promise<string> {
    let csv = '';
    
    switch (reportType) {
      case 'sales':
        csv = this.generateSalesCSV(data);
        break;
      case 'inventory':
        csv = this.generateInventoryCSV(data);
        break;
      case 'customers':
        csv = this.generateCustomersCSV(data);
        break;
      default:
        throw new Error('Invalid report type');
    }

    return csv;
  }

  private generateSalesCSV(data: any): string {
    const headers = ['Date', 'Orders', 'Revenue', 'Avg Order Value'];
    const rows = data.trend.map((row: any) => [
      row.date,
      row.orders,
      row.revenue,
      row.avg_order_value,
    ]);

    return this.arrayToCSV([headers, ...rows]);
  }

  private generateInventoryCSV(data: any): string {
    const headers = ['Product', 'SKU', 'Current Stock', 'Turnover Rate'];
    const rows = data.turnoverRates.map((row: any) => [
      row.name,
      row.sku,
      row.current_stock,
      row.turnover_rate,
    ]);

    return this.arrayToCSV([headers, ...rows]);
  }

  private generateCustomersCSV(data: any): string {
    const headers = ['Segment', 'Customer Count', 'Avg Spent'];
    const rows = data.segmentation.map((row: any) => [
      row.segment,
      row.customer_count,
      row.avg_spent,
    ]);

    return this.arrayToCSV([headers, ...rows]);
  }

  private arrayToCSV(data: any[][]): string {
    return data.map(row => 
      row.map(cell => 
        typeof cell === 'string' && cell.includes(',') 
          ? `"${cell}"` 
          : cell
      ).join(',')
    ).join('\n');
  }

  private getCurrentMonthRange(): DateRange {
    return {
      startDate: startOfMonth(new Date()),
      endDate: endOfMonth(new Date()),
    };
  }
}