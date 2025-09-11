import { ReactNode } from 'react'
import { Layout, Menu, Button, Avatar, Badge, Dropdown } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import {
  DashboardOutlined,
  ShoppingCartOutlined,
  AppstoreOutlined,
  UserOutlined,
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined,
  BellOutlined,
} from '@ant-design/icons'
import { RootState } from '@/stores/store'
import { logout } from '@/stores/slices/authSlice'

const { Header, Sider, Content } = Layout

interface POSLayoutProps {
  children: ReactNode
}

export default function POSLayout({ children }: POSLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const { user } = useSelector((state: RootState) => state.auth)
  const { sidebarCollapsed } = useSelector((state: RootState) => state.ui)

  const menuItems = [
    {
      key: '/pos',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/pos/sales',
      icon: <ShoppingCartOutlined />,
      label: 'Sales',
    },
    {
      key: '/pos/products',
      icon: <AppstoreOutlined />,
      label: 'Products',
    },
    {
      key: '/pos/customers',
      icon: <UserOutlined />,
      label: 'Customers',
    },
    {
      key: '/pos/reports',
      icon: <BarChartOutlined />,
      label: 'Reports',
    },
    {
      key: '/pos/settings',
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
      key: 'logout',
      label: 'Logout',
      icon: <LogoutOutlined />,
      onClick: () => {
        dispatch(logout())
        navigate('/login')
      },
    },
  ]

  return (
    <Layout className="min-h-screen">
      <Sider
        collapsible
        collapsed={sidebarCollapsed}
        onCollapse={(collapsed) => {
          // You can dispatch an action to update the UI state here
        }}
        theme="dark"
      >
        <div className="h-16 flex items-center justify-center text-white text-xl font-bold">
          {sidebarCollapsed ? 'POS' : 'POS System'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      
      <Layout>
        <Header className="bg-white px-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold">Point of Sale</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge count={5}>
              <Button icon={<BellOutlined />} shape="circle" />
            </Badge>
            
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div className="flex items-center gap-2 cursor-pointer">
                <Avatar icon={<UserOutlined />} />
                <span className="font-medium">{user?.firstName} {user?.lastName}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        
        <Content className="m-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}