import React, { useState } from 'react';
import { Card, Form, Input, Button, Space, Row, Col, message, Switch, Alert, List, Tag, Modal } from 'antd';
import { 
  SaveOutlined, 
  EnvironmentOutlined, 
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  CopyOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

interface Location {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type: 'main' | 'branch' | 'warehouse';
  phone?: string;
  email?: string;
}

const GoogleMap: React.FC = () => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<Location[]>([
    {
      id: '1',
      name: 'Trụ sở chính',
      address: '123 Nguyễn Văn Linh, Q.7, TP.HCM',
      lat: 10.7340344,
      lng: 106.7252784,
      type: 'main',
      phone: '(028) 1234 5678',
      email: 'info@medical.com.vn'
    },
    {
      id: '2', 
      name: 'Chi nhánh Hà Nội',
      address: '456 Trần Duy Hưng, Cầu Giấy, Hà Nội',
      lat: 21.0285,
      lng: 105.8542,
      type: 'branch',
      phone: '(024) 1234 5678'
    }
  ]);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleSave = async (values: any) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('Cập nhật cài đặt Google Map thành công!');
    } catch (error) {
      message.error('Có lỗi xảy ra!');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLocation = () => {
    setEditingLocation(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditLocation = (location: Location) => {
    setEditingLocation(location);
    form.setFieldsValue(location);
    setIsModalVisible(true);
  };

  const handleDeleteLocation = (id: string) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa địa điểm này?',
      onOk: () => {
        setLocations(locations.filter(loc => loc.id !== id));
        message.success('Đã xóa địa điểm');
      }
    });
  };

  const handleLocationSubmit = (values: any) => {
    if (editingLocation) {
      setLocations(locations.map(loc => 
        loc.id === editingLocation.id ? { ...values, id: loc.id } : loc
      ));
      message.success('Cập nhật địa điểm thành công');
    } else {
      setLocations([...locations, { ...values, id: Date.now().toString() }]);
      message.success('Thêm địa điểm thành công');
    }
    setIsModalVisible(false);
    form.resetFields();
  };

  const getEmbedCode = () => {
    const mainLocation = locations.find(loc => loc.type === 'main');
    if (!mainLocation) return '';
    
    return `<iframe 
  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.650532935903!2d${mainLocation.lng}!3d${mainLocation.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTDCsDQ0JzAyLjUiTiAxMDbCsDQzJzMxLjAiRQ!5e0!3m2!1svi!2s!4v1234567890" 
  width="100%" 
  height="450" 
  style="border:0;" 
  allowfullscreen="" 
  loading="lazy" 
  referrerpolicy="no-referrer-when-downgrade">
</iframe>`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('Đã sao chép vào clipboard');
  };

  return (
    <div style={{ padding: 24 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Row gutter={24}>
          <Col span={16}>
            <Card className="googlemap-card" 
              title="Cài đặt Google Map"
              extra={
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
              }
            >
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSave}
                initialValues={{
                  apiKey: 'AIzaSyB...',
                  zoom: 15,
                  mapType: 'roadmap',
                  enableStreetView: true,
                  enableFullscreen: true,
                }}
              >
                <Alert
                  message="Hướng dẫn"
                  description={
                    <div>
                      <p>1. Đăng ký Google Maps API key tại: <a href="https://console.cloud.google.com" target="_blank">Google Cloud Console</a></p>
                      <p>2. Bật các API: Maps JavaScript API, Places API, Geocoding API</p>
                      <p>3. Thêm domain của bạn vào danh sách cho phép</p>
                    </div>
                  }
                  type="info"
                  showIcon
                  style={{ marginBottom: 24 }}
                />

                <Row gutter={24}>
                  <Col span={16}>
                    <Form.Item
                      name="apiKey"
                      label="Google Maps API Key"
                      rules={[{ required: true, message: 'Vui lòng nhập API Key' }]}
                    >
                      <Input.Password 
                        placeholder="AIzaSyB..." 
                        addonBefore={<GlobalOutlined />}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="zoom"
                      label="Mức zoom mặc định"
                      rules={[{ required: true }]}
                    >
                      <Input type="number" min={1} max={20} />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={24}>
                  <Col span={12}>
                    <Form.Item
                      name="mapType"
                      label="Loại bản đồ"
                    >
                      <select className="ant-input" style={{ width: '100%', height: 32 }}>
                        <option value="roadmap">Bản đồ đường</option>
                        <option value="satellite">Vệ tinh</option>
                        <option value="hybrid">Kết hợp</option>
                        <option value="terrain">Địa hình</option>
                      </select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="language"
                      label="Ngôn ngữ"
                    >
                      <select className="ant-input" style={{ width: '100%', height: 32 }}>
                        <option value="vi">Tiếng Việt</option>
                        <option value="en">English</option>
                      </select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={24}>
                  <Col span={6}>
                    <Form.Item
                      name="enableStreetView"
                      label="Street View"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item
                      name="enableFullscreen"
                      label="Toàn màn hình"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item
                      name="enableZoomControl"
                      label="Nút zoom"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item
                      name="enableMapTypeControl"
                      label="Chọn loại bản đồ"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="customStyles"
                  label="Custom Styles (JSON)"
                >
                  <Input.TextArea 
                    rows={4}
                    placeholder='[{"featureType": "water", "stylers": [{"color": "#00A6B8"}]}]'
                  />
                </Form.Item>
              </Form>
            </Card>

            <Card className="googlemap-card"
              title="Mã nhúng Google Map"
              style={{ marginTop: 24 }}
            >
              <div style={{ 
                background: '#f5f5f5', 
                padding: 16, 
                borderRadius: 8,
                fontFamily: 'monospace',
                fontSize: 12,
                position: 'relative'
              }}>
                <Button
                  icon={<CopyOutlined />}
                  size="small"
                  style={{ position: 'absolute', top: 8, right: 8 }}
                  onClick={() => copyToClipboard(getEmbedCode())}
                >
                  Sao chép
                </Button>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                  {getEmbedCode()}
                </pre>
              </div>

              <Alert
                message="Sử dụng mã nhúng"
                description="Sao chép đoạn mã trên và dán vào vị trí muốn hiển thị bản đồ trên website"
                type="success"
                showIcon
                style={{ marginTop: 16 }}
              />
            </Card>
          </Col>

          <Col span={8}>
            <Card className="googlemap-card" 
              title="Địa điểm"
              extra={
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  size="small"
                  onClick={handleAddLocation}
                >
                  Thêm
                </Button>
              }
            >
              <List
                dataSource={locations}
                renderItem={(location) => (
                  <List.Item
                    actions={[
                      <Button 
                        type="text" 
                        icon={<EditOutlined />}
                        onClick={() => handleEditLocation(location)}
                      />,
                      <Button 
                        type="text" 
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteLocation(location.id)}
                      />
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<EnvironmentOutlined style={{ fontSize: 20, color: '#00A6B8' }} />}
                      title={
                        <Space>
                          {location.name}
                          <Tag color={
                            location.type === 'main' ? 'green' : 
                            location.type === 'branch' ? 'blue' : 'orange'
                          }>
                            {location.type === 'main' ? 'Trụ sở' : 
                             location.type === 'branch' ? 'Chi nhánh' : 'Kho'}
                          </Tag>
                        </Space>
                      }
                      description={
                        <div>
                          <div>{location.address}</div>
                          <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                            Lat: {location.lat}, Lng: {location.lng}
                          </div>
                          {location.phone && <div style={{ fontSize: 12 }}>📞 {location.phone}</div>}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>

            <Card className="googlemap-card" title="Xem trước" style={{ marginTop: 24 }}>
              <div style={{ 
                height: 300, 
                background: '#f0f0f0', 
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999'
              }}>
                <Space direction="vertical" align="center">
                  <EnvironmentOutlined style={{ fontSize: 48 }} />
                  <span>Bản đồ sẽ hiển thị ở đây</span>
                </Space>
              </div>
            </Card>
          </Col>
        </Row>

        <Modal
          title={editingLocation ? 'Sửa địa điểm' : 'Thêm địa điểm'}
          open={isModalVisible}
          onCancel={() => {
            setIsModalVisible(false);
            form.resetFields();
          }}
          footer={null}
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleLocationSubmit}
          >
            <Form.Item
              name="name"
              label="Tên địa điểm"
              rules={[{ required: true }]}
            >
              <Input placeholder="VD: Trụ sở chính" />
            </Form.Item>

            <Form.Item
              name="address"
              label="Địa chỉ"
              rules={[{ required: true }]}
            >
              <Input placeholder="123 Nguyễn Văn Linh, Q.7, TP.HCM" />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="lat"
                  label="Vĩ độ (Latitude)"
                  rules={[{ required: true }]}
                >
                  <Input type="number" step="0.000001" placeholder="10.7340344" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="lng"
                  label="Kinh độ (Longitude)"
                  rules={[{ required: true }]}
                >
                  <Input type="number" step="0.000001" placeholder="106.7252784" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="type"
              label="Loại địa điểm"
              rules={[{ required: true }]}
            >
              <select className="ant-input" style={{ width: '100%', height: 32 }}>
                <option value="main">Trụ sở chính</option>
                <option value="branch">Chi nhánh</option>
                <option value="warehouse">Kho hàng</option>
              </select>
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="phone"
                  label="Điện thoại"
                >
                  <Input placeholder="(028) 1234 5678" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="email"
                  label="Email"
                >
                  <Input placeholder="info@medical.com.vn" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Space>
                <Button onClick={() => {
                  setIsModalVisible(false);
                  form.resetFields();
                }}>
                  Hủy
                </Button>
                <Button 
                  type="primary" 
                  htmlType="submit"
                  style={{
                    background: 'linear-gradient(135deg, #00A6B8 0%, #0088A0 100%)',
                    border: 'none',
                  }}
                >
                  {editingLocation ? 'Cập nhật' : 'Thêm mới'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </motion.div>
    </div>
  );
};

export default GoogleMap;