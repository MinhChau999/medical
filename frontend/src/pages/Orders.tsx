import { Table, Card, Tag, Button, Space, Select, DatePicker } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

const Orders = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await api.get('/orders');
      return response.data;
    },
  });

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
      render: (_: any, record: any) => (
        <Button type="text" icon={<EyeOutlined />} />
      ),
    },
  ];

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
    </div>
  );
};

export default Orders;