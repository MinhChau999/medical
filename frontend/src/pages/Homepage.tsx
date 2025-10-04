import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Space, Row, Col, Upload, message, Tabs, Switch, Divider } from 'antd';
import { UploadOutlined, SaveOutlined, EyeOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import type { UploadFile } from 'antd/es/upload/interface';
import homepageService, { HomepageSettings } from '@/services/homepage';

const { TextArea } = Input;

const Homepage: React.FC = () => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [heroImages, setHeroImages] = useState<UploadFile[]>([]);
  const [features, setFeatures] = useState<Array<{
    id: number;
    icon: string;
    title: string;
    description: string;
  }>>([
    { id: 1, icon: '🔬', title: 'Thiết bị chẩn đoán', description: 'Công nghệ tiên tiến' },
    { id: 2, icon: '⚕️', title: 'Dụng cụ phẫu thuật', description: 'Chất lượng cao' },
    { id: 3, icon: '💊', title: 'Vật tư y tế', description: 'Đa dạng sản phẩm' },
  ]);

  // Fetch homepage settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setFetchLoading(true);
      const settings = await homepageService.getSettings();

      // Set form values
      form.setFieldsValue({
        heroTitle: settings.heroTitle,
        heroSubtitle: settings.heroSubtitle,
        heroButtonText: settings.heroButtonText,
        heroButtonLink: settings.heroButtonLink,
        aboutTitle: settings.aboutTitle,
        aboutContent: settings.aboutContent,
        yearsExperience: settings.yearsExperience,
        happyCustomers: settings.happyCustomers,
        productsCount: settings.productsCount,
        metaTitle: settings.metaTitle,
        metaDescription: settings.metaDescription,
        metaKeywords: settings.metaKeywords,
        showPromoBanner: settings.showPromoBanner,
        promoBannerText: settings.promoBannerText,
        showNewsletter: settings.showNewsletter,
        newsletterTitle: settings.newsletterTitle,
        primaryColor: settings.primaryColor,
        secondaryColor: settings.secondaryColor,
      });

      // Set features
      if (settings.features && Array.isArray(settings.features)) {
        setFeatures(settings.features as any);
      }

      // Set hero images
      if (settings.heroImages && Array.isArray(settings.heroImages)) {
        setHeroImages(
          settings.heroImages.map((url, index) => ({
            uid: `${index}`,
            name: `image-${index}`,
            status: 'done',
            url,
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching homepage settings:', error);
      message.error('Không thể tải cài đặt trang chủ');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSave = async (values: any) => {
    setLoading(true);
    try {
      const updateData: Partial<HomepageSettings> = {
        ...values,
        features,
        heroImages: heroImages.map(file => file.url || file.response?.url || '').filter(Boolean),
      };

      await homepageService.updateSettings(updateData);
      message.success('Cập nhật trang chủ thành công!');
    } catch (error) {
      console.error('Error updating homepage settings:', error);
      message.error('Có lỗi xảy ra khi cập nhật!');
    } finally {
      setLoading(false);
    }
  };

  const addFeature = () => {
    setFeatures([...features, {
      id: Date.now(),
      icon: '🏥',
      title: '',
      description: ''
    }]);
  };

  const removeFeature = (id: number) => {
    setFeatures(features.filter(f => f.id !== id));
  };

  const updateFeature = (id: number, field: string, value: string) => {
    setFeatures(features.map(f =>
      f.id === id ? { ...f, [field]: value } : f
    ));
  };

  const handlePreview = () => {
    window.open('/', '_blank');
  };

  const handleImageUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;

    try {
      // Upload to server
      const urls = await homepageService.uploadHeroImages([file]);

      if (urls && urls.length > 0) {
        onSuccess({ url: urls[0] }, file);
        message.success('Tải ảnh lên thành công!');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      onError(error);
      message.error('Lỗi khi tải ảnh lên!');
    }
  };

  if (fetchLoading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Card loading={true}>Đang tải...</Card>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card
          className="homepage-card"
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Quản lý Trang chủ</span>
              <Space>
                <Button icon={<EyeOutlined />} onClick={handlePreview}>
                  Xem trước
                </Button>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  loading={loading}
                  onClick={() => form.submit()}
                  style={{
                    background: 'linear-gradient(135deg, #00A6B8 0%, #0088A0 100%)',
                    border: 'none',
                  }}
                >
                  Lưu thay đổi
                </Button>
              </Space>
            </div>
          }
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
          >
            <Tabs defaultActiveKey="1">
              <Tabs.TabPane tab="Hero Section" key="1">
                <Row gutter={24}>
                  <Col span={12}>
                    <Form.Item
                      name="heroTitle"
                      label="Tiêu đề chính"
                      rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
                    >
                      <Input placeholder="Nhập tiêu đề chính" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="heroSubtitle"
                      label="Tiêu đề phụ"
                    >
                      <Input placeholder="Nhập tiêu đề phụ" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={24}>
                  <Col span={12}>
                    <Form.Item
                      name="heroButtonText"
                      label="Text nút CTA"
                    >
                      <Input placeholder="VD: Khám phá ngay" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="heroButtonLink"
                      label="Link nút CTA"
                    >
                      <Input placeholder="/products" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item label="Hình ảnh Banner">
                  <Upload
                    listType="picture-card"
                    fileList={heroImages}
                    onChange={({ fileList }) => setHeroImages(fileList)}
                    customRequest={handleImageUpload}
                  >
                    {heroImages.length < 3 && (
                      <div>
                        <UploadOutlined />
                        <div style={{ marginTop: 8 }}>Tải lên</div>
                      </div>
                    )}
                  </Upload>
                  <div style={{ color: '#999', fontSize: 12, marginTop: 8 }}>
                    Khuyến nghị: 1920x600px, tối đa 3 ảnh cho slideshow
                  </div>
                </Form.Item>
              </Tabs.TabPane>

              <Tabs.TabPane tab="Tính năng nổi bật" key="2">
                <div style={{ marginBottom: 16 }}>
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={addFeature}
                    style={{ width: '100%' }}
                  >
                    Thêm tính năng
                  </Button>
                </div>

                {features.map((feature) => (
                  <Card
                    key={feature.id}
                    size="small"
                    style={{ marginBottom: 16 }}
                    extra={
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeFeature(feature.id)}
                      />
                    }
                  >
                    <Row gutter={16}>
                      <Col span={4}>
                        <Input
                          value={feature.icon}
                          onChange={(e) => updateFeature(feature.id, 'icon', e.target.value)}
                          placeholder="Icon"
                          style={{ textAlign: 'center', fontSize: 24 }}
                        />
                      </Col>
                      <Col span={10}>
                        <Input
                          value={feature.title}
                          onChange={(e) => updateFeature(feature.id, 'title', e.target.value)}
                          placeholder="Tiêu đề tính năng"
                        />
                      </Col>
                      <Col span={10}>
                        <Input
                          value={feature.description}
                          onChange={(e) => updateFeature(feature.id, 'description', e.target.value)}
                          placeholder="Mô tả ngắn"
                        />
                      </Col>
                    </Row>
                  </Card>
                ))}
              </Tabs.TabPane>

              <Tabs.TabPane tab="Về chúng tôi" key="3">
                <Form.Item
                  name="aboutTitle"
                  label="Tiêu đề mục"
                >
                  <Input placeholder="Về chúng tôi" />
                </Form.Item>

                <Form.Item
                  name="aboutContent"
                  label="Nội dung"
                >
                  <TextArea
                    rows={6}
                    placeholder="Nhập nội dung giới thiệu..."
                  />
                </Form.Item>

                <Row gutter={24}>
                  <Col span={8}>
                    <Form.Item
                      name="yearsExperience"
                      label="Số năm kinh nghiệm"
                    >
                      <Input type="number" placeholder="10" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="happyCustomers"
                      label="Khách hàng hài lòng"
                    >
                      <Input type="number" placeholder="5000" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="productsCount"
                      label="Số sản phẩm"
                    >
                      <Input type="number" placeholder="1000" />
                    </Form.Item>
                  </Col>
                </Row>
              </Tabs.TabPane>

              <Tabs.TabPane tab="SEO & Meta Tags" key="4">
                <Form.Item
                  name="metaTitle"
                  label="Meta Title"
                  rules={[{ max: 60, message: 'Tối đa 60 ký tự' }]}
                >
                  <Input placeholder="Medical Electronics - Thiết bị Y tế" />
                </Form.Item>

                <Form.Item
                  name="metaDescription"
                  label="Meta Description"
                  rules={[{ max: 160, message: 'Tối đa 160 ký tự' }]}
                >
                  <TextArea
                    rows={3}
                    placeholder="Nhà cung cấp thiết bị y tế chất lượng cao..."
                    showCount
                    maxLength={160}
                  />
                </Form.Item>

                <Form.Item
                  name="metaKeywords"
                  label="Meta Keywords"
                >
                  <Input placeholder="thiết bị y tế, medical equipment, máy siêu âm..." />
                </Form.Item>

                <Divider />

                <Form.Item
                  name="ogImageUrl"
                  label="Open Graph Image URL"
                >
                  <Input placeholder="https://example.com/og-image.jpg" />
                </Form.Item>
                <div style={{ color: '#999', fontSize: 12, marginTop: -16, marginBottom: 16 }}>
                  Khuyến nghị: 1200x630px
                </div>
              </Tabs.TabPane>

              <Tabs.TabPane tab="Cài đặt khác" key="5">
                <Row gutter={24}>
                  <Col span={12}>
                    <Form.Item
                      name="showPromoBanner"
                      label="Hiển thị banner khuyến mãi"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>

                    <Form.Item
                      name="promoBannerText"
                      label="Nội dung banner khuyến mãi"
                    >
                      <Input placeholder="Giảm giá 20% cho đơn hàng đầu tiên!" />
                    </Form.Item>
                  </Col>

                  <Col span={12}>
                    <Form.Item
                      name="showNewsletter"
                      label="Hiển thị form đăng ký nhận tin"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>

                    <Form.Item
                      name="newsletterTitle"
                      label="Tiêu đề form nhận tin"
                    >
                      <Input placeholder="Đăng ký nhận thông tin mới nhất" />
                    </Form.Item>
                  </Col>
                </Row>

                <Divider />

                <Row gutter={24}>
                  <Col span={12}>
                    <Form.Item
                      name="primaryColor"
                      label="Màu chủ đạo"
                    >
                      <Input defaultValue="#00A6B8" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="secondaryColor"
                      label="Màu phụ"
                    >
                      <Input defaultValue="#0088A0" />
                    </Form.Item>
                  </Col>
                </Row>
              </Tabs.TabPane>
            </Tabs>
          </Form>
        </Card>
      </motion.div>
    </div>
  );
};

export default Homepage;
