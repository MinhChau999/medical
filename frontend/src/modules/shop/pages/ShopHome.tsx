import { useEffect, useState } from 'react';
import { Card, Carousel, Row, Col, Button, Typography, Statistic, Input, Form, message, Badge } from 'antd';
import {
  ShoppingCartOutlined,
  ThunderboltOutlined,
  GiftOutlined,
  RocketOutlined,
  SafetyOutlined,
  CustomerServiceOutlined,
  ArrowRightOutlined,
  HeartOutlined,
  StarFilled,
  CheckCircleFilled,
  TrophyOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import homepageService from '@/services/homepage';

const { Title, Paragraph, Text } = Typography;

interface HomepageSettings {
  heroTitle: string;
  heroSubtitle: string;
  heroButtonText: string;
  aboutTitle: string;
  aboutContent: string;
  yearsExperience: number;
  happyCustomers: number;
  productsCount: number;
  showPromoBanner: boolean;
  promoBannerText: string;
  showNewsletter: boolean;
  newsletterTitle: string;
}

export default function ShopHome() {
  const [settings, setSettings] = useState<HomepageSettings>({
    heroTitle: 'Medical Electronics - Thiết bị Y tế Chất lượng Cao',
    heroSubtitle: 'Nhà cung cấp thiết bị y tế hàng đầu Việt Nam',
    heroButtonText: 'Khám phá ngay',
    aboutTitle: 'Về chúng tôi',
    aboutContent: 'Medical Electronics là đơn vị tiên phong trong lĩnh vực cung cấp thiết bị y tế chất lượng cao tại Việt Nam. Với hơn 10 năm kinh nghiệm, chúng tôi cam kết mang đến những sản phẩm tốt nhất cho sức khỏe cộng đồng.',
    yearsExperience: 10,
    happyCustomers: 5000,
    productsCount: 1000,
    showPromoBanner: true,
    promoBannerText: 'Giảm giá 20% cho đơn hàng đầu tiên! Sử dụng mã: FIRST20',
    showNewsletter: true,
    newsletterTitle: 'Đăng ký nhận thông tin mới nhất'
  });

  const [newsletterForm] = Form.useForm();

  // Fetch homepage settings from API
  useEffect(() => {
    const fetchHomepageSettings = async () => {
      try {
        const data = await homepageService.getSettings();
        setSettings(data);
      } catch (error) {
        console.error('Error fetching homepage settings:', error);
        // Use default settings if API fails
      }
    };

    fetchHomepageSettings();
  }, []);

  const handleNewsletterSubmit = async (values: { email: string }) => {
    try {
      await homepageService.subscribeNewsletter(values);
      message.success('Đăng ký thành công! Cảm ơn bạn đã quan tâm.');
      newsletterForm.resetFields();
    } catch (error) {
      message.error('Có lỗi xảy ra, vui lòng thử lại.');
    }
  };

  const featuredProducts = [
    {
      id: 1,
      name: 'Máy đo huyết áp điện tử',
      price: '1.200.000đ',
      oldPrice: '1.500.000đ',
      image: '🩺',
      rating: 4.8,
      reviews: 156,
      badge: 'Bán chạy'
    },
    {
      id: 2,
      name: 'Nhiệt kế hồng ngoại',
      price: '350.000đ',
      oldPrice: '450.000đ',
      image: '🌡️',
      rating: 4.9,
      reviews: 203,
      badge: 'Mới'
    },
    {
      id: 3,
      name: 'Máy đo nồng độ oxy',
      price: '850.000đ',
      oldPrice: '1.000.000đ',
      image: '💓',
      rating: 4.7,
      reviews: 89,
      badge: '-15%'
    },
    {
      id: 4,
      name: 'Máy đo đường huyết',
      price: '650.000đ',
      oldPrice: '800.000đ',
      image: '💉',
      rating: 4.6,
      reviews: 124,
      badge: 'Hot'
    },
  ];

  const categories = [
    { name: 'Thiết bị chẩn đoán', icon: '🔬', count: 45, gradient: 'from-blue-500 to-cyan-500' },
    { name: 'Dụng cụ phẫu thuật', icon: '⚕️', count: 32, gradient: 'from-green-500 to-emerald-500' },
    { name: 'Vật tư y tế', icon: '🏥', count: 28, gradient: 'from-orange-500 to-amber-500' },
    { name: 'Thiết bị hỗ trợ', icon: '🦽', count: 15, gradient: 'from-purple-500 to-pink-500' },
  ];

  const features = [
    {
      icon: <ShoppingCartOutlined />,
      title: 'Miễn phí vận chuyển',
      description: 'Cho đơn hàng trên 500.000đ',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: <ThunderboltOutlined />,
      title: 'Giao hàng nhanh',
      description: 'Giao hàng trong ngày tại TP.HCM',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: <GiftOutlined />,
      title: 'Ưu đãi đặc biệt',
      description: 'Giảm giá lên đến 30%',
      gradient: 'from-orange-500 to-amber-500'
    },
    {
      icon: <SafetyOutlined />,
      title: 'Bảo hành chính hãng',
      description: 'Bảo hành 12-24 tháng',
      gradient: 'from-red-500 to-rose-500'
    },
    {
      icon: <CustomerServiceOutlined />,
      title: 'Hỗ trợ 24/7',
      description: 'Luôn sẵn sàng hỗ trợ bạn',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: <TrophyOutlined />,
      title: 'Chất lượng đảm bảo',
      description: 'Sản phẩm chính hãng 100%',
      gradient: 'from-indigo-500 to-blue-500'
    },
  ];

  const testimonials = [
    {
      name: 'Nguyễn Thị Lan',
      role: 'Khách hàng',
      content: 'Sản phẩm chất lượng tuyệt vời, giao hàng nhanh chóng. Tôi rất hài lòng với dịch vụ!',
      rating: 5,
      avatar: '👩'
    },
    {
      name: 'Trần Văn Nam',
      role: 'Bác sĩ',
      content: 'Thiết bị y tế chính hãng, đội ngũ tư vấn nhiệt tình. Sẽ tiếp tục ủng hộ!',
      rating: 5,
      avatar: '👨‍⚕️'
    },
    {
      name: 'Lê Thị Hoa',
      role: 'Khách hàng',
      content: 'Giá cả hợp lý, nhiều ưu đãi. Đã giới thiệu cho bạn bè và người thân.',
      rating: 5,
      avatar: '👩‍💼'
    }
  ];

  return (
    <div className="bg-white">
      {/* Promo Banner */}
      {settings.showPromoBanner && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-gradient-to-r from-medical-primary via-cyan-500 to-blue-500 text-white py-3 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
          <div className="relative z-10">
            <Text className="text-white font-semibold text-sm md:text-base">
              🎉 {settings.promoBannerText}
            </Text>
          </div>
        </motion.div>
      )}

      {/* Hero Section - Modern with Glassmorphism */}
      <div className="relative bg-gradient-to-br from-gray-50 via-blue-50 to-cyan-50 overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-medical-primary/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
          <Row gutter={[48, 48]} align="middle">
            <Col xs={24} lg={12}>
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
              >
                <div className="mb-4">
                  <span className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-medical-primary to-cyan-500 text-white text-sm font-semibold shadow-lg">
                    <CheckCircleFilled className="mr-2" />
                    Đơn vị uy tín #1 Việt Nam
                  </span>
                </div>
                <Title level={1} className="!text-5xl md:!text-6xl !font-extrabold !mb-6 !leading-tight">
                  <span className="bg-gradient-to-r from-medical-primary via-cyan-600 to-blue-600 bg-clip-text text-transparent">
                    {settings.heroTitle}
                  </span>
                </Title>
                <Paragraph className="!text-gray-600 !text-xl !mb-8 !leading-relaxed">
                  {settings.heroSubtitle}
                </Paragraph>
                <div className="flex flex-wrap gap-4">
                  <Link to="/products">
                    <Button
                      type="primary"
                      size="large"
                      className="!h-14 !px-8 !text-lg font-semibold shadow-lg hover:shadow-xl border-0 bg-gradient-to-r from-medical-primary to-cyan-500 hover:from-medical-primary/90 hover:to-cyan-500/90"
                    >
                      {settings.heroButtonText} <ArrowRightOutlined />
                    </Button>
                  </Link>
                  <Link to="/about">
                    <Button
                      size="large"
                      className="!h-14 !px-8 !text-lg font-semibold border-2 border-medical-primary text-medical-primary hover:bg-medical-primary hover:text-white"
                    >
                      Tìm hiểu thêm
                    </Button>
                  </Link>
                </div>

                {/* Trust indicators */}
                <div className="mt-12 flex flex-wrap items-center gap-8">
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <StarFilled key={i} className="text-yellow-400 text-lg" />
                      ))}
                    </div>
                    <Text className="text-gray-600 font-medium">4.9/5 từ 2,000+ đánh giá</Text>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircleFilled className="text-green-500 text-xl" />
                    <Text className="text-gray-600 font-medium">100% chính hãng</Text>
                  </div>
                </div>
              </motion.div>
            </Col>

            <Col xs={24} lg={12}>
              <motion.div
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative"
              >
                <div className="relative bg-white/40 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/20">
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="bg-gradient-to-br from-medical-primary to-cyan-600 rounded-2xl p-6 text-white text-center shadow-lg"
                      >
                        <div className="text-4xl font-bold mb-2">{settings.yearsExperience}+</div>
                        <div className="text-sm opacity-90">Năm kinh nghiệm</div>
                      </motion.div>
                    </Col>
                    <Col span={12}>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white text-center shadow-lg"
                      >
                        <div className="text-4xl font-bold mb-2">{settings.happyCustomers.toLocaleString()}+</div>
                        <div className="text-sm opacity-90">Khách hàng</div>
                      </motion.div>
                    </Col>
                    <Col span={24}>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white text-center shadow-lg"
                      >
                        <div className="text-4xl font-bold mb-2">{settings.productsCount.toLocaleString()}+</div>
                        <div className="text-sm opacity-90">Sản phẩm đa dạng</div>
                      </motion.div>
                    </Col>
                  </Row>
                </div>
              </motion.div>
            </Col>
          </Row>
        </div>
      </div>

      {/* Features Grid - Modern Cards */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Row gutter={[24, 24]}>
            {features.map((feature, index) => (
              <Col xs={24} sm={12} lg={8} key={index}>
                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8 }}
                >
                  <Card
                    className="text-center border-0 shadow-lg hover:shadow-2xl h-full"
                    styles={{ body: { padding: '40px 24px' } }}
                  >
                    <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br ${feature.gradient} text-white text-3xl mb-4 shadow-lg`}>
                      {feature.icon}
                    </div>
                    <Title level={4} className="!mb-2 !text-lg">{feature.title}</Title>
                    <Paragraph className="!text-gray-600 !mb-0">{feature.description}</Paragraph>
                  </Card>
                </motion.div>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* Categories Section - Gradient Cards */}
      <div className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Title level={2} className="!text-4xl md:!text-5xl !font-bold !mb-4">
              Danh mục sản phẩm
            </Title>
            <Paragraph className="!text-gray-600 !text-lg max-w-2xl mx-auto">
              Khám phá các danh mục thiết bị y tế chất lượng cao được phân loại theo chuyên môn
            </Paragraph>
          </motion.div>

          <Row gutter={[24, 24]}>
            {categories.map((cat, index) => (
              <Col xs={12} sm={12} md={6} key={index}>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -10, scale: 1.05 }}
                >
                  <Link to="/products">
                    <Card
                      className={`text-center border-0 shadow-xl hover:shadow-2xl overflow-hidden bg-gradient-to-br ${cat.gradient} h-full`}
                      styles={{ body: { padding: '48px 24px' } }}
                    >
                      <div className="text-6xl mb-4 filter drop-shadow-lg">{cat.icon}</div>
                      <Title level={4} className="!mb-2 !text-white">{cat.name}</Title>
                      <Text className="text-white/90 font-medium">{cat.count} sản phẩm</Text>
                    </Card>
                  </Link>
                </motion.div>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* Featured Products - Enhanced Cards */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Title level={2} className="!text-4xl md:!text-5xl !font-bold !mb-4">
              Sản phẩm nổi bật
            </Title>
            <Paragraph className="!text-gray-600 !text-lg max-w-2xl mx-auto">
              Những sản phẩm được khách hàng yêu thích và tin dùng nhất
            </Paragraph>
          </motion.div>

          <Row gutter={[24, 24]}>
            {featuredProducts.map((product, index) => (
              <Col xs={12} sm={12} md={6} key={product.id}>
                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -10 }}
                >
                  <Badge.Ribbon text={product.badge} color="red">
                    <Card
                      hoverable
                      className="border-0 shadow-lg hover:shadow-2xl overflow-hidden h-full"
                      styles={{ body: { padding: '0' } }}
                      cover={
                        <div className="bg-gradient-to-br from-blue-50 via-cyan-50 to-purple-50 h-56 flex items-center justify-center relative overflow-hidden group">
                          <div className="absolute inset-0 bg-gradient-to-br from-medical-primary/0 to-cyan-500/0 group-hover:from-medical-primary/10 group-hover:to-cyan-500/10 transition-all duration-300"></div>
                          <div className="text-9xl transform group-hover:scale-110 transition-transform duration-300">{product.image}</div>
                        </div>
                      }
                    >
                      <div className="p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <div className="flex items-center">
                            <StarFilled className="text-yellow-400 text-base" />
                            <Text className="ml-1 text-gray-600 text-sm font-medium">
                              {product.rating}
                            </Text>
                          </div>
                          <Text className="text-gray-500 text-xs">
                            {product.reviews} đánh giá
                          </Text>
                        </div>
                        <Title level={5} className="!mb-3 !text-sm !leading-tight" ellipsis={{ rows: 2 }}>
                          {product.name}
                        </Title>
                        <div className="flex items-baseline gap-2 mb-4">
                          <Text className="text-xl font-bold bg-gradient-to-r from-medical-primary to-cyan-600 bg-clip-text text-transparent">
                            {product.price}
                          </Text>
                          <Text delete className="text-gray-400 text-xs">
                            {product.oldPrice}
                          </Text>
                        </div>
                        <div className="flex gap-2">
                          <Link to={`/products/${product.id}`} className="flex-1">
                            <Button
                              type="primary"
                              block
                              icon={<ShoppingCartOutlined />}
                              className="font-semibold border-0 bg-gradient-to-r from-medical-primary to-cyan-500 hover:from-medical-primary/90 hover:to-cyan-500/90"
                            >
                              Mua ngay
                            </Button>
                          </Link>
                          <Button
                            icon={<HeartOutlined />}
                            className="hover:text-red-500 hover:border-red-500 hover:bg-red-50"
                          />
                        </div>
                      </div>
                    </Card>
                  </Badge.Ribbon>
                </motion.div>
              </Col>
            ))}
          </Row>

          <div className="text-center mt-12">
            <Link to="/products">
              <Button
                type="primary"
                size="large"
                className="!h-14 !px-10 !text-lg font-semibold shadow-lg hover:shadow-xl border-0 bg-gradient-to-r from-medical-primary to-cyan-500"
              >
                Xem tất cả sản phẩm <ArrowRightOutlined />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Title level={2} className="!text-4xl md:!text-5xl !font-bold !mb-4">
              Khách hàng nói gì về chúng tôi
            </Title>
            <Paragraph className="!text-gray-600 !text-lg max-w-2xl mx-auto">
              Hàng nghìn khách hàng hài lòng với sản phẩm và dịch vụ của chúng tôi
            </Paragraph>
          </motion.div>

          <Row gutter={[24, 24]}>
            {testimonials.map((testimonial, index) => (
              <Col xs={24} md={8} key={index}>
                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8 }}
                >
                  <Card className="border-0 shadow-lg hover:shadow-xl h-full bg-white/80 backdrop-blur-sm">
                    <div className="mb-4 flex">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <StarFilled key={i} className="text-yellow-400 text-lg" />
                      ))}
                    </div>
                    <Paragraph className="!text-gray-700 !mb-6 !leading-relaxed italic">
                      "{testimonial.content}"
                    </Paragraph>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-medical-primary to-cyan-500 flex items-center justify-center text-2xl">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <Text className="font-semibold text-gray-900 block">{testimonial.name}</Text>
                        <Text className="text-gray-500 text-sm">{testimonial.role}</Text>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* Newsletter Section - Modern Glassmorphism */}
      {settings.showNewsletter && (
        <div className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-medical-primary via-cyan-500 to-blue-500"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20"></div>

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 md:p-12 border border-white/20 shadow-2xl">
                <Title level={2} className="!text-white !text-3xl md:!text-4xl !font-bold !mb-4">
                  {settings.newsletterTitle}
                </Title>
                <Paragraph className="!text-white/90 !text-base md:!text-lg !mb-8 max-w-2xl mx-auto">
                  Nhận thông tin về sản phẩm mới, ưu đãi đặc biệt và tin tức y tế mới nhất
                </Paragraph>
                <Form
                  form={newsletterForm}
                  onFinish={handleNewsletterSubmit}
                  className="max-w-xl mx-auto"
                >
                  <Row gutter={16}>
                    <Col xs={24} sm={16}>
                      <Form.Item
                        name="email"
                        rules={[
                          { required: true, message: 'Vui lòng nhập email' },
                          { type: 'email', message: 'Email không hợp lệ' }
                        ]}
                        className="!mb-4 sm:!mb-0"
                      >
                        <Input
                          size="large"
                          placeholder="Nhập địa chỉ email của bạn"
                          className="!h-14 !rounded-xl !bg-white/90 !backdrop-blur-sm !border-0"
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Button
                        type="default"
                        size="large"
                        htmlType="submit"
                        block
                        className="!h-14 !bg-white !text-medical-primary !border-0 !rounded-xl font-bold hover:!bg-gray-100 hover:!scale-105 transition-transform shadow-lg"
                      >
                        Đăng ký
                      </Button>
                    </Col>
                  </Row>
                </Form>
                <Text className="text-white/70 text-xs mt-4 block">
                  Chúng tôi cam kết bảo mật thông tin của bạn
                </Text>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}
