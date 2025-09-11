import { ReactNode } from 'react'
import { Layout, Menu, Button, Avatar, Badge, Dropdown, Breadcrumb } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import {
  DashboardOutlined,
  ShoppingOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  TeamOutlined,
  ContainerOutlined,
  BarChartOutlined,
  SettingOutlined,
  TagsOutlined,
  BankOutlined,
  GiftOutlined,
  LogoutOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'
import { RootState } from '@/stores/store'
import { logout } from '@/stores/slices/authSlice'
import { toggleSidebar } from '@/stores/slices/uiSlice'

const { Header, Sider, Content } = Layout

interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const { user } = useSelector((state: RootState) => state.auth)
  const { sidebarCollapsed } = useSelector((state: RootState) => state.ui)

  const menuItems = [
    {
      key: '/admin',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: 'catalog',
      icon: <ShoppingOutlined />,
      label: 'Catalog',
      children: [
        {
          key: '/admin/products',
          label: 'Products',
        },
        {
          key: '/admin/categories',
          label: 'Categories',
        },
        {
          key: '/admin/brands',
          label: 'Brands',
        },
      ],
    },
    {
      key: '/admin/orders',
      icon: <ShoppingCartOutlined />,
      label: 'Orders',
    },
    {
      key: '/admin/customers',
      icon: <UserOutlined />,
      label: 'Customers',
    },
    {
      key: '/admin/inventory',
      icon: <ContainerOutlined />,
      label: 'Inventory',
    },
    {
      key: 'management',
      icon: <TeamOutlined />,
      label: 'Management',
      children: [
        {
          key: '/admin/users',
          label: 'Users',
        },
        {
          key: '/admin/suppliers',
          label: 'Suppliers',
        },
      ],
    },
    {
      key: 'marketing',
      icon: <GiftOutlined />,
      label: 'Marketing',
      children: [
        {
          key: '/admin/coupons',
          label: 'Coupons',
        },
        {
          key: '/admin/campaigns',
          label: 'Campaigns',
        },
      ],
    },
    {
      key: '/admin/reports',
      icon: <BarChartOutlined />,
      label: 'Reports',
    },
    {
      key: '/admin/settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
  ]

  const userMenuItems = [
    {
      key: 'profile',
      label: 'Profile',
      icon: <UserOutlined />,
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: <SettingOutlined />,
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

  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean)
    return paths.map((path, index) => ({
      title: path.charAt(0).toUpperCase() + path.slice(1),
      href: '/' + paths.slice(0, index + 1).join('/'),
    }))
  }

  return (
    <Layout className="min-h-screen">
      <Sider
        collapsible
        collapsed={sidebarCollapsed}
        onCollapse={() => dispatch(toggleSidebar())}
        theme="dark"
        width={250}
      >
        <div className="h-16 flex items-center justify-center text-white text-xl font-bold">
          {sidebarCollapsed ? 'Admin' : 'Admin Panel'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={['catalog', 'management', 'marketing']}
          items={menuItems}
          onClick={({ key }) => {
            if (key.startsWith('/')) navigate(key)
          }}
        />
      </Sider>
      
      <Layout>
        <Header className="bg-white px-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <Button
              icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => dispatch(toggleSidebar())}
            />
            <Breadcrumb items={getBreadcrumbs()} />
          </div>
          
          <div className="flex items-center gap-4">
            <Badge count={12} overflowCount={9}>
              <Button icon={<BellOutlined />} shape="circle" />
            </Badge>
            
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div className="flex items-center gap-2 cursor-pointer">
                <Avatar icon={<UserOutlined />} src={user?.avatar} />
                <div className="hidden md:block">
                  <div className="font-medium">{user?.firstName} {user?.lastName}</div>
                  <div className="text-xs text-gray-500">{user?.role}</div>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>
        
        <Content className="m-6">
          <div className="bg-white p-6 rounded-lg shadow-sm min-h-[calc(100vh-120px)]">
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}