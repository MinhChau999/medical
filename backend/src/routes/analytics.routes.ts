import { Router } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const analyticsService = new AnalyticsService();

// All analytics routes require authentication and admin/manager role
router.use(authenticate);
router.use(authorize(['admin', 'manager']));

// Sales metrics
router.get('/sales/metrics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateRange = startDate && endDate ? {
      startDate: new Date(startDate as string),
      endDate: new Date(endDate as string),
    } : undefined;

    const metrics = await analyticsService.getSalesMetrics(dateRange);
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching sales metrics:', error);
    res.status(500).json({ error: 'Failed to fetch sales metrics' });
  }
});

// Sales trend
router.get('/sales/trend', async (req, res) => {
  try {
    const { period = 'daily' } = req.query;
    const trend = await analyticsService.getSalesTrend(period as 'daily' | 'weekly' | 'monthly');
    res.json(trend);
  } catch (error) {
    console.error('Error fetching sales trend:', error);
    res.status(500).json({ error: 'Failed to fetch sales trend' });
  }
});

// Product metrics
router.get('/products/metrics', async (req, res) => {
  try {
    const metrics = await analyticsService.getProductMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching product metrics:', error);
    res.status(500).json({ error: 'Failed to fetch product metrics' });
  }
});

// Customer metrics
router.get('/customers/metrics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateRange = startDate && endDate ? {
      startDate: new Date(startDate as string),
      endDate: new Date(endDate as string),
    } : undefined;

    const metrics = await analyticsService.getCustomerMetrics(dateRange);
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching customer metrics:', error);
    res.status(500).json({ error: 'Failed to fetch customer metrics' });
  }
});

// Inventory turnover
router.get('/inventory/turnover', async (req, res) => {
  try {
    const turnover = await analyticsService.getInventoryTurnover();
    res.json(turnover);
  } catch (error) {
    console.error('Error fetching inventory turnover:', error);
    res.status(500).json({ error: 'Failed to fetch inventory turnover' });
  }
});

// Revenue by channel
router.get('/revenue/by-channel', async (req, res) => {
  try {
    const revenue = await analyticsService.getRevenueByChannel();
    res.json(revenue);
  } catch (error) {
    console.error('Error fetching revenue by channel:', error);
    res.status(500).json({ error: 'Failed to fetch revenue by channel' });
  }
});

// Order status distribution
router.get('/orders/status-distribution', async (req, res) => {
  try {
    const distribution = await analyticsService.getOrderStatusDistribution();
    res.json(distribution);
  } catch (error) {
    console.error('Error fetching order status distribution:', error);
    res.status(500).json({ error: 'Failed to fetch order status distribution' });
  }
});

// Hourly order pattern
router.get('/orders/hourly-pattern', async (req, res) => {
  try {
    const pattern = await analyticsService.getHourlyOrderPattern();
    res.json(pattern);
  } catch (error) {
    console.error('Error fetching hourly order pattern:', error);
    res.status(500).json({ error: 'Failed to fetch hourly order pattern' });
  }
});

// Generate sales report
router.post('/reports/sales', async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const report = await analyticsService.generateSalesReport(
      new Date(startDate),
      new Date(endDate)
    );
    res.json(report);
  } catch (error) {
    console.error('Error generating sales report:', error);
    res.status(500).json({ error: 'Failed to generate sales report' });
  }
});

// Generate inventory report
router.post('/reports/inventory', async (req, res) => {
  try {
    const report = await analyticsService.generateInventoryReport();
    res.json(report);
  } catch (error) {
    console.error('Error generating inventory report:', error);
    res.status(500).json({ error: 'Failed to generate inventory report' });
  }
});

// Export report to CSV
router.post('/reports/export', async (req, res) => {
  try {
    const { reportType, data } = req.body;
    const csv = await analyticsService.exportReportToCSV(reportType, data);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${reportType}-report-${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting report:', error);
    res.status(500).json({ error: 'Failed to export report' });
  }
});

export default router;