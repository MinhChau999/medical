import React, { useState } from 'react';
import {
  Card,
  Tabs,
  Form,
  Input,
  Switch,
  Button,
  Select,
  InputNumber,
  Space,
  Divider,
  Alert,
  message,
  Row,
  Col,
  Typography,
  Spin,
} from 'antd';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  SettingOutlined,
  SafetyOutlined,
  MailOutlined,
  CloudUploadOutlined,
  DatabaseOutlined,
  ThunderboltOutlined,
  LockOutlined,
  UserOutlined,
  ClearOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { useThemeStore } from '@/stores/themeStore';
import { useTranslation } from 'react-i18next';
import api from '@/services/api';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface SystemSettings {
  general: {
    site_name: string;
    site_url: string;
    api_url: string;
    timezone: string;
    language: string;
    currency: string;
  };
  security: {
    jwt_expiry: string;
    session_timeout: string;
    password_min_length: number;
    require_strong_password: boolean;
    enable_2fa: boolean;
    max_login_attempts: number;
  };
  email: {
    smtp_host: string;
    smtp_port: number;
    smtp_secure: boolean;
    smtp_user: string;
    from_email: string;
    from_name: string;
  };
  storage: {
    provider: string;
    s3_bucket: string;
    s3_region: string;
    max_upload_size: string;
  };
  database: {
    host: string;
    port: number;
    name: string;
    ssl: boolean;
    pool_max: number;
    pool_min: number;
  };
  performance: {
    enable_compression: boolean;
    compression_level: number;
    cache_enabled: boolean;
    cache_ttl: number;
    rate_limit_enabled: boolean;
    rate_limit_max: number;
    rate_limit_window: string;
  };
  features: {
    enable_blog: boolean;
    enable_guest_orders: boolean;
    enable_analytics: boolean;
    enable_notifications: boolean;
    enable_backups: boolean;
  };
}

const Settings: React.FC = () => {
  const { isDarkMode } = useThemeStore();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [generalForm] = Form.useForm();
  const [securityForm] = Form.useForm();
  const [emailForm] = Form.useForm();
  const [storageForm] = Form.useForm();
  const [databaseForm] = Form.useForm();
  const [performanceForm] = Form.useForm();
  const [featuresForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [testEmailForm] = Form.useForm();

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: SystemSettings }>('/settings/system');
      return response.data.data;
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async ({ category, settings }: { category: string; settings: any }) => {
      const response = await api.put('/settings/system', { category, settings });
      return response.data;
    },
    onSuccess: () => {
      message.success('Cài đặt đã được cập nhật thành công');
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
    },
    onError: () => {
      message.error('Không thể cập nhật cài đặt');
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (values: any) => {
      const response = await api.put('/settings/password', values);
      return response.data;
    },
    onSuccess: () => {
      message.success('Mật khẩu đã được cập nhật thành công');
      passwordForm.resetFields();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Không thể cập nhật mật khẩu');
    },
  });

  const clearCacheMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/settings/cache/clear');
      return response.data;
    },
    onSuccess: () => {
      message.success('Cache đã được xóa thành công');
    },
    onError: () => {
      message.error('Không thể xóa cache');
    },
  });

  const testEmailMutation = useMutation({
    mutationFn: async (values: any) => {
      const response = await api.post('/settings/email/test', values);
      return response.data;
    },
    onSuccess: () => {
      message.success('Email thử nghiệm đã được gửi');
      testEmailForm.resetFields();
    },
    onError: () => {
      message.error('Không thể gửi email thử nghiệm');
    },
  });

  React.useEffect(() => {
    if (settingsData) {
      generalForm.setFieldsValue(settingsData.general);
      securityForm.setFieldsValue(settingsData.security);
      emailForm.setFieldsValue(settingsData.email);
      storageForm.setFieldsValue(settingsData.storage);
      databaseForm.setFieldsValue(settingsData.database);
      performanceForm.setFieldsValue(settingsData.performance);
      featuresForm.setFieldsValue(settingsData.features);
    }
  }, [settingsData, generalForm, securityForm, emailForm, storageForm, databaseForm, performanceForm, featuresForm]);

  const handleSaveSettings = (category: string, form: any) => {
    form.validateFields().then((values: any) => {
      updateSettingsMutation.mutate({ category, settings: values });
    });
  };

  if (isLoading) {
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
          <SettingOutlined /> {t('settings')}
        </Title>
        <Text type="secondary">Cấu hình và quản lý hệ thống</Text>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card size="small">
          <Tabs defaultActiveKey="general" type="card">
            {/* General Settings */}
            <TabPane
              tab={
                <span>
                  <SettingOutlined />
                  Chung
                </span>
              }
              key="general"
            >
              <Form form={generalForm} layout="vertical">
                <Row gutter={[16, 0]}>
                  <Col xs={24} md={12}>
                    <Form.Item label="Tên trang" name="site_name">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="URL trang" name="site_url">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="API URL" name="api_url">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Múi giờ" name="timezone">
                      <Select>
                        <Select.Option value="Asia/Ho_Chi_Minh">Asia/Ho Chi Minh</Select.Option>
                        <Select.Option value="Asia/Bangkok">Asia/Bangkok</Select.Option>
                        <Select.Option value="UTC">UTC</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Ngôn ngữ" name="language">
                      <Select>
                        <Select.Option value="vi">Tiếng Việt</Select.Option>
                        <Select.Option value="en">English</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Tiền tệ" name="currency">
                      <Select>
                        <Select.Option value="VND">VND</Select.Option>
                        <Select.Option value="USD">USD</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
                <Button type="primary" onClick={() => handleSaveSettings('general', generalForm)}>
                  Lưu cài đặt
                </Button>
              </Form>
            </TabPane>

            {/* Security Settings */}
            <TabPane
              tab={
                <span>
                  <SafetyOutlined />
                  Bảo mật
                </span>
              }
              key="security"
            >
              <Form form={securityForm} layout="vertical">
                <Row gutter={[16, 0]}>
                  <Col xs={24} md={12}>
                    <Form.Item label="Thời gian hết hạn JWT" name="jwt_expiry">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Thời gian hết hạn phiên" name="session_timeout">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Độ dài mật khẩu tối thiểu" name="password_min_length">
                      <InputNumber min={6} max={32} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Số lần đăng nhập tối đa" name="max_login_attempts">
                      <InputNumber min={3} max={10} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Yêu cầu mật khẩu mạnh" name="require_strong_password" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Kích hoạt 2FA" name="enable_2fa" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                  </Col>
                </Row>
                <Divider />
                <Title level={5}>Đổi mật khẩu</Title>
                <Form form={passwordForm} layout="vertical" onFinish={(values) => updatePasswordMutation.mutate(values)}>
                  <Row gutter={[16, 0]}>
                    <Col xs={24} md={8}>
                      <Form.Item
                        label="Mật khẩu hiện tại"
                        name="current_password"
                        rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
                      >
                        <Input.Password />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item
                        label="Mật khẩu mới"
                        name="new_password"
                        rules={[
                          { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                          { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự' },
                        ]}
                      >
                        <Input.Password />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item
                        label="Xác nhận mật khẩu"
                        name="confirm_password"
                        dependencies={['new_password']}
                        rules={[
                          { required: true, message: 'Vui lòng xác nhận mật khẩu' },
                          ({ getFieldValue }) => ({
                            validator(_, value) {
                              if (!value || getFieldValue('new_password') === value) {
                                return Promise.resolve();
                              }
                              return Promise.reject(new Error('Mật khẩu không khớp'));
                            },
                          }),
                        ]}
                      >
                        <Input.Password />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Space>
                    <Button type="default" onClick={() => handleSaveSettings('security', securityForm)}>
                      Lưu cài đặt bảo mật
                    </Button>
                    <Button type="primary" htmlType="submit" icon={<LockOutlined />}>
                      Đổi mật khẩu
                    </Button>
                  </Space>
                </Form>
              </Form>
            </TabPane>

            {/* Email Settings */}
            <TabPane
              tab={
                <span>
                  <MailOutlined />
                  Email
                </span>
              }
              key="email"
            >
              <Form form={emailForm} layout="vertical">
                <Row gutter={[16, 0]}>
                  <Col xs={24} md={12}>
                    <Form.Item label="SMTP Host" name="smtp_host">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="SMTP Port" name="smtp_port">
                      <InputNumber min={1} max={65535} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="SMTP User" name="smtp_user">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="SMTP Secure (SSL/TLS)" name="smtp_secure" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="From Email" name="from_email">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="From Name" name="from_name">
                      <Input />
                    </Form.Item>
                  </Col>
                </Row>
                <Divider />
                <Title level={5}>Gửi email thử nghiệm</Title>
                <Form form={testEmailForm} layout="inline" onFinish={(values) => testEmailMutation.mutate(values)}>
                  <Form.Item
                    name="to_email"
                    rules={[
                      { required: true, message: 'Vui lòng nhập email' },
                      { type: 'email', message: 'Email không hợp lệ' },
                    ]}
                  >
                    <Input placeholder="Nhập email nhận" style={{ width: 250 }} />
                  </Form.Item>
                  <Form.Item>
                    <Button type="default" htmlType="submit" icon={<SendOutlined />}>
                      Gửi thử nghiệm
                    </Button>
                  </Form.Item>
                </Form>
                <Divider />
                <Button type="primary" onClick={() => handleSaveSettings('email', emailForm)}>
                  Lưu cài đặt
                </Button>
              </Form>
            </TabPane>

            {/* Storage Settings */}
            <TabPane
              tab={
                <span>
                  <CloudUploadOutlined />
                  Lưu trữ
                </span>
              }
              key="storage"
            >
              <Form form={storageForm} layout="vertical">
                <Row gutter={[16, 0]}>
                  <Col xs={24} md={12}>
                    <Form.Item label="Nhà cung cấp" name="provider">
                      <Select>
                        <Select.Option value="s3">Amazon S3</Select.Option>
                        <Select.Option value="local">Local Storage</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="S3 Bucket" name="s3_bucket">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="S3 Region" name="s3_region">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Kích thước tải lên tối đa" name="max_upload_size">
                      <Input />
                    </Form.Item>
                  </Col>
                </Row>
                <Button type="primary" onClick={() => handleSaveSettings('storage', storageForm)}>
                  Lưu cài đặt
                </Button>
              </Form>
            </TabPane>

            {/* Database Settings */}
            <TabPane
              tab={
                <span>
                  <DatabaseOutlined />
                  Cơ sở dữ liệu
                </span>
              }
              key="database"
            >
              <Alert
                message="Cảnh báo"
                description="Thay đổi cài đặt cơ sở dữ liệu có thể làm gián đoạn hệ thống. Vui lòng thận trọng."
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <Form form={databaseForm} layout="vertical">
                <Row gutter={[16, 0]}>
                  <Col xs={24} md={12}>
                    <Form.Item label="Host" name="host">
                      <Input disabled />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Port" name="port">
                      <InputNumber disabled style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Database Name" name="name">
                      <Input disabled />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="SSL" name="ssl" valuePropName="checked">
                      <Switch disabled />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Pool Max" name="pool_max">
                      <InputNumber min={1} max={100} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Pool Min" name="pool_min">
                      <InputNumber min={1} max={20} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>
                <Button type="primary" onClick={() => handleSaveSettings('database', databaseForm)}>
                  Lưu cài đặt
                </Button>
              </Form>
            </TabPane>

            {/* Performance Settings */}
            <TabPane
              tab={
                <span>
                  <ThunderboltOutlined />
                  Hiệu suất
                </span>
              }
              key="performance"
            >
              <Form form={performanceForm} layout="vertical">
                <Row gutter={[16, 0]}>
                  <Col xs={24} md={12}>
                    <Form.Item label="Kích hoạt nén" name="enable_compression" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Mức độ nén" name="compression_level">
                      <InputNumber min={0} max={9} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Kích hoạt cache" name="cache_enabled" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Cache TTL (giây)" name="cache_ttl">
                      <InputNumber min={60} max={86400} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Kích hoạt giới hạn tốc độ" name="rate_limit_enabled" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Số request tối đa" name="rate_limit_max">
                      <InputNumber min={10} max={1000} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Cửa sổ thời gian" name="rate_limit_window">
                      <Input />
                    </Form.Item>
                  </Col>
                </Row>
                <Space>
                  <Button type="primary" onClick={() => handleSaveSettings('performance', performanceForm)}>
                    Lưu cài đặt
                  </Button>
                  <Button
                    type="default"
                    danger
                    icon={<ClearOutlined />}
                    onClick={() => clearCacheMutation.mutate()}
                    loading={clearCacheMutation.isPending}
                  >
                    Xóa Cache
                  </Button>
                </Space>
              </Form>
            </TabPane>

            {/* Features Settings */}
            <TabPane
              tab={
                <span>
                  <UserOutlined />
                  Tính năng
                </span>
              }
              key="features"
            >
              <Form form={featuresForm} layout="vertical">
                <Row gutter={[16, 0]}>
                  <Col xs={24} md={12}>
                    <Form.Item label="Kích hoạt Blog" name="enable_blog" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Kích hoạt đơn hàng khách" name="enable_guest_orders" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Kích hoạt phân tích" name="enable_analytics" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Kích hoạt thông báo" name="enable_notifications" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Kích hoạt sao lưu" name="enable_backups" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                  </Col>
                </Row>
                <Button type="primary" onClick={() => handleSaveSettings('features', featuresForm)}>
                  Lưu cài đặt
                </Button>
              </Form>
            </TabPane>
          </Tabs>
        </Card>
      </motion.div>
    </div>
  );
};

export default Settings;
