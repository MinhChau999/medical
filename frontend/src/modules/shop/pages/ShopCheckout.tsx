import { useState } from 'react';
import {
  Card,
  Button,
  Typography,
  Form,
  Input,
  Radio,
  Breadcrumb,
  Row,
  Col,
  Divider,
  message,
  Space,
  Result,
} from 'antd';
import {
  HomeOutlined,
  ShoppingOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '@/stores/cartStore';
import { guestOrderService } from '@/services/guest-order';

const { Title, Text } = Typography;

export default function ShopCheckout() {
  const navigate = useNavigate();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const subtotal = getTotalPrice();
  const shippingFee = subtotal >= 500000 ? 0 : 30000;
  const total = subtotal + shippingFee;

  const handleSubmit = async (values: any) => {
    if (items.length === 0) {
      message.error('Giỏ hàng trống');
      return;
    }

    try {
      setLoading(true);

      const orderData = {
        customerInfo: {
          name: values.name,
          phone: values.phone,
          email: values.email,
        },
        shippingAddress: {
          address: values.address,
          ward: values.ward,
          district: values.district,
          city: values.city,
        },
        items: items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
        paymentMethod: values.paymentMethod || 'cod',
        notes: values.notes,
      };

      const response = await guestOrderService.createOrder(orderData);

      if (response.success) {
        setOrderNumber(response.data.orderNumber);
        setOrderSuccess(true);
        clearCart();
        message.success('Đặt hàng thành công!');
      }
    } catch (error: any) {
      console.error('Error creating order:', error);
      message.error(error.response?.data?.message || 'Đặt hàng thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // If no items in cart, redirect to products
  if (items.length === 0 && !orderSuccess) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Breadcrumb>
              <Breadcrumb.Item>
                <Link to="/">
                  <HomeOutlined /> Trang chủ
                </Link>
              </Breadcrumb.Item>
              <Breadcrumb.Item>Thanh toán</Breadcrumb.Item>
            </Breadcrumb>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card>
            <Result
              status="warning"
              title="Giỏ hàng trống"
              subTitle="Vui lòng thêm sản phẩm vào giỏ hàng trước khi thanh toán"
              extra={[
                <Link to="/products" key="products">
                  <Button type="primary" icon={<ShoppingOutlined />}>
                    Tiếp tục mua sắm
                  </Button>
                </Link>,
              ]}
            />
          </Card>
        </div>
      </div>
    );
  }

  // Order success screen
  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Breadcrumb>
              <Breadcrumb.Item>
                <Link to="/">
                  <HomeOutlined /> Trang chủ
                </Link>
              </Breadcrumb.Item>
              <Breadcrumb.Item>Đặt hàng thành công</Breadcrumb.Item>
            </Breadcrumb>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card>
            <Result
              status="success"
              title="Đặt hàng thành công!"
              subTitle={`Mã đơn hàng của bạn: ${orderNumber}. Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.`}
              extra={[
                <Link to="/products" key="products">
                  <Button type="primary">Tiếp tục mua sắm</Button>
                </Link>,
                <Link to="/" key="home">
                  <Button>Về trang chủ</Button>
                </Link>,
              ]}
            />
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
            <Breadcrumb.Item>
              <Link to="/cart">Giỏ hàng</Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>Thanh toán</Breadcrumb.Item>
          </Breadcrumb>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Title level={2} className="!mb-6">
          Thanh toán
        </Title>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            paymentMethod: 'cod',
          }}
        >
          <Row gutter={24}>
            {/* Customer Information */}
            <Col xs={24} lg={16}>
              <Card title="Thông tin khách hàng" className="mb-6">
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="Họ và tên"
                      name="name"
                      rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                    >
                      <Input placeholder="Nguyễn Văn A" size="large" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="Số điện thoại"
                      name="phone"
                      rules={[
                        { required: true, message: 'Vui lòng nhập số điện thoại' },
                        { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ' },
                      ]}
                    >
                      <Input placeholder="0901234567" size="large" />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item label="Email" name="email">
                      <Input type="email" placeholder="email@example.com" size="large" />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              <Card title="Địa chỉ giao hàng" className="mb-6">
                <Row gutter={16}>
                  <Col xs={24}>
                    <Form.Item
                      label="Địa chỉ"
                      name="address"
                      rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
                    >
                      <Input placeholder="Số nhà, tên đường" size="large" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item label="Phường/Xã" name="ward">
                      <Input placeholder="Phường/Xã" size="large" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item
                      label="Quận/Huyện"
                      name="district"
                      rules={[{ required: true, message: 'Vui lòng nhập quận/huyện' }]}
                    >
                      <Input placeholder="Quận/Huyện" size="large" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item
                      label="Tỉnh/Thành phố"
                      name="city"
                      rules={[{ required: true, message: 'Vui lòng nhập tỉnh/thành phố' }]}
                    >
                      <Input placeholder="Tỉnh/Thành phố" size="large" />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              <Card title="Phương thức thanh toán" className="mb-6">
                <Form.Item name="paymentMethod">
                  <Radio.Group>
                    <Space direction="vertical" className="w-full">
                      <Radio value="cod" className="w-full">
                        <div>
                          <Text strong>Thanh toán khi nhận hàng (COD)</Text>
                          <div className="text-gray-500 text-sm">
                            Thanh toán bằng tiền mặt khi nhận hàng
                          </div>
                        </div>
                      </Radio>
                      <Radio value="bank_transfer" className="w-full">
                        <div>
                          <Text strong>Chuyển khoản ngân hàng</Text>
                          <div className="text-gray-500 text-sm">
                            Chuyển khoản trước, giao hàng sau
                          </div>
                        </div>
                      </Radio>
                    </Space>
                  </Radio.Group>
                </Form.Item>
              </Card>

              <Card title="Ghi chú">
                <Form.Item name="notes">
                  <Input.TextArea
                    rows={4}
                    placeholder="Ghi chú đơn hàng (tùy chọn)"
                  />
                </Form.Item>
              </Card>
            </Col>

            {/* Order Summary */}
            <Col xs={24} lg={8}>
              <Card title="Thông tin đơn hàng" className="sticky top-20">
                <div className="space-y-3">
                  {/* Order Items */}
                  <div className="space-y-2 mb-4">
                    {items.map((item) => (
                      <div key={item.variantId} className="flex justify-between text-sm">
                        <Text>
                          {item.productName} <Text type="secondary">x{item.quantity}</Text>
                        </Text>
                        <Text>{formatPrice(item.price * item.quantity)}</Text>
                      </div>
                    ))}
                  </div>

                  <Divider className="!my-3" />

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
                    htmlType="submit"
                    loading={loading}
                    className="!mt-6"
                  >
                    Đặt hàng
                  </Button>

                  <Link to="/cart">
                    <Button block>Quay lại giỏ hàng</Button>
                  </Link>
                </div>
              </Card>
            </Col>
          </Row>
        </Form>
      </div>
    </div>
  );
}
