import React, { useState } from 'react';
import { Card, Form, Input, Button, Space, Row, Col, message, Tabs, Switch, Divider, Table, Tag, Modal } from 'antd';
import { 
  SaveOutlined, 
  PhoneOutlined, 
  MailOutlined, 
  EnvironmentOutlined,
  ClockCircleOutlined,
  FacebookOutlined,
  YoutubeOutlined,
  LinkedinOutlined,
  InstagramOutlined,
  WhatsAppOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import type { ColumnsType } from 'antd/es/table';

const { TextArea } = Input;

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  createdAt: string;
}

const Contact: React.FC = () => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ContactMessage[]>([
    {
      id: '1',
      name: 'Nguyễn Văn A',
      email: 'nguyenvana@gmail.com',
      phone: '0901234567',
      subject: 'Hỏi về máy siêu âm',
      message: 'Tôi muốn tìm hiểu về máy siêu âm model XYZ...',
      status: 'new',
      createdAt: '2024-01-20 10:30'
    },
    {
      id: '2',
      name: 'Trần Thị B',
      email: 'tranthib@gmail.com',
      phone: '0912345678',
      subject: 'Báo giá thiết bị',
      message: 'Xin báo giá cho các thiết bị phẫu thuật...',
      status: 'read',
      createdAt: '2024-01-19 14:20'
    }
  ]);

  const handleSave = async (values: any) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('Cập nhật thông tin liên hệ thành công!');
    } catch (error) {
      message.error('Có lỗi xảy ra!');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = (record: ContactMessage) => {
    Modal.info({
      title: 'Trả lời tin nhắn',
      content: (
        <div>
          <p><strong>Từ:</strong> {record.name} ({record.email})</p>
          <p><strong>Chủ đề:</strong> {record.subject}</p>
          <p><strong>Tin nhắn:</strong> {record.message}</p>
          <Divider />
          <TextArea rows={4} placeholder="Nhập câu trả lời..." />
        </div>
      ),
      width: 600,
      okText: 'Gửi',
      onOk: () => {
        setMessages(messages.map(msg => 
          msg.id === record.id ? { ...msg, status: 'replied' } : msg
        ));
        message.success('Đã gửi câu trả lời!');
      }
    });
  };

  const handleDelete = (id: string) => {
    setMessages(messages.filter(msg => msg.id !== id));
    message.success('Đã xóa tin nhắn');
  };

  const columns: ColumnsType<ContactMessage> = [
    {
      title: 'Họ tên',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email: string) => (
        <a href={`mailto:${email}`}>{email}</a>
      ),
    },
    {
      title: 'Điện thoại',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Chủ đề',
      dataIndex: 'subject',
      key: 'subject',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusConfig = {
          new: { color: 'red', text: 'Mới' },
          read: { color: 'blue', text: 'Đã đọc' },
          replied: { color: 'green', text: 'Đã trả lời' }
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            size="small" 
            type="primary"
            onClick={() => handleReply(record)}
          >
            Trả lời
          </Button>
          <Button 
            size="small" 
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="contact-card" 
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Quản lý Liên hệ</span>
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
            </div>
          }
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
            initialValues={{
              companyName: 'Medical Electronics Co., Ltd',
              companyNameEn: 'Medical Electronics Co., Ltd',
              address: '123 Nguyễn Văn Linh, Q.7, TP.HCM',
              phone: '(028) 1234 5678',
              hotline: '1900 1234',
              email: 'info@medical.com.vn',
              workingHours: 'Thứ 2 - Thứ 6: 8:00 - 17:00',
              facebook: 'https://facebook.com/medicalelectronics',
              youtube: 'https://youtube.com/medicalelectronics',
            }}
          >
            <Tabs defaultActiveKey="1">
              <Tabs.TabPane tab="Thông tin công ty" key="1">
                <Row gutter={24}>
                  <Col span={12}>
                    <Form.Item
                      name="companyName"
                      label="Tên công ty (Tiếng Việt)"
                      rules={[{ required: true }]}
                    >
                      <Input placeholder="Nhập tên công ty" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="companyNameEn"
                      label="Tên công ty (Tiếng Anh)"
                      rules={[{ required: true }]}
                    >
                      <Input placeholder="Enter company name" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="address"
                  label="Địa chỉ"
                  rules={[{ required: true }]}
                >
                  <Input 
                    prefix={<EnvironmentOutlined />}
                    placeholder="Nhập địa chỉ công ty" 
                  />
                </Form.Item>

                <Row gutter={24}>
                  <Col span={8}>
                    <Form.Item
                      name="phone"
                      label="Điện thoại"
                      rules={[{ required: true }]}
                    >
                      <Input 
                        prefix={<PhoneOutlined />}
                        placeholder="(028) 1234 5678" 
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="hotline"
                      label="Hotline"
                    >
                      <Input 
                        prefix={<PhoneOutlined />}
                        placeholder="1900 1234" 
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="email"
                      label="Email"
                      rules={[{ required: true, type: 'email' }]}
                    >
                      <Input 
                        prefix={<MailOutlined />}
                        placeholder="info@medical.com.vn" 
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="workingHours"
                  label="Giờ làm việc"
                >
                  <Input 
                    prefix={<ClockCircleOutlined />}
                    placeholder="Thứ 2 - Thứ 6: 8:00 - 17:00" 
                  />
                </Form.Item>

                <Divider />

                <Form.Item
                  name="aboutUs"
                  label="Giới thiệu ngắn"
                >
                  <TextArea 
                    rows={4}
                    placeholder="Nhập mô tả ngắn về công ty..."
                  />
                </Form.Item>
              </Tabs.TabPane>

              <Tabs.TabPane tab="Mạng xã hội" key="2">
                <Row gutter={24}>
                  <Col span={12}>
                    <Form.Item
                      name="facebook"
                      label={
                        <Space>
                          <FacebookOutlined style={{ color: '#1877f2' }} />
                          Facebook
                        </Space>
                      }
                    >
                      <Input placeholder="https://facebook.com/..." />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="youtube"
                      label={
                        <Space>
                          <YoutubeOutlined style={{ color: '#ff0000' }} />
                          YouTube
                        </Space>
                      }
                    >
                      <Input placeholder="https://youtube.com/..." />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={24}>
                  <Col span={12}>
                    <Form.Item
                      name="linkedin"
                      label={
                        <Space>
                          <LinkedinOutlined style={{ color: '#0077b5' }} />
                          LinkedIn
                        </Space>
                      }
                    >
                      <Input placeholder="https://linkedin.com/..." />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="instagram"
                      label={
                        <Space>
                          <InstagramOutlined style={{ color: '#e4405f' }} />
                          Instagram
                        </Space>
                      }
                    >
                      <Input placeholder="https://instagram.com/..." />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={24}>
                  <Col span={12}>
                    <Form.Item
                      name="zalo"
                      label="Zalo"
                    >
                      <Input placeholder="Số Zalo hoặc link Zalo OA" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="whatsapp"
                      label={
                        <Space>
                          <WhatsAppOutlined style={{ color: '#25d366' }} />
                          WhatsApp
                        </Space>
                      }
                    >
                      <Input placeholder="+84 901 234 567" />
                    </Form.Item>
                  </Col>
                </Row>
              </Tabs.TabPane>

              <Tabs.TabPane tab="Chi nhánh" key="3">
                <Card size="small" style={{ marginBottom: 16 }}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <h4>Chi nhánh Hà Nội</h4>
                      <p><EnvironmentOutlined /> 456 Trần Duy Hưng, Cầu Giấy, Hà Nội</p>
                      <p><PhoneOutlined /> (024) 1234 5678</p>
                      <p><MailOutlined /> hanoi@medical.com.vn</p>
                    </Col>
                    <Col span={12}>
                      <h4>Chi nhánh Đà Nẵng</h4>
                      <p><EnvironmentOutlined /> 789 Nguyễn Văn Linh, Hải Châu, Đà Nẵng</p>
                      <p><PhoneOutlined /> (0236) 1234 5678</p>
                      <p><MailOutlined /> danang@medical.com.vn</p>
                    </Col>
                  </Row>
                </Card>
                <Button type="dashed" style={{ width: '100%' }}>
                  + Thêm chi nhánh
                </Button>
              </Tabs.TabPane>

              <Tabs.TabPane tab="Form liên hệ" key="4">
                <Row gutter={24}>
                  <Col span={12}>
                    <Form.Item
                      name="enableContactForm"
                      label="Bật form liên hệ"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="emailReceiver"
                      label="Email nhận thông báo"
                    >
                      <Input placeholder="admin@medical.com.vn" />
                    </Form.Item>
                  </Col>
                </Row>

                <Divider />

                <h3>Tin nhắn từ khách hàng ({messages.length})</h3>
                <Table
                  columns={columns}
                  dataSource={messages}
                  rowKey="id"
                  size="small"
                  pagination={{ pageSize: 5 }}
                />
              </Tabs.TabPane>
            </Tabs>
          </Form>
        </Card>
      </motion.div>
    </div>
  );
};

export default Contact;