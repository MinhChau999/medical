import React, { useState } from 'react';
import { Drawer, Tabs, Card, Statistic, Table, Tag, Empty, Button, Space, Spin, Modal, Form, Input, InputNumber, message } from 'antd';
import {
  DollarOutlined,
  ShoppingOutlined,
  UserOutlined,
  TrophyOutlined,
  LineChartOutlined,
  HistoryOutlined,
  RollbackOutlined,
  SearchOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { motion } from 'framer-motion';

interface POSDashboardPanelProps {
  visible: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

export const POSDashboardPanel: React.FC<POSDashboardPanelProps> = ({ visible, onClose, isDarkMode }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [refundModalVisible, setRefundModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [refundForm] = Form.useForm();
  const queryClient = useQueryClient();

  // Fetch today's statistics
  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['pos-stats-today'],
    queryFn: async () => {
      const response = await api.get('/pos/stats/today');
      return response.data.data;
    },
    enabled: visible,
  });

  // Fetch today's orders
  const { data: ordersData, isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ['pos-orders-today'],
    queryFn: async () => {
      const response = await api.get('/pos/orders/today');
      return response.data.data;
    },
    enabled: visible,
  });

  // Refund mutation
  const refundMutation = useMutation({
    mutationFn: async (values: any) => {
      const response = await api.post('/pos/refunds', {
        orderId: selectedOrder.id,
        items: selectedOrder.items,
        reason: values.reason,
        refundAmount: values.amount
      });
      return response.data;
    },
    onSuccess: () => {
      message.success('Đã xử lý trả hàng thành công');
      setRefundModalVisible(false);
      refundForm.resetFields();
      setSelectedOrder(null);
      refetchOrders();
      refetchStats();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Lỗi khi xử lý trả hàng');
    }
  });

  const handleRefund = (order: any) => {
    setSelectedOrder(order);
    refundForm.setFieldsValue({
      amount: parseFloat(order.total_amount)
    });
    setRefundModalVisible(true);
  };

  const handleRefundSubmit = () => {
    refundForm.validateFields().then(values => {
      refundMutation.mutate(values);
    });
  };

  const orderColumns = [
    {
      title: 'Mã ĐH',
      dataIndex: 'order_number',
      key: 'order_number',
      width: 120,
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: 'Thời gian',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 100,
      render: (date: string) => new Date(date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customer_name',
      key: 'customer',
      render: (name: string, record: any) => name || record.customer_phone || <Text type="secondary">Khách lẻ</Text>
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'total_amount',
      key: 'total',
      align: 'right' as const,
      render: (amount: string) => (
        <Text strong style={{ color: '#52c41a' }}>
          {parseFloat(amount).toLocaleString()}₫
        </Text>
      )
    },
    {
      title: 'Thanh toán',
      dataIndex: 'payment_method',
      key: 'payment',
      render: (method: string) => {
        const methodMap: Record<string, { label: string; color: string }> = {
          cash: { label: 'Tiền mặt', color: 'green' },
          card: { label: 'Thẻ', color: 'blue' },
          qr: { label: 'QR', color: 'purple' },
          transfer: { label: 'CK', color: 'orange' }
        };
        const info = methodMap[method] || { label: method, color: 'default' };
        return <Tag color={info.color}>{info.label}</Tag>;
      }
    },
    {
      title: 'Trạng thái',
      dataIndex: 'order_status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, { label: string; color: string }> = {
          completed: { label: 'Hoàn thành', color: 'success' },
          refunded: { label: 'Đã trả', color: 'error' },
          pending: { label: 'Chờ xử lý', color: 'warning' }
        };
        const info = statusMap[status] || { label: status, color: 'default' };
        return <Tag color={info.color}>{info.label}</Tag>;
      }
    },
    {
      title: '',
      key: 'action',
      width: 100,
      render: (_: any, record: any) => (
        record.order_status !== 'refunded' && (
          <Button
            type="link"
            danger
            size="small"
            icon={<RollbackOutlined />}
            onClick={() => handleRefund(record)}
          >
            Trả hàng
          </Button>
        )
      )
    }
  ];

  const { Text } = Typography;
  const summary = statsData?.summary || {};
  const paymentMethods = statsData?.paymentMethods || [];
  const topProducts = statsData?.topProducts || [];

  return (
    <>
      <Drawer
        title={
          <Space>
            <LineChartOutlined />
            <span>Dashboard POS</span>
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => {
                refetchStats();
                refetchOrders();
              }}
            >
              Làm mới
            </Button>
          </Space>
        }
        placement={window.innerWidth > 768 ? "right" : "bottom"}
        width={window.innerWidth > 768 ? 800 : undefined}
        height={window.innerWidth > 768 ? undefined : '90vh'}
        onClose={onClose}
        open={visible}
        styles={{
          body: { padding: 16 }
        }}
      >
        <Tabs
          defaultActiveKey="stats"
          items={[
            {
              key: 'stats',
              label: (
                <span>
                  <LineChartOutlined />
                  Thống kê
                </span>
              ),
              children: (
                <Spin spinning={statsLoading}>
                  <Space direction="vertical" style={{ width: '100%' }} size="large">
                    {/* Summary Statistics */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: window.innerWidth > 768 ? 'repeat(auto-fit, minmax(180px, 1fr))' : 'repeat(2, 1fr)',
                      gap: window.innerWidth > 768 ? 16 : 12
                    }}>
                      <motion.div whileHover={{ scale: 1.02 }} transition={{ type: 'spring' }}>
                        <Card>
                          <Statistic
                            title="Tổng doanh thu"
                            value={summary.totalRevenue || 0}
                            precision={0}
                            valueStyle={{ color: '#3f8600' }}
                            prefix={<DollarOutlined />}
                            suffix="₫"
                          />
                        </Card>
                      </motion.div>

                      <motion.div whileHover={{ scale: 1.02 }} transition={{ type: 'spring' }}>
                        <Card>
                          <Statistic
                            title="Số đơn hàng"
                            value={summary.totalOrders || 0}
                            valueStyle={{ color: '#1890ff' }}
                            prefix={<ShoppingOutlined />}
                          />
                        </Card>
                      </motion.div>

                      <motion.div whileHover={{ scale: 1.02 }} transition={{ type: 'spring' }}>
                        <Card>
                          <Statistic
                            title="Khách hàng"
                            value={summary.totalCustomers || 0}
                            valueStyle={{ color: '#cf1322' }}
                            prefix={<UserOutlined />}
                          />
                        </Card>
                      </motion.div>

                      <motion.div whileHover={{ scale: 1.02 }} transition={{ type: 'spring' }}>
                        <Card>
                          <Statistic
                            title="TB/Đơn"
                            value={summary.averageOrderValue || 0}
                            precision={0}
                            valueStyle={{ color: '#faad14' }}
                            prefix={<TrophyOutlined />}
                            suffix="₫"
                          />
                        </Card>
                      </motion.div>
                    </div>

                    {/* Payment Methods */}
                    <Card title="Phương thức thanh toán" size="small">
                      <Space direction="vertical" style={{ width: '100%' }}>
                        {paymentMethods.length > 0 ? paymentMethods.map((pm: any) => (
                          <div key={pm.method} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Space>
                              <Tag color="blue">{pm.method === 'cash' ? 'Tiền mặt' : pm.method === 'card' ? 'Thẻ' : 'QR'}</Tag>
                              <Text type="secondary">{pm.count} giao dịch</Text>
                            </Space>
                            <Text strong style={{ color: '#52c41a' }}>
                              {parseFloat(pm.amount).toLocaleString()}₫
                            </Text>
                          </div>
                        )) : <Empty description="Chưa có giao dịch" />}
                      </Space>
                    </Card>

                    {/* Top Products */}
                    <Card title="Sản phẩm bán chạy" size="small">
                      <Space direction="vertical" style={{ width: '100%' }}>
                        {topProducts.length > 0 ? topProducts.slice(0, 5).map((product: any, index: number) => (
                          <div key={product.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Space>
                              <Tag color="gold">#{index + 1}</Tag>
                              <Text>{product.name}</Text>
                              <Text type="secondary">({product.quantitySold} sp)</Text>
                            </Space>
                            <Text strong style={{ color: '#52c41a' }}>
                              {parseFloat(product.revenue).toLocaleString()}₫
                            </Text>
                          </div>
                        )) : <Empty description="Chưa có dữ liệu" />}
                      </Space>
                    </Card>
                  </Space>
                </Spin>
              )
            },
            {
              key: 'orders',
              label: (
                <span>
                  <HistoryOutlined />
                  Lịch sử ({ordersData?.length || 0})
                </span>
              ),
              children: (
                <Spin spinning={ordersLoading}>
                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <Input
                      placeholder="Tìm kiếm theo mã đơn, khách hàng..."
                      prefix={<SearchOutlined />}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      allowClear
                    />
                    <Table
                      dataSource={ordersData?.filter((order: any) =>
                        order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        order.customer_phone?.includes(searchTerm)
                      )}
                      columns={orderColumns}
                      rowKey="id"
                      pagination={{ pageSize: 10, showSizeChanger: false }}
                      scroll={{ x: 800 }}
                      size="small"
                    />
                  </Space>
                </Spin>
              )
            }
          ]}
        />
      </Drawer>

      {/* Refund Modal */}
      <Modal
        title={`Trả hàng - ${selectedOrder?.order_number}`}
        open={refundModalVisible}
        onOk={handleRefundSubmit}
        onCancel={() => {
          setRefundModalVisible(false);
          refundForm.resetFields();
          setSelectedOrder(null);
        }}
        confirmLoading={refundMutation.isPending}
        okText="Xác nhận trả hàng"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
      >
        <Form form={refundForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="Số tiền hoàn trả"
            name="amount"
            rules={[{ required: true, message: 'Vui lòng nhập số tiền' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value!.replace(/\$\s?|(,*)/g, '')}
              addonAfter="₫"
              min={0}
            />
          </Form.Item>

          <Form.Item
            label="Lý do trả hàng"
            name="reason"
            rules={[{ required: true, message: 'Vui lòng nhập lý do' }]}
          >
            <Input.TextArea rows={3} placeholder="Nhập lý do trả hàng..." />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

import { Typography } from 'antd';
