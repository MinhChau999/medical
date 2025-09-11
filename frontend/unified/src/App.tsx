import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { Spin } from 'antd'

// Lazy load modules
const POSModule = lazy(() => import('./modules/pos'))
const ShopModule = lazy(() => import('./modules/shop'))
const AdminModule = lazy(() => import('./modules/admin'))

// Auth components
const Login = lazy(() => import('./shared/components/Auth/Login'))
const Register = lazy(() => import('./shared/components/Auth/Register'))

// Loading component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Spin size="large" />
  </div>
)

function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Root redirect based on user role or default */}
        <Route path="/" element={<Navigate to="/shop" replace />} />
        
        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Module routes */}
        <Route path="/pos/*" element={<POSModule />} />
        <Route path="/shop/*" element={<ShopModule />} />
        <Route path="/admin/*" element={<AdminModule />} />
        
        {/* 404 */}
        <Route path="*" element={<Navigate to="/shop" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App