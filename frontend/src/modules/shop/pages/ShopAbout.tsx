import { Card, Row, Col, Typography, Timeline, Statistic, Breadcrumb } from 'antd';
import {
  HomeOutlined,
  TrophyOutlined,
  TeamOutlined,
  SafetyOutlined,
  RocketOutlined,
  HeartOutlined,
  CheckCircleOutlined,
  CustomerServiceOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Title, Paragraph, Text } = Typography;

export default function ShopAbout() {
  const features = [
    {
      icon: <SafetyOutlined className="text-4xl text-medical-primary" />,
      title: 'Chất lượng đảm bảo',
      description: 'Sản phẩm chính hãng 100%, được kiểm định đầy đủ theo tiêu chuẩn y tế Việt Nam và quốc tế'
    },
    {
      icon: <CustomerServiceOutlined className="text-4xl text-medical-primary" />,
      title: 'Hỗ trợ 24/7',
      description: 'Đội ngũ tư vấn chuyên nghiệp sẵn sàng hỗ trợ bạn mọi lúc, mọi nơi'
    },
    {
      icon: <TrophyOutlined className="text-4xl text-medical-primary" />,
      title: 'Giá cả cạnh tranh',
      description: 'Cam kết giá tốt nhất thị trường với nhiều ưu đãi hấp dẫn'
    },
    {
      icon: <RocketOutlined className="text-4xl text-medical-primary" />,
      title: 'Giao hàng nhanh',
      description: 'Giao hàng toàn quốc, nhanh chóng trong vòng 24-48h'
    }
  ];

  const timeline = [
    {
      year: '2014',
      title: 'Thành lập công ty',
      description: 'Medical Electronics được thành lập với sứ mệnh mang thiết bị y tế chất lượng cao đến người Việt'
    },
    {
      year: '2016',
      title: 'Mở rộng quy mô',
      description: 'Mở thêm 5 chi nhánh tại các thành phố lớn: Hà Nội, Đà Nẵng, Cần Thơ'
    },
    {
      year: '2018',
      title: 'Chứng nhận ISO',
      description: 'Đạt chứng nhận ISO 13485:2016 về hệ thống quản lý chất lượng thiết bị y tế'
    },
    {
      year: '2020',
      title: 'Đối tác chiến lược',
      description: 'Trở thành đối tác phân phối của các thương hiệu y tế hàng đầu thế giới'
    },
    {
      year: '2023',
      title: 'Phát triển công nghệ',
      description: 'Ra mắt nền tảng thương mại điện tử và ứng dụng mobile'
    }
  ];

  const stats = [
    { title: 'Năm kinh nghiệm', value: 10, suffix: '+', icon: <TrophyOutlined /> },
    { title: 'Khách hàng tin tưởng', value: 50000, suffix: '+', icon: <TeamOutlined /> },
    { title: 'Sản phẩm chất lượng', value: 1000, suffix: '+', icon: <SafetyOutlined /> },
    { title: 'Chi nhánh toàn quốc', value: 15, suffix: '+', icon: <HomeOutlined /> }
  ];

  const values = [
    {
      icon: <HeartOutlined className="text-3xl text-red-500" />,
      title: 'Tận tâm',
      description: 'Đặt sức khỏe và sự hài lòng của khách hàng lên hàng đầu'
    },
    {
      icon: <CheckCircleOutlined className="text-3xl text-green-500" />,
      title: 'Chất lượng',
      description: 'Cam kết cung cấp sản phẩm và dịch vụ chất lượng cao nhất'
    },
    {
      icon: <SafetyOutlined className="text-3xl text-blue-500" />,
      title: 'An toàn',
      description: 'Tuân thủ nghiêm ngặt các tiêu chuẩn an toàn y tế'
    },
    {
      icon: <RocketOutlined className="text-3xl text-purple-500" />,
      title: 'Đổi mới',
      description: 'Không ngừng cải tiến và phát triển công nghệ mới'
    }
  ];

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
            <Breadcrumb.Item>Giới thiệu</Breadcrumb.Item>
          </Breadcrumb>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <Title level={1} className="!mb-4">
            Về Medical Electronics
          </Title>
          <Paragraph className="text-lg text-gray-600 max-w-3xl mx-auto">
            Chúng tôi là đơn vị tiên phong trong lĩnh vực cung cấp thiết bị y tế chất lượng cao tại Việt Nam,
            với hơn 10 năm kinh nghiệm phục vụ hàng chục nghìn khách hàng trên toàn quốc.
          </Paragraph>
        </div>

        {/* Stats */}
        <Row gutter={[16, 16]} className="mb-12">
          {stats.map((stat, index) => (
            <Col xs={12} sm={12} md={6} key={index}>
              <Card className="text-center h-full">
                <div className="text-3xl text-medical-primary mb-3">{stat.icon}</div>
                <Statistic
                  title={stat.title}
                  value={stat.value}
                  suffix={stat.suffix}
                  valueStyle={{ color: '#00A6B8', fontWeight: 'bold' }}
                />
              </Card>
            </Col>
          ))}
        </Row>

        {/* Mission & Vision */}
        <Row gutter={[24, 24]} className="mb-12">
          <Col xs={24} md={12}>
            <Card className="h-full" title={<Title level={3} className="!mb-0">Sứ mệnh</Title>}>
              <Paragraph className="text-base">
                Mang đến những thiết bị y tế chất lượng cao, an toàn và hiệu quả nhất cho người Việt Nam.
                Góp phần nâng cao chất lượng chăm sóc sức khỏe cộng đồng thông qua việc cung cấp các giải pháp
                y tế tiên tiến và dễ tiếp cận.
              </Paragraph>
              <Paragraph className="text-base !mb-0">
                Chúng tôi cam kết đồng hành cùng các cơ sở y tế, bác sĩ và người dân trong việc bảo vệ và
                nâng cao sức khỏe của mọi người.
              </Paragraph>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card className="h-full" title={<Title level={3} className="!mb-0">Tầm nhìn</Title>}>
              <Paragraph className="text-base">
                Trở thành nhà cung cấp thiết bị y tế hàng đầu Việt Nam, được khách hàng tin tưởng và lựa chọn
                nhờ chất lượng sản phẩm vượt trội và dịch vụ chăm sóc khách hàng tận tâm.
              </Paragraph>
              <Paragraph className="text-base !mb-0">
                Hướng tới mục tiêu mở rộng mạng lưới phân phối trên toàn quốc và phát triển các giải pháp
                công nghệ y tế thông minh, góp phần hiện đại hóa ngành y tế Việt Nam.
              </Paragraph>
            </Card>
          </Col>
        </Row>

        {/* Core Values */}
        <Card className="mb-12" title={<Title level={3} className="!mb-0">Giá trị cốt lõi</Title>}>
          <Row gutter={[24, 24]}>
            {values.map((value, index) => (
              <Col xs={24} sm={12} md={6} key={index}>
                <div className="text-center">
                  <div className="mb-3">{value.icon}</div>
                  <Title level={4} className="!mb-2">{value.title}</Title>
                  <Text className="text-gray-600">{value.description}</Text>
                </div>
              </Col>
            ))}
          </Row>
        </Card>

        {/* Features */}
        <Card className="mb-12" title={<Title level={3} className="!mb-0">Tại sao chọn chúng tôi</Title>}>
          <Row gutter={[24, 24]}>
            {features.map((feature, index) => (
              <Col xs={24} sm={12} md={6} key={index}>
                <div className="text-center">
                  <div className="mb-4">{feature.icon}</div>
                  <Title level={4} className="!mb-2">{feature.title}</Title>
                  <Paragraph className="text-gray-600 !mb-0">{feature.description}</Paragraph>
                </div>
              </Col>
            ))}
          </Row>
        </Card>

        {/* Timeline */}
        <Card title={<Title level={3} className="!mb-0">Hành trình phát triển</Title>}>
          <Timeline
            mode="alternate"
            items={timeline.map(item => ({
              children: (
                <div>
                  <Title level={4} className="!mb-2 text-medical-primary">{item.year}</Title>
                  <Title level={5} className="!mb-2">{item.title}</Title>
                  <Text className="text-gray-600">{item.description}</Text>
                </div>
              ),
              color: '#00A6B8'
            }))}
          />
        </Card>

        {/* CTA Section */}
        <div className="mt-12 text-center bg-gradient-to-r from-medical-primary to-medical-accent rounded-lg p-12">
          <Title level={2} className="!text-white !mb-4">
            Sẵn sàng đồng hành cùng bạn
          </Title>
          <Paragraph className="text-white text-lg !mb-6">
            Hãy để chúng tôi giúp bạn chăm sóc sức khỏe tốt hơn mỗi ngày
          </Paragraph>
          <Link to="/products">
            <button className="bg-white text-medical-primary px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all">
              Khám phá sản phẩm
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
