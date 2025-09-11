import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ConfigProvider, theme } from 'antd';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { RootState } from '@/stores/store';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { useTranslation } from 'react-i18next';
import './i18n';
import enUS from 'antd/locale/en_US';
import viVN from 'antd/locale/vi_VN';

// Layouts
import MainLayout from '@/layouts/MainLayout';

// Public Pages (E-commerce Shop)
import ShopHome from '@/modules/shop/pages/ShopHome';
import ShopProducts from '@/modules/shop/pages/ShopProducts';
import ShopProductDetail from '@/modules/shop/pages/ShopProductDetail';
import ShopCart from '@/modules/shop/pages/ShopCart';
import ShopCheckout from '@/modules/shop/pages/ShopCheckout';
import ShopOrders from '@/modules/shop/pages/ShopOrders';

// Auth Pages
import Login from '@/pages/Login';

// Protected Pages - POS (Staff/Manager)
import POSDashboard from '@/modules/pos/pages/POSDashboard';
import POSSales from '@/modules/pos/pages/POSSales';
import POSProducts from '@/modules/pos/pages/POSProducts';
import POSReports from '@/modules/pos/pages/POSReports';

// Protected Pages - Dashboard (Admin/Manager)
import Dashboard from '@/pages/Dashboard';
import Categories from '@/pages/Categories';
import Products from '@/pages/Products';
import Orders from '@/pages/Orders';
import Inventory from '@/pages/Inventory';
import Customers from '@/pages/Customers';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';
import Homepage from '@/pages/Homepage';
import Blog from '@/pages/Blog';
import ContactPage from '@/pages/Contact';
import GoogleMapPage from '@/pages/GoogleMap';

// Shop Layout Component
function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-medical-light">
      {/* Shop Header */}
      <header className="bg-white shadow-sm border-b-2 border-medical-accent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-medical-dark">Medical Electronics</h1>
            </div>
            <nav className="flex space-x-8">
              <a href="/" className="text-medical-dark hover:text-medical-primary transition-colors">Trang chủ</a>
              <a href="/products" className="text-medical-dark hover:text-medical-primary transition-colors">Sản phẩm</a>
              <a href="/about" className="text-medical-dark hover:text-medical-primary transition-colors">Giới thiệu</a>
              <a href="/blog" className="text-medical-dark hover:text-medical-primary transition-colors">Bài viết</a>
              <a href="/contact" className="text-medical-dark hover:text-medical-primary transition-colors">Liên hệ</a>
              <a href="/pos" className="text-medical-secondary hover:text-medical-primary transition-colors font-medium">POS</a>
              <a href="/dashboard" className="text-medical-primary hover:text-medical-secondary transition-colors font-medium">Dashboard</a>
            </nav>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}

// Simple page components for shop
function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-medical-dark mb-6">Giới thiệu</h1>
      <p className="text-medical-muted">Chúng tôi là nhà cung cấp thiết bị y tế hàng đầu...</p>
    </div>
  );
}

function BlogPageShop() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-medical-dark mb-6">Bài viết</h1>
      <p className="text-medical-muted">Tin tức và kiến thức về thiết bị y tế...</p>
    </div>
  );
}

function ContactPageShop() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-medical-dark mb-6">Liên hệ</h1>
      <p className="text-medical-muted">Thông tin liên hệ của chúng tôi...</p>
    </div>
  );
}

// Protected Route Component
function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: string }) {
  const reduxAuth = useSelector((state: RootState) => state.auth.isAuthenticated);
  const { isAuthenticated: zustandAuth, user } = useAuthStore();
  const isAuthenticated = reduxAuth || zustandAuth;

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user?.role !== requiredRole && user?.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}

// Animation wrapper component
function AnimatedRoutes() {
  const location = useLocation();
  const reduxAuth = useSelector((state: RootState) => state.auth.isAuthenticated);
  const { isAuthenticated: zustandAuth } = useAuthStore();
  const isAuthenticated = reduxAuth || zustandAuth;

  return (
    <Routes>
        {/* Public E-commerce Shop Routes */}
        <Route path="/" element={<ShopLayout><ShopHome /></ShopLayout>} />
        <Route path="/products" element={<ShopLayout><ShopProducts /></ShopLayout>} />
        <Route path="/products/:id" element={<ShopLayout><ShopProductDetail /></ShopLayout>} />
        <Route path="/cart" element={<ShopLayout><ShopCart /></ShopLayout>} />
        <Route path="/checkout" element={<ShopLayout><ShopCheckout /></ShopLayout>} />
        <Route path="/orders" element={<ShopLayout><ShopOrders /></ShopLayout>} />
        <Route path="/about" element={<ShopLayout><AboutPage /></ShopLayout>} />
        <Route path="/blog" element={<ShopLayout><BlogPageShop /></ShopLayout>} />
        <Route path="/contact" element={<ShopLayout><ContactPageShop /></ShopLayout>} />

        {/* Login Route */}
        <Route 
          path="/login" 
          element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} 
        />

        {/* Protected POS Routes - Direct to Sales Page */}
        <Route path="/pos" element={
          <ProtectedRoute>
            <POSSales />
          </ProtectedRoute>
        } />
        <Route path="/pos/sales" element={
          <ProtectedRoute>
            <POSSales />
          </ProtectedRoute>
        } />
        <Route path="/pos/products" element={
          <ProtectedRoute>
            <MainLayout>
              <POSProducts />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/pos/reports" element={
          <ProtectedRoute>
            <MainLayout>
              <POSReports />
            </MainLayout>
          </ProtectedRoute>
        } />

        {/* Protected Dashboard Routes (Admin/Manager) */}
        <Route path="/dashboard" element={
          <ProtectedRoute requiredRole="admin">
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/categories" element={
          <ProtectedRoute requiredRole="admin">
            <MainLayout>
              <Categories />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/products" element={
          <ProtectedRoute requiredRole="admin">
            <MainLayout>
              <Products />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/orders" element={
          <ProtectedRoute requiredRole="admin">
            <MainLayout>
              <Orders />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/inventory" element={
          <ProtectedRoute requiredRole="admin">
            <MainLayout>
              <Inventory />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/customers" element={
          <ProtectedRoute requiredRole="admin">
            <MainLayout>
              <Customers />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/reports" element={
          <ProtectedRoute requiredRole="admin">
            <MainLayout>
              <Reports />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/settings" element={
          <ProtectedRoute requiredRole="admin">
            <MainLayout>
              <Settings />
            </MainLayout>
          </ProtectedRoute>
        } />

        {/* Page Management Routes */}
        <Route path="/dashboard/homepage" element={
          <ProtectedRoute requiredRole="admin">
            <MainLayout>
              <Homepage />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/blog" element={
          <ProtectedRoute requiredRole="admin">
            <MainLayout>
              <Blog />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/contact" element={
          <ProtectedRoute requiredRole="admin">
            <MainLayout>
              <ContactPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/map" element={
          <ProtectedRoute requiredRole="admin">
            <MainLayout>
              <GoogleMapPage />
            </MainLayout>
          </ProtectedRoute>
        } />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  const { isDarkMode } = useThemeStore();
  const { i18n } = useTranslation();
  const currentLocale = i18n.language === 'vi' ? viVN : enUS;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.body.style.backgroundColor = '#141414';
    } else {
      document.body.style.backgroundColor = '#F5F7FA';
    }
  }, [isDarkMode]);

  return (
    <ConfigProvider
      locale={currentLocale}
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#00A6B8',           // Medical teal
          colorSuccess: '#4CAF50',           // Medical green
          colorWarning: '#FF9800',           // Medical orange
          colorError: '#F44336',             // Medical red
          colorInfo: '#4A90E2',              // Medical blue
          colorTextBase: isDarkMode ? '#E8E8E8' : '#2C3E50',
          colorBgContainer: isDarkMode ? '#1A1A2E' : '#ffffff',
          colorBgLayout: isDarkMode ? '#0F0F1E' : '#F5F7FA',
          borderRadius: 8,
          motion: true,
          motionUnit: 0.2,
          motionBase: 0,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        },
        components: {
          Button: {
            primaryColor: '#00A6B8',
            algorithm: true,
          },
          Menu: {
            itemSelectedBg: isDarkMode ? 'rgba(0, 166, 184, 0.15)' : 'rgba(0, 166, 184, 0.08)',
            itemSelectedColor: '#00A6B8',
          },
          Table: {
            headerBg: isDarkMode ? '#1A1A2E' : '#F5F7FA',
            headerColor: isDarkMode ? '#E8E8E8' : '#2C3E50',
          },
          Card: {
            headerBg: isDarkMode ? '#1A1A2E' : '#F5F7FA',
          },
          Badge: {
            colorBgContainer: '#FF4444',
            colorText: '#FFFFFF',
            colorError: '#FF4444',
          },
        },
      }}
    >
      <BrowserRouter 
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AnimatedRoutes />
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;