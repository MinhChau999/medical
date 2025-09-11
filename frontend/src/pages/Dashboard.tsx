import React from 'react';
import { Card, Row, Col, Typography, Progress, List, Avatar, Badge, Space } from 'antd';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  ShoppingCartOutlined,
  UserOutlined,
  DollarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  MedicineBoxOutlined,
} from '@ant-design/icons';
import { useThemeStore } from '@/stores/themeStore';

const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { isDarkMode } = useThemeStore();

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.3,
        ease: 'easeOut'
      }
    })
  };

  const statsData = [
    {
      title: t('totalRevenue'),
      value: 2450000,
      prefix: <DollarOutlined />,
      suffix: 'VND',
      color: '#00A6B8',
      trend: 12.5,
      isIncrease: true,
    },
    {
      title: t('totalOrders'),
      value: 1128,
      prefix: <ShoppingCartOutlined />,
      color: '#52c41a',
      trend: 8.2,
      isIncrease: true,
    },
    {
      title: t('activeCustomers'),
      value: 893,
      prefix: <UserOutlined />,
      color: '#1890ff',
      trend: 3.1,
      isIncrease: false,
    },
    {
      title: t('products'),
      value: 245,
      prefix: <MedicineBoxOutlined />,
      color: '#fa8c16',
      trend: 5.7,
      isIncrease: true,
    },
  ];

  const recentOrders = [
    { id: '#1234', customer: 'John Doe', amount: '125,000 VND', status: 'processing', time: '2 mins ago' },
    { id: '#1235', customer: 'Jane Smith', amount: '89,000 VND', status: 'shipped', time: '15 mins ago' },
    { id: '#1236', customer: 'Bob Johnson', amount: '256,000 VND', status: 'delivered', time: '1 hour ago' },
    { id: '#1237', customer: 'Alice Brown', amount: '178,000 VND', status: 'processing', time: '2 hours ago' },
    { id: '#1238', customer: 'Charlie Wilson', amount: '342,000 VND', status: 'shipped', time: '3 hours ago' },
  ];

  const topProducts = [
    { name: 'Blood Pressure Monitor', sales: 156, revenue: '15,600,000 VND', growth: 23 },
    { name: 'Digital Thermometer', sales: 142, revenue: '7,100,000 VND', growth: 18 },
    { name: 'Pulse Oximeter', sales: 128, revenue: '12,800,000 VND', growth: 15 },
    { name: 'ECG Machine', sales: 87, revenue: '43,500,000 VND', growth: 12 },
    { name: 'Glucometer', sales: 76, revenue: '3,800,000 VND', growth: 8 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return '#fa8c16';
      case 'shipped':
        return '#1890ff';
      case 'delivered':
        return '#52c41a';
      default:
        return '#666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <SyncOutlined spin />;
      case 'shipped':
        return <ClockCircleOutlined />;
      case 'delivered':
        return <CheckCircleOutlined />;
      default:
        return null;
    }
  };

  return (
    <div style={{ padding: '0 0 24px 0' }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ marginBottom: 24 }}
      >
        <Title level={2} style={{ marginBottom: 0, fontWeight: 600 }}>
          {t('dashboard')}
        </Title>
      </motion.div>
      
      {/* Stats Cards */}
      <Row gutter={[16, 16]}>
        {statsData.map((stat, index) => (
          <Col xs={24} sm={12} md={12} lg={6} key={index}>
            <motion.div
              custom={index + 1}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.98 }}
            >
              <Card 
                hoverable 
                className="dashboard-stat-card"
                style={{ 
                  borderRadius: 12, 
                  overflow: 'hidden',
                  background: isDarkMode ? '#1f1f1f' : '#fff',
                  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}`,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                      {stat.title}
                    </Text>
                    <div style={{ marginTop: 8 }}>
                      <span style={{ fontSize: 28, fontWeight: 700, color: stat.color }}>
                        {stat.value.toLocaleString()}
                      </span>
                      {stat.suffix && (
                        <span style={{ fontSize: 14, marginLeft: 4, color: '#666' }}>
                          {stat.suffix}
                        </span>
                      )}
                    </div>
                    <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {stat.isIncrease ? (
                        <ArrowUpOutlined style={{ fontSize: 12, color: '#52c41a' }} />
                      ) : (
                        <ArrowDownOutlined style={{ fontSize: 12, color: '#ff4d4f' }} />
                      )}
                      <span style={{ 
                        fontSize: 12, 
                        color: stat.isIncrease ? '#52c41a' : '#ff4d4f',
                        fontWeight: 500 
                      }}>
                        {stat.trend}%
                      </span>
                      <span style={{ fontSize: 12, color: '#999', marginLeft: 4 }}>
                        vs last month
                      </span>
                    </div>
                  </div>
                  <div style={{ 
                    width: 48, 
                    height: 48, 
                    borderRadius: 12,
                    background: `${stat.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    color: stat.color
                  }}>
                    {stat.prefix}
                  </div>
                </div>
              </Card>
            </motion.div>
          </Col>
        ))}
      </Row>

      {/* Charts and Tables */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* Recent Orders */}
        <Col xs={24} lg={12}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            <Card 
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 16, fontWeight: 600 }}>{t('recentOrders')}</span>
                  <Badge count={5} showZero={false} />
                </div>
              }
              hoverable 
              className="dashboard-content-card"
              style={{ 
                borderRadius: 12, 
                overflow: 'hidden',
                minHeight: 400,
                background: isDarkMode ? '#1f1f1f' : '#fff',
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}`,
              }}
              styles={{ body: { padding: 0 } }}
            >
              <List
                dataSource={recentOrders}
                renderItem={(order, index) => (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.05 }}
                  >
                    <List.Item 
                      style={{ 
                        padding: '12px 24px',
                        borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : '#f0f0f0'}`,
                      }}
                    >
                      <div style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <Space>
                            <Text strong style={{ fontSize: 14 }}>{order.id}</Text>
                            <Badge 
                              color={getStatusColor(order.status)} 
                              text={
                                <span style={{ color: getStatusColor(order.status), fontSize: 12 }}>
                                  {t(order.status)}
                                </span>
                              }
                            />
                          </Space>
                          <Text strong style={{ color: '#00A6B8' }}>{order.amount}</Text>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>{order.customer}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>{order.time}</Text>
                        </div>
                      </div>
                    </List.Item>
                  </motion.div>
                )}
              />
            </Card>
          </motion.div>
        </Col>

        {/* Top Products */}
        <Col xs={24} lg={12}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.6 }}
          >
            <Card 
              title={
                <span style={{ fontSize: 16, fontWeight: 600 }}>{t('topProducts')}</span>
              }
              hoverable
              className="dashboard-content-card"
              style={{ 
                borderRadius: 12, 
                overflow: 'hidden',
                minHeight: 400,
                background: isDarkMode ? '#1f1f1f' : '#fff',
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}`,
              }}
              styles={{ body: { padding: '12px 0' } }}
            >
              {topProducts.map((product, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.05 }}
                  style={{ 
                    padding: '12px 24px',
                    borderBottom: index < topProducts.length - 1 ? `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : '#f0f0f0'}` : 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Avatar 
                        style={{ 
                          backgroundColor: '#00A6B8', 
                          fontSize: 12,
                          fontWeight: 600 
                        }}
                      >
                        {index + 1}
                      </Avatar>
                      <div>
                        <Text strong style={{ fontSize: 14 }}>{product.name}</Text>
                        <div style={{ marginTop: 2 }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {product.sales} units sold
                          </Text>
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Text strong style={{ color: '#00A6B8', fontSize: 14 }}>
                        {product.revenue}
                      </Text>
                      <div style={{ marginTop: 2 }}>
                        <ArrowUpOutlined style={{ fontSize: 10, color: '#52c41a', marginRight: 2 }} />
                        <Text style={{ fontSize: 12, color: '#52c41a' }}>
                          {product.growth}%
                        </Text>
                      </div>
                    </div>
                  </div>
                  <Progress 
                    percent={product.sales / 2} 
                    showInfo={false}
                    strokeColor="#00A6B8"
                    trailColor={isDarkMode ? 'rgba(255,255,255,0.08)' : '#f0f0f0'}
                    style={{ marginBottom: 0 }}
                  />
                </motion.div>
              ))}
            </Card>
          </motion.div>
        </Col>
      </Row>

      {/* Activity Summary */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.8 }}
          >
            <Card
              title={
                <span style={{ fontSize: 16, fontWeight: 600 }}>{t('activitySummary')}</span>
              }
              className="dashboard-stat-card"
              style={{ 
                borderRadius: 12,
                background: isDarkMode ? '#1f1f1f' : '#fff',
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}`,
              }}
            >
              <Row gutter={[16, 16]}>
                <Col xs={12} sm={6}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#00A6B8' }}>24</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>{t('pendingOrders')}</Text>
                  </div>
                </Col>
                <Col xs={12} sm={6}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#52c41a' }}>156</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>{t('completedToday')}</Text>
                  </div>
                </Col>
                <Col xs={12} sm={6}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#fa8c16' }}>8</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>{t('lowStock')}</Text>
                  </div>
                </Col>
                <Col xs={12} sm={6}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#1890ff' }}>42</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>{t('newCustomers')}</Text>
                  </div>
                </Col>
              </Row>
            </Card>
          </motion.div>
        </Col>
      </Row>

      {/* CSS for POS Button Effects */}
      <style jsx>{`
        .pos-launch-btn:hover .shine-effect {
          left: 100% !important;
        }
        
        .pos-launch-btn {
          position: relative;
          transform-style: preserve-3d;
        }
        
        .pos-launch-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
          border-radius: 12px;
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: 1;
        }
        
        .pos-launch-btn:hover::before {
          opacity: 1;
        }
        
        .pos-launch-btn:active {
          transform: translateY(1px) !important;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;