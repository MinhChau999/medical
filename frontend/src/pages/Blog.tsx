import React, { useState } from 'react';
import { Table, Button, Space, Card, Input, Tag, Modal, Form, Select, message, Row, Col, Upload, DatePicker } from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined,
  EyeOutlined,
  UploadOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import type { ColumnsType } from 'antd/es/table';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface BlogPost {
  id: string;
  title: string;
  titleEn: string;
  slug: string;
  category: string;
  author: string;
  content: string;
  contentEn: string;
  excerpt: string;
  thumbnail: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  views: number;
  publishDate: string;
  createdAt: string;
  updatedAt: string;
}

const Blog: React.FC = () => {
  const { t } = useTranslation();
  const [posts, setPosts] = useState<BlogPost[]>([
    {
      id: '1',
      title: 'Hướng dẫn sử dụng máy siêu âm hiệu quả',
      titleEn: 'Guide to Using Ultrasound Machines Effectively',
      slug: 'huong-dan-su-dung-may-sieu-am',
      category: 'Hướng dẫn',
      author: 'Dr. Nguyễn Văn A',
      content: '<p>Nội dung bài viết...</p>',
      contentEn: '<p>Article content...</p>',
      excerpt: 'Máy siêu âm là thiết bị quan trọng trong chẩn đoán...',
      thumbnail: 'https://via.placeholder.com/300x200',
      tags: ['siêu âm', 'hướng dẫn', 'thiết bị y tế'],
      status: 'published',
      views: 1250,
      publishDate: '2024-01-15',
      createdAt: '2024-01-10',
      updatedAt: '2024-01-15'
    },
    {
      id: '2',
      title: 'Xu hướng công nghệ y tế 2024',
      titleEn: 'Medical Technology Trends 2024',
      slug: 'xu-huong-cong-nghe-y-te-2024',
      category: 'Tin tức',
      author: 'Admin',
      content: '<p>Nội dung bài viết...</p>',
      contentEn: '<p>Article content...</p>',
      excerpt: 'Năm 2024 hứa hẹn nhiều đột phá trong công nghệ y tế...',
      thumbnail: 'https://via.placeholder.com/300x200',
      tags: ['công nghệ', 'xu hướng', '2024'],
      status: 'published',
      views: 890,
      publishDate: '2024-01-20',
      createdAt: '2024-01-18',
      updatedAt: '2024-01-20'
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [form] = Form.useForm();
  const [content, setContent] = useState('');
  const [contentEn, setContentEn] = useState('');

  const handleAdd = () => {
    setEditingPost(null);
    form.resetFields();
    setContent('');
    setContentEn('');
    setIsModalVisible(true);
  };

  const handleEdit = (record: BlogPost) => {
    setEditingPost(record);
    form.setFieldsValue({
      ...record,
      tags: record.tags.join(', ')
    });
    setContent(record.content);
    setContentEn(record.contentEn);
    setIsModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa bài viết này?',
      onOk: () => {
        setPosts(posts.filter(post => post.id !== id));
        message.success('Xóa bài viết thành công');
      }
    });
  };

  const handleSubmit = async (values: any) => {
    const postData = {
      ...values,
      content,
      contentEn,
      tags: values.tags.split(',').map((tag: string) => tag.trim()),
      id: editingPost?.id || Date.now().toString(),
      views: editingPost?.views || 0,
      createdAt: editingPost?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (editingPost) {
      setPosts(posts.map(post => 
        post.id === editingPost.id ? postData : post
      ));
      message.success('Cập nhật bài viết thành công');
    } else {
      setPosts([...posts, postData]);
      message.success('Thêm bài viết thành công');
    }
    setIsModalVisible(false);
    form.resetFields();
  };

  const columns: ColumnsType<BlogPost> = [
    {
      title: 'Hình ảnh',
      dataIndex: 'thumbnail',
      key: 'thumbnail',
      width: 100,
      render: (thumbnail: string) => (
        <img 
          src={thumbnail} 
          alt="Thumbnail" 
          style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 4 }}
        />
      ),
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: BlogPost) => (
        <Space direction="vertical" size={0}>
          <strong>{text}</strong>
          <span style={{ fontSize: 12, color: '#999' }}>{record.excerpt}</span>
        </Space>
      ),
    },
    {
      title: 'Danh mục',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => (
        <Tag color="blue">{category}</Tag>
      ),
    },
    {
      title: 'Tác giả',
      dataIndex: 'author',
      key: 'author',
    },
    {
      title: 'Tags',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: string[]) => (
        <>
          {tags.map(tag => (
            <Tag key={tag} color="geekblue">{tag}</Tag>
          ))}
        </>
      ),
    },
    {
      title: 'Lượt xem',
      dataIndex: 'views',
      key: 'views',
      width: 100,
      align: 'center',
      render: (views: number) => (
        <span style={{ color: '#00A6B8', fontWeight: 500 }}>{views}</span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const statusConfig = {
          draft: { color: 'default', text: 'Nháp' },
          published: { color: 'success', text: 'Đã xuất bản' },
          archived: { color: 'warning', text: 'Lưu trữ' }
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Ngày đăng',
      dataIndex: 'publishDate',
      key: 'publishDate',
      width: 120,
      render: (date: string) => (
        <Space>
          <CalendarOutlined />
          {date}
        </Space>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            style={{ color: '#52c41a' }}
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            style={{ color: '#00A6B8' }}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      ),
    },
  ];

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchText.toLowerCase()) ||
    post.titleEn.toLowerCase().includes(searchText.toLowerCase()) ||
    post.excerpt.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div style={{ padding: 24 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="blog-card">
          <div style={{ padding: 20 }}>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
            <Space>
              <Input
                placeholder="Tìm kiếm bài viết..."
                prefix={<SearchOutlined />}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 300 }}
                allowClear
              />
              <Select defaultValue="all" style={{ width: 150 }}>
                <Select.Option value="all">Tất cả danh mục</Select.Option>
                <Select.Option value="news">Tin tức</Select.Option>
                <Select.Option value="guide">Hướng dẫn</Select.Option>
                <Select.Option value="tech">Công nghệ</Select.Option>
              </Select>
              <Select defaultValue="all" style={{ width: 150 }}>
                <Select.Option value="all">Tất cả trạng thái</Select.Option>
                <Select.Option value="published">Đã xuất bản</Select.Option>
                <Select.Option value="draft">Nháp</Select.Option>
                <Select.Option value="archived">Lưu trữ</Select.Option>
              </Select>
            </Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
              style={{
                background: 'linear-gradient(135deg, #00A6B8 0%, #0088A0 100%)',
                border: 'none',
              }}
            >
              Thêm bài viết
            </Button>
          </div>
          </div>

          <Table
            columns={columns}
            dataSource={filteredPosts}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} bài viết`,
            }}
            style={{ marginTop: 0 }}
          />
        </Card>

        <Modal
          title={editingPost ? 'Sửa bài viết' : 'Thêm bài viết mới'}
          open={isModalVisible}
          onCancel={() => {
            setIsModalVisible(false);
            form.resetFields();
          }}
          width={1000}
          footer={null}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="title"
                  label="Tiêu đề (Tiếng Việt)"
                  rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
                >
                  <Input placeholder="Nhập tiêu đề bài viết" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="titleEn"
                  label="Tiêu đề (Tiếng Anh)"
                  rules={[{ required: true }]}
                >
                  <Input placeholder="Enter article title" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="slug"
                  label="Slug URL"
                  rules={[{ required: true }]}
                >
                  <Input placeholder="huong-dan-su-dung" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="category"
                  label="Danh mục"
                  rules={[{ required: true }]}
                >
                  <Select placeholder="Chọn danh mục">
                    <Select.Option value="Tin tức">Tin tức</Select.Option>
                    <Select.Option value="Hướng dẫn">Hướng dẫn</Select.Option>
                    <Select.Option value="Công nghệ">Công nghệ</Select.Option>
                    <Select.Option value="Y học">Y học</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="excerpt"
              label="Mô tả ngắn"
              rules={[{ required: true }]}
            >
              <Input.TextArea rows={2} placeholder="Mô tả ngắn về bài viết..." />
            </Form.Item>

            <Form.Item label="Nội dung (Tiếng Việt)">
              <ReactQuill
                value={content}
                onChange={setContent}
                style={{ height: 200, marginBottom: 50 }}
              />
            </Form.Item>

            <Form.Item label="Nội dung (Tiếng Anh)">
              <ReactQuill
                value={contentEn}
                onChange={setContentEn}
                style={{ height: 200, marginBottom: 50 }}
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="author"
                  label="Tác giả"
                  rules={[{ required: true }]}
                >
                  <Input placeholder="Tên tác giả" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="tags"
                  label="Tags (phân cách bằng dấu phẩy)"
                >
                  <Input placeholder="tag1, tag2, tag3" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="status"
                  label="Trạng thái"
                  rules={[{ required: true }]}
                >
                  <Select placeholder="Chọn trạng thái">
                    <Select.Option value="draft">Nháp</Select.Option>
                    <Select.Option value="published">Xuất bản</Select.Option>
                    <Select.Option value="archived">Lưu trữ</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="thumbnail"
              label="Ảnh thumbnail"
            >
              <Upload
                listType="picture"
                maxCount={1}
                beforeUpload={() => false}
              >
                <Button icon={<UploadOutlined />}>Tải lên ảnh</Button>
              </Upload>
            </Form.Item>

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
                  {editingPost ? 'Cập nhật' : 'Thêm mới'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </motion.div>
    </div>
  );
};

export default Blog;