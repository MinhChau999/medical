import { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Space, Badge, Button, Tooltip, Input, theme } from 'antd';
import { motion } from 'framer-motion';
import AnimatedContent from '@/components/AnimatedContent';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '@/stores/themeStore';
import {
  DashboardOutlined,
  ShoppingCartOutlined,
  AppstoreOutlined,
  TeamOutlined,
  ContainerOutlined,
  SettingOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
  QuestionCircleOutlined,
  GithubOutlined,
  DatabaseOutlined,
  ApiOutlined,
  CloudServerOutlined,
  SafetyOutlined,
  FileTextOutlined,
  SunOutlined,
  MoonOutlined,
  TagOutlined,
  HomeOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  DesktopOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';

const { Header, Sider, Content } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { t, i18n } = useTranslation();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  useEffect(() => {
    // Apply theme class to body
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.style.background = '#0F1419';
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.style.background = '#F8FAFB';
    }
  }, [isDarkMode]);

  // Language selector items
  const languageItems = [
    {
      key: 'vi',
      label: '🇻🇳 Tiếng Việt',
      onClick: () => i18n.changeLanguage('vi'),
    },
    {
      key: 'en',
      label: '🇬🇧 English',
      onClick: () => i18n.changeLanguage('en'),
    },
  ];

  // Menu items inspired by nginx-ui structure
  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: t('dashboard'),
    },
    {
      type: 'divider',
    },
    {
      key: 'group-management',
      label: t('management'),
      type: 'group',
      children: [
        {
          key: '/dashboard/categories',
          icon: <TagOutlined />,
          label: t('categories'),
        },
        {
          key: '/dashboard/products',
          icon: <AppstoreOutlined />,
          label: t('products'),
        },
        {
          key: '/dashboard/orders',
          icon: <ShoppingCartOutlined />,
          label: t('orders'),
        },
        {
          key: '/dashboard/inventory',
          icon: <ContainerOutlined />,
          label: t('inventory'),
        },
        {
          key: '/dashboard/customers',
          icon: <TeamOutlined />,
          label: t('customers'),
        },
      ],
    },
    {
      type: 'divider',
    },
    {
      key: 'group-pages',
      label: t('pageManagement'),
      type: 'group',
      children: [
        {
          key: '/dashboard/homepage',
          icon: <HomeOutlined />,
          label: t('homepage'),
        },
        {
          key: '/dashboard/blog',
          icon: <FileTextOutlined />,
          label: t('blog'),
        },
        {
          key: '/dashboard/contact',
          icon: <PhoneOutlined />,
          label: t('contact'),
        },
        {
          key: '/dashboard/map',
          icon: <EnvironmentOutlined />,
          label: t('googleMap'),
        },
      ],
    },
    {
      type: 'divider',
    },
    {
      key: 'group-system',
      label: t('system'),
      type: 'group',
      children: [
        {
          key: '/dashboard/database',
          icon: <DatabaseOutlined />,
          label: t('database'),
        },
        {
          key: '/dashboard/api',
          icon: <ApiOutlined />,
          label: t('apiStatus'),
        },
        {
          key: '/dashboard/server',
          icon: <CloudServerOutlined />,
          label: t('server'),
        },
        {
          key: '/dashboard/security',
          icon: <SafetyOutlined />,
          label: t('security'),
        },
      ],
    },
    {
      type: 'divider',
    },
    {
      key: '/dashboard/settings',
      icon: <SettingOutlined />,
      label: t('settings'),
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: t('profile'),
      onClick: () => navigate('/dashboard/settings/profile'),
    },
    {
      type: 'divider',
    },
    {
      key: 'help',
      icon: <QuestionCircleOutlined />,
      label: t('helpSupport'),
      onClick: () => window.open('https://docs.medical.com', '_blank'),
    },
    {
      key: 'github',
      icon: <GithubOutlined />,
      label: 'GitHub',
      onClick: () => window.open('https://github.com/medical', '_blank'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('logout'),
      danger: true,
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  const getCurrentPageTitle = () => {
    const findInItems = (items: any[]): string => {
      for (const item of items) {
        if (item.key === location.pathname) {
          return item.label;
        }
        if (item.children) {
          const found = findInItems(item.children);
          if (found) return found;
        }
      }
      return '';
    };
    return findInItems(menuItems) || 'Dashboard';
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        width={240}
        className="medical-sidebar"
        style={{
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          background: 'var(--medical-gradient-sidebar)',
          borderRight: '1px solid var(--medical-border-primary)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Fixed Logo Section */}
        <div style={{ 
          height: 64, 
          minHeight: 64,
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.2)',
          flexShrink: 0,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: 'var(--medical-gradient-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: 16,
              color: '#fff',
            }}>
              M
            </div>
            {!collapsed && (
              <div>
                <div style={{ 
                  fontSize: 16, 
                  fontWeight: 600, 
                  color: '#FFFFFF'
                }}>
                  Medical Admin
                </div>
                <div style={{ 
                  fontSize: 11, 
                  color: 'rgba(255, 255, 255, 0.65)'
                }}>
                  Healthcare System
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Scrollable Menu Section */}
        <div style={{
          flex: '1 1 auto',
          overflowY: 'auto',
          overflowX: 'hidden',
          minHeight: 0,
          paddingBottom: 16,
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255, 255, 255, 0.3) rgba(255, 255, 255, 0.05)',
        }}>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
            style={{
              borderRight: 0,
              marginTop: 8,
              height: 'auto',
            }}
          />
        </div>
      </Sider>
      
      <Layout style={{ 
        marginLeft: collapsed ? 80 : 240, 
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        minHeight: '100vh',
        overflow: 'hidden'
      }}>
        <Header 
          className="medical-header"
          style={{ 
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 64,
            position: 'sticky',
            top: 0,
            zIndex: 1,
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: 16,
                width: 48,
                height: 48,
              }}
            />
            <div style={{ 
              marginLeft: 16,
              fontSize: 18, 
              fontWeight: 500,
              color: 'var(--medical-text-primary)',
            }}>
              {getCurrentPageTitle()}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Input
                placeholder={t('search')}
                prefix={<SearchOutlined style={{ color: 'var(--medical-text-tertiary)' }} />}
                className="medical-input"
                style={{
                  width: 240,
                  borderRadius: 8,
                }}
                allowClear
              />
            </motion.div>

            {/* POS Button */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, type: 'spring' }}
            >
              <Tooltip title={t('launchPOS')}>
                <Button
                  type="primary"
                  icon={<DesktopOutlined style={{ color: '#FFFFFF' }} />}
                  onClick={() => navigate('/pos')}
                  style={{
                    height: 36,
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, #00A6B8 0%, #26C6DA 100%)',
                    border: 'none',
                    fontWeight: 500,
                    fontSize: 14,
                    paddingLeft: 12,
                    paddingRight: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 2px 8px rgba(0, 166, 184, 0.25)',
                    transition: 'all 0.3s ease',
                    color: '#FFFFFF',
                  }}
                  className="pos-launch-btn"
                >
                  <span style={{ color: '#FFFFFF' }}>POS</span>
                </Button>
              </Tooltip>
            </motion.div>

            {/* Theme Toggle */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
            >
              <Tooltip title={isDarkMode ? 'Light Mode' : 'Dark Mode'}>
                <Button
                  type="text"
                  icon={
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 20,
                      height: 20,
                      position: 'relative',
                    }}>
                      {isDarkMode ? (
                        <>
                          <div style={{
                            position: 'absolute',
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                            boxShadow: '0 0 20px rgba(255, 215, 0, 0.6), inset -2px -2px 4px rgba(255, 165, 0, 0.4)',
                          }} />
                          <SunOutlined style={{ 
                            fontSize: 11,
                            color: '#fff',
                            zIndex: 1,
                            position: 'relative'
                          }} />
                        </>
                      ) : (
                        <>
                          <div style={{
                            position: 'absolute',
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
                            boxShadow: '0 0 20px rgba(139, 92, 246, 0.4), inset -2px -2px 4px rgba(109, 40, 217, 0.3)',
                          }}>
                            <div style={{
                              position: 'absolute',
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background: 'rgba(255, 255, 255, 0.3)',
                              top: 3,
                              right: 3,
                            }} />
                            <div style={{
                              position: 'absolute',
                              width: 4,
                              height: 4,
                              borderRadius: '50%',
                              background: 'rgba(255, 255, 255, 0.2)',
                              bottom: 4,
                              left: 2,
                            }} />
                          </div>
                          <MoonOutlined style={{ 
                            fontSize: 11,
                            color: '#fff',
                            zIndex: 1,
                            position: 'relative'
                          }} />
                        </>
                      )}
                    </div>
                  }
                  onClick={toggleTheme}
                  style={{
                    width: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--medical-bg-tertiary)',
                    borderRadius: '50%',
                    transition: 'all 0.3s ease',
                  }}
                  className="theme-toggle-btn"
                />
              </Tooltip>
            </motion.div>

            {/* Language Selector */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25, type: 'spring' }}
            >
              <Dropdown menu={{ items: languageItems }} placement="bottomRight">
                <Button 
                  type="text" 
                  style={{ 
                    fontSize: 18,
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--medical-bg-tertiary)',
                    transition: 'all 0.3s ease',
                  }}
                  className="language-btn"
                >
                  {i18n.language === 'vi' ? '🇻🇳' : '🇬🇧'}
                </Button>
              </Dropdown>
            </motion.div>

            {/* Notifications */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
            >
              <Tooltip title={t('notifications')}>
                <Badge 
                  count={5} 
                  size="small"
                >
                  <Button 
                    type="text" 
                    icon={<BellOutlined />} 
                    style={{ 
                      fontSize: 16,
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'var(--medical-bg-tertiary)',
                      color: '#999999',
                    }}
                    className="notification-btn"
                  />
                </Badge>
              </Tooltip>
            </motion.div>

            {/* User Menu */}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
              <Button 
                type="text"
                style={{ 
                  padding: '4px 8px',
                  height: 'auto',
                }}
              >
                <Space size={8}>
                  <Avatar 
                    size={28} 
                    style={{ 
                      background: 'var(--medical-gradient-primary)',
                      fontSize: 14,
                    }}
                  >
                    {user?.email?.charAt(0).toUpperCase()}
                  </Avatar>
                  <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{user?.email?.split('@')[0]}</div>
                    <div style={{ fontSize: 11, color: 'var(--medical-text-tertiary)' }}>{t('administrator')}</div>
                  </div>
                </Space>
              </Button>
            </Dropdown>
          </div>
        </Header>

        <Content
          className="medical-content"
          style={{
            margin: location.pathname === '/dashboard' ? 24 : 0,
            minHeight: 280,
            overflow: 'auto',
            maxWidth: '100%',
          }}
        >
          {location.pathname === '/dashboard' ? (
            <div style={{
              padding: '0 24px 24px 24px',
            }}>
              <AnimatedContent>
                {children}
              </AnimatedContent>
            </div>
          ) : (
            <AnimatedContent>
              {children}
            </AnimatedContent>
          )}
        </Content>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          padding: '16px 24px',
          color: 'var(--medical-text-tertiary)',
          fontSize: 12,
          borderTop: '1px solid var(--medical-border-primary)',
          background: 'var(--medical-bg-primary)',
        }}>
          <Space split="·" size="small">
            <span>Medical Admin System</span>
            <span>© 2025 Medical Electronics</span>
            <a href="https://github.com/medical" target="_blank" style={{ color: 'var(--medical-primary)' }}>
              <GithubOutlined /> GitHub
            </a>
            <a href="https://docs.medical.com" target="_blank" style={{ color: 'var(--medical-primary)' }}>
              {t('documentation')}
            </a>
          </Space>
        </div>
      </Layout>
    </Layout>
  );
};

export default MainLayout;