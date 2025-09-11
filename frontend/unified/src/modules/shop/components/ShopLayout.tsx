import { ReactNode } from 'react'
import { Layout, Menu, Input, Button, Badge, Dropdown, Avatar } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import {
  HomeOutlined,
  ShoppingCartOutlined,
  HeartOutlined,
  UserOutlined,
  SearchOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { RootState } from '@/stores/store'
import { logout } from '@/stores/slices/authSlice'

const { Header, Content, Footer } = Layout

interface ShopLayoutProps {
  children: ReactNode
}

export default function ShopLayout({ children }: ShopLayoutProps) {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth)
  const { itemCount } = useSelector((state: RootState) => state.cart)

  const menuItems = [
    {
      key: '/',
      label: 'Home',
    },
    {
      key: '/products',
      label: 'Products',
    },
    {
      key: '/categories',
      label: 'Categories',
    },
    {
      key: '/brands',
      label: 'Brands',
    },
    {
      key: '/deals',
      label: 'Deals',
    },
  ]

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
            dispatch(logout())
            navigate('/login')
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
      ]

  return (
    <Layout className="min-h-screen">
      <Header className="bg-white shadow-sm fixed w-full z-10">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="text-2xl font-bold text-blue-600 cursor-pointer" onClick={() => navigate('/shop')}>
              MedShop
            </div>
            
            <Menu
              mode="horizontal"
              items={menuItems}
              className="border-0"
              onClick={({ key }) => navigate(key)}
            />
          </div>

          <div className="flex items-center gap-4">
            <Input
              placeholder="Search products..."
              prefix={<SearchOutlined />}
              className="w-64"
              onPressEnter={(e) => {
                const value = (e.target as HTMLInputElement).value
                if (value) navigate(`/shop/products?search=${value}`)
              }}
            />

            <Badge count={itemCount}>
              <Button
                icon={<ShoppingCartOutlined />}
                shape="circle"
                onClick={() => navigate('/shop/cart')}
              />
            </Badge>

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Avatar
                icon={<UserOutlined />}
                className="cursor-pointer"
                src={user?.avatar}
              />
            </Dropdown>
          </div>
        </div>
      </Header>

      <Content className="mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {children}
        </div>
      </Content>

      <Footer className="text-center bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-semibold mb-4">About Us</h3>
              <ul className="space-y-2 text-gray-600">
                <li>Company Info</li>
                <li>Our Story</li>
                <li>Careers</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Customer Service</h3>
              <ul className="space-y-2 text-gray-600">
                <li>Contact Us</li>
                <li>Shipping Info</li>
                <li>Returns</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-600">
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>FAQ</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Follow Us</h3>
              <ul className="space-y-2 text-gray-600">
                <li>Facebook</li>
                <li>Twitter</li>
                <li>Instagram</li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-4 text-gray-600">
            © 2024 Medical Electronics Shop. All rights reserved.
          </div>
        </div>
      </Footer>
    </Layout>
  )
}