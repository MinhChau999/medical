import { Card, Row, Col, Statistic, Table, Tag } from 'antd'
import { ShoppingCartOutlined, DollarOutlined, UserOutlined, RiseOutlined } from '@ant-design/icons'

export default function POSDashboard() {
  const salesData = [
    { key: '1', product: 'Blood Pressure Monitor', quantity: 2, total: '$89.98', status: 'completed' },
    { key: '2', product: 'Thermometer', quantity: 5, total: '$124.95', status: 'completed' },
    { key: '3', product: 'Pulse Oximeter', quantity: 1, total: '$45.00', status: 'pending' },
  ]

  const columns = [
    { title: 'Product', dataIndex: 'product', key: 'product' },
    { title: 'Quantity', dataIndex: 'quantity', key: 'quantity' },
    { title: 'Total', dataIndex: 'total', key: 'total' },
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
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">POS Dashboard</h1>
      
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Today's Sales"
              value={1893}
              prefix="$"
              valueStyle={{ color: '#3f8600' }}
              suffix={<RiseOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Orders"
              value={93}
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Customers"
              value={28}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Avg. Order Value"
              value={20.35}
              prefix="$"
              precision={2}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Recent Sales">
        <Table dataSource={salesData} columns={columns} pagination={false} />
      </Card>
    </div>
  )
}