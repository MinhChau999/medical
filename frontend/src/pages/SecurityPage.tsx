import React from 'react';
import { Card, Row, Col, Typography, Table, Progress, Tag, Space, Spin, Alert, Timeline, Statistic } from 'antd';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  SafetyOutlined,
  LockOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  AuditOutlined,
  KeyOutlined,
  DatabaseOutlined,
  FileProtectOutlined,
  AlertOutlined,
} from '@ant-design/icons';
import { useThemeStore } from '@/stores/themeStore';
import api from '@/services/api';

const { Title, Text } = Typography;

interface SecurityMetrics {
  authentication: {
    total_users: number;
    active_sessions: number;
    failed_login_attempts: number;
    password_strength: {
      weak: number;
      medium: number;
      strong: number;
    };
  };
  authorization: {
    admin_users: number;
    staff_users: number;
    customer_users: number;
    inactive_users: number;
  };
  data_protection: {
    encrypted_fields: number;
    sensitive_data_access: number;
    backup_status: string;
    last_backup: string | null;
  };
  vulnerabilities: Array<{
    severity: 'critical' | 'high' | 'medium' | 'low';
    type: string;
    description: string;
    recommendation: string;
  }>;
  security_score: number;
}

interface Recommendation {
  priority: string;
  category: string;
  title: string;
  description: string;
  impact: string;
}

interface AuditLog {
  id: number;
  user_email: string;
  action: string;
  resource: string;
  status: string;
  timestamp: string;
}

const SecurityPage: React.FC = () => {
  const { isDarkMode } = useThemeStore();

  const { data: metricsData, isLoading: metricsLoading } = useQuery({
    queryKey: ['security-metrics'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: SecurityMetrics }>('/security/overview');
      return response.data.data;
    },
    refetchInterval: 60000,
  });

  const { data: recommendationsData, isLoading: recommendationsLoading } = useQuery({
    queryKey: ['security-recommendations'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: Recommendation[] }>('/security/recommendations');
      return response.data.data;
    },
  });

  const { data: auditLogsData, isLoading: auditLogsLoading } = useQuery({
    queryKey: ['security-audit-logs'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: { logs: AuditLog[] } }>('/security/audit-logs?limit=10');
      return response.data.data.logs;
    },
    refetchInterval: 30000,
  });

  if (metricsLoading || recommendationsLoading) {
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

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#52c41a';
    if (score >= 70) return '#faad14';
    return '#ff4d4f';
  };

  const getScoreStatus = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Poor';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'default';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertOutlined style={{ color: '#ff4d4f' }} />;
      case 'medium':
        return <WarningOutlined style={{ color: '#faad14' }} />;
      case 'low':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      default:
        return <WarningOutlined />;
    }
  };

  const recommendationsColumns = [
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: string) => (
        <Tag color={priority === 'high' ? 'error' : priority === 'medium' ? 'warning' : 'default'}>
          {priority.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 150,
    },
    {
      title: 'Recommendation',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: Recommendation) => (
        <Space direction="vertical" size={0}>
          <Text strong>{title}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.description}</Text>
        </Space>
      ),
    },
    {
      title: 'Impact',
      dataIndex: 'impact',
      key: 'impact',
      width: 300,
      render: (text: string) => <Text style={{ fontSize: 12 }}>{text}</Text>,
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
          Security
        </Title>
        <Text type="secondary">System Security Monitoring & Recommendations</Text>
      </motion.div>

      {/* Security Score Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card
          title={
            <Space>
              <SafetyCertificateOutlined />
              <span>Security Score</span>
            </Space>
          }
          size="small"
          style={{ marginBottom: 16 }}
        >
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={8}>
              <div style={{ textAlign: 'center' }}>
                <Progress
                  type="circle"
                  percent={metricsData?.security_score || 0}
                  strokeColor={getScoreColor(metricsData?.security_score || 0)}
                  format={(percent) => (
                    <div>
                      <div style={{ fontSize: 32, fontWeight: 700 }}>{percent}</div>
                      <div style={{ fontSize: 12, color: '#8c8c8c' }}>{getScoreStatus(percent || 0)}</div>
                    </div>
                  )}
                  width={150}
                />
              </div>
            </Col>
            <Col xs={24} sm={12} md={16}>
              <Row gutter={[16, 16]}>
                <Col xs={12} sm={12} md={8}>
                  <Statistic
                    title="Vulnerabilities"
                    value={metricsData?.vulnerabilities?.length || 0}
                    prefix={<WarningOutlined />}
                    valueStyle={{ color: metricsData?.vulnerabilities?.length ? '#ff4d4f' : '#52c41a' }}
                  />
                </Col>
                <Col xs={12} sm={12} md={8}>
                  <Statistic
                    title="Total Users"
                    value={metricsData?.authentication.total_users || 0}
                    prefix={<UserOutlined />}
                  />
                </Col>
                <Col xs={12} sm={12} md={8}>
                  <Statistic
                    title="Encrypted Fields"
                    value={metricsData?.data_protection.encrypted_fields || 0}
                    prefix={<LockOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
              </Row>
            </Col>
          </Row>
        </Card>
      </motion.div>

      {/* Vulnerabilities Alert */}
      {metricsData?.vulnerabilities && metricsData.vulnerabilities.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Alert
            message={`${metricsData.vulnerabilities.length} Security Issue(s) Detected`}
            description={
              <Space direction="vertical" size={8} style={{ width: '100%', marginTop: 8 }}>
                {metricsData.vulnerabilities.map((vuln, index) => (
                  <div key={index}>
                    <Space>
                      <Tag color={getSeverityColor(vuln.severity)}>{vuln.severity.toUpperCase()}</Tag>
                      <Text strong>{vuln.type}</Text>
                    </Space>
                    <div style={{ marginTop: 4, marginLeft: 8 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>{vuln.description}</Text>
                      <br />
                      <Text style={{ fontSize: 12, color: '#1890ff' }}>→ {vuln.recommendation}</Text>
                    </div>
                  </div>
                ))}
              </Space>
            }
            type="warning"
            showIcon
            icon={<WarningOutlined />}
            style={{ marginBottom: 16 }}
          />
        </motion.div>
      )}

      {/* Metrics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={24} md={8}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card
              title={
                <Space>
                  <KeyOutlined />
                  <span>Authentication</span>
                </Space>
              }
              size="small"
            >
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>Password Strength</Text>
                  <div style={{ marginTop: 6 }}>
                    <Space size={4}>
                      <Tag color="success">Strong: {metricsData?.authentication.password_strength.strong || 0}</Tag>
                      <Tag color="warning">Medium: {metricsData?.authentication.password_strength.medium || 0}</Tag>
                      <Tag color="error">Weak: {metricsData?.authentication.password_strength.weak || 0}</Tag>
                    </Space>
                  </div>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>Failed Login Attempts</Text>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>
                    {metricsData?.authentication.failed_login_attempts || 0}
                  </div>
                </div>
              </Space>
            </Card>
          </motion.div>
        </Col>

        <Col xs={24} sm={24} md={8}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card
              title={
                <Space>
                  <AuditOutlined />
                  <span>Authorization</span>
                </Space>
              }
              size="small"
            >
              <Space direction="vertical" style={{ width: '100%' }} size={8}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>Admin Users</Text>
                  <Text strong>{metricsData?.authorization.admin_users || 0}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>Staff Users</Text>
                  <Text strong>{metricsData?.authorization.staff_users || 0}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>Customer Users</Text>
                  <Text strong>{metricsData?.authorization.customer_users || 0}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">Inactive Users</Text>
                  <Text type="warning">{metricsData?.authorization.inactive_users || 0}</Text>
                </div>
              </Space>
            </Card>
          </motion.div>
        </Col>

        <Col xs={24} sm={24} md={8}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card
              title={
                <Space>
                  <FileProtectOutlined />
                  <span>Data Protection</span>
                </Space>
              }
              size="small"
            >
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>Backup Status</Text>
                  <div>
                    <Tag icon={<CheckCircleOutlined />} color="success">
                      {metricsData?.data_protection.backup_status || 'Unknown'}
                    </Tag>
                  </div>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>Last Backup</Text>
                  <div style={{ fontSize: 13 }}>
                    {metricsData?.data_protection.last_backup
                      ? new Date(metricsData.data_protection.last_backup).toLocaleString()
                      : 'N/A'}
                  </div>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>Sensitive Data Access</Text>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>
                    {metricsData?.data_protection.sensitive_data_access || 0}
                  </div>
                </div>
              </Space>
            </Card>
          </motion.div>
        </Col>
      </Row>

      {/* Security Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Card
          title={
            <Space>
              <SafetyOutlined />
              <span>Security Recommendations</span>
              <Tag color="blue">{recommendationsData?.length || 0}</Tag>
            </Space>
          }
          size="small"
          styles={{ body: { padding: 0 } }}
          style={{ marginBottom: 16 }}
        >
          <Table
            dataSource={recommendationsData}
            columns={recommendationsColumns}
            pagination={false}
            rowKey={(record, index) => index?.toString() || '0'}
            size="small"
            scroll={{ x: 'max-content' }}
          />
        </Card>
      </motion.div>

      {/* Audit Logs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card
          title={
            <Space>
              <DatabaseOutlined />
              <span>Recent Activity</span>
            </Space>
          }
          size="small"
          style={{ marginBottom: 16 }}
        >
          {auditLogsLoading ? (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <Spin />
            </div>
          ) : (
            <Timeline
              items={auditLogsData?.slice(0, 5).map((log) => ({
                children: (
                  <Space direction="vertical" size={0}>
                    <Space>
                      <Text strong>{log.user_email}</Text>
                      <Tag color="blue">{log.action}</Tag>
                    </Space>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {log.resource} • {new Date(log.timestamp).toLocaleString()}
                    </Text>
                  </Space>
                ),
                color: log.status === 'success' ? 'green' : 'red',
              }))}
            />
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default SecurityPage;
