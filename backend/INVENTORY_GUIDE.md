# 📦 Inventory Management System Guide

## 📚 Mục lục

- [Tổng quan](#tổng-quan)
- [Kiến trúc hệ thống](#kiến-trúc-hệ-thống)
- [Database Schema](#database-schema)
- [Triggers & Views](#triggers--views)
- [API Service](#api-service)
- [Ví dụ sử dụng](#ví-dụ-sử-dụng)
- [Best Practices](#best-practices)

---

## 🎯 Tổng quan

Hệ thống quản lý tồn kho của Medical sử dụng kiến trúc **3 bảng** để quản lý sản phẩm và tồn kho:

```
products (Catalog)
  ↓
product_variants (Pricing & SKU)
  ↓
inventory (Warehouse Stock)
```

### Lợi ích:
- ✅ **Multi-warehouse support** - Quản lý tồn kho nhiều kho
- ✅ **Auto-sync triggers** - Tự động đồng bộ stock
- ✅ **Stock reservation** - Giữ hàng khi đặt đơn
- ✅ **Low stock alerts** - Cảnh báo sắp hết hàng
- ✅ **Validation** - Ngăn chặn số âm, reserved > quantity

---

## 🏗️ Kiến trúc hệ thống

### 1. **Products** (Catalog Layer)
**Vai trò**: Thông tin mô tả sản phẩm

```sql
products
├── id, sku, name, slug
├── description, features, tags
├── category_id, brand_id, supplier_id
├── weight, dimensions, warranty
└── SEO: seo_title, seo_description, seo_keywords
```

**Đặc điểm**:
- ❌ KHÔNG có giá
- ❌ KHÔNG có số lượng tồn kho
- ✅ Chỉ có thông tin mô tả

**Ví dụ**:
```
Product: "Paracetamol Tablet"
- Description: "Pain relief medication"
- Category: "Pharmaceuticals"
- Brand: "ABC Pharma"
```

---

### 2. **Product Variants** (Pricing & SKU Layer)
**Vai trò**: Các phiên bản khác nhau của sản phẩm

```sql
product_variants
├── id, product_id, sku, barcode
├── name, attributes (size, color, dosage...)
├── price, cost, compare_at_price
├── stock_quantity, reserved_quantity  ← Tự động tính từ inventory
├── low_stock_threshold
└── is_default, is_active
```

**Đặc điểm**:
- ✅ Có giá bán
- ✅ Có `stock_quantity` (tổng hợp từ inventory)
- ✅ Mỗi variant có SKU riêng

**Ví dụ**:
```
Variant 1: "Paracetamol 500mg - Hộp 10 viên"
├── SKU: MED-001-V1
├── Price: 15,000₫
└── Stock: 1,000 (tổng từ tất cả kho)

Variant 2: "Paracetamol 500mg - Hộp 100 viên"
├── SKU: MED-001-V2
├── Price: 120,000₫
└── Stock: 500 (tổng từ tất cả kho)
```

---

### 3. **Inventory** (Warehouse Layer)
**Vai trò**: Tồn kho thực tế tại từng kho

```sql
inventory
├── id
├── warehouse_id        ← Kho nào?
├── variant_id          ← Sản phẩm nào?
├── quantity            ← Số lượng có sẵn
├── reserved_quantity   ← Số lượng đã giữ
└── last_restocked_at
```

**Công thức**:
```
Available = quantity - reserved_quantity
Total stock = SUM(quantity) across all warehouses
```

**Ví dụ**:
```
Variant: "Paracetamol 500mg - Hộp 10 viên"
├── Kho Hà Nội:   quantity: 500, reserved: 50  → available: 450
├── Kho TP.HCM:   quantity: 300, reserved: 20  → available: 280
├── Kho Đà Nẵng:  quantity: 200, reserved: 10  → available: 190
└── TOTAL:        quantity: 1000, reserved: 80 → available: 920
```

---

## 📊 Database Schema

### Warehouses (Kho)

```sql
CREATE TABLE warehouses (
  id UUID PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,      -- WH001, WH002...
  name VARCHAR(100) NOT NULL,             -- "Kho Hà Nội"
  address TEXT,
  phone VARCHAR(20),
  manager_id UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Dữ liệu mẫu**:
```sql
INSERT INTO warehouses (code, name, address) VALUES
  ('WH001', 'Main Warehouse', 'Hà Nội'),
  ('WH002', 'Kho Hồ Chí Minh', '123 Nguyễn Huệ, Q1, TP.HCM'),
  ('WH003', 'Kho Đà Nẵng', '456 Trần Phú, Hải Châu, Đà Nẵng'),
  ('WH004', 'Kho Cần Thơ', '789 Mậu Thân, Ninh Kiều, Cần Thơ');
```

### Inventory Records

```sql
CREATE TABLE inventory (
  id UUID PRIMARY KEY,
  warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  reserved_quantity INTEGER DEFAULT 0,
  last_restocked_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(warehouse_id, variant_id)  -- 1 variant chỉ 1 record/kho
);
```

**Constraints**:
- `quantity >= 0` (không cho phép số âm)
- `reserved_quantity <= quantity` (không giữ quá số có)

---

## ⚡ Triggers & Views

### Auto-Sync Trigger

Tự động cập nhật `product_variants.stock_quantity` khi `inventory` thay đổi:

```sql
CREATE TRIGGER trigger_sync_variant_stock_on_update
AFTER UPDATE OF quantity, reserved_quantity ON inventory
FOR EACH ROW
EXECUTE FUNCTION sync_variant_stock_from_inventory();
```

**Cách hoạt động**:
```sql
-- Bước 1: Update inventory
UPDATE inventory
SET quantity = 600
WHERE variant_id = '...' AND warehouse_id = 'WH001';

-- Bước 2: Trigger tự động chạy
-- → Tính tổng quantity từ TẤT CẢ warehouses
-- → Update product_variants.stock_quantity = SUM(quantity)

-- Kết quả: Không cần code, tự động sync!
```

### Helper Views

#### 1. **v_product_availability** - Xem tồn kho theo kho

```sql
SELECT
  product_name,
  variant_sku,
  warehouse_name,
  available_quantity,
  reserved_quantity,
  sellable_quantity,        -- quantity - reserved
  stock_status              -- 'in_stock', 'low_stock', 'out_of_stock'
FROM v_product_availability
WHERE product_name LIKE 'Paracetamol%';
```

**Kết quả**:
```
product_name      | warehouse_name  | available | reserved | sellable | status
------------------|-----------------|-----------|----------|----------|------------
Paracetamol 500mg | Kho Hà Nội      | 500       | 50       | 450      | in_stock
Paracetamol 500mg | Kho TP.HCM      | 300       | 20       | 280      | in_stock
Paracetamol 500mg | Kho Đà Nẵng     | 0         | 0        | 0        | out_of_stock
```

#### 2. **v_inventory_summary** - Tổng hợp tồn kho

```sql
SELECT
  product_name,
  sku,
  total_quantity,           -- SUM(quantity) all warehouses
  total_reserved,           -- SUM(reserved) all warehouses
  total_available,          -- total_quantity - total_reserved
  warehouse_count,          -- Số kho có hàng
  stock_status
FROM v_inventory_summary
WHERE stock_status = 'low_stock';
```

**Kết quả**:
```
product_name      | sku       | total_qty | reserved | available | wh_count | status
------------------|-----------|-----------|----------|-----------|----------|----------
Alcohol Swabs 70% | MED-ALC-1 | 8         | 0        | 8         | 1        | low_stock
```

---

## 🔧 API Service

### InventoryService Class

```typescript
import InventoryService from '@/services/inventory.service';
```

### Methods

#### 1. **getVariantInventory** - Lấy thông tin tồn kho

```typescript
const inventory = await InventoryService.getVariantInventory(variantId);

// Returns:
{
  variant_id: "uuid",
  product_name: "Paracetamol 500mg",
  sku: "MED-001-V1",
  total_quantity: 1000,
  total_reserved: 80,
  total_available: 920,
  warehouse_count: 3,
  stock_status: "in_stock",
  locations: [
    {
      warehouse_id: "uuid",
      warehouse_code: "WH001",
      warehouse_name: "Kho Hà Nội",
      quantity: 500,
      reserved_quantity: 50,
      available_quantity: 450
    },
    // ...
  ]
}
```

#### 2. **checkAvailability** - Kiểm tra đủ hàng

```typescript
// Check toàn hệ thống
const hasStock = await InventoryService.checkAvailability(
  variantId,
  100  // cần 100 sản phẩm
);

// Check kho cụ thể
const hasStockInHN = await InventoryService.checkAvailability(
  variantId,
  100,
  'warehouse-hn-id'
);
```

#### 3. **reserveStock** - Giữ hàng khi đặt

```typescript
// Khi khách đặt hàng (chưa thanh toán)
await InventoryService.reserveStock(
  variantId,
  10,           // quantity
  warehouseId
);

// → Inventory: reserved_quantity += 10
// → Trigger: product_variants.reserved_quantity tự động tăng
```

#### 4. **releaseStock** - Trả hàng khi hủy

```typescript
// Khi hủy đơn hàng
await InventoryService.releaseStock(
  variantId,
  10,           // quantity
  warehouseId
);

// → Inventory: reserved_quantity -= 10
// → Trigger: product_variants.reserved_quantity tự động giảm
```

#### 5. **deductStock** - Trừ hàng khi giao

```typescript
// Khi giao hàng thành công
await InventoryService.deductStock(
  variantId,
  10,           // quantity
  warehouseId
);

// → Inventory: quantity -= 10, reserved_quantity -= 10
// → Trigger: product_variants.stock_quantity tự động giảm
```

#### 6. **addStock** - Nhập hàng

```typescript
// Nhập hàng vào kho
await InventoryService.addStock(
  variantId,
  100,          // quantity
  warehouseId
);

// → Inventory: quantity += 100
// → Trigger: product_variants.stock_quantity tự động tăng
```

#### 7. **getLowStockItems** - Sản phẩm sắp hết

```typescript
const lowStockItems = await InventoryService.getLowStockItems();

// Returns: Array of products with stock_status = 'low_stock' or 'out_of_stock'
```

---

## 💡 Ví dụ sử dụng

### Workflow: Khách đặt hàng

```typescript
// 1. Kiểm tra tồn kho
const hasStock = await InventoryService.checkAvailability(variantId, quantity);
if (!hasStock) {
  throw new Error('Insufficient stock');
}

// 2. Tạo đơn hàng & giữ hàng
const order = await createOrder({...});
await InventoryService.reserveStock(variantId, quantity, warehouseId);

// 3a. Nếu thanh toán thành công & giao hàng
await InventoryService.deductStock(variantId, quantity, warehouseId);

// 3b. Nếu hủy đơn
await InventoryService.releaseStock(variantId, quantity, warehouseId);
```

### Workflow: Nhập hàng

```typescript
// Nhập 500 sản phẩm vào kho TP.HCM
await InventoryService.addStock(
  variantId,
  500,
  'warehouse-hcm-id'
);

// Kiểm tra lại
const inventory = await InventoryService.getVariantInventory(variantId);
console.log(inventory.total_quantity);  // Tăng thêm 500
```

### Workflow: Chuyển kho

```typescript
// Chuyển 100 sản phẩm từ HN → HCM
await InventoryService.deductStock(variantId, 100, 'warehouse-hn-id');
await InventoryService.addStock(variantId, 100, 'warehouse-hcm-id');

// Hoặc dùng transfer (nếu có implement)
await InventoryService.transferStock({
  fromWarehouseId: 'warehouse-hn-id',
  toWarehouseId: 'warehouse-hcm-id',
  variantId,
  quantity: 100
});
```

---

## 📋 Best Practices

### 1. **Luôn dùng Inventory, không dùng variant stock trực tiếp**

❌ **Sai**:
```typescript
// Đọc stock từ product_variants
const variant = await getProductVariant(id);
if (variant.stock_quantity > 0) { ... }
```

✅ **Đúng**:
```typescript
// Đọc từ inventory (có warehouse info)
const hasStock = await InventoryService.checkAvailability(variantId, quantity);
```

### 2. **Luôn reserve trước khi deduct**

❌ **Sai**:
```typescript
// Trừ hàng ngay khi đặt
await InventoryService.deductStock(variantId, quantity, warehouseId);
```

✅ **Đúng**:
```typescript
// 1. Reserve khi đặt hàng
await InventoryService.reserveStock(variantId, quantity, warehouseId);

// 2. Deduct khi giao hàng
await InventoryService.deductStock(variantId, quantity, warehouseId);

// 3. Release nếu hủy
await InventoryService.releaseStock(variantId, quantity, warehouseId);
```

### 3. **Sử dụng transaction cho multiple operations**

```typescript
const client = await pool.connect();
try {
  await client.query('BEGIN');

  // Multiple inventory operations
  await InventoryService.deductStock(variant1, 10, warehouseId);
  await InventoryService.deductStock(variant2, 5, warehouseId);

  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

### 4. **Monitor low stock alerts**

```typescript
// Chạy định kỳ (cronjob)
const lowStockItems = await InventoryService.getLowStockItems();

if (lowStockItems.length > 0) {
  // Send notification to managers
  await sendLowStockAlert(lowStockItems);
}
```

### 5. **Inventory reports**

```sql
-- Báo cáo tồn kho theo kho
SELECT
  w.name as warehouse,
  COUNT(DISTINCT i.variant_id) as total_products,
  SUM(i.quantity) as total_quantity,
  SUM(i.reserved_quantity) as total_reserved,
  SUM(i.quantity - i.reserved_quantity) as total_available
FROM inventory i
JOIN warehouses w ON i.warehouse_id = w.id
GROUP BY w.id, w.name
ORDER BY w.name;

-- Sản phẩm bán chạy (reserved nhiều nhất)
SELECT
  p.name,
  pv.sku,
  SUM(i.reserved_quantity) as total_reserved
FROM inventory i
JOIN product_variants pv ON i.variant_id = pv.id
JOIN products p ON pv.product_id = p.id
GROUP BY p.id, p.name, pv.sku
ORDER BY total_reserved DESC
LIMIT 10;
```

---

## 🔄 Migration & Seeding

### 1. Tạo triggers & views

```bash
psql -h localhost -U dobby -d medical -f src/migrations/create-inventory-triggers.sql
```

### 2. Sync inventory từ variants hiện tại

```bash
npx ts-node src/seeders/sync-inventory.ts
```

### 3. Thêm warehouses mẫu

```bash
npx ts-node src/seeders/seed-warehouses.ts
```

---

## 🐛 Troubleshooting

### Issue: Stock không sync

**Kiểm tra trigger có hoạt động không**:
```sql
-- Test trigger
UPDATE inventory SET quantity = 999
WHERE variant_id = (SELECT id FROM product_variants LIMIT 1);

-- Check kết quả
SELECT pv.stock_quantity, i.quantity
FROM product_variants pv
JOIN inventory i ON i.variant_id = pv.id
WHERE pv.id = ...;
```

### Issue: Reserved > Quantity

**Trigger validation sẽ báo lỗi**:
```
ERROR: Reserved quantity (150) cannot exceed available quantity (100)
```

**Fix**: Không cho phép reserve quá số lượng có

### Issue: Negative quantity

**Trigger validation sẽ báo lỗi**:
```
ERROR: Quantity cannot be negative. Got: -10
```

**Fix**: Kiểm tra quantity trước khi deduct

---

## 📚 Tài liệu tham khảo

- [Database Triggers Documentation](./src/migrations/create-inventory-triggers.sql)
- [Inventory Service Source](./src/services/inventory.service.ts)
- [Seeder Scripts](./src/seeders/)

---

## 🎉 Kết luận

Hệ thống inventory đã được thiết kế hoàn chỉnh với:

✅ **3-tier architecture**: Products → Variants → Inventory
✅ **Auto-sync triggers**: Tự động đồng bộ stock
✅ **Multi-warehouse**: Hỗ trợ nhiều kho
✅ **Stock reservation**: Giữ hàng khi đặt
✅ **Validation**: Ngăn chặn lỗi logic
✅ **Helper views**: Query dễ dàng
✅ **Service layer**: API đầy đủ

**Happy Coding! 🚀**
