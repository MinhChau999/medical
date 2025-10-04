# 📚 Hướng dẫn sử dụng Products & Inventory

> **Tài liệu hướng dẫn workflow quản lý sản phẩm và tồn kho trong hệ thống Medical Electronics Management**

---

## 📋 Mục lục

- [1. Tổng quan](#1-tổng-quan)
- [2. Products - Quản lý danh mục sản phẩm](#2-products---quản-lý-danh-mục-sản-phẩm)
- [3. Inventory - Quản lý tồn kho](#3-inventory---quản-lý-tồn-kho)
- [4. Workflow hoàn chỉnh](#4-workflow-hoàn-chỉnh)
- [5. Bảng so sánh](#5-bảng-so-sánh)
- [6. Lưu ý quan trọng](#6-lưu-ý-quan-trọng)
- [7. FAQ](#7-faq)

---

## 1. Tổng quan

### 🎯 Kiến trúc 3 tầng

Hệ thống sử dụng kiến trúc 3 tầng để quản lý sản phẩm và tồn kho:

```
┌─────────────────────────────────────────────────┐
│  PRODUCTS (Danh mục sản phẩm)                   │
│  - Thông tin cơ bản                             │
│  - Không chứa số lượng                          │
└─────────────────┬───────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────┐
│  PRODUCT_VARIANTS (Biến thể)                    │
│  - SKU, giá bán                                 │
│  - stock_quantity (TỰ ĐỘNG tính)               │
└─────────────────┬───────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────┐
│  INVENTORY (Tồn kho theo kho)                   │
│  - Quantity (Source of truth)                   │
│  - Theo từng warehouse                          │
│  - Reserved_quantity                            │
└─────────────────────────────────────────────────┘
```

### 🔑 Nguyên tắc vàng

| Nguyên tắc | Mô tả |
|------------|-------|
| **Products** | Chỉ nhập THÔNG TIN sản phẩm (tên, giá, hình ảnh) |
| **Inventory** | Chỉ nhập/xuất SỐ LƯỢNG tồn kho |
| **Stock_quantity** | KHÔNG BAO GIỜ chỉnh trực tiếp (tự động tính từ Inventory) |
| **Multi-warehouse** | Mỗi kho có tồn kho riêng biệt |

---

## 2. Products - Quản lý danh mục sản phẩm

### 📍 URL
```
http://localhost:5173/dashboard/products
```

### ✅ Khi nào sử dụng Products?

- ✅ Thêm sản phẩm MỚI vào hệ thống
- ✅ Cập nhật thông tin sản phẩm (tên, mô tả, giá, hình ảnh)
- ✅ Tạo biến thể (variants) cho sản phẩm
- ✅ Thay đổi giá bán
- ✅ Thay đổi ngưỡng cảnh báo tồn kho
- ❌ KHÔNG nhập số lượng tồn kho

### 📝 Thông tin cần nhập

#### **Thông tin sản phẩm:**
```javascript
{
  name: "Paracetamol 500mg",              // Tên sản phẩm
  description: "Thuốc giảm đau hạ sốt",   // Mô tả
  category: "Thuốc không kê đơn",         // Danh mục
  sku: "PAR-500",                         // SKU sản phẩm
  images: [...],                          // Hình ảnh
  status: "active"                        // Trạng thái
}
```

#### **Thông tin Variant:**
```javascript
{
  name: "Hộp 100 viên",           // Tên biến thể
  sku: "PAR-500-100",             // SKU biến thể
  price: 50000,                   // Giá bán (VNĐ)
  low_stock_threshold: 50,        // Ngưỡng cảnh báo
  stock_quantity: 0,              // ❌ KHÔNG nhập (tự động)
  is_active: true
}
```

### 📖 Ví dụ thực tế

#### **Thêm sản phẩm mới:**

```
Bước 1: Vào trang Products
  URL: http://localhost:5173/dashboard/products

Bước 2: Click "Thêm sản phẩm"

Bước 3: Nhập thông tin
  ┌─────────────────────────────────────┐
  │ Tên sản phẩm: Vitamin C 1000mg      │
  │ Mô tả: Viên sủi bổ sung vitamin C   │
  │ Danh mục: Vitamin & Khoáng chất     │
  │ SKU: VTC-1000                        │
  │ Upload hình ảnh                      │
  └─────────────────────────────────────┘

Bước 4: Thêm Variants
  ┌─────────────────────────────────────┐
  │ Variant 1:                           │
  │   - Tên: "Tuýp 10 viên"             │
  │   - SKU: VTC-1000-10                 │
  │   - Giá: 35,000đ                     │
  │   - Ngưỡng cảnh báo: 50              │
  │                                      │
  │ Variant 2:                           │
  │   - Tên: "Hộp 30 viên"              │
  │   - SKU: VTC-1000-30                 │
  │   - Giá: 95,000đ                     │
  │   - Ngưỡng cảnh báo: 30              │
  └─────────────────────────────────────┘

Bước 5: Lưu sản phẩm
  ✅ Sản phẩm được tạo với stock_quantity = 0
  ⚠️ Chưa có hàng trong kho
```

### 🎨 Các chức năng

| Chức năng | Mô tả |
|-----------|-------|
| **Thêm sản phẩm** | Tạo sản phẩm mới với variants |
| **Sửa sản phẩm** | Cập nhật thông tin, giá |
| **Xóa sản phẩm** | Ngừng hoạt động sản phẩm |
| **Tìm kiếm** | Tìm theo tên, SKU |
| **Lọc** | Lọc theo danh mục, trạng thái |
| **Xem tồn kho** | Xem stock_quantity (tự động) |

---

## 3. Inventory - Quản lý tồn kho

### 📍 URL
```
http://localhost:5173/dashboard/inventory
```

### ✅ Khi nào sử dụng Inventory?

- ✅ NHẬP HÀNG vào kho (nhập hàng mới từ NCC)
- ✅ XUẤT HÀNG từ kho (hàng hỏng, hết hạn, trả NCC)
- ✅ CHUYỂN KHO (từ kho này sang kho khác)
- ✅ KIỂM KÊ (điều chỉnh số lượng thực tế)
- ✅ Xem tồn kho theo từng kho
- ❌ KHÔNG sửa thông tin sản phẩm (làm ở Products)

### 🏢 Các kho trong hệ thống

```
WH001 - Kho Hà Nội
├── Address: 123 Nguyễn Trãi, Thanh Xuân, Hà Nội
├── Phone: 024-1234-5678
└── Status: Active

WH002 - Kho Hồ Chí Minh
├── Address: 123 Nguyễn Huệ, Quận 1, TP.HCM
├── Phone: 028-1234-5678
└── Status: Active

WH003 - Kho Đà Nẵng
├── Address: 456 Trần Phú, Hải Châu, Đà Nẵng
├── Phone: 0236-123-4567
└── Status: Active

WH004 - Kho Cần Thơ
├── Address: 789 Mậu Thân, Ninh Kiều, Cần Thơ
├── Phone: 0292-123-4567
└── Status: Active
```

### 📊 Thông tin hiển thị

```javascript
{
  product_name: "Paracetamol 500mg",      // Tên sản phẩm
  variant_name: "Hộp 100 viên",           // Biến thể
  variant_sku: "PAR-500-100",             // SKU
  warehouse_name: "Kho Hà Nội",           // Kho

  quantity: 500,                          // Tồn kho
  reserved_quantity: 50,                  // Đã đặt
  available: 450,                         // Khả dụng (quantity - reserved)

  price: 50000,                           // Giá
  value: 25000000,                        // Giá trị (quantity × price)

  low_stock_threshold: 100,               // Ngưỡng cảnh báo
  isLowStock: false,                      // Cảnh báo sắp hết
  stock_status: "in_stock"                // Trạng thái
}
```

### 📥 Nhập kho

#### **Cách 1: Nhập từng sản phẩm**

```
Bước 1: Tìm sản phẩm trong bảng Inventory

Bước 2: Click nút "..." → "Nhập kho"

Bước 3: Điền thông tin
  ┌─────────────────────────────────────┐
  │ Sản phẩm: Paracetamol 500mg         │
  │ SKU: PAR-500-100                     │
  │ Kho: Kho Hà Nội                      │
  │ Tồn kho hiện tại: 100                │
  │                                      │
  │ Số lượng nhập: [500]                 │
  │ Ghi chú: "Nhập hàng từ NCC ABC"     │
  └─────────────────────────────────────┘

Bước 4: Click "Nhập kho"

Kết quả:
  ✅ Quantity: 100 → 600
  ✅ Stock_quantity tự động cập nhật
  ✅ Lưu lịch sử giao dịch
```

#### **Cách 2: Nhập hàng loạt**

```
Bước 1: Click "Nhập kho" (toolbar)

Bước 2: Chọn kho
  → Kho Hà Nội

Bước 3: Thêm sản phẩm
  ┌─────────────────────────────────────┐
  │ [Chọn sản phẩm ▼]                   │
  │                                      │
  │ Danh sách đã chọn:                  │
  │ ┌─────────────────────────────────┐ │
  │ │ Paracetamol 500mg - Hộp 100     │ │
  │ │ SKU: PAR-500-100                │ │
  │ │ Tồn: 100 → Nhập: [500]          │ │
  │ │                           [Xóa] │ │
  │ └─────────────────────────────────┘ │
  │                                      │
  │ ┌─────────────────────────────────┐ │
  │ │ Vitamin C 1000mg - Tuýp 10      │ │
  │ │ SKU: VTC-1000-10                │ │
  │ │ Tồn: 50 → Nhập: [200]           │ │
  │ │                           [Xóa] │ │
  │ └─────────────────────────────────┘ │
  │                                      │
  │ Ghi chú: "Đơn hàng #NH001"          │
  └─────────────────────────────────────┘

Bước 4: Click "Nhập kho"

Kết quả:
  ✅ Nhập 2 sản phẩm cùng lúc
  ✅ Tất cả quantity được cập nhật
  ✅ Message: "Đã nhập 2 sản phẩm thành công"
```

### 📤 Xuất kho

#### **Các trường hợp xuất kho:**

- **Hàng hỏng**: Sản phẩm bị hư hại
- **Hết hạn**: Sản phẩm quá hạn sử dụng
- **Trả NCC**: Trả hàng lỗi cho nhà cung cấp
- **Tiêu hao**: Sử dụng nội bộ, demo

#### **Quy trình xuất:**

```
Bước 1: Tìm sản phẩm → Click "..." → "Xuất kho"

Bước 2: Nhập thông tin
  ┌─────────────────────────────────────┐
  │ Sản phẩm: Paracetamol 500mg         │
  │ Tồn kho: 600                         │
  │ Đã đặt: 50                           │
  │ Khả dụng: 550                        │
  │                                      │
  │ Số lượng xuất: [10]                  │
  │ ⚠️ Tối đa: 550                       │
  │                                      │
  │ Ghi chú: "Hàng hết hạn sử dụng"     │
  └─────────────────────────────────────┘

Bước 3: Click "Xuất kho"

Kết quả:
  ✅ Quantity: 600 → 590
  ✅ Available: 550 → 540
  ⚠️ Không được xuất quá Available
```

### 🔄 Chuyển kho

```
Tính năng: Đang phát triển

Khi hoàn thành:
  Chuyển từ Kho Hà Nội → Kho TP.HCM
  - Kho HN: Quantity - 100
  - Kho HCM: Quantity + 100
  - Tạo 2 transactions (out/in)
```

### 📊 Các chỉ số quan trọng

```
┌──────────────────────────────────────────┐
│  TỔNG SKU: 11                            │
│  2,398 sản phẩm                          │
├──────────────────────────────────────────┤
│  CẢNH BÁO: 1                             │
│  Sắp hết hàng                            │
├──────────────────────────────────────────┤
│  HẾT HÀNG: 1                             │
│  Cần nhập hàng                           │
├──────────────────────────────────────────┤
│  GIÁ TRỊ KHO: 227,329,000₫               │
│  0 đã đặt                                │
└──────────────────────────────────────────┘
```

---

## 4. Workflow hoàn chỉnh

### 🎯 Kịch bản 1: Nhập sản phẩm mới

```
┌─────────────────────────────────────────────────┐
│  BƯỚC 1: Thêm sản phẩm trong PRODUCTS           │
├─────────────────────────────────────────────────┤
│  URL: /dashboard/products                       │
│  Action: Click "Thêm sản phẩm"                  │
│                                                  │
│  Input:                                          │
│  ├── Tên: "Amoxicillin 500mg"                   │
│  ├── Mô tả: "Kháng sinh nhóm Penicillin"       │
│  ├── Danh mục: "Kháng sinh"                     │
│  ├── SKU: AMX-500                                │
│  └── Upload hình ảnh                             │
│                                                  │
│  Variants:                                       │
│  ├── Variant 1: "Vỉ 10 viên" - 15,000đ         │
│  └── Variant 2: "Hộp 100 viên" - 140,000đ      │
│                                                  │
│  Output:                                         │
│  ✅ Product created                              │
│  ✅ Stock_quantity = 0 (chưa có hàng)           │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  BƯỚC 2: Nhập hàng vào kho INVENTORY            │
├─────────────────────────────────────────────────┤
│  URL: /dashboard/inventory                      │
│  Action: Click "Nhập kho"                       │
│                                                  │
│  Input:                                          │
│  ├── Chọn kho: Kho Hà Nội                       │
│  ├── Chọn SP: AMX-500-10 (Vỉ 10 viên)          │
│  ├── Số lượng: 1000 vỉ                           │
│  ├── Chọn SP: AMX-500-100 (Hộp 100 viên)       │
│  ├── Số lượng: 200 hộp                           │
│  └── Ghi chú: "Đơn hàng #NH2024001"             │
│                                                  │
│  Output:                                         │
│  ✅ Inventory[WH001][AMX-500-10].qty = 1000     │
│  ✅ Inventory[WH001][AMX-500-100].qty = 200     │
│  ✅ Variant[AMX-500-10].stock_qty = 1000        │
│  ✅ Variant[AMX-500-100].stock_qty = 200        │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  BƯỚC 3: Kiểm tra kết quả                       │
├─────────────────────────────────────────────────┤
│  Products Page:                                  │
│  ├── AMX-500-10: Stock 1,000 vỉ ✅              │
│  └── AMX-500-100: Stock 200 hộp ✅              │
│                                                  │
│  Inventory Page:                                 │
│  ├── Kho HN > AMX-500-10: 1,000 vỉ              │
│  └── Kho HN > AMX-500-100: 200 hộp              │
└─────────────────────────────────────────────────┘
```

### 🛒 Kịch bản 2: Bán hàng (Tự động)

```
┌─────────────────────────────────────────────────┐
│  KHÁCH ĐẶT HÀNG (Orders)                        │
├─────────────────────────────────────────────────┤
│  Đơn hàng #SO001:                               │
│  ├── AMX-500-100 (Hộp 100 viên) × 5 hộp        │
│  ├── Kho: Kho Hà Nội                            │
│  └── Trạng thái: Pending                        │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  HỆ THỐNG TỰ ĐỘNG XỬ LÝ                        │
├─────────────────────────────────────────────────┤
│  1. Order Status: Pending → Confirmed           │
│     └── Reserved_quantity += 5                   │
│                                                  │
│  2. Order Status: Confirmed → Shipped           │
│     ├── Quantity -= 5                            │
│     ├── Reserved_quantity -= 5                   │
│     └── Create transaction "out"                 │
│                                                  │
│  3. Stock_quantity auto update                   │
│     └── Variant.stock_qty: 200 → 195            │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  KẾT QUẢ                                        │
├─────────────────────────────────────────────────┤
│  Inventory:                                      │
│  ├── Quantity: 200 → 195                        │
│  ├── Reserved: 0                                 │
│  └── Available: 195                              │
│                                                  │
│  Products:                                       │
│  └── Stock_quantity: 200 → 195 (tự động)        │
└─────────────────────────────────────────────────┘
```

### 🗑️ Kịch bản 3: Xuất kho (Hàng hỏng)

```
┌─────────────────────────────────────────────────┐
│  PHÁT HIỆN HÀNG HƯ HỎNG                         │
├─────────────────────────────────────────────────┤
│  Phát hiện: 10 hộp AMX-500-100 hết hạn          │
│  Kho: Kho Hà Nội                                 │
│  Quyết định: Xuất hủy                            │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  THAO TÁC TRONG INVENTORY                       │
├─────────────────────────────────────────────────┤
│  1. Tìm sản phẩm: AMX-500-100, Kho HN           │
│  2. Click "..." → "Xuất kho"                    │
│  3. Nhập:                                        │
│     ├── Số lượng: 10                             │
│     └── Ghi chú: "Hàng hết hạn 03/2024"         │
│  4. Click "Xuất kho"                            │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  HỆ THỐNG XỬ LÝ                                 │
├─────────────────────────────────────────────────┤
│  ✅ Inventory.quantity: 195 → 185               │
│  ✅ Variant.stock_qty: 195 → 185                │
│  ✅ Create transaction "out" (manual)            │
│  ✅ Save note: "Hàng hết hạn 03/2024"           │
└─────────────────────────────────────────────────┘
```

---

## 5. Bảng so sánh

### 📊 Products vs Inventory

| Tiêu chí | PRODUCTS | INVENTORY |
|----------|----------|-----------|
| **URL** | `/dashboard/products` | `/dashboard/inventory` |
| **Mục đích** | Quản lý thông tin sản phẩm | Quản lý số lượng tồn kho |
| **Thao tác chính** | Thêm/Sửa/Xóa sản phẩm | Nhập/Xuất/Chuyển kho |
| **Nhập liệu** | Tên, giá, hình ảnh, mô tả | Số lượng nhập/xuất |
| **Tần suất sử dụng** | Ít (khi có SP mới) | Thường xuyên (hàng ngày) |
| **Stock_quantity** | Chỉ XEM (readonly) | Không hiển thị |
| **Quantity** | Không có | NHẬP/XUẤT ở đây |
| **Warehouse** | Không phân biệt | Phân theo từng kho |
| **Price** | CÓ (nhập/sửa được) | Chỉ hiển thị |
| **Variants** | Quản lý variants | Hiển thị variant info |
| **Reserved** | Không có | CÓ (đã đặt hàng) |
| **Available** | Không có | CÓ (khả dụng) |
| **Ghi chú** | Mô tả sản phẩm | Lý do nhập/xuất |

### 🔄 Luồng dữ liệu

```
PRODUCTS                 VARIANTS              INVENTORY
┌─────────┐             ┌─────────┐           ┌─────────┐
│  name   │────────────▶│  name   │           │quantity │◀── Source of Truth
│  desc   │             │  sku    │           │reserved │
│  image  │             │  price  │           │w_house  │
│  sku    │             │ stock ◀─┼───────────┤  ...    │
└─────────┘             └─────────┘  Auto     └─────────┘
                             ▲        Update        ▲
                             │                      │
                             └──────────────────────┘
                                  SUM(quantity)
```

---

## 6. Lưu ý quan trọng

### ⚠️ SAI LẦM THƯỜNG GẶP

#### ❌ **SAI - Nhập stock trong Products**
```javascript
// Trang Products
Product: "Paracetamol 500mg"
Variant: "Hộp 100 viên"
└── Stock_quantity: [100] ← ❌ SAI! Không nhập ở đây
```

#### ✅ **ĐÚNG - Nhập qua Inventory**
```javascript
// Trang Inventory
Action: Click "Nhập kho"
└── Quantity: [100] ← ✅ ĐÚNG! Nhập ở đây
```

### 🔐 Nguyên tắc bảo mật

```
┌────────────────────────────────────────────┐
│  1. KHÔNG BAO GIỜ sửa stock_quantity       │
│     trực tiếp trong database               │
│                                             │
│  2. LUÔN LUÔN thao tác qua Inventory UI    │
│                                             │
│  3. KIỂM TRA Available trước khi xuất      │
│     (Available = Quantity - Reserved)      │
│                                             │
│  4. GHI CHÚ rõ ràng lý do nhập/xuất        │
│                                             │
│  5. SỬ DỤNG đúng warehouse khi nhập/xuất   │
└────────────────────────────────────────────┘
```

### 💡 Best Practices

#### 1. **Quản lý Variants**
```
✅ ĐÚNG:
Product: "Paracetamol 500mg"
├── Variant 1: "Vỉ 10 viên" - SKU: PAR-500-10
├── Variant 2: "Hộp 100 viên" - SKU: PAR-500-100
└── Variant 3: "Hộp 200 viên" - SKU: PAR-500-200

❌ SAI:
Product: "Paracetamol 500mg Vỉ 10 viên"
Product: "Paracetamol 500mg Hộp 100 viên"
Product: "Paracetamol 500mg Hộp 200 viên"
```

#### 2. **Đặt tên SKU**
```
✅ ĐÚNG:
PAR-500-10   (Paracetamol 500mg - 10 viên)
VTC-1000-30  (Vitamin C 1000mg - 30 viên)
AMX-500-100  (Amoxicillin 500mg - 100 viên)

❌ SAI:
SKU001, SKU002, SKU003 (không mang nghĩa)
```

#### 3. **Ghi chú khi nhập/xuất**
```
✅ ĐÚNG:
- "Nhập hàng từ NCC ABC - Đơn #NH2024001"
- "Hàng hết hạn 03/2024 - Lô #LOT123"
- "Trả hàng lỗi cho NCC - PO #PO2024001"

❌ SAI:
- "Nhập hàng"
- "Xuất"
- (Để trống)
```

#### 4. **Ngưỡng cảnh báo**
```
Công thức đề xuất:
low_stock_threshold = Lượng bán TB × Thời gian nhập hàng × 2

Ví dụ:
- Bán TB: 10 hộp/ngày
- Thời gian nhập: 7 ngày
- Ngưỡng: 10 × 7 × 2 = 140 hộp

✅ Cảnh báo khi stock ≤ 140
```

---

## 7. FAQ

### ❓ Câu hỏi thường gặp

#### **Q1: Tại sao stock_quantity trong Products không cho nhập?**
**A:** Stock_quantity được tính tự động từ tổng `SUM(inventory.quantity)` của tất cả các kho. Điều này đảm bảo:
- ✅ Dữ liệu luôn chính xác
- ✅ Có lịch sử nhập/xuất đầy đủ
- ✅ Quản lý được tồn kho theo từng kho

#### **Q2: Làm sao để chuyển hàng giữa các kho?**
**A:** Hiện tại:
1. Xuất kho từ kho nguồn
2. Nhập kho vào kho đích
3. Ghi chú: "Chuyển từ Kho A → Kho B"

Trong tương lai: Tính năng "Chuyển kho" tự động

#### **Q3: Reserved_quantity được tạo khi nào?**
**A:** Tự động khi:
1. Đơn hàng được tạo (Orders)
2. Status: Pending → Confirmed
3. Hệ thống tự động: `reserved_quantity += order_quantity`

#### **Q4: Khi nào thì xuất kho thủ công?**
**A:** Các trường hợp:
- Hàng hỏng, hư hại
- Hàng hết hạn sử dụng
- Trả hàng cho nhà cung cấp
- Sử dụng nội bộ, demo

#### **Q5: Có thể xóa sản phẩm đã có tồn kho không?**
**A:**
- ❌ Không thể xóa hoàn toàn
- ✅ Chỉ có thể đặt `status = 'inactive'`
- ⚠️ Phải xuất hết tồn kho trước khi inactive

#### **Q6: Làm sao biết sản phẩm sắp hết hàng?**
**A:** Hệ thống tự động:
```
if (quantity <= low_stock_threshold) {
  status = "low_stock"  // Tag màu vàng
  alert = true          // Hiển thị cảnh báo
}
```

#### **Q7: Available khác gì với Quantity?**
**A:**
```
Quantity:  Tổng số hàng trong kho
Reserved:  Số hàng đã được đặt (chờ ship)
Available: Số hàng có thể bán = Quantity - Reserved

Ví dụ:
├── Quantity: 500
├── Reserved: 50 (đã có đơn hàng)
└── Available: 450 (có thể bán thêm)
```

#### **Q8: Có thể nhập số âm không?**
**A:**
```
❌ Validation:
- Quantity >= 0
- Reserved_quantity >= 0
- Reserved <= Quantity

✅ Đúng cách:
- Nhập kho: type = "in", quantity = 100
- Xuất kho: type = "out", quantity = 50
```

---

## 📞 Hỗ trợ

Nếu có thắc mắc, vui lòng liên hệ:
- **Email**: support@medical-system.com
- **Docs**: `/backend/INVENTORY_GUIDE.md`
- **Issues**: GitHub Issues

---

**Phiên bản**: 1.0.0
**Cập nhật lần cuối**: 2024
**Tác giả**: Medical Electronics Management Team
