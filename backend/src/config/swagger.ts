import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Medical Electronics API',
      version: '1.0.0',
      description: 'Complete API documentation for Medical Electronics System',
      contact: {
        name: 'API Support',
        email: 'api@medical-electronics.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api/v1',
        description: 'Development server'
      },
      {
        url: 'https://api.medical-electronics.com/v1',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            details: { type: 'array' }
          }
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            sku: { type: 'string' },
            price: { type: 'number' },
            category_id: { type: 'integer' },
            description: { type: 'string' },
            stock_quantity: { type: 'integer' },
            images: { type: 'array', items: { type: 'string' } },
            status: { type: 'string', enum: ['active', 'inactive'] },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Order: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            customer_id: { type: 'integer' },
            order_number: { type: 'string' },
            total_amount: { type: 'number' },
            status: { type: 'string', enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] },
            payment_status: { type: 'string', enum: ['pending', 'paid', 'failed', 'refunded'] },
            payment_method: { type: 'string' },
            shipping_address: { type: 'string' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  product_id: { type: 'integer' },
                  quantity: { type: 'integer' },
                  price: { type: 'number' }
                }
              }
            },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            email: { type: 'string' },
            full_name: { type: 'string' },
            role: { type: 'string', enum: ['admin', 'manager', 'cashier', 'customer'] },
            phone: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
            totalPages: { type: 'integer' }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts']
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
  // Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Medical Electronics API Documentation',
    customfavIcon: '/favicon.ico'
  }));

  // JSON format for API documentation
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};

export default swaggerSpec;