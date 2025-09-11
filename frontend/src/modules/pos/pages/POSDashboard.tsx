import { Card, Row, Col, Statistic, Table, Tag, Button } from 'antd';
import { ShoppingCartOutlined, DollarOutlined, UserOutlined, PrinterOutlined } from '@ant-design/icons';

export default function POSDashboard() {
  const recentSales = [
    { key: '1', time: '10:23 AM', items: 3, total: '$125.50', payment: 'Cash', status: 'completed' },
    { key: '2', time: '10:45 AM', items: 5, total: '$89.99', payment: 'Card', status: 'completed' },
    { key: '3', time: '11:02 AM', items: 2, total: '$45.00', payment: 'Cash', status: 'pending' },
    { key: '4', time: '11:15 AM', items: 7, total: '$234.75', payment: 'Card', status: 'completed' },
  ];

  const columns = [
    { title: 'Time', dataIndex: 'time', key: 'time' },
    { title: 'Items', dataIndex: 'items', key: 'items' },
    { title: 'Total', dataIndex: 'total', key: 'total' },
    { title: 'Payment', dataIndex: 'payment', key: 'payment' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'completed' ? 'green' : 'orange'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: () => (
        <Button type="link" icon={<PrinterOutlined />} size="small">
          Receipt
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">POS Dashboard</h1>
        <Button type="primary" icon={<ShoppingCartOutlined />} size="large">
          New Sale
        </Button>
      </div>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Today's Sales"
              value={2389.50}
              prefix="$"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Transactions"
              value={47}
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Customers"
              value={38}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Avg. Sale"
              value={50.73}
              prefix="$"
              precision={2}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Recent Transactions">
        <Table dataSource={recentSales} columns={columns} pagination={false} />
      </Card>
    </div>
  );
}