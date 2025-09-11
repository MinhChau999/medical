import { Table, Card, Tag, Alert, Statistic, Row, Col } from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

const Inventory = () => {
  const { data: inventory, isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const response = await api.get('/inventory');
      return response.data;
    },
  });

  const { data: lowStock } = useQuery({
    queryKey: ['inventory-low-stock'],
    queryFn: async () => {
      const response = await api.get('/inventory/low-stock');
      return response.data;
    },
  });

  const columns = [
    {
      title: 'Product',
      dataIndex: 'product_name',
      key: 'product_name',
    },
    {
      title: 'Variant',
      dataIndex: 'variant_name',
      key: 'variant_name',
    },
    {
      title: 'SKU',
      dataIndex: 'variant_sku',
      key: 'variant_sku',
    },
    {
      title: 'Warehouse',
      dataIndex: 'warehouse_name',
      key: 'warehouse_name',
    },
    {
      title: 'Stock',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (value: number, record: any) => (
        <span style={{ color: record.isLowStock ? 'red' : 'inherit' }}>
          {value}
        </span>
      ),
    },
    {
      title: 'Reserved',
      dataIndex: 'reserved_quantity',
      key: 'reserved_quantity',
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: any, record: any) => {
        if (record.quantity === 0) {
          return <Tag color="red">OUT OF STOCK</Tag>;
        }
        if (record.isLowStock) {
          return <Tag color="orange">LOW STOCK</Tag>;
        }
        return <Tag color="green">IN STOCK</Tag>;
      },
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      {lowStock?.data?.length > 0 && (
        <Alert
          message="Low Stock Alert"
          description={`${lowStock.data.length} items are running low on stock`}
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: 16 }}
        />
      )}
      
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total SKUs"
              value={inventory?.pagination?.totalCount || 0}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Low Stock Items"
              value={lowStock?.count || 0}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Out of Stock"
              value={inventory?.data?.filter((i: any) => i.quantity === 0).length || 0}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Value"
              value={0}
              prefix="₫"
              formatter={(value) => `${value.toLocaleString()}`}
            />
          </Card>
        </Col>
      </Row>

      <Card className="inventory-card">
        <div style={{ padding: 20 }}>
        <Table
          columns={columns}
          dataSource={inventory?.data || []}
          loading={isLoading}
          rowKey="id"
          style={{ marginTop: 0 }}
        />
        </div>
      </Card>
    </div>
  );
};

export default Inventory;