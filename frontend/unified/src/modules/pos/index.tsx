import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { Spin } from 'antd'
import POSLayout from './components/POSLayout'

// Lazy load POS pages
const POSDashboard = lazy(() => import('./pages/Dashboard'))
const POSSales = lazy(() => import('./pages/Sales'))
const POSProducts = lazy(() => import('./pages/Products'))
const POSCustomers = lazy(() => import('./pages/Customers'))
const POSReports = lazy(() => import('./pages/Reports'))
const POSSettings = lazy(() => import('./pages/Settings'))

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <Spin size="large" />
  </div>
)

export default function POSModule() {
  return (
    <div className="pos-module">
      <POSLayout>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route index element={<POSDashboard />} />
            <Route path="sales" element={<POSSales />} />
            <Route path="products" element={<POSProducts />} />
            <Route path="customers" element={<POSCustomers />} />
            <Route path="reports" element={<POSReports />} />
            <Route path="settings" element={<POSSettings />} />
          </Routes>
        </Suspense>
      </POSLayout>
    </div>
  )
}