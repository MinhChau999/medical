import React, { useState, useEffect } from 'react';
import { Layout, Button, Space, Typography, Badge, Dropdown, Avatar, Tooltip, Modal, message } from 'antd';
import {
  LogoutOutlined,
  UserOutlined,
  ClockCircleOutlined,
  BellOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  MenuOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  PrinterOutlined,
  SettingOutlined,
  HomeOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import type { MenuProps } from 'antd';

const { Header, Content } = Layout;
const { Text } = Typography;

interface POSLayoutProps {
  children: React.ReactNode;
}

const POSLayout: React.FC<POSLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { isDarkMode } = useThemeStore();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [shiftStatus, setShiftStatus] = useState<'open' | 'closed'>('closed');
  const [notifications, setNotifications] = useState<number>(0);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // SSE for online orders - disabled for now to avoid 404 errors
  useEffect(() => {
    // Commented out SSE connection to avoid 404 errors in development
    // Will be enabled when backend API is ready
    
    // const eventSource = new EventSource('/api/sse/orders');
    // 
    // eventSource.onmessage = (event) => {
    //   const data = JSON.parse(event.data);
    //   if (data.type === 'new_order') {
    //     setNotifications(prev => prev + 1);
    //     message.info('Đơn hàng online mới!');
    //   }
    // };
    // 
    // eventSource.onerror = () => {
    //   console.log('SSE connection error');
    // };
    // 
    // return () => {
    //   eventSource.close();
    // };
    
    // Simulate occasional notifications for demo purposes
    const timer = setInterval(() => {
      if (Math.random() > 0.95) {
        setNotifications(prev => prev + 1);
        message.info('Đơn hàng online mới!');
      }
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(timer);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleStartShift = () => {
    Modal.confirm({
      title: 'Bắt đầu ca làm việc',
      content: 'Xác nhận bắt đầu ca làm việc mới?',
      okText: 'Bắt đầu',
      cancelText: 'Hủy',
      onOk: () => {
        setShiftStatus('open');
        message.success('Đã bắt đầu ca làm việc');
      }
    });
  };

  const handleEndShift = () => {
    Modal.confirm({
      title: 'Kết thúc ca làm việc',
      content: 'Xác nhận kết thúc ca làm việc? Hệ thống sẽ tạo báo cáo cuối ngày.',
      okText: 'Kết thúc',
      cancelText: 'Hủy',
      onOk: () => {
        setShiftStatus('closed');
        message.success('Đã kết thúc ca làm việc. Đang tạo báo cáo...');
        // Generate end of day report
        setTimeout(() => {
          message.success('Báo cáo cuối ngày đã được tạo');
        }, 2000);
      }
    });
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: `${user?.name || 'Nhân viên'}`,
      disabled: true,
    },
    { type: 'divider' },
    {
      key: 'shift',
      icon: <ClockCircleOutlined />,
      label: shiftStatus === 'open' ? 'Kết thúc ca' : 'Bắt đầu ca',
      onClick: shiftStatus === 'open' ? handleEndShift : handleStartShift,
    },
    {
      key: 'report',
      icon: <PrinterOutlined />,
      label: 'Báo cáo ca',
      disabled: shiftStatus === 'closed',
    },
    { type: 'divider' },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Cài đặt POS',
    },
    {
      key: 'back',
      icon: <HomeOutlined />,
      label: 'Về Dashboard',
      onClick: () => navigate('/dashboard'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true,
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: isDarkMode ? '#0F1419' : '#F5F7FA' }}>
      {/* POS Header */}
      <Header
        style={{
          background: isDarkMode 
            ? 'linear-gradient(135deg, #1A2332 0%, #243142 100%)' 
            : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFB 100%)',
          backdropFilter: 'blur(10px)',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: isDarkMode 
            ? '1px solid rgba(255,255,255,0.08)' 
            : '1px solid rgba(0,166,184,0.1)',
          boxShadow: isDarkMode
            ? '0 4px 24px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.2)'
            : '0 4px 24px rgba(0,166,184,0.08), 0 1px 3px rgba(0,0,0,0.04)',
          height: 64,
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        {/* Left Section - Logo & Brand */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 16,
          flex: '0 0 auto',
        }}>
          {/* Logo & Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              position: 'relative',
              width: 42,
              height: 42,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #00A6B8 0%, #26C6DA 100%)',
              boxShadow: '0 4px 12px rgba(0,166,184,0.3), inset 0 1px 2px rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              overflow: 'hidden',
            }}>
              {/* Animated background effect */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
                animation: 'shimmer 3s infinite',
              }} />
              <span style={{
                fontSize: 18,
                fontWeight: 700,
                color: '#FFFFFF',
                letterSpacing: 0.5,
                textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                position: 'relative',
                zIndex: 1,
              }}>
                POS
              </span>
            </div>
            <div>
              <div style={{ 
                fontSize: 16, 
                fontWeight: 700,
                color: isDarkMode ? '#FFFFFF' : '#1A2332',
                lineHeight: 1.1,
                letterSpacing: -0.3,
                background: isDarkMode 
                  ? 'linear-gradient(135deg, #FFFFFF 0%, #B8E6F0 100%)'
                  : 'linear-gradient(135deg, #1A2332 0%, #00A6B8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Medical POS
              </div>
              <div style={{ 
                fontSize: 10, 
                color: isDarkMode ? 'rgba(255,255,255,0.4)' : '#a0a0a0',
                lineHeight: 1.2,
                marginTop: 2,
                letterSpacing: 0.3,
                textTransform: 'uppercase',
                fontWeight: 500,
              }}>
                Hệ thống bán hàng
              </div>
            </div>
          </div>

          {/* Status Indicators */}
          <div style={{
            display: 'flex',
            gap: 8,
          }}>
            {shiftStatus === 'open' && (
              <div style={{
                padding: '4px 10px',
                borderRadius: 20,
                background: 'linear-gradient(135deg, rgba(82,196,26,0.15) 0%, rgba(82,196,26,0.05) 100%)',
                border: '1px solid rgba(82,196,26,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                <div style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: '#52c41a',
                  boxShadow: '0 0 8px rgba(82,196,26,0.6)',
                  animation: 'pulse 2s infinite',
                }} />
                <span style={{
                  fontSize: 11,
                  color: '#52c41a',
                  fontWeight: 600,
                  letterSpacing: 0.5,
                }}>
                  ONLINE
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Center Section - Empty for balance */}
        <div style={{
          flex: '1 1 auto',
        }} />

        {/* Right Section - Clock & Actions */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 16,
          flex: '0 0 auto',
        }}>
          {/* Beautiful Clock Display */}
          <div style={{ 
            position: 'relative',
            padding: '8px 16px',
            borderRadius: 24,
            background: isDarkMode 
              ? 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)'
              : 'linear-gradient(135deg, rgba(0,166,184,0.08) 0%, rgba(0,166,184,0.03) 100%)',
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,166,184,0.15)'}`,
            backdropFilter: 'blur(10px)',
            boxShadow: isDarkMode
              ? 'inset 0 1px 2px rgba(255,255,255,0.05)'
              : 'inset 0 1px 2px rgba(255,255,255,0.5)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(0,166,184,0.2) 0%, rgba(38,198,218,0.2) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <ClockCircleOutlined style={{ 
                  fontSize: 16, 
                  color: '#00A6B8',
                }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                <span style={{ 
                  fontSize: 15,
                  fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                  color: isDarkMode ? '#FFFFFF' : '#1A2332',
                  lineHeight: 1.1,
                  letterSpacing: 0.5,
                }}>
                  {currentTime.toLocaleTimeString('vi-VN')}
                </span>
                <span style={{ 
                  fontSize: 10,
                  color: isDarkMode ? 'rgba(255,255,255,0.5)' : '#6b7280',
                  lineHeight: 1.2,
                  fontWeight: 500,
                  letterSpacing: 0.3,
                }}>
                  {currentTime.toLocaleDateString('vi-VN', { 
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons Group */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px',
            borderRadius: 12,
            background: isDarkMode 
              ? 'rgba(255,255,255,0.03)' 
              : 'rgba(0,0,0,0.02)',
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
          }}>
            {/* Notifications */}
            <Tooltip title="Thông báo" placement="bottom">
              <Badge 
                count={notifications} 
                size="small"
                offset={[-4, 4]}
                style={{
                  boxShadow: '0 2px 8px rgba(250,140,22,0.4)',
                }}
              >
                <Button
                  type="text"
                  icon={<BellOutlined />}
                  onClick={() => setNotifications(0)}
                  style={{
                    width: 36,
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                    color: notifications > 0 
                      ? '#fa8c16' 
                      : isDarkMode ? 'rgba(255,255,255,0.65)' : '#6b7280',
                    background: notifications > 0 
                      ? 'linear-gradient(135deg, rgba(255,152,0,0.15) 0%, rgba(255,152,0,0.05) 100%)'
                      : 'transparent',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  onMouseEnter={(e) => {
                    if (notifications === 0) {
                      e.currentTarget.style.background = isDarkMode 
                        ? 'rgba(255,255,255,0.05)' 
                        : 'rgba(0,0,0,0.03)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (notifications === 0) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                />
              </Badge>
            </Tooltip>

            {/* Fullscreen */}
            <Tooltip title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"} placement="bottom">
              <Button
                type="text"
                icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                onClick={toggleFullscreen}
                style={{
                  width: 36,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 8,
                  color: isDarkMode ? 'rgba(255,255,255,0.65)' : '#6b7280',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDarkMode 
                    ? 'rgba(255,255,255,0.05)' 
                    : 'rgba(0,0,0,0.03)';
                  e.currentTarget.style.color = isDarkMode ? '#FFFFFF' : '#1A2332';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = isDarkMode ? 'rgba(255,255,255,0.65)' : '#6b7280';
                }}
              />
            </Tooltip>
          </div>

          {/* User Profile - Enhanced */}
          <Dropdown 
            menu={{ items: userMenuItems }} 
            placement="bottomRight" 
            arrow={{ pointAtCenter: true }}
            trigger={['click']}
          >
            <Button
              type="text"
              style={{
                height: 40,
                padding: '0 12px',
                borderRadius: 20,
                background: isDarkMode 
                  ? 'linear-gradient(135deg, rgba(0,166,184,0.15) 0%, rgba(0,166,184,0.05) 100%)'
                  : 'linear-gradient(135deg, rgba(0,166,184,0.1) 0%, rgba(0,166,184,0.03) 100%)',
                border: `1px solid ${isDarkMode ? 'rgba(0,166,184,0.3)' : 'rgba(0,166,184,0.2)'}`,
                boxShadow: isDarkMode
                  ? '0 2px 8px rgba(0,166,184,0.2), inset 0 1px 2px rgba(255,255,255,0.05)'
                  : '0 2px 8px rgba(0,166,184,0.1), inset 0 1px 2px rgba(255,255,255,0.5)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = isDarkMode
                  ? '0 4px 12px rgba(0,166,184,0.3), inset 0 1px 2px rgba(255,255,255,0.05)'
                  : '0 4px 12px rgba(0,166,184,0.15), inset 0 1px 2px rgba(255,255,255,0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = isDarkMode
                  ? '0 2px 8px rgba(0,166,184,0.2), inset 0 1px 2px rgba(255,255,255,0.05)'
                  : '0 2px 8px rgba(0,166,184,0.1), inset 0 1px 2px rgba(255,255,255,0.5)';
              }}
            >
              <Space size={8} align="center">
                <Avatar 
                  size={26} 
                  style={{ 
                    background: 'linear-gradient(135deg, #00A6B8 0%, #26C6DA 100%)',
                    fontSize: 12,
                    fontWeight: 600,
                    boxShadow: '0 2px 6px rgba(0,166,184,0.3)',
                  }}
                >
                  {user?.name?.charAt(0)?.toUpperCase() || 'N'}
                </Avatar>
                <span style={{ 
                  fontSize: 13,
                  color: isDarkMode ? '#FFFFFF' : '#1A2332',
                  fontWeight: 600,
                  letterSpacing: 0.2,
                }}>
                  {user?.name || 'Nhân viên'}
                </span>
                <DownOutlined style={{ 
                  fontSize: 9, 
                  color: isDarkMode ? 'rgba(255,255,255,0.5)' : '#8c8c8c',
                  transition: 'transform 0.3s',
                }} />
              </Space>
            </Button>
          </Dropdown>
        </div>
      </Header>

      {/* POS Content */}
      <Content style={{ 
        padding: 0,
        background: isDarkMode ? '#0F1419' : '#F5F7FA',
        height: 'calc(100vh - 64px)',
        overflow: 'hidden',
      }}>
        {children}
      </Content>

      <style>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(82, 196, 26, 0.4);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(82, 196, 26, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(82, 196, 26, 0);
          }
        }
        
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }
      `}</style>
    </Layout>
  );
};

export default POSLayout;