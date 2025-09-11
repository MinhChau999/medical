import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { Spin } from 'antd'
import ShopLayout from './components/ShopLayout'

// Lazy load Shop pages
const HomePage = lazy(() => import('./pages/Home'))
const ProductsPage = lazy(() => import('./pages/Products'))
const ProductDetailPage = lazy(() => import('./pages/ProductDetail'))
const CartPage = lazy(() => import('./pages/Cart'))
const CheckoutPage = lazy(() => import('./pages/Checkout'))
const AccountPage = lazy(() => import('./pages/Account'))
const OrdersPage = lazy(() => import('./pages/Orders'))
const WishlistPage = lazy(() => import('./pages/Wishlist'))

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <Spin size="large" />
  </div>
)

export default function ShopModule() {
  return (
    <div className="shop-module">
      <ShopLayout>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route index element={<HomePage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="products/:id" element={<ProductDetailPage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="account" element={<AccountPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="wishlist" element={<WishlistPage />} />
          </Routes>
        </Suspense>
      </ShopLayout>
    </div>
  )
}