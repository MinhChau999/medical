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
  Drawer,
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
  LineChartOutlined,
  GiftOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useThemeStore } from '@/stores/themeStore';
import POSLayout from '@/layouts/POSLayout';
import { InvoiceGenerator, InvoiceData, InvoiceItem } from '@/utils/invoiceGenerator';
import type { ColumnsType } from 'antd/es/table';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { POSDashboardPanel } from '../components/POSDashboardPanel';
import { LoyaltyPointsModal } from '../components/LoyaltyPointsModal';
import { ProductAutocomplete } from '../components/ProductAutocomplete';

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
  const [dashboardVisible, setDashboardVisible] = useState(false);
  const [loyaltyModalVisible, setLoyaltyModalVisible] = useState(false);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0);
  const [usedPoints, setUsedPoints] = useState(0);
  const [cartDrawerVisible, setCartDrawerVisible] = useState(false);

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

      @keyframes shine {
        0% {
          left: -100%;
        }
        100% {
          left: 200%;
        }
      }

      @keyframes float {
        0%, 100% {
          transform: translateY(0px);
        }
        50% {
          transform: translateY(-10px);
        }
      }

      .payment-modal-content {
        animation: fadeInScale 0.3s ease-out;
      }

      .hide-scrollbar::-webkit-scrollbar {
        display: none;
      }

      .hide-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
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

  // Fetch products from API
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['pos-products'],
    queryFn: async () => {
      try {
        const response = await api.get('/products?status=active&limit=1000');
        // API returns { success: true, data: [...] }
        return response.data?.data || [];
      } catch (error) {
        console.error('Failed to fetch products:', error);
        return [];
      }
    },
  });

  // Fetch customers from API
  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ['pos-customers'],
    queryFn: async () => {
      try {
        const response = await api.get('/customers?status=active&limit=1000');
        return response.data?.data?.customers || [];
      } catch (error) {
        console.error('Failed to fetch customers:', error);
        return [];
      }
    },
  });

  // Transform API products to POS Product format
  const products: Product[] = React.useMemo(() => {
    if (!productsData) return [];
    return productsData.map((p: any) => ({
      id: p.id.toString(),
      barcode: p.barcode || p.sku || '',
      name: p.name,
      price: parseFloat(p.price) || 0,
      stock: p.stockQuantity || 0,
      unit: p.unit || 'cái',
      category: p.category?.slug || 'device',
      image: p.image || p.images?.[0] || '',
      discount: 0,
    }));
  }, [productsData]);

  // Transform API customers to POS Customer format
  const customers: Customer[] = React.useMemo(() => {
    if (!customersData) return [];
    return customersData.map((c: any) => ({
      id: c.id.toString(),
      name: c.name,
      phone: c.phone || '',
      email: c.email,
      points: c.points || 0,
      type: c.type || 'regular',
    }));
  }, [customersData]);

  // Fetch categories from API
  const { data: categoriesData } = useQuery({
    queryKey: ['pos-categories'],
    queryFn: async () => {
      try {
        const response = await api.get('/categories');
        return response.data?.data || [];
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        return [];
      }
    },
  });

  // Category color mapping - map to actual database slugs
  const categoryColorMap: Record<string, string> = {
    'thuoc-ho': '#FF5722',
    'thuc-pham-chuc-nang': '#4CAF50',
    'vat-tu-y-te': '#00BCD4',
    'may-do-duong-huyet': '#2196F3',
    'thuoc-khang-sinh': '#F44336',
    'thiet-bi-y-te': '#9C27B0',
    'dung-cu-y-te': '#607D8B',
    'vitamin': '#8BC34A',
    'duoc-my-pham': '#E91E63',
  };

  // Transform API categories to POS format
  const categories = React.useMemo(() => {
    const allCategory = {
      key: 'all',
      label: 'Tất cả',
      color: '#607D8B',
      slug: 'all'
    };

    if (!categoriesData || categoriesData.length === 0) {
      return [allCategory];
    }

    const apiCategories = categoriesData.map((cat: any) => ({
      key: cat.slug || cat.id.toString(),
      label: cat.name,
      color: categoryColorMap[cat.slug] || '#607D8B',
      slug: cat.slug,
    }));

    return [allCategory, ...apiCategories];
  }, [categoriesData]);

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
    let filtered = products;
    
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
    const itemDiscountAmount = cart.reduce((sum, item) => sum + item.discountAmount, 0);
    const totalDiscount = itemDiscountAmount + loyaltyDiscount;
    const tax = (subtotal - totalDiscount) * 0.1; // 10% VAT
    const total = subtotal - totalDiscount + tax;

    return { subtotal, discount: totalDiscount, tax, total };
  };

  const handleApplyLoyaltyDiscount = (discount: number, points: number) => {
    setLoyaltyDiscount(discount);
    setUsedPoints(points);
  };

  // Handle barcode scan
  const handleBarcodeScan = (barcode: string) => {
    const product = products.find(p => p.barcode === barcode);
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
  const completePayment = async () => {
    setLoading(true);

    try {
      const { subtotal, discount, tax, total } = calculateTotals();

      // Save order to database
      const orderData = {
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
          discount: item.discountAmount
        })),
        customerId: selectedCustomer?.id || null,
        customerInfo: selectedCustomer ? {
          name: selectedCustomer.name,
          phone: selectedCustomer.phone
        } : null,
        paymentMethod,
        receivedAmount,
        discount,
        notes: ''
      };

      const response = await api.post('/pos/orders', orderData);

      if (response.data.success) {
        message.success('Thanh toán thành công');

        // Print receipt with order number
        printReceipt(response.data.data.orderNumber);

        // Open cash drawer (simulated)
        if (paymentMethod === 'cash') {
          message.info('Mở két tiền...');
        }

        // Clear cart
        setCart([]);
        setSelectedCustomer(null);
        setPaymentModalVisible(false);

        // Focus back to barcode input
        setTimeout(() => barcodeInputRef.current?.focus(), 100);
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Lỗi khi lưu đơn hàng');
    } finally {
      setLoading(false);
    }
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

  // Show loading state while fetching data
  if (productsLoading || customersLoading) {
    return (
      <POSLayout>
        <div style={{
          height: 'calc(100vh - 64px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isDarkMode ? '#0F1419' : '#F0F2F5'
        }}>
          <Space direction="vertical" align="center" size="large">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <ShoppingCartOutlined style={{ fontSize: 48, color: '#00A6B8' }} />
            </motion.div>
            <Text style={{ fontSize: 16, color: isDarkMode ? '#fff' : '#666' }}>
              Đang tải dữ liệu POS...
            </Text>
          </Space>
        </div>
      </POSLayout>
    );
  }

  return (
    <POSLayout>
      <div style={{
        height: 'calc(100vh - 64px)',
        display: 'flex',
        background: isDarkMode
          ? 'linear-gradient(135deg, #0F1419 0%, #1A1F2E 50%, #0F1419 100%)'
          : 'linear-gradient(135deg, #F0F5FF 0%, #E6F0FF 50%, #F0F5FF 100%)',
        flexDirection: screens.md ? 'row' : 'column',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Animated Background Pattern */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          opacity: isDarkMode ? 0.03 : 0.04,
          backgroundImage: `radial-gradient(circle at 25px 25px, ${isDarkMode ? '#00A6B8' : '#1890ff'} 2%, transparent 0%),
                           radial-gradient(circle at 75px 75px, ${isDarkMode ? '#00A6B8' : '#1890ff'} 2%, transparent 0%)`,
          backgroundSize: '100px 100px',
          pointerEvents: 'none',
        }} />

        {/* Left Panel - Product Selection */}
        <div style={{
          flex: screens.md ? '1 1 65%' : '1',
          display: 'flex',
          flexDirection: 'column',
          borderRight: screens.md ? `1px solid ${isDarkMode ? 'rgba(0,166,184,0.15)' : 'rgba(24,144,255,0.15)'}` : 'none',
          background: isDarkMode
            ? 'linear-gradient(180deg, rgba(19,24,33,0.95) 0%, rgba(15,20,25,0.98) 100%)'
            : 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(250,251,252,0.98) 100%)',
          maxHeight: screens.md ? 'none' : 'calc(100vh - 64px)',
          backdropFilter: 'blur(20px)',
          position: 'relative',
          zIndex: 1,
          minWidth: 0,
          overflow: 'hidden',
        }}>
          
          {/* Compact Search Header */}
          <div style={{
            padding: '10px 16px',
            borderBottom: `1px solid ${isDarkMode ? 'rgba(0,166,184,0.08)' : 'rgba(24,144,255,0.08)'}`,
            background: isDarkMode
              ? 'rgba(26,35,50,0.4)'
              : 'rgba(255,255,255,0.6)',
            backdropFilter: 'blur(20px)',
            flexShrink: 0,
            minWidth: 0,
          }}>
            <div style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
            }}>
              <ProductAutocomplete
                onSelect={addToCart}
                placeholder="Tìm kiếm..."
                style={{ flex: 1, maxWidth: screens.md ? 400 : '100%' }}
              />

              {/* Category Filter - Inline */}
              {categories.length > 4 && (
                <Select
                  value={activeCategory}
                  onChange={setActiveCategory}
                  style={{ width: 150 }}
                  size="middle"
                  options={categories.map(cat => ({
                    value: cat.key,
                    label: cat.label,
                  }))}
                  suffixIcon={
                    <Tag color={categories.find(c => c.key === activeCategory)?.color} style={{ margin: 0, fontSize: 9, padding: '0 4px' }}>
                      {getFilteredProducts().length}
                    </Tag>
                  }
                />
              )}

              <Tooltip title="Thống kê">
                <Button
                  size="middle"
                  icon={<LineChartOutlined />}
                  onClick={() => setDashboardVisible(true)}
                  style={{
                    borderRadius: 8,
                    width: 36,
                    height: 36,
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                />
              </Tooltip>
              {screens.sm && (
                <Space.Compact size="middle">
                  <Button
                    icon={<AppstoreOutlined />}
                    type={viewMode === 'grid' ? 'primary' : 'default'}
                    onClick={() => setViewMode('grid')}
                    style={{ width: 36, height: 36, padding: 0 }}
                  />
                  <Button
                    icon={<UnorderedListOutlined />}
                    type={viewMode === 'list' ? 'primary' : 'default'}
                    onClick={() => setViewMode('list')}
                    style={{ width: 36, height: 36, padding: 0 }}
                  />
                </Space.Compact>
              )}
            </div>

            {/* Category Filter Pills - Show below only if 4 or fewer categories */}
            {categories.length <= 4 && (
              // Show as pills if 4 or fewer categories
              <div style={{
                display: 'flex',
                gap: 6,
                marginTop: 8,
                paddingBottom: 4,
                flexWrap: 'wrap',
              }}>
                {categories.map(cat => (
                  <motion.button
                    key={cat.key}
                    onClick={() => setActiveCategory(cat.key)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 12,
                      border: 'none',
                      background: activeCategory === cat.key
                        ? `linear-gradient(135deg, ${cat.color} 0%, ${cat.color}DD 100%)`
                        : isDarkMode
                          ? 'rgba(255,255,255,0.04)'
                          : 'rgba(0,0,0,0.04)',
                      color: activeCategory === cat.key
                        ? '#FFFFFF'
                        : isDarkMode ? 'rgba(255,255,255,0.65)' : '#666',
                      fontSize: 11.5,
                      fontWeight: activeCategory === cat.key ? 600 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      boxShadow: activeCategory === cat.key
                        ? `0 2px 6px ${cat.color}35`
                        : 'none',
                      letterSpacing: 0.3,
                    }}
                  >
                    {cat.label}
                    {activeCategory === cat.key && (
                      <span style={{
                        background: 'rgba(255,255,255,0.3)',
                        color: '#FFFFFF',
                        padding: '1px 5px',
                        borderRadius: 6,
                        fontSize: 9.5,
                        fontWeight: 700,
                        minWidth: 18,
                        textAlign: 'center',
                        lineHeight: '14px',
                      }}>
                        {getFilteredProducts().length}
                      </span>
                    )}
                  </motion.button>
                ))}
              </div>
            )}
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
                  const categoryColor = categories.find(c => c.key === product.category || c.slug === product.category)?.color || '#00A6B8';
                  return (
                    <motion.div
                      key={product.id}
                      whileHover={{
                        scale: product.stock > 0 ? 1.04 : 1,
                        y: product.stock > 0 ? -4 : 0,
                      }}
                      whileTap={{ scale: product.stock > 0 ? 0.96 : 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <Card
                          onClick={() => addToCart(product)}
                          style={{
                            height: '100%',
                            minHeight: 240,
                            cursor: product.stock > 0 ? 'pointer' : 'not-allowed',
                            opacity: product.stock === 0 ? 0.6 : 1,
                            borderRadius: 20,
                            overflow: 'hidden',
                            border: isDarkMode
                              ? `1.5px solid ${product.stock > 0 ? `${categoryColor}25` : 'rgba(255,255,255,0.05)'}`
                              : `1.5px solid ${product.stock > 0 ? `${categoryColor}20` : 'rgba(0,0,0,0.04)'}`,
                            background: isDarkMode
                              ? `linear-gradient(145deg, rgba(26,35,50,0.6) 0%, rgba(20,25,33,0.8) 100%)`
                              : `linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(250,251,252,0.95) 100%)`,
                            boxShadow: product.stock > 0
                              ? isDarkMode
                                ? `0 8px 32px rgba(0,0,0,0.4), 0 4px 16px ${categoryColor}15, inset 0 1px 0 rgba(255,255,255,0.05)`
                                : `0 8px 32px rgba(0,0,0,0.08), 0 4px 16px ${categoryColor}10, inset 0 1px 0 rgba(255,255,255,0.8)`
                              : 'none',
                            backdropFilter: 'blur(12px)',
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            position: 'relative',
                          }}
                          styles={{ body: { padding: 0 } }}
                          hoverable={false}
                        >
                          {/* Glow effect on hover */}
                          {product.stock > 0 && (
                            <div style={{
                              position: 'absolute',
                              top: -2,
                              left: -2,
                              right: -2,
                              bottom: -2,
                              background: `linear-gradient(135deg, ${categoryColor}40, transparent)`,
                              borderRadius: 20,
                              opacity: 0,
                              transition: 'opacity 0.3s',
                              pointerEvents: 'none',
                            }} className="card-glow" />
                          )}

                          {/* Product Image */}
                          <div style={{
                            position: 'relative',
                            height: 130,
                            background: isDarkMode
                              ? `linear-gradient(135deg, ${categoryColor}18 0%, ${categoryColor}08 100%)`
                              : `linear-gradient(135deg, ${categoryColor}12 0%, ${categoryColor}05 100%)`,
                            borderBottom: `2px solid ${isDarkMode
                              ? `${categoryColor}20`
                              : `${categoryColor}15`}`,
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            {product.image ? (
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
                                  // Hide broken image and show placeholder
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div style={{
                                width: 80,
                                height: 80,
                                borderRadius: 16,
                                background: isDarkMode
                                  ? 'linear-gradient(135deg, #2A2A2A 0%, #1F1F1F 100%)'
                                  : 'linear-gradient(135deg, #F0F0F0 0%, #E6E6E6 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: isDarkMode ? '2px solid #2A2A2A' : '2px solid #F0F0F0',
                              }}>
                                <svg
                                  viewBox="0 0 1024 1024"
                                  style={{
                                    fontSize: 32,
                                    color: isDarkMode ? '#555' : '#BFBFBF',
                                    width: '1em',
                                    height: '1em',
                                    fill: 'currentColor',
                                  }}
                                >
                                  <path d="M885.2 446.3l-.2-.8-112.2-285.1c-5-16.1-19.9-27.2-36.8-27.2H281.2c-17 0-32.1 11.3-36.9 27.6L139.4 443l-.3.7-.2.8c-1.3 4.9-1.7 9.9-1 14.8-.1 1.6-.2 3.2-.2 4.8V830a60.9 60.9 0 0060.8 60.8h627.2c33.5 0 60.8-27.3 60.9-60.8V464.1c0-1.3 0-2.6-.1-3.7.4-4.9 0-9.6-1.3-14.1zm-295.8-43l-.3 15.7c-.8 44.9-31.8 75.1-77.1 75.1-22.1 0-41.1-7.1-54.8-20.6S436 441.2 435.6 419l-.3-15.7H229.5L309 210h399.2l81.7 193.3H589.4zm-375 76.8h157.3c24.3 57.1 76 90.8 140.4 90.8 33.7 0 65-9.4 90.3-27.2 22.2-15.6 39.5-37.4 50.7-63.6h156.5V814H214.4V480.1z"></path>
                                </svg>
                              </div>
                            )}
                            
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
                              <Text style={{
                                fontSize: 10,
                                fontWeight: 600,
                                color: '#9E9E9E',
                                textTransform: 'uppercase',
                                letterSpacing: 0.5,
                              }}>
                                {categories.find(c => c.key === product.category || c.slug === product.category)?.label}
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
                            
                            {/* Price - Premium Style */}
                            <div style={{
                              fontSize: 20,
                              fontWeight: 800,
                              background: `linear-gradient(135deg, ${categoryColor} 0%, ${categoryColor}BB 100%)`,
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              backgroundClip: 'text',
                              marginBottom: 12,
                              letterSpacing: -0.5,
                              textShadow: isDarkMode
                                ? `0 2px 10px ${categoryColor}30`
                                : `0 2px 10px ${categoryColor}20`,
                              filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.1))',
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
                  const categoryColor = categories.find(c => c.key === product.category || c.slug === product.category)?.color || '#00A6B8';
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
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: isDarkMode
                              ? 'linear-gradient(135deg, #2A2A2A 0%, #1F1F1F 100%)'
                              : 'linear-gradient(135deg, #F0F0F0 0%, #E6E6E6 100%)',
                          }}>
                            {product.image ? (
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
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <svg
                                viewBox="0 0 1024 1024"
                                style={{
                                  fontSize: 20,
                                  color: isDarkMode ? '#555' : '#BFBFBF',
                                  width: '1em',
                                  height: '1em',
                                  fill: 'currentColor',
                                }}
                              >
                                <path d="M885.2 446.3l-.2-.8-112.2-285.1c-5-16.1-19.9-27.2-36.8-27.2H281.2c-17 0-32.1 11.3-36.9 27.6L139.4 443l-.3.7-.2.8c-1.3 4.9-1.7 9.9-1 14.8-.1 1.6-.2 3.2-.2 4.8V830a60.9 60.9 0 0060.8 60.8h627.2c33.5 0 60.8-27.3 60.9-60.8V464.1c0-1.3 0-2.6-.1-3.7.4-4.9 0-9.6-1.3-14.1zm-295.8-43l-.3 15.7c-.8 44.9-31.8 75.1-77.1 75.1-22.1 0-41.1-7.1-54.8-20.6S436 441.2 435.6 419l-.3-15.7H229.5L309 210h399.2l81.7 193.3H589.4zm-375 76.8h157.3c24.3 57.1 76 90.8 140.4 90.8 33.7 0 65-9.4 90.3-27.2 22.2-15.6 39.5-37.4 50.7-63.6h156.5V814H214.4V480.1z"></path>
                              </svg>
                            )}
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

        {/* Floating Cart Button for Mobile - Premium Design */}
        {!screens.md && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            style={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 999,
            }}
          >
            <Badge
              count={cart.reduce((sum, item) => sum + item.quantity, 0)}
              offset={[-8, 8]}
              style={{
                background: 'linear-gradient(135deg, #FF5722 0%, #F44336 100%)',
                boxShadow: '0 4px 12px rgba(255,87,34,0.5)',
                fontWeight: 700,
              }}
            >
              <Button
                shape="circle"
                size="large"
                icon={<ShoppingCartOutlined />}
                onClick={() => setCartDrawerVisible(true)}
                style={{
                  width: 70,
                  height: 70,
                  fontSize: 28,
                  background: 'linear-gradient(135deg, #00A6B8 0%, #0288D1 100%)',
                  border: 'none',
                  boxShadow: '0 8px 24px rgba(0,166,184,0.5), 0 4px 12px rgba(0,0,0,0.2)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              />
            </Badge>
          </motion.div>
        )}

        {/* Right Panel - Cart & Payment (Desktop) / Drawer (Mobile) */}
        {screens.md ? (
          <div style={{
            flex: '0 0 35%',
            minWidth: 400,
            display: 'flex',
            flexDirection: 'column',
            background: isDarkMode
              ? 'linear-gradient(180deg, rgba(15,20,25,0.98) 0%, rgba(10,15,20,0.95) 100%)'
              : 'linear-gradient(180deg, rgba(250,251,252,0.98) 0%, rgba(245,247,250,0.95) 100%)',
            backdropFilter: 'blur(20px)',
            position: 'relative',
            zIndex: 1,
          }}>
          
          {/* Beautiful Cart Header */}
          <div style={{
            padding: '16px 20px',
            background: isDarkMode
              ? 'linear-gradient(135deg, rgba(0,166,184,0.15) 0%, rgba(45,27,105,0.2) 100%)'
              : 'linear-gradient(135deg, rgba(255,248,243,0.8) 0%, rgba(243,229,245,0.8) 100%)',
            borderBottom: `2px solid ${isDarkMode ? 'rgba(0,166,184,0.2)' : 'rgba(255,87,34,0.15)'}`,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: isDarkMode
              ? '0 4px 20px rgba(0,0,0,0.3)'
              : '0 4px 20px rgba(0,0,0,0.05)',
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
                <Space>
                  {selectedCustomer.points > 0 && (
                    <Tooltip title={`Sử dụng ${selectedCustomer.points} điểm thưởng`}>
                      <Button
                        size="small"
                        type="primary"
                        ghost
                        icon={<GiftOutlined />}
                        onClick={() => setLoyaltyModalVisible(true)}
                        style={{ fontSize: 10, height: 24 }}
                      >
                        Điểm
                      </Button>
                    </Tooltip>
                  )}
                  <Button
                    size="small"
                    type="text"
                    icon={<CloseOutlined />}
                    onClick={() => {
                      setSelectedCustomer(null);
                      setLoyaltyDiscount(0);
                      setUsedPoints(0);
                    }}
                    style={{ color: '#999', padding: '2px', minWidth: 'auto', height: 'auto' }}
                  />
                </Space>
              </motion.div>
            )}

            {/* Loyalty Discount Display */}
            {loyaltyDiscount > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                style={{
                  background: `linear-gradient(135deg, rgba(250,173,20,0.1) 0%, rgba(250,173,20,0.05) 100%)`,
                  borderRadius: 6,
                  padding: '6px 8px',
                  marginBottom: 8,
                  border: '1px solid rgba(250,173,20,0.3)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Space size={4}>
                    <TrophyOutlined style={{ color: '#faad14' }} />
                    <Text style={{ fontSize: 11 }}>Đã dùng {usedPoints} điểm</Text>
                  </Space>
                  <Text strong style={{ color: '#52c41a', fontSize: 12 }}>
                    -{loyaltyDiscount.toLocaleString()}₫
                  </Text>
                </div>
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
        ) : null}

        {/* Mobile Cart Drawer */}
        <Drawer
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShoppingCartOutlined style={{ fontSize: 20, color: '#00A6B8' }} />
              <span>Giỏ hàng ({cart.reduce((sum, item) => sum + item.quantity, 0)} SP)</span>
            </div>
          }
          placement="bottom"
          height="85vh"
          onClose={() => setCartDrawerVisible(false)}
          open={cartDrawerVisible}
          styles={{
            body: { padding: 0 },
            header: {
              background: isDarkMode ? '#1A2332' : '#FAFBFC',
              borderBottom: `2px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : '#F0F0F0'}`,
            }
          }}
        >
          {/* Cart Content - Same as Desktop */}
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: isDarkMode ? '#0F1419' : '#FAFBFC',
          }}>
            {/* Cart Header */}
            <div style={{
              padding: '12px 16px',
              background: isDarkMode ? '#1A2332' : '#FAFBFC',
              borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : '#F0F0F0'}`,
            }}>
              {selectedCustomer ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 12,
                  background: isDarkMode ? 'rgba(0,166,184,0.1)' : 'rgba(0,166,184,0.05)',
                  borderRadius: 8,
                  border: `1px solid ${isDarkMode ? 'rgba(0,166,184,0.3)' : 'rgba(0,166,184,0.2)'}`,
                }}>
                  <Space>
                    <UserOutlined style={{ fontSize: 18, color: '#00A6B8' }} />
                    <div>
                      <Text strong style={{ fontSize: 13 }}>{selectedCustomer.name}</Text>
                      <div style={{ fontSize: 11, color: '#888' }}>
                        {selectedCustomer.phone} • {selectedCustomer.points} điểm
                      </div>
                    </div>
                  </Space>
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<CloseOutlined />}
                    onClick={() => setSelectedCustomer(null)}
                  />
                </div>
              ) : (
                <Button
                  block
                  icon={<UserOutlined />}
                  onClick={() => setCustomerModalVisible(true)}
                >
                  Chọn khách hàng
                </Button>
              )}
            </div>

            {/* Cart Items */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
              {cart.length === 0 ? (
                <Empty description="Giỏ hàng trống" />
              ) : (
                <Table
                  dataSource={cart}
                  columns={cartColumns}
                  pagination={false}
                  rowKey="id"
                  size="small"
                />
              )}
            </div>

            {/* Summary & Checkout */}
            {cart.length > 0 && (
              <div style={{
                padding: 16,
                background: isDarkMode ? '#131821' : '#FFFFFF',
                borderTop: `2px solid ${isDarkMode ? 'rgba(0,166,184,0.3)' : 'rgba(0,166,184,0.2)'}`,
              }}>
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text>Tạm tính:</Text>
                    <Text strong>{subtotal.toLocaleString()}₫</Text>
                  </div>
                  {discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text>Giảm giá:</Text>
                      <Text type="danger">-{discount.toLocaleString()}₫</Text>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text>VAT (10%):</Text>
                    <Text>{tax.toLocaleString()}₫</Text>
                  </div>
                  <Divider style={{ margin: '8px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text strong style={{ fontSize: 16 }}>Tổng cộng:</Text>
                    <Text strong style={{ fontSize: 20, color: '#00A6B8' }}>
                      {total.toLocaleString()}₫
                    </Text>
                  </div>

                  <Space style={{ width: '100%', marginTop: 12 }} size="small">
                    <Button
                      block
                      size="large"
                      icon={<PauseOutlined />}
                      onClick={holdInvoice}
                    >
                      Giữ
                    </Button>
                    <Button
                      block
                      size="large"
                      type="primary"
                      icon={<CheckOutlined />}
                      onClick={() => {
                        setPaymentModalVisible(true);
                        setCartDrawerVisible(false);
                      }}
                    >
                      Thanh toán
                    </Button>
                  </Space>
                </Space>
              </div>
            )}
          </div>
        </Drawer>

        {/* Elegant Compact Payment Modal */}
        <Modal
          title={null}
          open={paymentModalVisible}
          onCancel={() => setPaymentModalVisible(false)}
          width={screens.xs ? '100%' : 480}
          footer={null}
          centered={!screens.xs}
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
                  gridTemplateColumns: screens.xs ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                  gap: screens.xs ? 10 : 8,
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
                        padding: screens.xs ? '16px 12px' : '12px 8px',
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
                        gap: screens.xs ? 8 : 6,
                        position: 'relative',
                        minHeight: screens.xs ? 70 : 'auto',
                      }}
                    >
                      <div style={{
                        fontSize: screens.xs ? 24 : 18,
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
                    display: 'grid',
                    gridTemplateColumns: screens.xs ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                    gap: screens.xs ? 8 : 6,
                    marginBottom: receivedAmount >= total ? 10 : 0,
                  }}>
                    {QUICK_AMOUNTS.slice(0, screens.xs ? 6 : 4).map(amount => (
                      <Button
                        key={amount}
                        size={screens.xs ? "middle" : "small"}
                        onClick={() => setReceivedAmount(amount)}
                        style={{
                          height: screens.xs ? 40 : 28,
                          fontSize: screens.xs ? 13 : 11,
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
              dataSource={customers}
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

        {/* Dashboard Panel */}
        <POSDashboardPanel
          visible={dashboardVisible}
          onClose={() => setDashboardVisible(false)}
          isDarkMode={isDarkMode}
        />

        {/* Loyalty Points Modal */}
        <LoyaltyPointsModal
          visible={loyaltyModalVisible}
          onClose={() => setLoyaltyModalVisible(false)}
          customerId={selectedCustomer?.id || null}
          onApplyDiscount={handleApplyLoyaltyDiscount}
        />
      </div>
    </POSLayout>
  );
};

export default POSSales;