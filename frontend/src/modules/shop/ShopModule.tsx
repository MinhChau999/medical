import { Routes, Route } from 'react-router-dom';
import ShopHome from './pages/ShopHome';
import ShopProducts from './pages/ShopProducts';
import ShopProductDetail from './pages/ShopProductDetail';
import ShopCart from './pages/ShopCart';
import ShopCheckout from './pages/ShopCheckout';
import ShopOrders from './pages/ShopOrders';

export default function ShopModule() {
  return (
    <Routes>
      <Route path="/" element={<ShopHome />} />
      <Route path="/products" element={<ShopProducts />} />
      <Route path="/products/:id" element={<ShopProductDetail />} />
      <Route path="/cart" element={<ShopCart />} />
      <Route path="/checkout" element={<ShopCheckout />} />
      <Route path="/orders" element={<ShopOrders />} />
    </Routes>
  );
}