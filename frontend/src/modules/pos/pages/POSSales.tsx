import React, { useState, useEffect, useRef } from 'react';
import { 
  Row,
  Col,
  Card, 
  Input, 
  Button, 
  Space, 
  Table, 
  Typography, 
  InputNumber,
  Tag, 
  Modal, 
  Form, 
  Select, 
  message, 
  Divider,
  List,
  Avatar,
  Badge,
  Tabs,
  Tooltip,
  Radio,
  Statistic,
  Empty,
  Grid,
} from 'antd';
import {
  SearchOutlined,
  BarcodeOutlined,
  PlusOutlined,
  MinusOutlined,
  DeleteOutlined,
  CreditCardOutlined,
  DollarOutlined,
  PrinterOutlined,
  PauseOutlined,
  PercentageOutlined,
  UserOutlined,
  CloseOutlined,
  CheckOutlined,
  WalletOutlined,
  BankOutlined,
  QrcodeOutlined,
  FileTextOutlined,
  MedicineBoxOutlined,
  ShoppingCartOutlined,
  ClearOutlined,
  HistoryOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  ScanOutlined,
  CalculatorOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useThemeStore } from '@/stores/themeStore';
import POSLayout from '@/layouts/POSLayout';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { Search } = Input;
const { useBreakpoint } = Grid;

interface Product {
  id: string;
  barcode: string;
  name: string;
  price: number;
  stock: number;
  unit: string;
  category: string;
  image: string;
  discount?: number;
}

interface CartItem extends Product {
  quantity: number;
  subtotal: number;
  discountAmount: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  points: number;
  type: 'regular' | 'vip';
}

interface Invoice {
  id: string;
  items: CartItem[];
  customer?: Customer;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: 'pending' | 'paid' | 'cancelled';
  createdAt: Date;
}

// Quick amount buttons for cash payment
const QUICK_AMOUNTS = [10000, 20000, 50000, 100000, 200000, 500000, 1000000, 2000000];

const POSSales: React.FC = () => {
  const { isDarkMode } = useThemeStore();
  const screens = useBreakpoint();
  const [searchText, setSearchText] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [holdInvoices, setHoldInvoices] = useState<Invoice[]>([]);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [receivedAmount, setReceivedAmount] = useState<number>(0);
  const barcodeInputRef = useRef<any>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Mock products data with placeholder images
  const mockProducts: Product[] = [
    { id: '1', barcode: '8934563201234', name: 'Máy đo huyết áp Omron HEM-7121', price: 1250000, stock: 15, unit: 'cái', category: 'device', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=300&fit=crop' },
    { id: '2', barcode: '8934563201235', name: 'Nhiệt kế điện tử Microlife MT550', price: 150000, stock: 50, unit: 'cái', category: 'device', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=300&fit=crop' },
    { id: '3', barcode: '8934563201236', name: 'Máy đo đường huyết Accu-Chek', price: 850000, stock: 20, unit: 'cái', category: 'device', image: 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?w=300&h=300&fit=crop' },
    { id: '4', barcode: '8934563201237', name: 'Khẩu trang y tế 4 lớp (50 cái)', price: 45000, stock: 200, unit: 'hộp', category: 'consumable', image: 'https://images.unsplash.com/photo-1584634428004-1caaca977f01?w=300&h=300&fit=crop' },
    { id: '5', barcode: '8934563201238', name: 'Găng tay y tế Latex (100 đôi)', price: 65000, stock: 100, unit: 'hộp', category: 'consumable', image: 'https://images.unsplash.com/photo-1599493758267-c6c884c7071f?w=300&h=300&fit=crop' },
    { id: '6', barcode: '8934563201239', name: 'Máy xông khí dung Omron NE-C28', price: 1650000, stock: 10, unit: 'cái', category: 'device', image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=300&h=300&fit=crop' },
    { id: '7', barcode: '8934563201240', name: 'Máy đo SpO2 Beurer PO30', price: 450000, stock: 25, unit: 'cái', category: 'device', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=300&fit=crop' },
    { id: '8', barcode: '8934563201241', name: 'Băng gạc y tế 5cm x 5m', price: 25000, stock: 150, unit: 'cuộn', category: 'consumable', image: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=300&h=300&fit=crop' },
    { id: '9', barcode: '8934563201242', name: 'Bông y tế 100g', price: 15000, stock: 100, unit: 'gói', category: 'consumable', image: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=300&h=300&fit=crop' },
    { id: '10', barcode: '8934563201243', name: 'Cồn y tế 70 độ (500ml)', price: 35000, stock: 80, unit: 'chai', category: 'consumable', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=300&fit=crop' },
    { id: '11', barcode: '8934563201244', name: 'Que test Covid-19', price: 25000, stock: 500, unit: 'que', category: 'test', image: 'https://images.unsplash.com/photo-1605289982774-9a6fef564df8?w=300&h=300&fit=crop' },
    { id: '12', barcode: '8934563201245', name: 'Máy massage cổ vai gáy', price: 890000, stock: 12, unit: 'cái', category: 'device', image: 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?w=300&h=300&fit=crop' },
  ];

  // Mock customers
  const mockCustomers: Customer[] = [
    { id: '1', name: 'Nguyễn Văn A', phone: '0901234567', points: 1500, type: 'vip' },
    { id: '2', name: 'Trần Thị B', phone: '0912345678', points: 800, type: 'regular' },
    { id: '3', name: 'Lê Văn C', phone: '0923456789', points: 2000, type: 'vip' },
  ];

  // Categories with colors
  const categories = [
    { key: 'all', label: 'Tất cả', icon: '📦', color: '#00A6B8' },
    { key: 'device', label: 'Thiết bị', icon: '🏥', color: '#4A90E2' },
    { key: 'consumable', label: 'Vật tư', icon: '💊', color: '#52c41a' },
    { key: 'test', label: 'Que test', icon: '🧪', color: '#fa8c16' },
  ];

  useEffect(() => {
    // Focus on barcode input
    barcodeInputRef.current?.focus();

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // F1 - Focus search
      if (e.key === 'F1') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      }
      // F2 - Customer
      if (e.key === 'F2') {
        e.preventDefault();
        setCustomerModalVisible(true);
      }
      // F3 - Hold invoice
      if (e.key === 'F3') {
        e.preventDefault();
        holdInvoice();
      }
      // F4 - Payment
      if (e.key === 'F4') {
        e.preventDefault();
        processPayment();
      }
      // Delete - Clear cart
      if (e.key === 'Delete' && e.ctrlKey) {
        e.preventDefault();
        clearCart();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [cart]);

  // Filter products by category and search
  const getFilteredProducts = () => {
    let filtered = mockProducts;
    
    if (activeCategory !== 'all') {
      filtered = filtered.filter(p => p.category === activeCategory);
    }
    
    if (searchText) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchText.toLowerCase()) ||
        p.barcode.includes(searchText)
      );
    }
    
    return filtered;
  };

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const discountAmount = cart.reduce((sum, item) => sum + item.discountAmount, 0);
    const tax = (subtotal - discountAmount) * 0.1; // 10% VAT
    const total = subtotal - discountAmount + tax;
    
    return { subtotal, discount: discountAmount, tax, total };
  };

  // Handle barcode scan
  const handleBarcodeScan = (barcode: string) => {
    const product = mockProducts.find(p => p.barcode === barcode);
    if (product) {
      addToCart(product);
      setSearchText('');
      barcodeInputRef.current?.focus();
    } else {
      message.error('Không tìm thấy sản phẩm');
    }
  };

  // Add product to cart
  const addToCart = (product: Product) => {
    if (product.stock === 0) {
      message.warning('Sản phẩm đã hết hàng');
      return;
    }

    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        message.warning(`Chỉ còn ${product.stock} sản phẩm trong kho`);
        return;
      }
      updateQuantity(product.id, existingItem.quantity + 1);
    } else {
      const newItem: CartItem = {
        ...product,
        quantity: 1,
        subtotal: product.price,
        discountAmount: product.discount ? product.price * product.discount / 100 : 0,
      };
      setCart([...cart, newItem]);
    }

    // Play sound effect (optional)
    const audio = new Audio('/beep.mp3');
    audio.play().catch(() => {});
  };

  // Update quantity
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    const product = cart.find(item => item.id === productId);
    if (product && quantity > product.stock) {
      message.warning(`Chỉ còn ${product.stock} sản phẩm trong kho`);
      return;
    }
    
    setCart(cart.map(item => {
      if (item.id === productId) {
        const subtotal = item.price * quantity;
        const discountAmount = item.discount ? subtotal * item.discount / 100 : 0;
        return { ...item, quantity, subtotal, discountAmount };
      }
      return item;
    }));
  };

  // Remove from cart
  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  // Clear cart
  const clearCart = () => {
    if (cart.length === 0) return;
    
    Modal.confirm({
      title: 'Xóa giỏ hàng',
      content: 'Bạn có chắc muốn xóa toàn bộ giỏ hàng?',
      okText: 'Xóa',
      cancelText: 'Hủy',
      okButtonProps: { danger: true },
      onOk: () => {
        setCart([]);
        setSelectedCustomer(null);
        message.success('Đã xóa giỏ hàng');
      }
    });
  };

  // Hold invoice
  const holdInvoice = () => {
    if (cart.length === 0) {
      message.warning('Giỏ hàng trống');
      return;
    }
    
    const { subtotal, discount, tax, total } = calculateTotals();
    const invoice: Invoice = {
      id: `HD${Date.now().toString().slice(-6)}`,
      items: [...cart],
      customer: selectedCustomer,
      subtotal,
      discount,
      tax,
      total,
      status: 'pending',
      createdAt: new Date(),
    };
    
    setHoldInvoices([...holdInvoices, invoice]);
    setCart([]);
    setSelectedCustomer(null);
    message.success('Đã lưu hóa đơn tạm');
  };

  // Restore held invoice
  const restoreInvoice = (invoice: Invoice) => {
    setCart(invoice.items);
    setSelectedCustomer(invoice.customer || null);
    setHoldInvoices(holdInvoices.filter(inv => inv.id !== invoice.id));
    message.success('Đã khôi phục hóa đơn');
  };

  // Process payment
  const processPayment = () => {
    if (cart.length === 0) {
      message.warning('Giỏ hàng trống');
      return;
    }
    setPaymentModalVisible(true);
    const { total } = calculateTotals();
    setReceivedAmount(total);
  };

  // Complete payment
  const completePayment = () => {
    setLoading(true);
    
    setTimeout(() => {
      message.success('Thanh toán thành công');
      
      // Print receipt
      printReceipt();
      
      // Open cash drawer (simulated)
      if (paymentMethod === 'cash') {
        message.info('Mở két tiền...');
      }
      
      // Clear cart
      setCart([]);
      setSelectedCustomer(null);
      setPaymentModalVisible(false);
      setLoading(false);
      
      // Focus back to barcode input
      barcodeInputRef.current?.focus();
    }, 1000);
  };

  // Print receipt
  const printReceipt = () => {
    message.info('Đang in hóa đơn...');
    setTimeout(() => {
      message.success('Đã in hóa đơn');
    }, 1500);
  };

  // Cart columns for table
  const cartColumns: ColumnsType<CartItem> = [
    {
      title: 'Sản phẩm',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <Text strong style={{ fontSize: 14 }}>{text}</Text>
          <div style={{ fontSize: 11, color: '#999' }}>
            {record.barcode} • {record.unit}
          </div>
        </div>
      ),
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      align: 'right',
      render: (price) => (
        <Text style={{ fontSize: 14 }}>
          {price.toLocaleString()}
        </Text>
      ),
    },
    {
      title: 'SL',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      align: 'center',
      render: (quantity, record) => (
        <Space size={2}>
          <Button
            size="small"
            icon={<MinusOutlined />}
            onClick={() => updateQuantity(record.id, quantity - 1)}
            style={{ width: 28, height: 28 }}
          />
          <InputNumber
            size="small"
            min={1}
            max={record.stock}
            value={quantity}
            onChange={(value) => updateQuantity(record.id, value || 1)}
            style={{ width: 50, textAlign: 'center' }}
          />
          <Button
            size="small"
            icon={<PlusOutlined />}
            onClick={() => updateQuantity(record.id, quantity + 1)}
            style={{ width: 28, height: 28 }}
          />
        </Space>
      ),
    },
    {
      title: 'T.Tiền',
      dataIndex: 'subtotal',
      key: 'subtotal',
      width: 110,
      align: 'right',
      render: (subtotal, record) => (
        <div>
          <Text strong style={{ fontSize: 14, color: '#00A6B8' }}>
            {(subtotal - record.discountAmount).toLocaleString()}
          </Text>
          {record.discountAmount > 0 && (
            <div style={{ fontSize: 11, color: '#ff4d4f' }}>
              -{record.discountAmount.toLocaleString()}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '',
      key: 'action',
      width: 40,
      render: (_, record) => (
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => removeFromCart(record.id)}
        />
      ),
    },
  ];

  const { subtotal, discount, tax, total } = calculateTotals();


  return (
    <POSLayout>
      <div style={{ height: 'calc(100vh - 64px)', display: 'flex', background: isDarkMode ? '#0F1419' : '#F0F2F5' }}>
        
        {/* Left Panel - Product Selection */}
        <div style={{ 
          flex: '1 1 65%', 
          display: 'flex',
          flexDirection: 'column',
          borderRight: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : '#E8E8E8'}`,
          background: isDarkMode ? '#131821' : '#FFFFFF',
        }}>
          
          {/* Search Header */}
          <div style={{ 
            padding: '12px 16px',
            borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : '#F0F0F0'}`,
            background: isDarkMode ? '#1A2332' : '#FAFBFC',
          }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <Input
                ref={barcodeInputRef}
                size="large"
                placeholder="Quét mã vạch hoặc tìm sản phẩm... (F1)"
                prefix={<ScanOutlined style={{ fontSize: 18, color: '#00A6B8' }} />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onPressEnter={(e) => handleBarcodeScan(e.currentTarget.value)}
                style={{ 
                  fontSize: 15,
                  height: 44,
                  borderRadius: 8,
                  flex: 1,
                }}
                allowClear
              />
              <Space.Compact>
                <Tooltip title="Chế độ lưới">
                  <Button
                    size="large"
                    icon={<AppstoreOutlined />}
                    type={viewMode === 'grid' ? 'primary' : 'default'}
                    onClick={() => setViewMode('grid')}
                    style={{ height: 44 }}
                  />
                </Tooltip>
                <Tooltip title="Chế độ danh sách">
                  <Button
                    size="large"
                    icon={<UnorderedListOutlined />}
                    type={viewMode === 'list' ? 'primary' : 'default'}
                    onClick={() => setViewMode('list')}
                    style={{ height: 44 }}
                  />
                </Tooltip>
              </Space.Compact>
            </div>
            
            {/* Category Pills */}
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
              {categories.map(cat => (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 20,
                    border: activeCategory === cat.key 
                      ? `2px solid ${cat.color}`
                      : `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : '#E8E8E8'}`,
                    background: activeCategory === cat.key
                      ? isDarkMode ? `${cat.color}20` : `${cat.color}10`
                      : isDarkMode ? 'rgba(255,255,255,0.02)' : '#FFFFFF',
                    color: activeCategory === cat.key
                      ? cat.color
                      : isDarkMode ? '#FFFFFF' : '#595959',
                    fontSize: 14,
                    fontWeight: activeCategory === cat.key ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span style={{ fontSize: 16 }}>{cat.icon}</span>
                  {cat.label}
                  {activeCategory === cat.key && (
                    <span style={{
                      background: cat.color,
                      color: '#FFFFFF',
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 600,
                    }}>
                      {getFilteredProducts().length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Products Display */}
          <div style={{ 
            flex: 1,
            overflowY: 'auto',
            padding: viewMode === 'grid' ? 12 : 0,
          }}>
            {viewMode === 'grid' ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: screens.xl 
                  ? 'repeat(auto-fill, minmax(200px, 1fr))'
                  : screens.lg 
                  ? 'repeat(auto-fill, minmax(180px, 1fr))'
                  : screens.md
                  ? 'repeat(auto-fill, minmax(160px, 1fr))'
                  : screens.sm
                  ? 'repeat(auto-fill, minmax(150px, 1fr))'
                  : 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: 12,
                width: '100%',
              }}>
                {getFilteredProducts().map(product => {
                  const categoryColor = categories.find(c => c.key === product.category)?.color || '#00A6B8';
                  const categoryIcon = categories.find(c => c.key === product.category)?.icon || '📦';
                  return (
                    <motion.div
                      key={product.id}
                      whileHover={{ scale: product.stock > 0 ? 1.02 : 1 }}
                      whileTap={{ scale: product.stock > 0 ? 0.98 : 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <Card
                          onClick={() => addToCart(product)}
                          style={{
                            height: '100%',
                            minHeight: 230,
                            cursor: product.stock > 0 ? 'pointer' : 'not-allowed',
                            opacity: product.stock === 0 ? 0.5 : 1,
                            borderRadius: 16,
                            overflow: 'hidden',
                            border: isDarkMode 
                              ? '1px solid rgba(255,255,255,0.06)' 
                              : '1px solid rgba(0,0,0,0.04)',
                            background: isDarkMode
                              ? 'linear-gradient(145deg, #1A2332 0%, #141921 100%)'
                              : 'linear-gradient(145deg, #FFFFFF 0%, #FAFBFC 100%)',
                            boxShadow: product.stock > 0
                              ? isDarkMode
                                ? '0 4px 16px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)'
                                : '0 4px 16px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.02)'
                              : 'none',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          }}
                          styles={{ body: { padding: 0 } }}
                          hoverable={false}
                        >
                          {/* Product Image */}
                          <div style={{ 
                            position: 'relative',
                            height: 120,
                            background: isDarkMode
                              ? `linear-gradient(135deg, ${categoryColor}10 0%, ${categoryColor}05 100%)`
                              : `linear-gradient(135deg, ${categoryColor}05 0%, ${categoryColor}02 100%)`,
                            borderBottom: `1px solid ${isDarkMode 
                              ? `${categoryColor}15` 
                              : `${categoryColor}08`}`,
                            overflow: 'hidden',
                          }}>
                            <img 
                              src={product.image}
                              alt={product.name}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                filter: product.stock === 0 ? 'grayscale(100%)' : 'none',
                                transition: 'transform 0.3s',
                              }}
                              onMouseEnter={(e) => {
                                if (product.stock > 0) {
                                  e.currentTarget.style.transform = 'scale(1.05)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                              }}
                              onError={(e) => {
                                // Fallback to placeholder if image fails to load
                                e.currentTarget.src = `https://via.placeholder.com/300x300/00A6B8/FFFFFF?text=${categoryIcon}`;
                              }}
                            />
                            
                            {/* Category Badge */}
                            <div style={{
                              position: 'absolute',
                              bottom: 8,
                              left: 8,
                              padding: '4px 8px',
                              borderRadius: 12,
                              background: isDarkMode
                                ? 'rgba(0,0,0,0.7)'
                                : 'rgba(255,255,255,0.9)',
                              backdropFilter: 'blur(8px)',
                              border: `1px solid ${isDarkMode 
                                ? 'rgba(255,255,255,0.1)' 
                                : 'rgba(0,0,0,0.1)'}`,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}>
                              <span style={{ fontSize: 12 }}>{categoryIcon}</span>
                              <Text style={{ 
                                fontSize: 10,
                                fontWeight: 600,
                                color: categoryColor,
                                textTransform: 'uppercase',
                                letterSpacing: 0.5,
                              }}>
                                {categories.find(c => c.key === product.category)?.label}
                              </Text>
                            </div>
                            
                            {/* Stock Badge */}
                            {product.stock <= 5 && product.stock > 0 && (
                              <div style={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                background: 'linear-gradient(135deg, #ff6b6b 0%, #ff4444 100%)',
                                color: '#FFFFFF',
                                padding: '3px 8px',
                                borderRadius: 12,
                                fontSize: 10,
                                fontWeight: 600,
                                boxShadow: '0 2px 6px rgba(255,68,68,0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                              }}>
                                ⚠️ Sắp hết
                              </div>
                            )}
                            {product.stock === 0 && (
                              <div style={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                background: 'linear-gradient(135deg, #8c8c8c 0%, #595959 100%)',
                                color: '#FFFFFF',
                                padding: '3px 8px',
                                borderRadius: 12,
                                fontSize: 10,
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                              }}>
                                ❌ Hết hàng
                              </div>
                            )}
                          </div>
                          
                          {/* Product Details */}
                          <div style={{ padding: 14 }}>
                            {/* Product Name - Single Line */}
                            <div style={{ 
                              fontSize: 12, 
                              fontWeight: 600,
                              marginBottom: 3,
                              lineHeight: 1.2,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              color: isDarkMode ? '#FFFFFF' : '#1A2332',
                              letterSpacing: 0.1,
                            }}>
                              {product.name}
                            </div>
                            
                            {/* Barcode - Muted */}
                            <div style={{ 
                              fontSize: 10, 
                              color: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)',
                              marginBottom: 8,
                              fontFamily: 'monospace',
                              letterSpacing: 0.5,
                            }}>
                              {product.barcode}
                            </div>
                            
                            {/* Price */}
                            <div style={{ 
                              fontSize: 19,
                              fontWeight: 700,
                              background: `linear-gradient(135deg, ${categoryColor} 0%, ${categoryColor}CC 100%)`,
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              backgroundClip: 'text',
                              marginBottom: 10,
                              letterSpacing: -0.3,
                            }}>
                              {product.price.toLocaleString()}₫
                            </div>
                            
                            {/* Stock Info */}
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              gap: 6,
                              padding: '6px 10px',
                              background: isDarkMode
                                ? 'rgba(255,255,255,0.03)'
                                : 'rgba(0,0,0,0.02)',
                              borderRadius: 8,
                              border: `1px solid ${isDarkMode 
                                ? 'rgba(255,255,255,0.06)' 
                                : 'rgba(0,0,0,0.04)'}`,
                            }}>
                              <div style={{
                                width: 5,
                                height: 5,
                                borderRadius: '50%',
                                background: product.stock > 10 ? '#52c41a' : 
                                            product.stock > 0 ? '#fa8c16' : '#ff4d4f',
                              }} />
                              <Text style={{ 
                                fontSize: 11,
                                fontWeight: 500,
                                color: isDarkMode ? 'rgba(255,255,255,0.65)' : '#595959',
                              }}>
                                Kho: {product.stock}
                              </Text>
                              <Text style={{ 
                                fontSize: 10,
                                color: isDarkMode ? 'rgba(255,255,255,0.45)' : '#8c8c8c',
                                fontStyle: 'italic',
                              }}>
                                /{product.unit}
                              </Text>
                            </div>
                          </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <List
                dataSource={getFilteredProducts()}
                renderItem={product => {
                  const categoryColor = categories.find(c => c.key === product.category)?.color || '#00A6B8';
                  return (
                    <List.Item
                      style={{
                        padding: '12px 16px',
                        borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : '#F0F0F0'}`,
                        cursor: product.stock > 0 ? 'pointer' : 'not-allowed',
                        opacity: product.stock === 0 ? 0.6 : 1,
                        transition: 'background 0.2s',
                      }}
                      onClick={() => addToCart(product)}
                      onMouseEnter={(e) => {
                        if (product.stock > 0) {
                          e.currentTarget.style.background = isDarkMode 
                            ? 'rgba(255,255,255,0.02)' 
                            : 'rgba(0,0,0,0.02)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <List.Item.Meta
                        avatar={
                          <div style={{
                            width: 64,
                            height: 64,
                            borderRadius: 8,
                            overflow: 'hidden',
                            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}`,
                            position: 'relative',
                          }}>
                            <img 
                              src={product.image}
                              alt={product.name}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                filter: product.stock === 0 ? 'grayscale(100%)' : 'none',
                              }}
                              onError={(e) => {
                                e.currentTarget.src = `https://via.placeholder.com/64x64/00A6B8/FFFFFF?text=${categoryIcon}`;
                              }}
                            />
                            {/* Small category badge */}
                            <div style={{
                              position: 'absolute',
                              bottom: 2,
                              right: 2,
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              background: isDarkMode
                                ? 'rgba(0,0,0,0.7)'
                                : 'rgba(255,255,255,0.9)',
                              backdropFilter: 'blur(4px)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 10,
                              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
                            }}>
                              {categoryIcon}
                            </div>
                          </div>
                        }
                        title={
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Text strong>{product.name}</Text>
                            {product.stock <= 5 && product.stock > 0 && (
                              <Tag color="orange" style={{ fontSize: 10 }}>Sắp hết</Tag>
                            )}
                          </div>
                        }
                        description={
                          <Space size={12}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {product.barcode}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Kho: {product.stock} {product.unit}
                            </Text>
                          </Space>
                        }
                      />
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: categoryColor }}>
                          {product.price.toLocaleString()}₫
                        </div>
                        <Button
                          type="primary"
                          size="small"
                          icon={<PlusOutlined />}
                          disabled={product.stock === 0}
                          style={{ marginTop: 4 }}
                        >
                          Thêm
                        </Button>
                      </div>
                    </List.Item>
                  );
                }}
              />
            )}
            
            {getFilteredProducts().length === 0 && (
              <Empty 
                description="Không tìm thấy sản phẩm"
                style={{ marginTop: 100 }}
              />
            )}
          </div>

          {/* Held Invoices Bar */}
          {holdInvoices.length > 0 && (
            <div style={{ 
              padding: '10px 16px',
              borderTop: `2px solid ${isDarkMode ? 'rgba(255,152,0,0.3)' : 'rgba(255,152,0,0.2)'}`,
              background: `linear-gradient(90deg, ${isDarkMode ? 'rgba(255,152,0,0.15)' : 'rgba(255,152,0,0.08)'} 0%, ${isDarkMode ? 'rgba(255,152,0,0.05)' : 'rgba(255,152,0,0.02)'} 100%)`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, overflowX: 'auto' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontWeight: 600,
                  fontSize: 13,
                  color: '#fa8c16',
                  whiteSpace: 'nowrap',
                }}>
                  <PauseOutlined />
                  Đang giữ ({holdInvoices.length})
                </div>
                {holdInvoices.map(invoice => (
                  <motion.div
                    key={invoice.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Tag
                      color="orange"
                      style={{ 
                        cursor: 'pointer',
                        borderRadius: 6,
                        padding: '4px 12px',
                        fontSize: 13,
                        border: '1px solid #ffd591',
                      }}
                      onClick={() => restoreInvoice(invoice)}
                    >
                      <FileTextOutlined /> {invoice.id}
                      <Divider type="vertical" style={{ margin: '0 8px' }} />
                      <strong>{invoice.total.toLocaleString()}₫</strong>
                    </Tag>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Cart & Payment */}
        <div style={{ 
          flex: '0 0 35%',
          minWidth: 400,
          display: 'flex', 
          flexDirection: 'column',
          background: isDarkMode ? '#0F1419' : '#FAFBFC',
        }}>
          
          {/* Cart Header with Customer */}
          <div style={{ 
            padding: '12px 16px',
            borderBottom: `2px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : '#E8E8E8'}`,
            background: isDarkMode ? '#1A2332' : '#FFFFFF',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShoppingCartOutlined style={{ fontSize: 18, color: '#00A6B8' }} />
                <Text strong style={{ fontSize: 16 }}>
                  Giỏ hàng
                </Text>
                {cart.length > 0 && (
                  <Badge 
                    count={cart.length} 
                    style={{ backgroundColor: '#00A6B8' }}
                  />
                )}
              </div>
              {cart.length > 0 && (
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {cart.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm
                </Text>
              )}
            </div>
            
            {selectedCustomer ? (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: `linear-gradient(135deg, ${isDarkMode ? 'rgba(0,166,184,0.15)' : 'rgba(0,166,184,0.08)'} 0%, ${isDarkMode ? 'rgba(0,166,184,0.05)' : 'rgba(0,166,184,0.02)'} 100%)`,
                  borderRadius: 8,
                  border: `1px solid ${isDarkMode ? 'rgba(0,166,184,0.3)' : 'rgba(0,166,184,0.2)'}`,
                }}
              >
                <Space size={12}>
                  <Avatar size={36} style={{ backgroundColor: '#00A6B8' }}>
                    {selectedCustomer.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Text strong style={{ fontSize: 14 }}>{selectedCustomer.name}</Text>
                      {selectedCustomer.type === 'vip' && (
                        <Tag color="gold" style={{ margin: 0, fontSize: 10 }}>VIP</Tag>
                      )}
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {selectedCustomer.phone} • {selectedCustomer.points} điểm
                    </Text>
                  </div>
                </Space>
                <Button 
                  size="small" 
                  type="text" 
                  icon={<CloseOutlined />}
                  onClick={() => setSelectedCustomer(null)}
                  style={{ color: '#999' }}
                />
              </motion.div>
            ) : (
              <Button 
                block 
                type="dashed"
                icon={<UserOutlined />}
                onClick={() => setCustomerModalVisible(true)}
                style={{ 
                  height: 40,
                  borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#d9d9d9',
                }}
              >
                Thêm khách hàng (F2)
              </Button>
            )}
          </div>

          {/* Cart Items */}
          <div style={{ 
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
          }}>
            {cart.length > 0 ? (
              <Table
                dataSource={cart}
                columns={cartColumns}
                pagination={false}
                size="small"
                rowKey="id"
                scroll={{ y: 'calc(100vh - 420px)' }}
              />
            ) : (
              <div style={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 40,
              }}>
                <ShoppingCartOutlined style={{ fontSize: 64, color: '#d9d9d9', marginBottom: 16 }} />
                <Text type="secondary" style={{ fontSize: 16 }}>Giỏ hàng trống</Text>
                <Text type="secondary" style={{ fontSize: 13, marginTop: 8 }}>
                  Quét mã vạch hoặc chọn sản phẩm để thêm vào giỏ
                </Text>
              </div>
            )}
          </div>

          {/* Summary & Actions */}
          <div style={{ 
            borderTop: `2px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : '#E8E8E8'}`,
            background: isDarkMode ? '#1A2332' : '#FFFFFF',
          }}>
            {/* Payment Summary */}
            <div style={{ 
              padding: '16px',
              background: isDarkMode ? 'rgba(0,166,184,0.05)' : 'rgba(0,166,184,0.02)',
            }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr auto',
                gap: 8,
                marginBottom: 12,
              }}>
                <Text style={{ fontSize: 13, color: isDarkMode ? 'rgba(255,255,255,0.65)' : '#8c8c8c' }}>
                  Tạm tính:
                </Text>
                <Text style={{ fontSize: 13, textAlign: 'right' }}>
                  {subtotal.toLocaleString()}₫
                </Text>
                
                {discount > 0 && (
                  <>
                    <Text style={{ fontSize: 13, color: '#ff4d4f' }}>Giảm giá:</Text>
                    <Text style={{ fontSize: 13, color: '#ff4d4f', textAlign: 'right' }}>
                      -{discount.toLocaleString()}₫
                    </Text>
                  </>
                )}
                
                <Text style={{ fontSize: 13, color: isDarkMode ? 'rgba(255,255,255,0.65)' : '#8c8c8c' }}>
                  VAT (10%):
                </Text>
                <Text style={{ fontSize: 13, textAlign: 'right' }}>
                  {tax.toLocaleString()}₫
                </Text>
              </div>
              
              <div style={{ 
                padding: '12px',
                background: isDarkMode ? 'rgba(0,166,184,0.1)' : '#FFFFFF',
                borderRadius: 8,
                border: `2px solid ${isDarkMode ? 'rgba(0,166,184,0.3)' : '#00A6B8'}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CalculatorOutlined style={{ fontSize: 20, color: '#00A6B8' }} />
                    <Text strong style={{ fontSize: 16 }}>Tổng cộng:</Text>
                  </div>
                  <Text strong style={{ 
                    fontSize: 28, 
                    color: '#00A6B8',
                    fontWeight: 700,
                  }}>
                    {total.toLocaleString()}₫
                  </Text>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ padding: '0 16px 16px' }}>
              <Row gutter={8} style={{ marginBottom: 8 }}>
                <Col span={8}>
                  <Button 
                    block 
                    size="large"
                    icon={<PauseOutlined />}
                    onClick={holdInvoice}
                    disabled={cart.length === 0}
                    style={{ height: 44 }}
                  >
                    Giữ (F3)
                  </Button>
                </Col>
                <Col span={8}>
                  <Button 
                    block 
                    size="large"
                    icon={<PercentageOutlined />}
                    disabled={cart.length === 0}
                    style={{ height: 44 }}
                  >
                    Giảm giá
                  </Button>
                </Col>
                <Col span={8}>
                  <Button 
                    block 
                    size="large"
                    danger
                    icon={<ClearOutlined />}
                    onClick={clearCart}
                    disabled={cart.length === 0}
                    style={{ height: 44 }}
                  >
                    Xóa (Ctrl+Del)
                  </Button>
                </Col>
              </Row>
              
              <Button 
                block 
                type="primary"
                size="large"
                icon={<DollarOutlined />}
                onClick={processPayment}
                disabled={cart.length === 0}
                style={{
                  height: 60,
                  fontSize: 20,
                  fontWeight: 600,
                  background: cart.length > 0 
                    ? 'linear-gradient(135deg, #00A6B8 0%, #26C6DA 100%)'
                    : undefined,
                  border: 'none',
                }}
              >
                THANH TOÁN (F4)
              </Button>
            </div>
          </div>
        </div>

        {/* Payment Modal */}
        <Modal
          title={
            <div style={{ fontSize: 18, fontWeight: 600 }}>
              Thanh toán hóa đơn
            </div>
          }
          open={paymentModalVisible}
          onCancel={() => setPaymentModalVisible(false)}
          width={650}
          footer={null}
          centered
        >
          <div style={{ padding: '20px 0' }}>
            {/* Total Amount */}
            <Card style={{ 
              background: isDarkMode ? 'rgba(0,166,184,0.1)' : 'rgba(0,166,184,0.05)',
              marginBottom: 24,
              borderRadius: 8,
            }}>
              <Statistic
                title="Tổng tiền thanh toán"
                value={total}
                suffix="VNĐ"
                valueStyle={{ 
                  color: '#00A6B8', 
                  fontSize: 36,
                  fontWeight: 700,
                }}
              />
            </Card>

            {/* Payment Method */}
            <div style={{ marginBottom: 24 }}>
              <Text strong style={{ fontSize: 14, marginBottom: 12, display: 'block' }}>
                Phương thức thanh toán
              </Text>
              <Radio.Group 
                value={paymentMethod} 
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={{ width: '100%' }}
                size="large"
              >
                <Row gutter={[12, 12]}>
                  <Col span={12}>
                    <Radio.Button value="cash" style={{ 
                      width: '100%', 
                      height: 50,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <DollarOutlined style={{ marginRight: 8 }} />
                      Tiền mặt
                    </Radio.Button>
                  </Col>
                  <Col span={12}>
                    <Radio.Button value="card" style={{ 
                      width: '100%',
                      height: 50,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <CreditCardOutlined style={{ marginRight: 8 }} />
                      Thẻ
                    </Radio.Button>
                  </Col>
                  <Col span={12}>
                    <Radio.Button value="transfer" style={{ 
                      width: '100%',
                      height: 50,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <BankOutlined style={{ marginRight: 8 }} />
                      Chuyển khoản
                    </Radio.Button>
                  </Col>
                  <Col span={12}>
                    <Radio.Button value="qr" style={{ 
                      width: '100%',
                      height: 50,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <QrcodeOutlined style={{ marginRight: 8 }} />
                      QR Code
                    </Radio.Button>
                  </Col>
                </Row>
              </Radio.Group>
            </div>

            {/* Cash Payment Details */}
            {paymentMethod === 'cash' && (
              <div>
                <Text strong style={{ fontSize: 14, marginBottom: 12, display: 'block' }}>
                  Tiền khách đưa
                </Text>
                
                <InputNumber
                  size="large"
                  style={{ width: '100%', fontSize: 24, marginBottom: 16 }}
                  value={receivedAmount}
                  onChange={(value) => setReceivedAmount(value || 0)}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                  addonAfter="VNĐ"
                />
                
                {/* Quick amount buttons */}
                <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
                  {QUICK_AMOUNTS.map(amount => (
                    <Col span={6} key={amount}>
                      <Button
                        block
                        onClick={() => setReceivedAmount(amount)}
                        style={{ height: 40 }}
                      >
                        {(amount / 1000).toFixed(0)}k
                      </Button>
                    </Col>
                  ))}
                </Row>
                
                {/* Change calculation */}
                {receivedAmount >= total && (
                  <Card style={{ 
                    background: 'rgba(82,196,26,0.1)',
                    borderColor: '#52c41a',
                    borderRadius: 8,
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <Text style={{ fontSize: 16 }}>Tiền thừa:</Text>
                      <Text strong style={{ fontSize: 24, color: '#52c41a' }}>
                        {(receivedAmount - total).toLocaleString()} VNĐ
                      </Text>
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ marginTop: 24 }}>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button 
                  size="large" 
                  onClick={() => setPaymentModalVisible(false)}
                  style={{ minWidth: 100 }}
                >
                  Hủy
                </Button>
                <Button 
                  type="primary" 
                  size="large"
                  icon={<CheckOutlined />}
                  loading={loading}
                  onClick={completePayment}
                  disabled={paymentMethod === 'cash' && receivedAmount < total}
                  style={{
                    minWidth: 150,
                    background: 'linear-gradient(135deg, #00A6B8 0%, #26C6DA 100%)',
                    border: 'none',
                  }}
                >
                  Xác nhận
                </Button>
              </Space>
            </div>
          </div>
        </Modal>

        {/* Customer Selection Modal */}
        <Modal
          title="Chọn khách hàng"
          open={customerModalVisible}
          onCancel={() => setCustomerModalVisible(false)}
          width={500}
          footer={null}
        >
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            <Search 
              placeholder="Tìm theo tên hoặc số điện thoại"
              size="large"
            />
            
            <List
              dataSource={mockCustomers}
              renderItem={(customer) => (
                <List.Item
                  style={{ 
                    cursor: 'pointer',
                    padding: '12px 16px',
                    borderRadius: 8,
                    transition: 'background 0.2s',
                  }}
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setCustomerModalVisible(false);
                    message.success(`Đã chọn khách hàng ${customer.name}`);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = isDarkMode 
                      ? 'rgba(255,255,255,0.05)' 
                      : 'rgba(0,0,0,0.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <List.Item.Meta
                    avatar={<Avatar size={40} icon={<UserOutlined />} />}
                    title={
                      <Space>
                        <Text strong>{customer.name}</Text>
                        {customer.type === 'vip' && <Tag color="gold">VIP</Tag>}
                      </Space>
                    }
                    description={`${customer.phone} • ${customer.points} điểm tích lũy`}
                  />
                </List.Item>
              )}
            />
            
            <Button block size="large" icon={<PlusOutlined />}>
              Thêm khách hàng mới
            </Button>
          </Space>
        </Modal>
      </div>
    </POSLayout>
  );
};

export default POSSales;