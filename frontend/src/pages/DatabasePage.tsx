import React from 'react';
import { Card, Row, Col, Typography, Table, Progress, Tag, Space, Spin, Descriptions, Empty } from 'antd';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  DatabaseOutlined,
  TableOutlined,
  ApiOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ThunderboltOutlined,
  LineChartOutlined,
  HddOutlined,
  SafetyCertificateOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { useThemeStore } from '@/stores/themeStore';
import api from '@/services/api';

const { Title, Text, Paragraph } = Typography;

interface DatabaseStats {
  database_name: string;
  database_size: number;
  database_size_pretty: string;
  total_tables: number;
  version: string;
  connections: {
    total: number;
    active: number;
    idle: number;
  };
  operations: {
    inserts: number;
    updates: number;
    deletes: number;
    total: number;
  };
  table_sizes: Array<{
    tablename: string;
    size: string;
    size_bytes: number;
  }>;
  table_rows: Array<{
    tablename: string;
    row_count: number;
  }>;
}

interface DatabaseHealth {
  status: 'healthy' | 'warning' | 'critical';
  health_score: number;
  metrics: {
    cache_hit_ratio: number;
    index_usage_ratio: number;
    tables_needing_vacuum: number;
    long_running_queries: number;
  };
  recommendations: string[];
}

const DatabasePage: React.FC = () => {
  const { isDarkMode } = useThemeStore();

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['database-stats'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: DatabaseStats }>(
        '/database/stats'
      );
      return response.data.data;
    },
    refetchInterval: 30000,
  });

  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ['database-health'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: DatabaseHealth }>(
        '/database/health'
      );
      return response.data.data;
    },
    refetchInterval: 30000,
  });

  if (statsLoading || healthLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
        background: isDarkMode ? '#141414' : '#f5f5f5'
      }}>
        <Spin size="large" />
      </div>
    );
  }

  const getHealthStatus = () => {
    if (!healthData) return { color: '#8c8c8c', text: 'Unknown', icon: <WarningOutlined /> };
    switch (healthData.status) {
      case 'healthy':
        return { color: '#52c41a', text: 'Healthy', icon: <CheckCircleOutlined /> };
      case 'warning':
        return { color: '#faad14', text: 'Warning', icon: <WarningOutlined /> };
      case 'critical':
        return { color: '#ff4d4f', text: 'Critical', icon: <CloseCircleOutlined /> };
      default:
        return { color: '#8c8c8c', text: 'Unknown', icon: <WarningOutlined /> };
    }
  };

  const healthStatus = getHealthStatus();

  const tableSizeColumns = [
    {
      title: 'Table Name',
      dataIndex: 'tablename',
      key: 'tablename',
      render: (text: string) => (
        <Space>
          <TableOutlined style={{ color: isDarkMode ? '#1890ff' : '#0050b3' }} />
          <Text>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      width: 200,
      render: (text: string, record: any) => (
        <div>
          <Text style={{ fontSize: 13 }}>{text}</Text>
          <Progress
            percent={Math.min((record.size_bytes / (statsData?.database_size || 1)) * 100, 100)}
            showInfo={false}
            strokeColor="#1890ff"
            trailColor={isDarkMode ? '#303030' : '#f0f0f0'}
            size="small"
            style={{ marginTop: 4 }}
          />
        </div>
      ),
    },
  ];

  const tableRowsColumns = [
    {
      title: 'Table Name',
      dataIndex: 'tablename',
      key: 'tablename',
      render: (text: string) => (
        <Space>
          <BarChartOutlined style={{ color: isDarkMode ? '#52c41a' : '#389e0d' }} />
          <Text>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Row Count',
      dataIndex: 'row_count',
      key: 'row_count',
      width: 150,
      align: 'right' as const,
      render: (count: number) => (
        <Tag color="blue">{count.toLocaleString()}</Tag>
      ),
    },
  ];

  return (
    <div style={{
      padding: '16px',
      background: isDarkMode ? '#141414' : '#f5f5f5',
      minHeight: '100vh'
    }}>
      {/* Header - nginx-ui style */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ marginBottom: 16 }}
      >
        <Title level={3} style={{ margin: 0, fontWeight: 600 }}>
          Database
        </Title>
        <Text type="secondary">PostgreSQL Database Statistics</Text>
      </motion.div>

      {/* Overview Card - nginx-ui style with Descriptions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card
          title={
            <Space>
              <DatabaseOutlined />
              <span>Database Overview</span>
            </Space>
          }
          style={{ marginBottom: 16 }}
          extra={
            <Tag icon={healthStatus.icon} color={healthStatus.color}>
              {healthStatus.text}
            </Tag>
          }
        >
          <Descriptions column={{ xs: 1, sm: 2, md: 3, lg: 4 }} bordered size="small">
            <Descriptions.Item label="Database Name">
              <Text strong>{statsData?.database_name || 'N/A'}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Size">
              <Text strong style={{ color: '#1890ff' }}>{statsData?.database_size_pretty || '0 B'}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Total Tables">
              <Text strong>{statsData?.total_tables || 0}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Health Score">
              <Progress
                percent={healthData?.health_score || 0}
                size="small"
                strokeColor={healthStatus.color}
                format={(percent) => `${percent}%`}
              />
            </Descriptions.Item>
            <Descriptions.Item label="Active Connections">
              <Text strong style={{ color: '#52c41a' }}>
                {statsData?.connections.active || 0}
              </Text>
              <Text type="secondary"> / {statsData?.connections.total || 0}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Idle Connections">
              <Text>{statsData?.connections.idle || 0}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Total Operations">
              <Text strong>{statsData?.operations.total?.toLocaleString() || 0}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="PostgreSQL Version">
              <Text code style={{ fontSize: 12 }}>
                {statsData?.version?.split('PostgreSQL')[1]?.split('on')[0]?.trim() || 'N/A'}
              </Text>
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </motion.div>

      {/* Performance Metrics - nginx-ui compact style */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={24} md={12} lg={12}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card
              title={
                <Space>
                  <LineChartOutlined />
                  <span>Performance</span>
                </Space>
              }
              size="small"
            >
              <Space direction="vertical" style={{ width: '100%' }} size={16}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontSize: 13 }}>Cache Hit Ratio</Text>
                    <Text strong style={{ fontSize: 13, color: '#1890ff' }}>
                      {healthData?.metrics.cache_hit_ratio?.toFixed(2) || 0}%
                    </Text>
                  </div>
                  <Progress
                    percent={healthData?.metrics.cache_hit_ratio || 0}
                    strokeColor="#1890ff"
                    trailColor={isDarkMode ? '#303030' : '#f0f0f0'}
                    showInfo={false}
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontSize: 13 }}>Index Usage Ratio</Text>
                    <Text strong style={{ fontSize: 13, color: '#52c41a' }}>
                      {healthData?.metrics.index_usage_ratio?.toFixed(2) || 0}%
                    </Text>
                  </div>
                  <Progress
                    percent={healthData?.metrics.index_usage_ratio || 0}
                    strokeColor="#52c41a"
                    trailColor={isDarkMode ? '#303030' : '#f0f0f0'}
                    showInfo={false}
                  />
                </div>
              </Space>
            </Card>
          </motion.div>
        </Col>

        <Col xs={24} sm={24} md={12} lg={12}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card
              title={
                <Space>
                  <ThunderboltOutlined />
                  <span>Operations</span>
                </Space>
              }
              size="small"
            >
              <Row gutter={[16, 16]}>
                <Col xs={8} sm={8} md={8}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#52c41a' }}>
                      {statsData?.operations.inserts || 0}
                    </div>
                    <Text type="secondary" style={{ fontSize: 11 }}>Inserts</Text>
                  </div>
                </Col>
                <Col xs={8} sm={8} md={8}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#1890ff' }}>
                      {statsData?.operations.updates || 0}
                    </div>
                    <Text type="secondary" style={{ fontSize: 11 }}>Updates</Text>
                  </div>
                </Col>
                <Col xs={8} sm={8} md={8}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#ff4d4f' }}>
                      {statsData?.operations.deletes || 0}
                    </div>
                    <Text type="secondary" style={{ fontSize: 11 }}>Deletes</Text>
                  </div>
                </Col>
              </Row>
            </Card>
          </motion.div>
        </Col>
      </Row>

      {/* Health Recommendations */}
      {healthData?.recommendations && healthData.recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card
            title={
              <Space>
                <SafetyCertificateOutlined />
                <span>Recommendations</span>
              </Space>
            }
            size="small"
            style={{ marginBottom: 16 }}
          >
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {healthData.recommendations.map((rec, idx) => (
                <li key={idx}>
                  <Text>{rec}</Text>
                </li>
              ))}
            </ul>
          </Card>
        </motion.div>
      )}

      {/* Tables Information - nginx-ui style */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={24} md={24} lg={12} xl={12}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Card
              title={
                <Space>
                  <HddOutlined />
                  <span>Table Sizes</span>
                  <Tag color="blue">{statsData?.table_sizes?.length || 0}</Tag>
                </Space>
              }
              size="small"
              styles={{ body: { padding: 0 } }}
              style={{ marginBottom: 16 }}
            >
              <Table
                dataSource={statsData?.table_sizes}
                columns={tableSizeColumns}
                pagination={false}
                rowKey="tablename"
                size="small"
                scroll={{ y: 400, x: 'max-content' }}
                locale={{
                  emptyText: <Empty description="No tables found" />
                }}
              />
            </Card>
          </motion.div>
        </Col>

        <Col xs={24} sm={24} md={24} lg={12} xl={12}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card
              title={
                <Space>
                  <BarChartOutlined />
                  <span>Row Counts</span>
                  <Tag color="cyan">{statsData?.table_rows?.length || 0}</Tag>
                </Space>
              }
              size="small"
              styles={{ body: { padding: 0 } }}
              style={{ marginBottom: 16 }}
            >
              <Table
                dataSource={statsData?.table_rows}
                columns={tableRowsColumns}
                pagination={false}
                rowKey="tablename"
                size="small"
                scroll={{ y: 400, x: 'max-content' }}
                locale={{
                  emptyText: <Empty description="No data available" />
                }}
              />
            </Card>
          </motion.div>
        </Col>
      </Row>

      {/* Footer Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Card
          size="small"
          style={{
            background: isDarkMode ? '#1f1f1f' : '#fafafa',
            border: isDarkMode ? '1px solid #303030' : '1px solid #d9d9d9'
          }}
        >
          <Space split="|" size="large" wrap>
            <Space>
              <ClockCircleOutlined style={{ color: '#8c8c8c' }} />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Auto-refresh: 30s
              </Text>
            </Space>
            <Space>
              <SyncOutlined style={{ color: '#8c8c8c' }} />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Last updated: {new Date().toLocaleTimeString()}
              </Text>
            </Space>
            <Space>
              <DatabaseOutlined style={{ color: '#8c8c8c' }} />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Connected to: {statsData?.database_name}
              </Text>
            </Space>
          </Space>
        </Card>
      </motion.div>
    </div>
  );
};

export default DatabasePage;
