import { Card, Carousel, Row, Col, Button } from 'antd';
import { ShoppingCartOutlined, ThunderboltOutlined, GiftOutlined } from '@ant-design/icons';

export default function ShopHome() {
  const featuredProducts = [
    { id: 1, name: 'Blood Pressure Monitor', price: '$45.99', image: '🩺' },
    { id: 2, name: 'Digital Thermometer', price: '$12.99', image: '🌡️' },
    { id: 3, name: 'Pulse Oximeter', price: '$35.50', image: '💓' },
    { id: 4, name: 'Glucose Meter', price: '$28.75', image: '💉' },
  ];

  const categories = [
    { name: 'Monitoring Devices', icon: '📊', count: 45 },
    { name: 'Diagnostic Tools', icon: '🔬', count: 32 },
    { name: 'First Aid', icon: '🏥', count: 28 },
    { name: 'Mobility Aids', icon: '🦽', count: 15 },
  ];

  return (
    <div>
      {/* Hero Banner */}
      <Carousel autoplay className="mb-8">
        <div>
          <div className="h-80 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4">Medical Electronics Shop</h1>
              <p className="text-xl mb-6">Quality Healthcare Products at Your Fingertips</p>
              <Button type="primary" size="large" ghost>
                Shop Now
              </Button>
            </div>
          </div>
        </div>
        <div>
          <div className="h-80 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4">New Arrivals</h1>
              <p className="text-xl mb-6">Check out our latest medical devices</p>
              <Button type="primary" size="large" ghost>
                View Collection
              </Button>
            </div>
          </div>
        </div>
      </Carousel>

      {/* Features */}
      <Row gutter={[16, 16]} className="mb-8">
        <Col xs={24} sm={8}>
          <Card className="text-center">
            <ShoppingCartOutlined className="text-4xl text-blue-500 mb-4" />
            <h3 className="font-semibold mb-2">Free Shipping</h3>
            <p className="text-gray-600">On orders over $50</p>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="text-center">
            <ThunderboltOutlined className="text-4xl text-green-500 mb-4" />
            <h3 className="font-semibold mb-2">Fast Delivery</h3>
            <p className="text-gray-600">Same day delivery available</p>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="text-center">
            <GiftOutlined className="text-4xl text-purple-500 mb-4" />
            <h3 className="font-semibold mb-2">Special Offers</h3>
            <p className="text-gray-600">Up to 30% off selected items</p>
          </Card>
        </Col>
      </Row>

      {/* Categories */}
      <Card title="Shop by Category" className="mb-8">
        <Row gutter={[16, 16]}>
          {categories.map((cat, index) => (
            <Col xs={12} sm={6} key={index}>
              <Card hoverable className="text-center">
                <div className="text-4xl mb-2">{cat.icon}</div>
                <h4 className="font-semibold">{cat.name}</h4>
                <p className="text-gray-500">{cat.count} products</p>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Featured Products */}
      <Card title="Featured Products">
        <Row gutter={[16, 16]}>
          {featuredProducts.map(product => (
            <Col xs={12} sm={6} key={product.id}>
              <Card hoverable>
                <div className="text-6xl text-center mb-4">{product.image}</div>
                <h4 className="font-semibold mb-2">{product.name}</h4>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-blue-600">{product.price}</span>
                  <Button type="primary" size="small" icon={<ShoppingCartOutlined />}>
                    Add
                  </Button>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );
}