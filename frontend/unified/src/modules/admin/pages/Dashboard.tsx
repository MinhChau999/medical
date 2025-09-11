import { Card, Row, Col, Statistic, Progress } from 'antd'
import { 
  ShoppingCartOutlined, 
  DollarOutlined, 
  UserOutlined, 
  RiseOutlined,
  FallOutlined,
  ShoppingOutlined 
} from '@ant-design/icons'

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>
      
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={112893}
              prefix="$"
              valueStyle={{ color: '#3f8600' }}
              suffix={<RiseOutlined />}
            />
            <Progress percent={70} showInfo={false} strokeColor="#52c41a" />
            <div className="text-sm text-gray-500 mt-2">+12.5% from last month</div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Orders"
              value={1893}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <Progress percent={85} showInfo={false} />
            <div className="text-sm text-gray-500 mt-2">+8.2% from last month</div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Customers"
              value={2893}
              prefix={<UserOutlined />}
            />
            <Progress percent={60} showInfo={false} strokeColor="#faad14" />
            <div className="text-sm text-gray-500 mt-2">+15.3% from last month</div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Products"
              value={456}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#cf1322' }}
              suffix={<FallOutlined />}
            />
            <Progress percent={45} showInfo={false} strokeColor="#ff4d4f" />
            <div className="text-sm text-gray-500 mt-2">12 out of stock</div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Sales Analytics">
            <p>Sales chart coming soon...</p>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Recent Activities">
            <p>Activity feed coming soon...</p>
          </Card>
        </Col>
      </Row>
    </div>
  )
}