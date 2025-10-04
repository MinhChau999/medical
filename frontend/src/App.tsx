import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import { useEffect, lazy, Suspense } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { useCartStore } from '@/stores/cartStore';
import { useTranslation } from 'react-i18next';
import './i18n';
import enUS from 'antd/locale/en_US';
import viVN from 'antd/locale/vi_VN';
import { PageLoader } from '@/components/LazyLoad';

// Layouts
import MainLayout from '@/layouts/MainLayout';

// Public Pages (E-commerce Shop) - Lazy loaded
const ShopHome = lazy(() => import('@/modules/shop/pages/ShopHome'));
const ShopProducts = lazy(() => import('@/modules/shop/pages/ShopProducts'));
const ShopProductDetail = lazy(() => import('@/modules/shop/pages/ShopProductDetail'));
const ShopCart = lazy(() => import('@/modules/shop/pages/ShopCart'));
const ShopCheckout = lazy(() => import('@/modules/shop/pages/ShopCheckout'));
const ShopOrders = lazy(() => import('@/modules/shop/pages/ShopOrders'));
const ShopAbout = lazy(() => import('@/modules/shop/pages/ShopAbout'));
const ShopBlog = lazy(() => import('@/modules/shop/pages/ShopBlog'));

// Auth Pages - Lazy loaded
const Login = lazy(() => import('@/pages/Login'));

// Protected Pages - POS (Staff/Manager) - Lazy loaded
const POSSales = lazy(() => import('@/modules/pos/pages/POSSales'));
const POSProducts = lazy(() => import('@/modules/pos/pages/POSProducts'));
const POSReports = lazy(() => import('@/modules/pos/pages/POSReports'));

// Protected Pages - Dashboard (Admin/Manager) - Lazy loaded
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Categories = lazy(() => import('@/pages/Categories'));
const Products = lazy(() => import('@/pages/Products'));
const Orders = lazy(() => import('@/pages/Orders'));
const Inventory = lazy(() => import('@/pages/Inventory'));
const Customers = lazy(() => import('@/pages/Customers'));
const Reports = lazy(() => import('@/pages/Reports'));
const Settings = lazy(() => import('@/pages/Settings'));
const Homepage = lazy(() => import('@/pages/Homepage'));
const Blog = lazy(() => import('@/pages/Blog'));
const ContactPage = lazy(() => import('@/pages/Contact'));
const GoogleMapPage = lazy(() => import('@/pages/GoogleMap'));
const DatabasePage = lazy(() => import('@/pages/DatabasePage'));
const APIStatusPage = lazy(() => import('@/pages/APIStatusPage'));
const SecurityPage = lazy(() => import('@/pages/SecurityPage'));

// Shop Layout Component
function ShopLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { getTotalItems } = useCartStore();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar - Premium Style */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-10 text-xs">
            <div className="flex items-center space-x-6 text-gray-600">
              <span className="flex items-center space-x-1.5 hover:text-medical-primary transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="font-medium">1900-xxxx</span>
              </span>
              <span className="hidden md:flex items-center space-x-1.5 hover:text-medical-primary transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>support@medical.vn</span>
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-3 text-gray-600">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">Miễn phí vận chuyển từ 500.000đ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header - Clean & Modern */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo - Minimalist */}
            <a href="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-medical-primary to-medical-accent rounded-2xl flex items-center justify-center shadow-lg shadow-medical-primary/20 group-hover:shadow-xl group-hover:shadow-medical-primary/30 transition-all duration-300">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
              </div>
              <div>
                <div className="text-xl font-bold bg-gradient-to-r from-medical-primary to-medical-accent bg-clip-text text-transparent">
                  Medical Electronics
                </div>
                <div className="text-xs text-gray-500 font-medium">Chăm sóc sức khỏe toàn diện</div>
              </div>
            </a>

            {/* Center Navigation - Pill Style */}
            <nav className="hidden lg:flex items-center space-x-2 bg-gray-50 rounded-full px-2 py-2">
              {[
                { href: '/', label: 'Trang chủ', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
                { href: '/products', label: 'Sản phẩm', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
                { href: '/about', label: 'Giới thiệu', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                { href: '/blog', label: 'Bài viết', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z' },
                { href: '/contact', label: 'Liên hệ', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' }
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                    isActive(item.href)
                      ? 'bg-gradient-to-r from-medical-primary to-medical-accent text-white shadow-md'
                      : 'text-gray-700 hover:bg-white hover:shadow-sm'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                  <span>{item.label}</span>
                </a>
              ))}
            </nav>

            {/* Right Actions - Icon Based */}
            <div className="flex items-center space-x-3">
              {/* Search */}
              <button className="hidden md:flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 text-gray-600 hover:text-medical-primary transition-all duration-300 border-0 outline-none focus:outline-none focus:ring-2 focus:ring-medical-primary/20">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* Cart with Badge */}
              <a href="/cart" className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 text-gray-600 hover:text-medical-primary transition-all duration-300 group border-0 outline-none focus:outline-none focus:ring-2 focus:ring-medical-primary/20">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {getTotalItems() > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1.5 shadow-lg animate-pulse border-0">
                    {getTotalItems()}
                  </span>
                )}
              </a>

              {/* Login Button */}
              <button className="hidden md:flex items-center space-x-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-medical-primary to-medical-accent rounded-full hover:shadow-lg hover:scale-105 transition-all duration-300 border-0 outline-none focus:outline-none focus:ring-2 focus:ring-medical-primary/30 focus:ring-offset-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Đăng nhập</span>
              </button>

              {/* Mobile Menu */}
              <button className="lg:hidden flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 text-gray-600 hover:text-medical-primary transition-all duration-300 border-0 outline-none focus:outline-none focus:ring-2 focus:ring-medical-primary/20">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}

// Simple page components for shop
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
  const { isAuthenticated, user } = useAuthStore();

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
  const { isAuthenticated } = useAuthStore();

  return (
    <Routes>
        {/* Public E-commerce Shop Routes */}
        <Route path="/" element={<ShopLayout><Suspense fallback={<PageLoader />}><ShopHome /></Suspense></ShopLayout>} />
        <Route path="/products" element={<ShopLayout><Suspense fallback={<PageLoader />}><ShopProducts /></Suspense></ShopLayout>} />
        <Route path="/products/:id" element={<ShopLayout><Suspense fallback={<PageLoader />}><ShopProductDetail /></Suspense></ShopLayout>} />
        <Route path="/cart" element={<ShopLayout><Suspense fallback={<PageLoader />}><ShopCart /></Suspense></ShopLayout>} />
        <Route path="/checkout" element={<ShopLayout><Suspense fallback={<PageLoader />}><ShopCheckout /></Suspense></ShopLayout>} />
        <Route path="/orders" element={<ShopLayout><Suspense fallback={<PageLoader />}><ShopOrders /></Suspense></ShopLayout>} />
        <Route path="/about" element={<ShopLayout><Suspense fallback={<PageLoader />}><ShopAbout /></Suspense></ShopLayout>} />
        <Route path="/blog" element={<ShopLayout><Suspense fallback={<PageLoader />}><ShopBlog /></Suspense></ShopLayout>} />
        <Route path="/contact" element={<ShopLayout><ContactPageShop /></ShopLayout>} />

        {/* Login Route */}
        <Route
          path="/login"
          element={!isAuthenticated ? <Suspense fallback={<PageLoader />}><Login /></Suspense> : <Navigate to="/dashboard" />}
        />

        {/* Protected POS Routes - Direct to Sales Page */}
        <Route path="/pos" element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <POSSales />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/pos/products" element={
          <ProtectedRoute>
            <MainLayout>
              <Suspense fallback={<PageLoader />}>
                <POSProducts />
              </Suspense>
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/pos/reports" element={
          <ProtectedRoute>
            <MainLayout>
              <Suspense fallback={<PageLoader />}>
                <POSReports />
              </Suspense>
            </MainLayout>
          </ProtectedRoute>
        } />

        {/* Protected Dashboard Routes (Admin/Manager) */}
        <Route path="/dashboard" element={
          <ProtectedRoute requiredRole="admin">
            <MainLayout>
              <Suspense fallback={<PageLoader />}>
                <Dashboard />
              </Suspense>
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

        {/* System Routes */}
        <Route path="/dashboard/database" element={
          <ProtectedRoute requiredRole="admin">
            <MainLayout>
              <DatabasePage />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/api-status" element={
          <ProtectedRoute requiredRole="admin">
            <MainLayout>
              <APIStatusPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/security" element={
          <ProtectedRoute requiredRole="admin">
            <MainLayout>
              <SecurityPage />
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