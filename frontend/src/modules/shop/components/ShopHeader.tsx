import { useState } from 'react';
import { Layout, Menu, Input, Badge, Button, Drawer, Avatar, Dropdown, Space } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  SearchOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  MenuOutlined,
  HeartOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { RootState } from '@/stores/store';
import { logout } from '@/stores/slices/authSlice';

const { Header } = Layout;

export default function ShopHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { itemCount } = useSelector((state: RootState) => state.cart);
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  const categories = [
    { key: 'monitoring', label: 'Monitoring Devices', path: '/shop/category/monitoring' },
    { key: 'diagnostic', label: 'Diagnostic Tools', path: '/shop/category/diagnostic' },
    { key: 'firstaid', label: 'First Aid', path: '/shop/category/firstaid' },
    { key: 'mobility', label: 'Mobility Aids', path: '/shop/category/mobility' },
    { key: 'deals', label: 'Deals', path: '/shop/deals' },
  ];

  const userMenuItems = isAuthenticated
    ? [
        {
          key: 'account',
          label: 'My Account',
          icon: <UserOutlined />,
          onClick: () => navigate('/shop/account'),
        },
        {
          key: 'orders',
          label: 'My Orders',
          onClick: () => navigate('/shop/orders'),
        },
        {
          key: 'wishlist',
          label: 'Wishlist',
          icon: <HeartOutlined />,
          onClick: () => navigate('/shop/wishlist'),
        },
        {
          type: 'divider' as const,
        },
        {
          key: 'logout',
          label: 'Logout',
          icon: <LogoutOutlined />,
          onClick: () => {
            dispatch(logout());
            navigate('/login');
          },
        },
      ]
    : [
        {
          key: 'login',
          label: 'Login',
          onClick: () => navigate('/login'),
        },
        {
          key: 'register',
          label: 'Register',
          onClick: () => navigate('/register'),
        },
      ];

  const handleSearch = () => {
    if (searchValue.trim()) {
      navigate(`/shop/products?search=${encodeURIComponent(searchValue)}`);
    }
  };

  return (
    <Header className="bg-white shadow-sm fixed w-full z-10 px-0">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/shop" className="flex items-center">
            <span className="text-2xl font-bold text-blue-600">Medical</span>
            <span className="text-2xl font-light text-gray-600 ml-1">Shop</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {categories.map((category) => (
              <Link
                key={category.key}
                to={category.path}
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                {category.label}
              </Link>
            ))}
          </nav>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <Input.Search
              placeholder="Search products..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onSearch={handleSearch}
              enterButton
            />
          </div>

          {/* Actions */}
          <Space size="middle">
            {/* Mobile Menu Button */}
            <Button
              className="md:hidden"
              icon={<MenuOutlined />}
              onClick={() => setIsMenuOpen(true)}
            />

            {/* Wishlist */}
            <Button
              icon={<HeartOutlined />}
              shape="circle"
              onClick={() => navigate('/shop/wishlist')}
            />

            {/* Cart */}
            <Badge count={itemCount}>
              <Button
                icon={<ShoppingCartOutlined />}
                shape="circle"
                onClick={() => navigate('/shop/cart')}
              />
            </Badge>

            {/* User Menu */}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Avatar
                icon={<UserOutlined />}
                className="cursor-pointer"
                src={user?.avatar}
              />
            </Dropdown>
          </Space>
        </div>
      </div>

      {/* Mobile Drawer */}
      <Drawer
        title="Menu"
        placement="left"
        onClose={() => setIsMenuOpen(false)}
        open={isMenuOpen}
      >
        <Input.Search
          placeholder="Search products..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onSearch={(value) => {
            handleSearch();
            setIsMenuOpen(false);
          }}
          className="mb-4"
        />
        
        <Menu
          mode="vertical"
          items={categories.map(cat => ({
            key: cat.key,
            label: cat.label,
            onClick: () => {
              navigate(cat.path);
              setIsMenuOpen(false);
            },
          }))}
        />
      </Drawer>
    </Header>
  );
}