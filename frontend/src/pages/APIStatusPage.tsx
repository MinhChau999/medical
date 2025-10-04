import React from 'react';
import { Card, Row, Col, Typography, Table, Progress, Tag, Space, Spin, Descriptions, Statistic } from 'antd';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  ApiOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  DatabaseOutlined,
  HddOutlined,
  SyncOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import { useThemeStore } from '@/stores/themeStore';
import api from '@/services/api';

const { Title, Text } = Typography;

interface EndpointStatus {
  name: string;
  endpoint: string;
  method: string;
  status: 'healthy' | 'degraded' | 'down';
  response_time: number;
  last_checked: string;
  status_code?: number;
  error?: string;
}

interface APIMetrics {
  total_endpoints: number;
  healthy: number;
  degraded: number;
  down: number;
  average_response_time: number;
  uptime_percentage: number;
}

interface APIStatusData {
  metrics: APIMetrics;
  endpoints: EndpointStatus[];
  checked_at: string;
}

interface SystemMetrics {
  system: {
    uptime_seconds: number;
    uptime_formatted: string;
    memory: {
      total: number;
      used: number;
      percentage: number;
    };
    cpu: {
      user: number;
      system: number;
    };
  };
  database: {
    response_time: number;
    status: string;
  };
  environment: string;
  version: string;
  timestamp: string;
}

const APIStatusPage: React.FC = () => {
  const { isDarkMode } = useThemeStore();

  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ['api-status'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: APIStatusData }>('/api-status');
      return response.data.data;
    },
    refetchInterval: 30000,
  });

  const { data: metricsData, isLoading: metricsLoading } = useQuery({
    queryKey: ['api-metrics'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: SystemMetrics }>('/api-status/metrics');
      return response.data.data;
    },
    refetchInterval: 30000,
  });

  if (statusLoading || metricsLoading) {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'degraded':
        return <WarningOutlined style={{ color: '#faad14' }} />;
      case 'down':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return <WarningOutlined style={{ color: '#8c8c8c' }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return '#52c41a';
      case 'degraded':
        return '#faad14';
      case 'down':
        return '#ff4d4f';
      default:
        return '#8c8c8c';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'Healthy';
      case 'degraded':
        return 'Degraded';
      case 'down':
        return 'Down';
      default:
        return 'Unknown';
    }
  };

  const endpointColumns = [
    {
      title: 'Endpoint',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: EndpointStatus) => (
        <Space direction="vertical" size={0}>
          <Space>
            <ApiOutlined style={{ color: isDarkMode ? '#1890ff' : '#0050b3' }} />
            <Text strong>{text}</Text>
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.method} {record.endpoint}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag icon={getStatusIcon(status)} color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: 'Response Time',
      dataIndex: 'response_time',
      key: 'response_time',
      width: 150,
      render: (time: number) => (
        <Space>
          <ThunderboltOutlined style={{ color: time < 500 ? '#52c41a' : time < 1000 ? '#faad14' : '#ff4d4f' }} />
          <Text>{time}ms</Text>
        </Space>
      ),
    },
    {
      title: 'Status Code',
      dataIndex: 'status_code',
      key: 'status_code',
      width: 120,
      align: 'center' as const,
      render: (code?: number) => (
        code ? (
          <Tag color={code === 200 ? 'success' : code >= 400 ? 'error' : 'default'}>
            {code}
          </Tag>
        ) : <Text type="secondary">N/A</Text>
      ),
    },
  ];

  return (
    <div style={{
      padding: '16px',
      background: isDarkMode ? '#141414' : '#f5f5f5',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ marginBottom: 16 }}
      >
        <Title level={3} style={{ margin: 0, fontWeight: 600 }}>
          API Status
        </Title>
        <Text type="secondary">Real-time API Health Monitoring</Text>
      </motion.div>

      {/* Overview Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card
          title={
            <Space>
              <RocketOutlined />
              <span>Overview</span>
            </Space>
          }
          size="small"
          style={{ marginBottom: 16 }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6} md={6} lg={6}>
              <Statistic
                title="Total Endpoints"
                value={statusData?.metrics.total_endpoints || 0}
                prefix={<ApiOutlined />}
              />
            </Col>
            <Col xs={12} sm={6} md={6} lg={6}>
              <Statistic
                title="Healthy"
                value={statusData?.metrics.healthy || 0}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Col>
            <Col xs={12} sm={6} md={6} lg={6}>
              <Statistic
                title="Degraded"
                value={statusData?.metrics.degraded || 0}
                valueStyle={{ color: '#faad14' }}
                prefix={<WarningOutlined />}
              />
            </Col>
            <Col xs={12} sm={6} md={6} lg={6}>
              <Statistic
                title="Down"
                value={statusData?.metrics.down || 0}
                valueStyle={{ color: '#ff4d4f' }}
                prefix={<CloseCircleOutlined />}
              />
            </Col>
          </Row>
        </Card>
      </motion.div>

      {/* Performance Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={24} md={12} lg={8}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card
              title={
                <Space>
                  <ThunderboltOutlined />
                  <span>Performance</span>
                </Space>
              }
              size="small"
            >
              <Space direction="vertical" style={{ width: '100%' }} size={16}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontSize: 13 }}>Uptime</Text>
                    <Text strong style={{ fontSize: 13, color: '#52c41a' }}>
                      {statusData?.metrics.uptime_percentage || 0}%
                    </Text>
                  </div>
                  <Progress
                    percent={statusData?.metrics.uptime_percentage || 0}
                    strokeColor="#52c41a"
                    trailColor={isDarkMode ? '#303030' : '#f0f0f0'}
                    showInfo={false}
                  />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>Avg Response Time</Text>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#1890ff' }}>
                    {statusData?.metrics.average_response_time || 0}ms
                  </div>
                </div>
              </Space>
            </Card>
          </motion.div>
        </Col>

        <Col xs={24} sm={24} md={12} lg={8}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card
              title={
                <Space>
                  <HddOutlined />
                  <span>System</span>
                </Space>
              }
              size="small"
            >
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Uptime">
                  <Text strong>{metricsData?.system.uptime_formatted || 'N/A'}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Memory">
                  <Progress
                    percent={metricsData?.system.memory.percentage || 0}
                    size="small"
                    format={() => `${metricsData?.system.memory.used}MB / ${metricsData?.system.memory.total}MB`}
                  />
                </Descriptions.Item>
                <Descriptions.Item label="Environment">
                  <Tag color="blue">{metricsData?.environment || 'N/A'}</Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </motion.div>
        </Col>

        <Col xs={24} sm={24} md={12} lg={8}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card
              title={
                <Space>
                  <DatabaseOutlined />
                  <span>Database</span>
                </Space>
              }
              size="small"
            >
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>Response Time</Text>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#52c41a' }}>
                    {metricsData?.database.response_time || 0}ms
                  </div>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>Status</Text>
                  <div>
                    <Tag icon={<CheckCircleOutlined />} color="success">
                      {metricsData?.database.status || 'Unknown'}
                    </Tag>
                  </div>
                </div>
              </Space>
            </Card>
          </motion.div>
        </Col>
      </Row>

      {/* Endpoints Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Card
          title={
            <Space>
              <ApiOutlined />
              <span>Endpoints Status</span>
              <Tag color="blue">{statusData?.endpoints?.length || 0}</Tag>
            </Space>
          }
          size="small"
          styles={{ body: { padding: 0 } }}
          style={{ marginBottom: 16 }}
        >
          <Table
            dataSource={statusData?.endpoints}
            columns={endpointColumns}
            pagination={false}
            rowKey="endpoint"
            size="small"
            scroll={{ x: 'max-content' }}
          />
        </Card>
      </motion.div>

      {/* Footer Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
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
                Last checked: {statusData?.checked_at ? new Date(statusData.checked_at).toLocaleTimeString() : 'N/A'}
              </Text>
            </Space>
            <Space>
              <ApiOutlined style={{ color: '#8c8c8c' }} />
              <Text type="secondary" style={{ fontSize: 12 }}>
                API Version: {metricsData?.version || 'v1'}
              </Text>
            </Space>
          </Space>
        </Card>
      </motion.div>
    </div>
  );
};

export default APIStatusPage;
