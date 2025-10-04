import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Input,
  Tag,
  Pagination,
  Empty,
  Spin,
  Breadcrumb,
  Typography,
  Space,
  Button
} from 'antd';
import {
  SearchOutlined,
  CalendarOutlined,
  EyeOutlined,
  UserOutlined,
  HomeOutlined,
  FolderOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { blogService, type BlogPost } from '@/services/blog';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

export default function ShopBlog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<{ category: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const pageSize = 9;

  useEffect(() => {
    fetchData();
  }, [searchText, selectedCategory, currentPage]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await blogService.getPosts({
        search: searchText || undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        status: 'published',
        page: currentPage,
        limit: pageSize,
        sortBy: 'published_at',
        sortOrder: 'desc'
      });

      setPosts(response.data);
      setTotalPosts(response.total);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await blogService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const formatDate = (date: string) => {
    return dayjs(date).format('DD/MM/YYYY');
  };

  const stripHtml = (html: string) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

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
            <Breadcrumb.Item>Bài viết</Breadcrumb.Item>
          </Breadcrumb>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Row gutter={24}>
          {/* Sidebar */}
          <Col xs={24} lg={6}>
            <Card className="mb-6">
              <Title level={5} className="!mb-4">
                <SearchOutlined /> Tìm kiếm
              </Title>
              <Input
                placeholder="Tìm bài viết..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Card>

            <Card>
              <Title level={5} className="!mb-4">
                <FolderOutlined /> Danh mục
              </Title>
              <div className="space-y-2">
                <Button
                  block
                  type={selectedCategory === 'all' ? 'primary' : 'default'}
                  onClick={() => setSelectedCategory('all')}
                  className="text-left flex justify-between items-center"
                >
                  <span>Tất cả</span>
                  <span className="text-gray-500">{posts.length}</span>
                </Button>
                {categories.map((cat) => (
                  <Button
                    key={cat.category}
                    block
                    type={selectedCategory === cat.category ? 'primary' : 'default'}
                    onClick={() => setSelectedCategory(cat.category)}
                    className="text-left flex justify-between items-center"
                  >
                    <span>{cat.category}</span>
                    <span className="text-gray-500">{cat.count}</span>
                  </Button>
                ))}
              </div>
            </Card>
          </Col>

          {/* Main Content */}
          <Col xs={24} lg={18}>
            {loading ? (
              <div className="text-center py-20">
                <Spin size="large" />
              </div>
            ) : posts.length === 0 ? (
              <Empty description="Không có bài viết" className="py-20" />
            ) : (
              <>
                <Row gutter={[16, 16]}>
                  {posts.map((post) => (
                    <Col xs={24} sm={12} lg={8} key={post.id}>
                      <Card
                        hoverable
                        className="h-full"
                        styles={{ body: { padding: '16px' } }}
                        cover={
                          post.featuredImage ? (
                            <Link to={`/blog/${post.slug}`}>
                              <img
                                alt={post.title}
                                src={post.featuredImage}
                                className="h-48 w-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSIjY2NjIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';
                                }}
                              />
                            </Link>
                          ) : (
                            <div className="h-48 bg-gradient-to-br from-medical-primary to-medical-accent flex items-center justify-center">
                              <FolderOutlined className="text-6xl text-white opacity-50" />
                            </div>
                          )
                        }
                      >
                        {post.category && (
                          <Tag color="blue" className="!mb-2">
                            {post.category}
                          </Tag>
                        )}

                        <Link to={`/blog/${post.slug}`}>
                          <Title level={5} className="!mb-2" ellipsis={{ rows: 2 }}>
                            {post.title}
                          </Title>
                        </Link>

                        <Paragraph
                          className="text-gray-600 text-sm !mb-3"
                          ellipsis={{ rows: 3 }}
                        >
                          {post.excerpt || stripHtml(post.content).substring(0, 150) + '...'}
                        </Paragraph>

                        <Space className="w-full justify-between text-xs text-gray-500">
                          <Space size="small">
                            <CalendarOutlined />
                            {post.publishedAt && formatDate(post.publishedAt)}
                          </Space>
                          <Space size="small">
                            <EyeOutlined />
                            {post.views || 0}
                          </Space>
                        </Space>
                      </Card>
                    </Col>
                  ))}
                </Row>

                {totalPosts > pageSize && (
                  <div className="mt-6 flex justify-center">
                    <Pagination
                      current={currentPage}
                      pageSize={pageSize}
                      total={totalPosts}
                      onChange={setCurrentPage}
                      showSizeChanger={false}
                      showTotal={(total) => `Tổng ${total} bài viết`}
                    />
                  </div>
                )}
              </>
            )}
          </Col>
        </Row>
      </div>
    </div>
  );
}
