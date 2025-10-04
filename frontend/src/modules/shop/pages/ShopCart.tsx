import { useState } from 'react';
import {
  Card,
  Button,
  Typography,
  Empty,
  InputNumber,
  Breadcrumb,
  Row,
  Col,
  Image,
  Space,
  Divider,
} from 'antd';
import {
  DeleteOutlined,
  ShoppingOutlined,
  HomeOutlined,
  MinusOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '@/stores/cartStore';

const { Title, Text } = Typography;

export default function ShopCart() {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, getTotalPrice } = useCartStore();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const subtotal = getTotalPrice();
  const shippingFee = subtotal >= 500000 ? 0 : 30000;
  const total = subtotal + shippingFee;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumb */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Breadcrumb>
              <Breadcrumb.Item>
                <Link to="/">
                  <HomeOutlined /> Trang chủ
                </Link>
              </Breadcrumb.Item>
              <Breadcrumb.Item>Giỏ hàng</Breadcrumb.Item>
            </Breadcrumb>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Giỏ hàng trống"
            >
              <Link to="/products">
                <Button type="primary" icon={<ShoppingOutlined />}>
                  Tiếp tục mua sắm
                </Button>
              </Link>
            </Empty>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumb>
            <Breadcrumb.Item>
              <Link to="/">
                <HomeOutlined /> Trang chủ
              </Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>Giỏ hàng</Breadcrumb.Item>
          </Breadcrumb>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Title level={2} className="!mb-6">
          Giỏ hàng của bạn
        </Title>

        <Row gutter={24}>
          {/* Cart Items */}
          <Col xs={24} lg={16}>
            <Card>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.variantId} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      <Image
                        src={item.image}
                        alt={item.productName}
                        width={100}
                        height={100}
                        className="rounded-lg object-cover"
                        fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjY2NjIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1">
                      <Title level={5} className="!mb-1">
                        {item.productName}
                      </Title>
                      {item.variantName && (
                        <Text type="secondary" className="text-sm">
                          {item.variantName}
                        </Text>
                      )}
                      <div className="mt-2">
                        <Text className="text-lg font-semibold text-medical-primary">
                          {formatPrice(item.price)}
                        </Text>
                      </div>
                    </div>

                    {/* Quantity & Actions */}
                    <div className="flex flex-col items-end justify-between">
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeItem(item.variantId)}
                      />

                      <Space.Compact>
                        <Button
                          icon={<MinusOutlined />}
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        />
                        <InputNumber
                          min={1}
                          max={99}
                          value={item.quantity}
                          onChange={(value) => updateQuantity(item.variantId, value || 1)}
                          className="w-16"
                          controls={false}
                        />
                        <Button
                          icon={<PlusOutlined />}
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                        />
                      </Space.Compact>

                      <Text className="text-base font-medium">
                        {formatPrice(item.price * item.quantity)}
                      </Text>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </Col>

          {/* Order Summary */}
          <Col xs={24} lg={8}>
            <Card title="Tổng quan đơn hàng" className="sticky top-20">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Text>Tạm tính:</Text>
                  <Text className="font-medium">{formatPrice(subtotal)}</Text>
                </div>

                <div className="flex justify-between">
                  <Text>Phí vận chuyển:</Text>
                  <Text className="font-medium">
                    {shippingFee === 0 ? (
                      <span className="text-green-600">Miễn phí</span>
                    ) : (
                      formatPrice(shippingFee)
                    )}
                  </Text>
                </div>

                {subtotal < 500000 && (
                  <Text type="secondary" className="text-xs block">
                    Mua thêm {formatPrice(500000 - subtotal)} để được miễn phí vận chuyển
                  </Text>
                )}

                <Divider className="!my-3" />

                <div className="flex justify-between">
                  <Text strong className="text-base">Tổng cộng:</Text>
                  <Text strong className="text-xl text-medical-primary">
                    {formatPrice(total)}
                  </Text>
                </div>

                <Button
                  type="primary"
                  size="large"
                  block
                  onClick={() => navigate('/checkout')}
                  className="!mt-6"
                >
                  Tiến hành thanh toán
                </Button>

                <Link to="/products">
                  <Button block>Tiếp tục mua sắm</Button>
                </Link>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}
