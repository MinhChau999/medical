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
import { InvoiceGenerator, InvoiceData, InvoiceItem } from '@/utils/invoiceGenerator';
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

// Helper function to get category color
const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    device: '#2196F3',      // Blue
    consumable: '#4CAF50',  // Green
    medicine: '#F44336',    // Red
    equipment: '#9C27B0',   // Purple
    accessory: '#FF9800',   // Orange
    test: '#00BCD4',        // Cyan
  };
  return colors[category] || '#009688';
};

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
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const barcodeInputRef = useRef<any>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // Add CSS animations
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInScale {
        from {
          opacity: 0;
          transform: scale(0.95);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
      
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes pulse {
        0%, 100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.05);
        }
      }
      
      .payment-modal-content {
        animation: fadeInScale 0.3s ease-out;
      }
      
      .payment-method-card {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      .payment-method-card:hover {
        transform: translateY(-2px);
      }
      
      .quick-amount-btn {
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      .quick-amount-btn:hover {
        transform: scale(1.05);
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

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
    { key: 'all', label: 'Tất cả', icon: '🌈', color: '#607D8B' },
    { key: 'device', label: 'Thiết bị', icon: '💻', color: '#2196F3' },
    { key: 'consumable', label: 'Vật tư', icon: '🧴', color: '#4CAF50' },
    { key: 'test', label: 'Que test', icon: '🧪', color: '#00BCD4' },
    { key: 'medicine', label: 'Thuốc', icon: '💉', color: '#F44336' },
    { key: 'equipment', label: 'Dụng cụ', icon: '🔬', color: '#9C27B0' },
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

  // Print temporary invoice (for preview)
  const printTempInvoice = async () => {
    if (cart.length === 0) {
      message.warning('Giỏ hàng trống');
      return;
    }

    message.info('Đang in hóa đơn tạm...');
    
    const { subtotal, discount, tax, total } = calculateTotals();
    
    // Prepare invoice data
    const invoiceItems: InvoiceItem[] = cart.map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      notes: item.unit,
    }));
    
    const invoiceData: InvoiceData = {
      id: `TMP${Date.now()}`,
      orderNumber: `TMP${Date.now()}`,
      customerName: selectedCustomer?.name || 'Khách lẻ',
      items: invoiceItems,
      subtotal,
      discount,
      tax,
      total,
      paymentMethod: 'Chưa thanh toán',
      createdAt: new Date(),
      cashier: 'Staff',
      restaurantInfo: {
        name: 'Medical Electronics Store',
        address: '123 Nguyễn Văn Linh, Q7, TP.HCM',
        phone: '028 1234 5678',
        taxId: '0123456789',
      },
    };
    
    // Print the invoice
    try {
      await InvoiceGenerator.printInvoice(invoiceData);
      message.success('Đã in hóa đơn tạm');
    } catch (error) {
      message.error('Không thể in hóa đơn');
      console.error('Print error:', error);
    }
  };

  // Print receipt
  const printReceipt = async () => {
    message.info('Đang in hóa đơn...');
    
    // Prepare invoice data
    const invoiceItems: InvoiceItem[] = cart.map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      notes: item.unit,
    }));
    
    const invoiceData: InvoiceData = {
      id: `HD${Date.now()}`,
      orderNumber: `HD${Date.now()}`,
      customerName: selectedCustomer?.name,
      items: invoiceItems,
      subtotal,
      discount: discountAmount,
      tax: taxAmount,
      total,
      paymentMethod: paymentMethod === 'cash' ? 'Tiền mặt' : 
                     paymentMethod === 'card' ? 'Thẻ' : 
                     paymentMethod === 'transfer' ? 'Chuyển khoản' : 'QR',
      createdAt: new Date(),
      cashier: 'Staff',
      restaurantInfo: {
        name: 'Medical Electronics Store',
        address: '123 Nguyễn Văn Linh, Q7, TP.HCM',
        phone: '028 1234 5678',
        taxId: '0123456789',
      },
      bankInfo: paymentMethod === 'qr' || paymentMethod === 'transfer' ? {
        accountName: 'MEDICAL ELECTRONICS STORE',
        accountNumber: '1234567890',
        bankName: 'Vietcombank',
      } : undefined,
    };
    
    // Print the invoice
    try {
      await InvoiceGenerator.printInvoice(
        invoiceData, 
        paymentMethod === 'qr' ? qrCodeUrl : undefined
      );
      message.success('Đã in hóa đơn');
    } catch (error) {
      message.error('Không thể in hóa đơn');
      console.error('Print error:', error);
    }
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
                                color: '#9E9E9E',
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
                                background: 'linear-gradient(135deg, #FF5252 0%, #F44336 100%)',
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
                                background: 'linear-gradient(135deg, #9E9E9E 0%, #616161 100%)',
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
                              background: 'linear-gradient(135deg, #2196F3 0%, #2196F3DD 100%)',
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
              <div style={{
                maxWidth: '800px',
                width: '100%',
                margin: '0 auto',
              }}>
                <List
                  dataSource={getFilteredProducts()}
                renderItem={product => {
                  const categoryColor = categories.find(c => c.key === product.category)?.color || '#00A6B8';
                  const categoryIcon = categories.find(c => c.key === product.category)?.icon || '📦';
                  return (
                    <List.Item
                      style={{
                        padding: '8px 12px',
                        borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : '#F0F0F0'}`,
                        cursor: product.stock > 0 ? 'pointer' : 'not-allowed',
                        opacity: product.stock === 0 ? 0.6 : 1,
                        transition: 'background 0.2s',
                        minHeight: 'auto',
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
                            width: 48,
                            height: 48,
                            borderRadius: 6,
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
                              bottom: 1,
                              right: 1,
                              width: 16,
                              height: 16,
                              borderRadius: '50%',
                              background: isDarkMode
                                ? 'rgba(0,0,0,0.7)'
                                : 'rgba(255,255,255,0.9)',
                              backdropFilter: 'blur(4px)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 8,
                              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
                            }}>
                              {categoryIcon}
                            </div>
                          </div>
                        }
                        title={
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Text strong style={{ fontSize: 14 }}>{product.name}</Text>
                            {product.stock <= 5 && product.stock > 0 && (
                              <Tag color="orange" style={{ fontSize: 10 }}>Sắp hết</Tag>
                            )}
                          </div>
                        }
                        description={
                          <Space size={12}>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              {product.barcode}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              Kho: {product.stock} {product.unit}
                            </Text>
                          </Space>
                        }
                      />
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#2196F3' }}>
                          {product.price.toLocaleString()}₫
                        </div>
                        <Button
                          size="small"
                          icon={<PlusOutlined />}
                          disabled={product.stock === 0}
                          style={{ 
                            marginTop: 2,
                            background: product.stock > 0 ? 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)' : undefined,
                            borderColor: '#4CAF50',
                            color: product.stock > 0 ? '#FFFFFF' : undefined,
                          }}
                        >
                          Thêm
                        </Button>
                      </div>
                    </List.Item>
                  );
                }}
              />
              </div>
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
          
          {/* Beautiful Cart Header */}
          <div style={{ 
            padding: '8px',
            background: `linear-gradient(135deg, ${isDarkMode ? '#2D1B69' : '#FFF8F3'} 0%, ${isDarkMode ? '#0F1419' : '#F3E5F5'} 100%)`,
            borderBottom: `2px solid ${isDarkMode ? 'rgba(255,87,34,0.15)' : 'rgba(255,87,34,0.1)'}`,
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Decorative Background Pattern */}
            <div style={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${isDarkMode ? 'rgba(0,166,184,0.1)' : 'rgba(0,166,184,0.05)'} 0%, transparent 70%)`,
            }} />
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShoppingCartOutlined style={{ fontSize: 18, color: '#FF5722' }} />
                <Text strong style={{ 
                  fontSize: 14,
                  color: isDarkMode ? '#FF8A65' : '#FF5722',
                }}>
                  Giỏ hàng ({cart.reduce((sum, item) => sum + item.quantity, 0)})
                </Text>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {!selectedCustomer && (
                  <Button
                    size="small"
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() => setCustomerModalVisible(true)}
                    style={{
                      fontSize: 11,
                      height: 24,
                      padding: '0 8px',
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#d9d9d9',
                    }}
                  >
                    Thêm khách hàng
                  </Button>
                )}
                {cart.length > 0 && (
                  <Button
                    type="text"
                    size="small"
                    icon={<ClearOutlined />}
                    onClick={clearCart}
                    style={{
                      color: '#ff4d4f',
                      fontSize: 11,
                      padding: '2px 6px',
                      height: 24,
                    }}
                  >
                    Xóa
                  </Button>
                )}
              </div>
            </div>
            
            {selectedCustomer && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  background: `linear-gradient(135deg, ${isDarkMode ? 'rgba(0,166,184,0.15)' : 'rgba(0,166,184,0.08)'} 0%, ${isDarkMode ? 'rgba(0,166,184,0.05)' : 'rgba(0,166,184,0.02)'} 100%)`,
                  borderRadius: 6,
                  border: `1px solid ${isDarkMode ? 'rgba(0,166,184,0.3)' : 'rgba(0,166,184,0.2)'}`,
                  marginBottom: 8,
                }}
              >
                <Space size={8}>
                  <Avatar size={28} style={{ backgroundColor: '#00A6B8' }}>
                    {selectedCustomer.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Text strong style={{ fontSize: 12 }}>{selectedCustomer.name}</Text>
                      {selectedCustomer.type === 'vip' && (
                        <Tag color="gold" style={{ margin: 0, fontSize: 9, padding: '0 4px', lineHeight: '14px' }}>VIP</Tag>
                      )}
                    </div>
                    <Text type="secondary" style={{ fontSize: 10 }}>
                      {selectedCustomer.phone} • {selectedCustomer.points} điểm
                    </Text>
                  </div>
                </Space>
                <Button 
                  size="small" 
                  type="text" 
                  icon={<CloseOutlined />}
                  onClick={() => setSelectedCustomer(null)}
                  style={{ color: '#999', padding: '2px', minWidth: 'auto', height: 'auto' }}
                />
              </motion.div>
            )}
          </div>

          {/* Beautiful Cart Items */}
          <div style={{ 
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            background: isDarkMode ? '#0F1419' : '#FAFBFC',
            padding: '12px',
          }}>
            {cart.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {cart.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    style={{
                      background: isDarkMode ? '#1A2332' : '#FFFFFF',
                      borderRadius: 8,
                      padding: 8,
                      border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                      boxShadow: isDarkMode 
                        ? '0 1px 4px rgba(0,0,0,0.2)'
                        : '0 1px 4px rgba(0,0,0,0.04)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateX(-2px)';
                      e.currentTarget.style.boxShadow = isDarkMode
                        ? '0 2px 8px rgba(0,166,184,0.2)'
                        : '0 2px 8px rgba(0,166,184,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.boxShadow = isDarkMode
                        ? '0 1px 4px rgba(0,0,0,0.2)'
                        : '0 1px 4px rgba(0,0,0,0.04)';
                    }}
                  >
                    {/* Product Info Row */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                      {/* Product Image */}
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        background: `linear-gradient(135deg, #9C27B022 0%, #9C27B011 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        border: `1px solid #9C27B033`,
                      }}>
                        <MedicineBoxOutlined style={{ 
                          fontSize: 16, 
                          color: '#9C27B0',
                        }} />
                      </div>
                      
                      {/* Product Details */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ 
                          fontSize: 12,
                          fontWeight: 600,
                          color: isDarkMode ? '#FFFFFF' : '#1A2332',
                          marginBottom: 2,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {item.name}
                        </div>
                        <div style={{ 
                          fontSize: 10,
                          color: isDarkMode ? 'rgba(255,255,255,0.45)' : '#8c8c8c',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}>
                          <span>{item.barcode}</span>
                          <span>•</span>
                          <span style={{ color: '#9C27B0' }}>
                            {categories.find(c => c.key === item.category)?.label}
                          </span>
                        </div>
                      </div>
                      
                      {/* Delete Button */}
                      <Button
                        type="text"
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromCart(item.id);
                        }}
                        style={{
                          color: '#ff4d4f',
                          opacity: 0.7,
                          transition: 'opacity 0.2s',
                          padding: '2px 6px',
                          minWidth: 'auto',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                      />
                    </div>
                    
                    {/* Quantity and Price Row */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}>
                      {/* Quantity Controls */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0,
                        background: isDarkMode 
                          ? 'rgba(255,255,255,0.05)' 
                          : 'rgba(0,0,0,0.02)',
                        borderRadius: 6,
                        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}`,
                        overflow: 'hidden',
                      }}>
                        <Button
                          type="text"
                          size="small"
                          icon={<MinusOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQuantity(item.id, Math.max(1, item.quantity - 1));
                          }}
                          style={{
                            borderRadius: 0,
                            width: 24,
                            height: 24,
                            minWidth: 24,
                            padding: 0,
                            fontSize: 12,
                            color: isDarkMode ? '#FFFFFF' : '#1A2332',
                          }}
                        />
                        <div style={{
                          width: 32,
                          height: 24,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 600,
                          color: isDarkMode ? '#FFFFFF' : '#1A2332',
                          borderLeft: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}`,
                          borderRight: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}`,
                        }}>
                          {item.quantity}
                        </div>
                        <Button
                          type="text"
                          size="small"
                          icon={<PlusOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQuantity(item.id, item.quantity + 1);
                          }}
                          style={{
                            borderRadius: 0,
                            width: 24,
                            height: 24,
                            minWidth: 24,
                            padding: 0,
                            fontSize: 12,
                            color: isDarkMode ? '#FFFFFF' : '#1A2332',
                          }}
                        />
                      </div>
                      
                      {/* Price Display */}
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ 
                          fontSize: 10,
                          color: '#2196F3',
                          opacity: 0.7,
                        }}>
                          {item.price.toLocaleString()}₫ x {item.quantity}
                        </div>
                        <div style={{ 
                          fontSize: 13,
                          fontWeight: 700,
                          color: '#2196F3',
                        }}>
                          {(item.price * item.quantity).toLocaleString()}₫
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 40,
                }}
              >
                <div style={{
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  background: isDarkMode 
                    ? 'linear-gradient(135deg, rgba(0,166,184,0.1) 0%, rgba(0,166,184,0.05) 100%)'
                    : 'linear-gradient(135deg, rgba(0,166,184,0.08) 0%, rgba(0,166,184,0.02) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 24,
                  border: `2px dashed ${isDarkMode ? 'rgba(0,166,184,0.2)' : 'rgba(0,166,184,0.15)'}`,
                }}>
                  <ShoppingCartOutlined style={{ 
                    fontSize: 48, 
                    color: '#00A6B8',
                    opacity: 0.5,
                  }} />
                </div>
                <Text style={{ 
                  fontSize: 18,
                  fontWeight: 600,
                  color: isDarkMode ? 'rgba(255,255,255,0.65)' : '#595959',
                  marginBottom: 8,
                }}>
                  Giỏ hàng trống
                </Text>
                <Text type="secondary" style={{ 
                  fontSize: 14,
                  textAlign: 'center',
                  lineHeight: 1.6,
                }}>
                  Quét mã vạch hoặc chọn sản phẩm<br />để thêm vào giỏ hàng
                </Text>
                <div style={{
                  marginTop: 24,
                  padding: '8px 16px',
                  background: isDarkMode
                    ? 'rgba(255,255,255,0.05)'
                    : 'rgba(0,0,0,0.02)',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  <BarcodeOutlined style={{ color: '#00A6B8' }} />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Nhấn F1 để focus vào ô quét mã
                  </Text>
                </div>
              </motion.div>
            )}
          </div>

          {/* Beautiful Summary & Actions */}
          <div style={{ 
            background: `linear-gradient(180deg, ${isDarkMode ? '#1A2332' : '#FFFFFF'} 0%, ${isDarkMode ? '#0F1419' : '#F8F9FA'} 100%)`,
            borderTop: `2px solid ${isDarkMode ? 'rgba(0,166,184,0.15)' : 'rgba(0,166,184,0.1)'}`,
          }}>
            {/* Compact Payment Summary */}
            <div style={{ 
              padding: '8px',
              background: isDarkMode 
                ? 'rgba(255,255,255,0.03)'
                : 'rgba(0,0,0,0.02)',
              position: 'relative',
            }}>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr auto',
                gap: 6,
                marginBottom: 8,
                position: 'relative',
                zIndex: 1,
              }}>
                <Text style={{ 
                  fontSize: 11, 
                  color: isDarkMode ? 'rgba(255,255,255,0.65)' : '#595959',
                }}>
                  Tạm tính
                </Text>
                <Text style={{ 
                  fontSize: 12, 
                  textAlign: 'right',
                  fontWeight: 500,
                  color: '#2196F3',
                }}>
                  {subtotal.toLocaleString()}₫
                </Text>
                
                {discount > 0 && (
                  <>
                    <Text style={{ 
                      fontSize: 11, 
                      color: '#ff4d4f',
                    }}>
                      Giảm giá
                    </Text>
                    <Text style={{ 
                      fontSize: 12, 
                      color: '#ff4d4f', 
                      textAlign: 'right',
                      fontWeight: 500,
                    }}>
                      -{discount.toLocaleString()}₫
                    </Text>
                  </>
                )}
                
                <Text style={{ 
                  fontSize: 13, 
                  color: isDarkMode ? 'rgba(255,255,255,0.65)' : '#595959',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  <div style={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: '#8c8c8c',
                  }} />
                  VAT (10%)
                </Text>
                <Text style={{ 
                  fontSize: 14, 
                  textAlign: 'right',
                  fontWeight: 500,
                  color: '#2196F3',
                }}>
                  {tax.toLocaleString()}₫
                </Text>
              </div>
              
              {/* Compact Total */}
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 8px',
                background: isDarkMode 
                  ? 'linear-gradient(135deg, #2A1547 0%, #1A0E2E 100%)'
                  : 'linear-gradient(135deg, #F3E5F5 0%, #FCE4EC 100%)',
                borderRadius: 6,
                border: `1px solid ${isDarkMode ? 'rgba(156,39,176,0.2)' : 'rgba(156,39,176,0.1)'}`,
              }}>
                <div>
                  <Text style={{ 
                    fontSize: 9,
                    color: isDarkMode ? 'rgba(255,255,255,0.7)' : '#7B1FA2',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    display: 'block',
                    marginBottom: 2,
                  }}>
                    Tổng cộng
                  </Text>
                  <div style={{ 
                    fontSize: 18,
                    fontWeight: 700,
                    color: isDarkMode ? '#FFFFFF' : '#9C27B0',
                    lineHeight: 1,
                  }}>
                    {total.toLocaleString()}₫
                  </div>
                </div>
                <div style={{
                  fontSize: 10,
                  color: isDarkMode ? 'rgba(255,255,255,0.6)' : '#8E24AA',
                }}>
                  {cart.length} mặt hàng
                </div>
              </div>
            </div>

            {/* Compact Action Buttons */}
            <div style={{ padding: '8px' }}>
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 4,
                marginBottom: 6,
              }}>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    block 
                    size="small"
                    icon={<PauseOutlined />}
                    onClick={holdInvoice}
                    style={{ 
                      height: 28,
                      borderRadius: 6,
                      background: isDarkMode ? 'rgba(76,175,80,0.1)' : 'rgba(76,175,80,0.05)',
                      border: `1px solid ${isDarkMode ? 'rgba(76,175,80,0.2)' : 'rgba(76,175,80,0.15)'}`,
                      color: '#4CAF50',
                      fontWeight: 500,
                      fontSize: 11,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                    disabled={cart.length === 0}
                  >
                    Giữ
                  </Button>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    block 
                    size="small"
                    icon={<PercentageOutlined />}
                    style={{ 
                      height: 28,
                      borderRadius: 6,
                      background: isDarkMode ? 'rgba(255,193,7,0.1)' : 'rgba(255,193,7,0.05)',
                      border: `1px solid ${isDarkMode ? 'rgba(255,193,7,0.2)' : 'rgba(255,193,7,0.15)'}`,
                      color: '#FFC107',
                      fontWeight: 500,
                      fontSize: 11,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                    disabled={cart.length === 0}
                  >
                    Giảm
                  </Button>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    block 
                    size="small"
                    icon={<ClearOutlined />}
                    onClick={clearCart}
                    style={{ 
                      height: 28,
                      borderRadius: 6,
                      background: isDarkMode ? 'rgba(239,83,80,0.1)' : 'rgba(239,83,80,0.05)',
                      border: `1px solid ${isDarkMode ? 'rgba(239,83,80,0.2)' : 'rgba(239,83,80,0.15)'}`,
                      color: '#EF5350',
                      fontWeight: 500,
                      fontSize: 11,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                    disabled={cart.length === 0}
                  >
                    Xóa
                  </Button>
                </motion.div>
              </div>
              
              {/* Print & Payment Buttons */}
              <div style={{ display: 'flex', gap: 4 }}>
                {/* Print Invoice Button */}
                <motion.div
                  whileHover={{ scale: cart.length > 0 ? 1.02 : 1 }}
                  whileTap={{ scale: cart.length > 0 ? 0.98 : 1 }}
                  style={{ flex: 1 }}
                >
                  <Button
                    block
                    size="middle"
                    icon={<PrinterOutlined />}
                    onClick={printTempInvoice}
                    disabled={cart.length === 0}
                    style={{
                      height: 36,
                      fontSize: 13,
                      fontWeight: 500,
                      borderColor: cart.length > 0
                        ? isDarkMode ? 'rgba(103,58,183,0.5)' : '#673AB7'
                        : isDarkMode ? 'rgba(255,255,255,0.1)' : '#e8e8e8',
                      color: cart.length > 0
                        ? isDarkMode ? '#B388FF' : '#673AB7'
                        : isDarkMode ? 'rgba(255,255,255,0.45)' : '#8c8c8c',
                      background: cart.length > 0
                        ? isDarkMode ? 'rgba(103,58,183,0.1)' : 'rgba(103,58,183,0.05)'
                        : 'transparent',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    In HĐ
                  </Button>
                </motion.div>

                {/* Payment Button */}
                <motion.div
                  whileHover={{ scale: cart.length > 0 ? 1.02 : 1 }}
                  whileTap={{ scale: cart.length > 0 ? 0.98 : 1 }}
                  style={{ flex: 2 }}
                >
                  <Button 
                  block 
                  type="primary"
                  size="middle"
                  icon={<WalletOutlined />}
                  onClick={processPayment}
                  disabled={cart.length === 0}
                  style={{
                    height: 36,
                    fontSize: 13,
                    fontWeight: 600,
                    background: cart.length > 0 
                      ? 'linear-gradient(135deg, #673AB7 0%, #3F51B5 100%)'
                      : isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    border: 'none',
                    borderRadius: 8,
                    color: cart.length > 0 ? '#fff' : isDarkMode ? 'rgba(255,255,255,0.45)' : '#8c8c8c',
                    boxShadow: cart.length > 0 ? '0 4px 12px rgba(103,58,183,0.25)' : 'none',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <span>Thanh toán</span>
                  {cart.length > 0 && (
                    <span style={{
                      padding: '2px 6px',
                      background: 'rgba(255,255,255,0.2)',
                      borderRadius: 6,
                      fontSize: 14,
                      fontWeight: 600,
                    }}>
                      {total.toLocaleString()}₫
                    </span>
                  )}
                </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Elegant Compact Payment Modal */}
        <Modal
          title={null}
          open={paymentModalVisible}
          onCancel={() => setPaymentModalVisible(false)}
          width={480}
          footer={null}
          centered
          closable={false}
          styles={{
            body: { padding: 0 },
            mask: { backdropFilter: 'blur(8px)' },
          }}
        >
          <div className="payment-modal-content">
            {/* Minimalist Header */}
            <div style={{
              padding: '16px 20px',
              background: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <WalletOutlined style={{ fontSize: 20, color: '#FFFFFF' }} />
                <div style={{ 
                  fontSize: 15, 
                  fontWeight: 600,
                  color: '#FFFFFF',
                  letterSpacing: 0.3,
                }}>
                  Thanh toán hóa đơn
                </div>
              </div>
              <Button
                type="text"
                icon={<CloseOutlined />}
                onClick={() => setPaymentModalVisible(false)}
                style={{
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: 14,
                }}
              />
            </div>

            <div style={{ padding: '16px' }}>
              {/* Compact Invoice Summary */}
              <div style={{
                background: isDarkMode
                  ? 'linear-gradient(135deg, rgba(103,58,183,0.08) 0%, rgba(103,58,183,0.03) 100%)'
                  : 'linear-gradient(135deg, #F5F3FF 0%, #FAFBFC 100%)',
                borderRadius: 10,
                padding: 12,
                marginBottom: 16,
                border: `1px solid ${isDarkMode ? 'rgba(103,58,183,0.2)' : 'rgba(103,58,183,0.1)'}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: '#667EEA',
                    }} />
                    <Text style={{ fontSize: 11, color: isDarkMode ? 'rgba(255,255,255,0.6)' : '#8c8c8c' }}>
                      HD{Date.now().toString().slice(-6)}
                    </Text>
                  </div>
                  <Text style={{ fontSize: 11, color: isDarkMode ? 'rgba(255,255,255,0.6)' : '#8c8c8c' }}>
                    {cart.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm
                  </Text>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: 8,
                  borderTop: `1px dashed ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                }}>
                  <Text style={{ fontSize: 12, fontWeight: 500 }}>Tổng thanh toán</Text>
                  <div style={{ 
                    fontSize: 24, 
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>
                    {total.toLocaleString()}₫
                  </div>
                </div>
              </div>

              {/* Elegant Payment Methods */}
              <div style={{ marginBottom: 16 }}>
                <Text style={{ 
                  fontSize: 11, 
                  marginBottom: 8, 
                  display: 'block',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  color: isDarkMode ? 'rgba(255,255,255,0.5)' : '#8c8c8c',
                }}>
                  Phương thức thanh toán
                </Text>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 8,
                }}>
                  {[
                    { value: 'cash', icon: <DollarOutlined />, label: 'Tiền mặt', color: '#4CAF50' },
                    { value: 'card', icon: <CreditCardOutlined />, label: 'Thẻ', color: '#2196F3' },
                    { value: 'transfer', icon: <BankOutlined />, label: 'Chuyển khoản', color: '#9C27B0' },
                    { value: 'qr', icon: <QrcodeOutlined />, label: 'QR', color: '#FF9800' },
                  ].map(method => (
                    <motion.div
                      key={method.value}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={async () => {
                        setPaymentMethod(method.value);
                        
                        // Generate QR code when QR payment is selected
                        if (method.value === 'qr') {
                          const orderNumber = `HD${Date.now()}`;
                          const qrUrl = await InvoiceGenerator.generateVietQR(
                            '970436', // Vietcombank BIN code
                            '1234567890', // Replace with actual account number
                            'MEDICAL ELECTRONICS STORE', // Account name
                            total,
                            orderNumber // Payment description
                          );
                          setQrCodeUrl(qrUrl);
                        }
                      }}
                      style={{
                        padding: '12px 8px',
                        borderRadius: 10,
                        border: `1.5px solid ${paymentMethod === method.value 
                          ? method.color 
                          : isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                        background: paymentMethod === method.value
                          ? `${method.color}10`
                          : isDarkMode 
                            ? 'rgba(255,255,255,0.02)'
                            : 'rgba(0,0,0,0.01)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 6,
                        position: 'relative',
                      }}
                    >
                      <div style={{
                        fontSize: 18,
                        color: paymentMethod === method.value ? method.color : isDarkMode ? 'rgba(255,255,255,0.6)' : '#8c8c8c',
                      }}>
                        {method.icon}
                      </div>
                      <div style={{ 
                        fontSize: 11, 
                        fontWeight: paymentMethod === method.value ? 600 : 400,
                        color: paymentMethod === method.value 
                          ? method.color
                          : isDarkMode ? 'rgba(255,255,255,0.7)' : '#595959',
                        textAlign: 'center',
                      }}>
                        {method.label}
                      </div>
                      {paymentMethod === method.value && (
                        <div style={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: method.color,
                        }} />
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Elegant Cash Payment */}
              {paymentMethod === 'cash' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    background: 'linear-gradient(135deg, rgba(76,175,80,0.08) 0%, rgba(76,175,80,0.03) 100%)',
                    borderRadius: 10,
                    padding: 12,
                    border: `1px solid ${isDarkMode ? 'rgba(76,175,80,0.2)' : 'rgba(76,175,80,0.15)'}`,
                    marginBottom: 16,
                  }}
                >
                  <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <DollarOutlined style={{ fontSize: 14, color: '#4CAF50' }} />
                    <Text style={{ fontSize: 11, color: '#4CAF50', fontWeight: 500, textTransform: 'uppercase' }}>
                      Tiền khách đưa
                    </Text>
                  </div>
                  
                  <InputNumber
                    size="middle"
                    style={{ 
                      width: '100%', 
                      fontSize: 18, 
                      marginBottom: 10,
                      borderColor: '#4CAF50',
                      fontWeight: 600,
                    }}
                    value={receivedAmount}
                    onChange={(value) => setReceivedAmount(value || 0)}
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                    suffix="₫"
                  />
                  
                  {/* Elegant Quick Amounts */}
                  <div style={{ 
                    display: 'flex', 
                    gap: 6,
                    marginBottom: receivedAmount >= total ? 10 : 0,
                  }}>
                    {QUICK_AMOUNTS.slice(0, 4).map(amount => (
                      <Button
                        key={amount}
                        size="small"
                        onClick={() => setReceivedAmount(amount)}
                        style={{ 
                          flex: 1,
                          height: 28,
                          fontSize: 11,
                          borderColor: receivedAmount === amount ? '#4CAF50' : isDarkMode ? 'rgba(255,255,255,0.1)' : '#e8e8e8',
                          color: receivedAmount === amount ? '#4CAF50' : isDarkMode ? 'rgba(255,255,255,0.65)' : '#595959',
                          background: receivedAmount === amount ? 'rgba(76,175,80,0.1)' : 'transparent',
                          fontWeight: receivedAmount === amount ? 600 : 400,
                        }}
                      >
                        {amount >= 1000000 
                          ? `${(amount / 1000000).toFixed(0)}M` 
                          : `${(amount / 1000).toFixed(0)}K`}
                      </Button>
                    ))}
                  </div>
                  
                  {/* Elegant Change Display */}
                  {receivedAmount >= total && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      style={{
                        background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
                        borderRadius: 8,
                        padding: '10px 12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        border: `1px solid ${isDarkMode ? 'rgba(76,175,80,0.3)' : 'rgba(76,175,80,0.2)'}`,
                      }}
                    >
                      <div>
                        <Text style={{ fontSize: 10, color: isDarkMode ? 'rgba(255,255,255,0.5)' : '#8c8c8c' }}>
                          Tiền thừa
                        </Text>
                      </div>
                      <div style={{ 
                        fontSize: 20,
                        fontWeight: 700,
                        color: '#4CAF50',
                      }}>
                        {(receivedAmount - total).toLocaleString()}₫
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* QR Code Display */}
              {paymentMethod === 'qr' && (
                <div style={{
                  textAlign: 'center',
                  padding: 20,
                  background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  borderRadius: 12,
                  marginBottom: 20,
                }}>
                  <div style={{
                    width: 200,
                    height: 200,
                    margin: '0 auto',
                    background: '#FFFFFF',
                    padding: 10,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {qrCodeUrl ? (
                      <img src={qrCodeUrl} alt="QR Code" style={{ width: '100%', height: '100%' }} />
                    ) : (
                      <QrcodeOutlined style={{ fontSize: 180, color: '#000' }} />
                    )}
                  </div>
                  <Text type="secondary" style={{ fontSize: 12, marginTop: 12, display: 'block' }}>
                    Quét mã để thanh toán {total.toLocaleString()}₫
                  </Text>
                  <div style={{ marginTop: 16, textAlign: 'left', fontSize: 11 }}>
                    <div style={{ marginBottom: 4 }}>
                      <strong>Ngân hàng:</strong> Vietcombank
                    </div>
                    <div style={{ marginBottom: 4 }}>
                      <strong>Số tài khoản:</strong> 1234567890
                    </div>
                    <div style={{ marginBottom: 4 }}>
                      <strong>Chủ TK:</strong> MEDICAL ELECTRONICS STORE
                    </div>
                    <div style={{ marginBottom: 4 }}>
                      <strong>Số tiền:</strong> {total.toLocaleString()}₫
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {/* Elegant Action Buttons */}
              <div style={{ 
                display: 'flex', 
                gap: 8,
                paddingTop: 12,
                borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
              }}>
                <Button 
                  size="middle" 
                  onClick={() => setPaymentModalVisible(false)}
                  style={{ 
                    flex: 1,
                    height: 36,
                    fontSize: 13,
                    borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : '#e8e8e8',
                  }}
                >
                  Hủy
                </Button>
                <Button
                  size="middle"
                  icon={<PrinterOutlined />}
                  onClick={() => printReceipt()}
                  style={{
                    flex: 1,
                    height: 36,
                    fontSize: 13,
                    borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : '#e8e8e8',
                  }}
                >
                  In HĐ
                </Button>
                <Button 
                  type="primary" 
                  size="middle"
                  icon={<CheckOutlined />}
                  loading={loading}
                  onClick={completePayment}
                  disabled={paymentMethod === 'cash' && Math.floor(receivedAmount) < Math.floor(total)}
                  style={{
                    flex: 2,
                    height: 36,
                    fontSize: 13,
                    fontWeight: 600,
                    background: paymentMethod === 'cash' && Math.floor(receivedAmount) < Math.floor(total)
                      ? undefined
                      : 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
                    border: 'none',
                    boxShadow: paymentMethod === 'cash' && Math.floor(receivedAmount) < Math.floor(total) 
                      ? 'none'
                      : '0 4px 12px rgba(103,58,183,0.25)',
                  }}
                >
                  {loading ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
                </Button>
              </div>
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