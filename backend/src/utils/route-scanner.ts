import { Express, Router } from 'express';

interface RouteInfo {
  method: string;
  path: string;
  name: string;
  requiresAuth: boolean;
}

/**
 * Extract all routes from Express app
 */
export function getAllRoutes(app: Express): RouteInfo[] {
  const routes: RouteInfo[] = [];
  const apiVersion = process.env.API_VERSION || 'v1';

  // Manually define routes based on our app structure
  // This is more reliable than trying to scan the Express stack
  const apiRoutes = [
    // Core APIs
    { method: 'GET', path: `/api/${apiVersion}/auth/profile`, name: 'Auth Profile', requiresAuth: true },
    { method: 'POST', path: `/api/${apiVersion}/auth/login`, name: 'Auth Login', requiresAuth: false },
    { method: 'POST', path: `/api/${apiVersion}/auth/register`, name: 'Auth Register', requiresAuth: false },

    // Categories
    { method: 'GET', path: `/api/${apiVersion}/categories`, name: 'List Categories', requiresAuth: false },
    { method: 'POST', path: `/api/${apiVersion}/categories`, name: 'Create Category', requiresAuth: true },

    // Products
    { method: 'GET', path: `/api/${apiVersion}/products`, name: 'List Products', requiresAuth: false },
    { method: 'POST', path: `/api/${apiVersion}/products`, name: 'Create Product', requiresAuth: true },
    { method: 'GET', path: `/api/${apiVersion}/products/stats`, name: 'Product Stats', requiresAuth: true },

    // Orders
    { method: 'GET', path: `/api/${apiVersion}/orders`, name: 'List Orders', requiresAuth: true },
    { method: 'POST', path: `/api/${apiVersion}/orders`, name: 'Create Order', requiresAuth: true },
    { method: 'GET', path: `/api/${apiVersion}/orders/stats`, name: 'Order Stats', requiresAuth: true },

    // Customers
    { method: 'GET', path: `/api/${apiVersion}/customers`, name: 'List Customers', requiresAuth: true },
    { method: 'POST', path: `/api/${apiVersion}/customers`, name: 'Create Customer', requiresAuth: true },

    // Inventory
    { method: 'GET', path: `/api/${apiVersion}/inventory`, name: 'List Inventory', requiresAuth: true },
    { method: 'GET', path: `/api/${apiVersion}/inventory/low-stock`, name: 'Low Stock Items', requiresAuth: true },

    // Warehouses
    { method: 'GET', path: `/api/${apiVersion}/warehouses`, name: 'List Warehouses', requiresAuth: true },

    // Analytics
    { method: 'GET', path: `/api/${apiVersion}/analytics/overview`, name: 'Analytics Overview', requiresAuth: true },
    { method: 'GET', path: `/api/${apiVersion}/analytics/sales`, name: 'Sales Analytics', requiresAuth: true },

    // Payment
    { method: 'POST', path: `/api/${apiVersion}/payment/process`, name: 'Process Payment', requiresAuth: true },

    // Upload
    { method: 'POST', path: `/api/${apiVersion}/upload`, name: 'Upload File', requiresAuth: true },

    // Homepage
    { method: 'GET', path: `/api/${apiVersion}/homepage`, name: 'Get Homepage', requiresAuth: false },
    { method: 'PUT', path: `/api/${apiVersion}/homepage`, name: 'Update Homepage', requiresAuth: true },

    // Blog
    { method: 'GET', path: `/api/${apiVersion}/blog`, name: 'List Blog Posts', requiresAuth: false },
    { method: 'POST', path: `/api/${apiVersion}/blog`, name: 'Create Blog Post', requiresAuth: true },

    // Database
    { method: 'GET', path: `/api/${apiVersion}/database/stats`, name: 'Database Stats', requiresAuth: true },
    { method: 'GET', path: `/api/${apiVersion}/database/health`, name: 'Database Health', requiresAuth: true },

    // API Status (this endpoint)
    { method: 'GET', path: `/api/${apiVersion}/api-status`, name: 'API Status', requiresAuth: true },
    { method: 'GET', path: `/api/${apiVersion}/api-status/metrics`, name: 'API Metrics', requiresAuth: true },

    // Health check
    { method: 'GET', path: '/health', name: 'Health Check', requiresAuth: false },
  ];

  return apiRoutes;
}

/**
 * Get categorized endpoints for monitoring
 */
export function getCategorizedEndpoints(): Array<{ name: string; endpoint: string; method: string; requiresAuth: boolean }> {
  const apiVersion = process.env.API_VERSION || 'v1';

  return [
    // System Health
    { name: 'Health Check', endpoint: '/health', method: 'GET', requiresAuth: false },
    { name: 'API Stats', endpoint: `/api/${apiVersion}/stats`, method: 'GET', requiresAuth: false },

    // Core APIs
    { name: 'Products API', endpoint: `/api/${apiVersion}/products`, method: 'GET', requiresAuth: false },
    { name: 'Product Stats', endpoint: `/api/${apiVersion}/products/stats`, method: 'GET', requiresAuth: true },
    { name: 'Categories API', endpoint: `/api/${apiVersion}/categories`, method: 'GET', requiresAuth: false },

    // Business Logic
    { name: 'Orders API', endpoint: `/api/${apiVersion}/orders`, method: 'GET', requiresAuth: true },
    { name: 'Order Stats', endpoint: `/api/${apiVersion}/orders/stats`, method: 'GET', requiresAuth: true },
    { name: 'Customers API', endpoint: `/api/${apiVersion}/customers`, method: 'GET', requiresAuth: true },

    // Inventory & Warehouse
    { name: 'Inventory API', endpoint: `/api/${apiVersion}/inventory`, method: 'GET', requiresAuth: true },
    { name: 'Low Stock Alert', endpoint: `/api/${apiVersion}/inventory/low-stock`, method: 'GET', requiresAuth: true },
    { name: 'Warehouses API', endpoint: `/api/${apiVersion}/warehouses`, method: 'GET', requiresAuth: true },

    // Analytics & Reports
    { name: 'Analytics Overview', endpoint: `/api/${apiVersion}/analytics/overview`, method: 'GET', requiresAuth: true },
    { name: 'Sales Analytics', endpoint: `/api/${apiVersion}/analytics/sales`, method: 'GET', requiresAuth: true },

    // Content Management
    { name: 'Homepage API', endpoint: `/api/${apiVersion}/homepage`, method: 'GET', requiresAuth: false },
    { name: 'Blog API', endpoint: `/api/${apiVersion}/blog`, method: 'GET', requiresAuth: false },

    // System Monitoring
    { name: 'Database Health', endpoint: `/api/${apiVersion}/database/health`, method: 'GET', requiresAuth: true },
    { name: 'Database Stats', endpoint: `/api/${apiVersion}/database/stats`, method: 'GET', requiresAuth: true },
    { name: 'Security Overview', endpoint: `/api/${apiVersion}/security/overview`, method: 'GET', requiresAuth: true },
    { name: 'API Status', endpoint: `/api/${apiVersion}/api-status`, method: 'GET', requiresAuth: true },

    // Settings
    { name: 'System Settings', endpoint: `/api/${apiVersion}/settings/system`, method: 'GET', requiresAuth: true },
    { name: 'User Preferences', endpoint: `/api/${apiVersion}/settings/preferences`, method: 'GET', requiresAuth: true },
  ];
}
