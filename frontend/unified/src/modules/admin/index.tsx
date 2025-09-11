import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { Spin } from 'antd'
import AdminLayout from './components/AdminLayout'

// Lazy load Admin pages
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Products = lazy(() => import('./pages/Products'))
const Orders = lazy(() => import('./pages/Orders'))
const Customers = lazy(() => import('./pages/Customers'))
const Inventory = lazy(() => import('./pages/Inventory'))
const Reports = lazy(() => import('./pages/Reports'))
const Settings = lazy(() => import('./pages/Settings'))
const Users = lazy(() => import('./pages/Users'))
const Categories = lazy(() => import('./pages/Categories'))
const Brands = lazy(() => import('./pages/Brands'))
const Suppliers = lazy(() => import('./pages/Suppliers'))
const Coupons = lazy(() => import('./pages/Coupons'))

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <Spin size="large" />
  </div>
)

export default function AdminModule() {
  return (
    <div className="admin-module">
      <AdminLayout>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="orders" element={<Orders />} />
            <Route path="customers" element={<Customers />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="users" element={<Users />} />
            <Route path="categories" element={<Categories />} />
            <Route path="brands" element={<Brands />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="coupons" element={<Coupons />} />
          </Routes>
        </Suspense>
      </AdminLayout>
    </div>
  )
}