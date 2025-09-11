# Medical Electronics System - API Documentation

## Base URL
```
Development: http://localhost:3000/api/v1
Production: https://api.medical-electronics.com/api/v1
```

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## Response Format
All responses follow this format:
```json
{
  "success": true|false,
  "data": {},
  "message": "Optional message",
  "errors": []
}
```

## Endpoints

### Authentication

#### Register
```
POST /auth/register
```
**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+84901234567"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "customer"
    },
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

#### Login
```
POST /auth/login
```
**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Refresh Token
```
POST /auth/refresh-token
```
**Body:**
```json
{
  "refreshToken": "refresh_token"
}
```

#### Logout
```
POST /auth/logout
```
**Headers:** Authorization required

#### Change Password
```
POST /auth/change-password
```
**Headers:** Authorization required
**Body:**
```json
{
  "oldPassword": "current_password",
  "newPassword": "new_password"
}
```

#### Get Profile
```
GET /auth/profile
```
**Headers:** Authorization required

### Products

#### List Products
```
GET /products
```
**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 20, max: 100)
- `categoryId` (uuid): Filter by category
- `brandId` (uuid): Filter by brand
- `status` (string): Filter by status (active, inactive, draft, out_of_stock)
- `minPrice` (number): Minimum price filter
- `maxPrice` (number): Maximum price filter
- `tags` (string): Comma-separated tags
- `search` (string): Search term
- `sortBy` (string): Sort field (default: created_at)
- `sortOrder` (string): ASC or DESC (default: DESC)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "sku": "PROD001",
      "name": "Product Name",
      "slug": "product-name",
      "description": "Product description",
      "category_name": "Electronics",
      "brand_name": "Brand",
      "status": "active",
      "features": ["feature1", "feature2"],
      "tags": ["tag1", "tag2"],
      "warranty_months": 12,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalCount": 100,
    "totalPages": 5
  }
}
```

#### Search Products
```
GET /products/search
```
**Query Parameters:**
- `q` (string, required): Search query
- `limit` (integer): Maximum results (default: 10)

#### Get Product by ID
```
GET /products/:id
```
**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "sku": "PROD001",
    "name": "Product Name",
    "description": "Detailed description",
    "variants": [
      {
        "id": "uuid",
        "sku": "PROD001-BLK",
        "name": "Black",
        "price": 999000,
        "stock_quantity": 50,
        "is_default": true
      }
    ],
    "images": [
      {
        "id": "uuid",
        "url": "https://cdn.example.com/image.jpg",
        "alt_text": "Product image",
        "is_primary": true
      }
    ],
    "specifications": [
      {
        "name": "Weight",
        "value": "1.5 kg"
      }
    ]
  }
}
```

#### Create Product
```
POST /products
```
**Headers:** Authorization required (admin, manager)
**Body:**
```json
{
  "sku": "PROD001",
  "name": "Product Name",
  "description": "Product description",
  "categoryId": "uuid",
  "brandId": "uuid",
  "supplierId": "uuid",
  "price": 999000,
  "cost": 500000,
  "stockQuantity": 100,
  "features": ["feature1", "feature2"],
  "tags": ["tag1", "tag2"],
  "warrantyMonths": 12
}
```

#### Update Product
```
PUT /products/:id
```
**Headers:** Authorization required (admin, manager)
**Body:** Any product fields to update

#### Delete Product
```
DELETE /products/:id
```
**Headers:** Authorization required (admin)

#### Create Product Variant
```
POST /products/:id/variants
```
**Headers:** Authorization required (admin, manager)
**Body:**
```json
{
  "sku": "PROD001-VAR",
  "barcode": "1234567890123",
  "name": "Variant Name",
  "attributes": {
    "color": "Red",
    "size": "Large"
  },
  "price": 1099000,
  "cost": 550000,
  "stockQuantity": 50
}
```

### Orders

#### List Orders
```
GET /orders
```
**Headers:** Authorization required
**Query Parameters:**
- `page` (integer): Page number
- `limit` (integer): Items per page
- `status` (string): Filter by status
- `customerId` (uuid): Filter by customer
- `dateFrom` (date): Start date filter
- `dateTo` (date): End date filter

#### Get Order by ID
```
GET /orders/:id
```
**Headers:** Authorization required

#### Create Order
```
POST /orders
```
**Headers:** Authorization required
**Body:**
```json
{
  "items": [
    {
      "variantId": "uuid",
      "quantity": 2
    }
  ],
  "shippingAddressId": "uuid",
  "billingAddressId": "uuid",
  "paymentMethod": "card",
  "notes": "Special instructions"
}
```

#### Update Order Status
```
PATCH /orders/:id/status
```
**Headers:** Authorization required (admin, manager, staff)
**Body:**
```json
{
  "status": "confirmed"
}
```

### Customers

#### List Customers
```
GET /customers
```
**Headers:** Authorization required (admin, manager, staff)
**Query Parameters:**
- `page` (integer): Page number
- `limit` (integer): Items per page
- `search` (string): Search by name, email, or phone
- `tier` (string): Filter by tier

#### Get Customer by ID
```
GET /customers/:id
```
**Headers:** Authorization required (admin, manager, staff)

#### Update Customer
```
PUT /customers/:id
```
**Headers:** Authorization required (admin, manager)

### Inventory

#### Get Inventory
```
GET /inventory
```
**Headers:** Authorization required (admin, manager, staff)
**Query Parameters:**
- `warehouseId` (uuid): Filter by warehouse
- `variantId` (uuid): Filter by product variant
- `lowStock` (boolean): Show only low stock items

#### Get Low Stock Items
```
GET /inventory/low-stock
```
**Headers:** Authorization required (admin, manager)

#### Adjust Inventory
```
POST /inventory/adjust
```
**Headers:** Authorization required (admin, manager)
**Body:**
```json
{
  "warehouseId": "uuid",
  "variantId": "uuid",
  "quantity": 10,
  "type": "adjustment",
  "notes": "Reason for adjustment"
}
```

#### Transfer Inventory
```
POST /inventory/transfer
```
**Headers:** Authorization required (admin, manager)
**Body:**
```json
{
  "fromWarehouseId": "uuid",
  "toWarehouseId": "uuid",
  "variantId": "uuid",
  "quantity": 20,
  "notes": "Transfer reason"
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation error |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

## Rate Limiting

API requests are limited to:
- 100 requests per 15 minutes for authenticated users
- 30 requests per 15 minutes for unauthenticated users

Rate limit headers:
- `X-RateLimit-Limit`: Request limit
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset timestamp

## Pagination

All list endpoints support pagination with these parameters:
- `page`: Page number (starts from 1)
- `limit`: Items per page (max 100)

Response includes pagination metadata:
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalCount": 100,
    "totalPages": 5
  }
}
```

## Webhooks (Coming Soon)

Webhooks will be available for:
- Order status changes
- Low stock alerts
- Payment confirmations
- Customer registrations

## SDKs (Coming Soon)

Official SDKs will be available for:
- JavaScript/TypeScript
- Python
- PHP
- Java

## Support

For API support, contact:
- Email: api-support@medical-electronics.com
- Documentation: https://docs.medical-electronics.com
- Status Page: https://status.medical-electronics.com