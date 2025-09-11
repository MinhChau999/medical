# Medical Electronics System

Hệ thống quản lý và bán hàng thiết bị điện tử tích hợp đa kênh.

## 📋 Tính năng chính

- **Quản lý sản phẩm**: CRUD sản phẩm, biến thể, hình ảnh, thông số kỹ thuật
- **Quản lý kho**: Theo dõi tồn kho real-time, nhập/xuất kho, kiểm kê
- **Quản lý đơn hàng**: Xử lý đơn hàng đa kênh, tích hợp vận chuyển
- **Quản lý khách hàng**: CRM, phân nhóm, loyalty program
- **Hệ thống POS**: Bán hàng tại cửa hàng
- **E-commerce**: Website bán hàng responsive, SEO-friendly
- **Báo cáo thống kê**: Dashboard real-time, báo cáo chi tiết

## 🛠 Công nghệ sử dụng

### Backend
- Node.js v20 LTS + TypeScript
- Express.js framework
- PostgreSQL database
- Redis caching
- Elasticsearch for search
- JWT authentication

### Frontend (Coming Soon)
- React 18 (Admin Panel)
- Next.js 14 (E-commerce)
- React Native (Mobile App)

## 🚀 Cài đặt

### Yêu cầu hệ thống
- Node.js >= 20.0.0
- PostgreSQL >= 15
- Redis >= 7
- Elasticsearch >= 8 (optional)

### Bước 1: Clone repository
```bash
git clone <repository-url>
cd Medical
```

### Bước 2: Cài đặt dependencies
```bash
npm install
```

### Bước 3: Cấu hình environment
```bash
cp backend/.env.example backend/.env
# Chỉnh sửa file .env với thông tin database và các service
```

### Bước 4: Khởi tạo database
```bash
# Tạo database
createdb medical_electronics

# Chạy migrations
psql -U <username> -d medical_electronics -f database/schema.sql
```

### Bước 5: Chạy development server
```bash
# Backend only
npm run dev:backend

# Hoặc chạy tất cả services
npm run dev
```

## 📁 Cấu trúc dự án

```
Medical/
├── backend/                 # Backend services
│   ├── src/
│   │   ├── config/         # Configurations
│   │   ├── controllers/    # Route controllers
│   │   ├── services/       # Business logic
│   │   ├── models/         # Data models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Express middleware
│   │   ├── utils/          # Utilities
│   │   └── index.ts        # Entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── admin/              # Admin dashboard
│   ├── shop/               # E-commerce website
│   └── pos/                # POS system
├── database/
│   └── schema.sql          # Database schema
├── docs/                   # Documentation
└── infrastructure/         # Docker, K8s configs
```

## 🔒 Authentication

Hệ thống sử dụng JWT với hai loại token:
- **Access Token**: Thời hạn 15 phút
- **Refresh Token**: Thời hạn 7 ngày

Roles:
- `admin`: Full quyền quản trị
- `manager`: Quản lý nghiệp vụ
- `staff`: Nhân viên bán hàng
- `customer`: Khách hàng

## 📊 Database Schema

Các bảng chính:
- `users`: Thông tin người dùng
- `products`: Sản phẩm
- `product_variants`: Biến thể sản phẩm
- `orders`: Đơn hàng
- `inventory`: Kho hàng
- `customers`: Thông tin khách hàng

Chi tiết xem file `database/schema.sql`

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage
```

## 📝 API Documentation

Xem chi tiết tại [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

### Quick Start
```bash
# Register
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get products
curl http://localhost:3000/api/v1/products
```

## 🚢 Deployment

### Docker
```bash
docker-compose up -d
```

### Production
```bash
npm run build
npm start
```

## 📊 Monitoring

- Health check: `GET /health`
- Metrics: Integrated with Prometheus (coming soon)
- Logs: Winston logger với daily rotation
- Error tracking: Sentry integration

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

Private - Medical Electronics © 2025

## 👥 Team

- **Project Owner**: Medical
- **Technical Lead**: Dobby
- **Development Team**: TBD

## 📞 Support

- Email: support@medical-electronics.com
- Issues: [GitHub Issues](https://github.com/medical/electronics/issues)

## 🗓 Roadmap

### Phase 1 (Month 1-2) ✅
- [x] Setup project structure
- [x] Database design
- [x] Authentication system
- [x] Product management

### Phase 2 (Month 3-4)
- [ ] Order management
- [ ] Inventory system
- [ ] Admin dashboard UI
- [ ] E-commerce frontend

### Phase 3 (Month 5)
- [ ] POS system
- [ ] Reporting & analytics
- [ ] Email/SMS integration

### Phase 4 (Month 6)
- [ ] Testing & optimization
- [ ] Documentation
- [ ] Deployment

### Future (Phase 2)
- [ ] Mobile applications
- [ ] AI/ML features
- [ ] Multi-language support
- [ ] B2B portal

---

Developed with ❤️ by Medical Team