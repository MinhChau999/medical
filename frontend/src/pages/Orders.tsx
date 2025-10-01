import { Table, Card, Tag, Button, Space, Select, DatePicker, Modal, Descriptions, Divider, Timeline } from 'antd';
import { EyeOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import api from '@/services/api';
import { useThemeStore } from '@/stores/themeStore';

interface OrderItem {
  id: string;
  product_name: string;
  variant_name?: string;
  sku: string;
  quantity: number;
  price: number;
  total_amount: number;
}

interface Order {
  id: string;
  order_number: string;
  customer_name?: string;
  status: string;
  payment_status: string;
  payment_method: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  shipping_fee: number;
  total_amount: number;
  created_at: string;
  confirmed_at?: string;
  packed_at?: string;
  shipped_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  items?: OrderItem[];
}

const Orders = () => {
  const { isDarkMode } = useThemeStore();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await api.get('/orders');
      return response.data;
    },
  });

  const { data: orderDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['order', selectedOrder?.id],
    queryFn: async () => {
      if (!selectedOrder?.id) return null;
      const response = await api.get(`/orders/${selectedOrder.id}`);
      return response.data;
    },
    enabled: !!selectedOrder?.id,
  });

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsModalVisible(true);
  };

  const columns = [
    {
      title: 'Order Number',
      dataIndex: 'order_number',
      key: 'order_number',
    },
    {
      title: 'Customer',
      dataIndex: 'customer_name',
      key: 'customer_name',
    },
    {
      title: 'Total',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (value: number) => `₫${Number(value).toLocaleString()}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: any = {
          pending: 'orange',
          confirmed: 'blue',
          processing: 'cyan',
          packed: 'purple',
          shipped: 'geekblue',
          delivered: 'green',
          cancelled: 'red',
        };
        return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Payment',
      dataIndex: 'payment_status',
      key: 'payment_status',
      render: (status: string) => {
        const colors: any = {
          pending: 'orange',
          paid: 'green',
          failed: 'red',
          refunded: 'purple',
        };
        return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Order) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => handleViewOrder(record)}
        />
      ),
    },
  ];

  const getStatusColor = (status: string) => {
    const colors: any = {
      pending: 'orange',
      confirmed: 'blue',
      processing: 'cyan',
      packed: 'purple',
      shipped: 'geekblue',
      delivered: 'green',
      cancelled: 'red',
    };
    return colors[status] || 'default';
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: any = {
      pending: 'orange',
      paid: 'green',
      failed: 'red',
      refunded: 'purple',
    };
    return colors[status] || 'default';
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: any = {
      cash: 'Tiền mặt',
      card: 'Thẻ',
      bank_transfer: 'Chuyển khoản',
      e_wallet: 'Ví điện tử',
    };
    return labels[method] || method;
  };

  const renderTimeline = (order: Order) => {
    const timelineItems = [];

    if (order.created_at) {
      timelineItems.push({
        color: 'blue',
        dot: <ClockCircleOutlined />,
        children: (
          <div>
            <div style={{ fontWeight: 500 }}>Đơn hàng được tạo</div>
            <div style={{ fontSize: 12, color: isDarkMode ? '#8c8c8c' : '#595959' }}>
              {new Date(order.created_at).toLocaleString('vi-VN')}
            </div>
          </div>
        ),
      });
    }

    if (order.confirmed_at) {
      timelineItems.push({
        color: 'green',
        dot: <CheckCircleOutlined />,
        children: (
          <div>
            <div style={{ fontWeight: 500 }}>Đơn hàng được xác nhận</div>
            <div style={{ fontSize: 12, color: isDarkMode ? '#8c8c8c' : '#595959' }}>
              {new Date(order.confirmed_at).toLocaleString('vi-VN')}
            </div>
          </div>
        ),
      });
    }

    if (order.packed_at) {
      timelineItems.push({
        color: 'purple',
        dot: <CheckCircleOutlined />,
        children: (
          <div>
            <div style={{ fontWeight: 500 }}>Đơn hàng đã đóng gói</div>
            <div style={{ fontSize: 12, color: isDarkMode ? '#8c8c8c' : '#595959' }}>
              {new Date(order.packed_at).toLocaleString('vi-VN')}
            </div>
          </div>
        ),
      });
    }

    if (order.shipped_at) {
      timelineItems.push({
        color: 'cyan',
        dot: <CheckCircleOutlined />,
        children: (
          <div>
            <div style={{ fontWeight: 500 }}>Đơn hàng đã giao cho vận chuyển</div>
            <div style={{ fontSize: 12, color: isDarkMode ? '#8c8c8c' : '#595959' }}>
              {new Date(order.shipped_at).toLocaleString('vi-VN')}
            </div>
          </div>
        ),
      });
    }

    if (order.delivered_at) {
      timelineItems.push({
        color: 'green',
        dot: <CheckCircleOutlined />,
        children: (
          <div>
            <div style={{ fontWeight: 500 }}>Đơn hàng đã giao thành công</div>
            <div style={{ fontSize: 12, color: isDarkMode ? '#8c8c8c' : '#595959' }}>
              {new Date(order.delivered_at).toLocaleString('vi-VN')}
            </div>
          </div>
        ),
      });
    }

    if (order.cancelled_at) {
      timelineItems.push({
        color: 'red',
        dot: <CloseCircleOutlined />,
        children: (
          <div>
            <div style={{ fontWeight: 500 }}>Đơn hàng đã bị hủy</div>
            <div style={{ fontSize: 12, color: isDarkMode ? '#8c8c8c' : '#595959' }}>
              {new Date(order.cancelled_at).toLocaleString('vi-VN')}
            </div>
          </div>
        ),
      });
    }

    return <Timeline items={timelineItems} />;
  };

  const currentOrder = orderDetail?.data || selectedOrder;

  return (
    <div style={{ padding: 24 }}>
      <Card className="order-card">
        <div style={{ padding: 20 }}>
          <div className="table-operations">
            <Space>
              <Select placeholder="Status" style={{ width: 150 }} />
              <Select placeholder="Payment Status" style={{ width: 150 }} />
              <DatePicker.RangePicker />
            </Space>
          </div>
        </div>
        <Table
          columns={columns}
          dataSource={data?.data || []}
          loading={isLoading}
          rowKey="id"
          style={{ marginTop: 0 }}
        />
      </Card>

      <Modal
        title={
          <div style={{ fontSize: 18, fontWeight: 600 }}>
            Chi tiết đơn hàng {currentOrder?.order_number}
          </div>
        }
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setSelectedOrder(null);
        }}
        footer={null}
        width={900}
        style={{
          top: 20
        }}
        styles={{
          body: {
            maxHeight: 'calc(100vh - 200px)',
            overflowY: 'auto',
            background: isDarkMode ? '#141414' : '#ffffff',
            padding: 24
          }
        }}
      >
        {isLoadingDetail ? (
          <div style={{ textAlign: 'center', padding: 40 }}>Đang tải...</div>
        ) : currentOrder ? (
          <div>
            {/* Order Info */}
            <Descriptions
              bordered
              column={2}
              size="small"
              style={{ marginBottom: 24 }}
            >
              <Descriptions.Item label="Mã đơn hàng" span={2}>
                <strong>{currentOrder.order_number}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={getStatusColor(currentOrder.status)}>
                  {currentOrder.status.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Thanh toán">
                <Tag color={getPaymentStatusColor(currentOrder.payment_status)}>
                  {currentOrder.payment_status.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Phương thức thanh toán" span={2}>
                {getPaymentMethodLabel(currentOrder.payment_method)}
              </Descriptions.Item>
            </Descriptions>

            <Divider>Sản phẩm</Divider>

            {/* Order Items */}
            <Table
              dataSource={currentOrder.items || []}
              pagination={false}
              size="small"
              rowKey="id"
              style={{ marginBottom: 24 }}
              columns={[
                {
                  title: 'Sản phẩm',
                  dataIndex: 'product_name',
                  key: 'product_name',
                  render: (name: string, record: OrderItem) => (
                    <div>
                      <div style={{ fontWeight: 500 }}>{name}</div>
                      {record.variant_name && (
                        <div style={{ fontSize: 12, color: isDarkMode ? '#8c8c8c' : '#595959' }}>
                          {record.variant_name}
                        </div>
                      )}
                      <div style={{ fontSize: 12, color: isDarkMode ? '#8c8c8c' : '#595959' }}>
                        SKU: {record.sku}
                      </div>
                    </div>
                  ),
                },
                {
                  title: 'Đơn giá',
                  dataIndex: 'price',
                  key: 'price',
                  align: 'right',
                  render: (price: number) => `${Math.round(Number(price)).toLocaleString('vi-VN')}₫`,
                },
                {
                  title: 'SL',
                  dataIndex: 'quantity',
                  key: 'quantity',
                  align: 'center',
                  width: 60,
                },
                {
                  title: 'Thành tiền',
                  dataIndex: 'total_amount',
                  key: 'total_amount',
                  align: 'right',
                  render: (total: number) => (
                    <strong>{Math.round(Number(total)).toLocaleString('vi-VN')}₫</strong>
                  ),
                },
              ]}
            />

            {/* Order Summary */}
            <div style={{
              background: isDarkMode ? '#1f1f1f' : '#fafafa',
              padding: 16,
              borderRadius: 8,
              marginBottom: 24
            }}>
              <Space direction="vertical" style={{ width: '100%' }} size={8}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Tạm tính:</span>
                  <span>{Math.round(Number(currentOrder.subtotal)).toLocaleString('vi-VN')}₫</span>
                </div>
                {currentOrder.discount_amount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ff4d4f' }}>
                    <span>Giảm giá:</span>
                    <span>-{Math.round(Number(currentOrder.discount_amount)).toLocaleString('vi-VN')}₫</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Thuế VAT (10%):</span>
                  <span>{Math.round(Number(currentOrder.tax_amount)).toLocaleString('vi-VN')}₫</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Phí vận chuyển:</span>
                  <span>
                    {currentOrder.shipping_fee > 0
                      ? `${Math.round(Number(currentOrder.shipping_fee)).toLocaleString('vi-VN')}₫`
                      : 'Miễn phí'
                    }
                  </span>
                </div>
                <Divider style={{ margin: '8px 0' }} />
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 16,
                  fontWeight: 600
                }}>
                  <span>Tổng cộng:</span>
                  <span style={{ color: '#00A6B8' }}>
                    {Math.round(Number(currentOrder.total_amount)).toLocaleString('vi-VN')}₫
                  </span>
                </div>
              </Space>
            </div>

            <Divider>Lịch sử đơn hàng</Divider>

            {/* Timeline */}
            {renderTimeline(currentOrder)}
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default Orders;