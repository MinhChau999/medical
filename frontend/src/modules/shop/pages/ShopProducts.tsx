import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Input,
  Select,
  Slider,
  Button,
  Typography,
  Tag,
  Pagination,
  Empty,
  Spin,
  Breadcrumb,
  message,
  Drawer
} from 'antd';
import {
  SearchOutlined,
  AppstoreOutlined,
  BarsOutlined,
  ShoppingCartOutlined,
  HeartOutlined,
  StarFilled,
  FilterOutlined,
  HomeOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { productsService } from '@/services/products';
import { categoriesService, type Category } from '@/services/categories';
import { useCartStore } from '@/stores/cartStore';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  image?: string;
  categoryId: string;
  stockQuantity: number;
  brand?: string;
  rating?: number;
  reviews?: number;
  variantId?: string;
}

export default function ShopProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const { addItem } = useCartStore();

  // Filters
  const [searchText, setSearchText] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000000]);
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(searchText);
      setCurrentPage(1); // Reset to page 1 when search changes
    }, 500);

    return () => clearTimeout(timer);
  }, [searchText]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, priceRange, sortBy]);

  // Fetch data from API
  useEffect(() => {
    fetchData();
  }, [searchDebounced, selectedCategory, priceRange, sortBy, currentPage]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch products and categories in parallel
      const [productsResponse, categoriesData] = await Promise.all([
        productsService.getProducts({
          search: searchDebounced || undefined,
          categoryId: selectedCategory !== 'all' ? selectedCategory : undefined,
          minPrice: priceRange[0],
          maxPrice: priceRange[1],
          sortBy: sortBy === 'newest' ? 'createdAt' : sortBy === 'name' ? 'name' : sortBy === 'rating' ? 'rating' : 'price',
          sortOrder: sortBy === 'price-desc' || sortBy === 'rating' ? 'desc' : 'asc',
          page: currentPage,
          limit: pageSize,
          status: 'active'
        }),
        categories.length === 0 ? categoriesService.getCategories() : Promise.resolve(categories)
      ]);

      // Map products to include variantId from the default variant
      const mappedProducts = productsResponse.data.map((p: any) => ({
        ...p,
        variantId: p.defaultVariantId || p.variantId || p.id // Use default variant or fallback
      }));

      setProducts(mappedProducts);
      setTotalProducts(productsResponse.total);
      if (categories.length === 0) {
        setCategories(categoriesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      message.error('Không thể tải dữ liệu sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  // Total count from API
  const [totalProducts, setTotalProducts] = useState(0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
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
            <Breadcrumb.Item>Sản phẩm</Breadcrumb.Item>
          </Breadcrumb>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Row gutter={24}>
          {/* Sidebar Filters - Desktop */}
          <Col xs={0} lg={6}>
            <Card className="mb-6" title={<><FilterOutlined /> Bộ lọc</>}>
              {/* Search */}
              <div className="mb-6">
                <Text strong className="block mb-2">Tìm kiếm</Text>
                <Input
                  placeholder="Tìm sản phẩm..."
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                />
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <Text strong className="block mb-3">Danh mục</Text>
                <div className="space-y-2">
                  <Button
                    block
                    type={selectedCategory === 'all' ? 'primary' : 'default'}
                    onClick={() => setSelectedCategory('all')}
                    className="text-left"
                  >
                    Tất cả
                  </Button>
                  {categories.map(cat => (
                    <Button
                      key={cat.id}
                      block
                      type={selectedCategory === cat.id ? 'primary' : 'default'}
                      onClick={() => setSelectedCategory(cat.id)}
                      className="text-left"
                    >
                      {cat.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <Text strong className="block mb-3">Khoảng giá</Text>
                <Slider
                  range
                  min={0}
                  max={10000000}
                  step={100000}
                  value={priceRange}
                  onChange={(value) => setPriceRange(value as [number, number])}
                  tooltip={{
                    formatter: (value) => formatPrice(value || 0)
                  }}
                />
                <div className="flex justify-between mt-2">
                  <Text className="text-xs text-gray-600">{formatPrice(priceRange[0])}</Text>
                  <Text className="text-xs text-gray-600">{formatPrice(priceRange[1])}</Text>
                </div>
              </div>

              {/* Clear Filters */}
              <Button
                block
                onClick={() => {
                  setSearchText('');
                  setSelectedCategory('all');
                  setPriceRange([0, 10000000]);
                }}
              >
                Xóa bộ lọc
              </Button>
            </Card>
          </Col>

          {/* Drawer Filters - Mobile */}
          <Drawer
            title={<><FilterOutlined /> Bộ lọc</>}
            placement="left"
            onClose={() => setFilterDrawerOpen(false)}
            open={filterDrawerOpen}
            width={300}
          >
            {/* Search */}
            <div className="mb-6">
              <Text strong className="block mb-2">Tìm kiếm</Text>
              <Input
                placeholder="Tìm sản phẩm..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </div>

            {/* Category Filter */}
            <div className="mb-6">
              <Text strong className="block mb-3">Danh mục</Text>
              <div className="space-y-2">
                <Button
                  block
                  type={selectedCategory === 'all' ? 'primary' : 'default'}
                  onClick={() => setSelectedCategory('all')}
                  className="text-left"
                >
                  Tất cả
                </Button>
                {categories.map(cat => (
                  <Button
                    key={cat.id}
                    block
                    type={selectedCategory === cat.id ? 'primary' : 'default'}
                    onClick={() => setSelectedCategory(cat.id)}
                    className="text-left"
                  >
                    {cat.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="mb-6">
              <Text strong className="block mb-3">Khoảng giá</Text>
              <Slider
                range
                min={0}
                max={10000000}
                step={100000}
                value={priceRange}
                onChange={(value) => setPriceRange(value as [number, number])}
                tooltip={{
                  formatter: (value) => formatPrice(value || 0)
                }}
              />
              <div className="flex justify-between mt-2">
                <Text className="text-xs text-gray-600">{formatPrice(priceRange[0])}</Text>
                <Text className="text-xs text-gray-600">{formatPrice(priceRange[1])}</Text>
              </div>
            </div>

            {/* Clear Filters */}
            <Button
              block
              onClick={() => {
                setSearchText('');
                setSelectedCategory('all');
                setPriceRange([0, 10000000]);
              }}
            >
              Xóa bộ lọc
            </Button>
          </Drawer>

          {/* Products Grid */}
          <Col xs={24} lg={18}>
            {/* Toolbar */}
            <div className="bg-white p-3 rounded-lg mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {/* Filter Button - Mobile Only */}
                <Button
                  icon={<FilterOutlined />}
                  onClick={() => setFilterDrawerOpen(true)}
                  className="lg:hidden"
                >
                  Bộ lọc
                </Button>

                <Text className="text-gray-600 text-sm">
                  {totalProducts > 0 ? `${totalProducts} sản phẩm` : 'Không có sản phẩm'}
                </Text>
              </div>

              <div className="flex items-center gap-3">
                <Select
                  value={sortBy}
                  onChange={setSortBy}
                  style={{ width: 180 }}
                  size="middle"
                >
                  <Option value="newest">Mới nhất</Option>
                  <Option value="price-asc">Giá: Thấp đến cao</Option>
                  <Option value="price-desc">Giá: Cao đến thấp</Option>
                  <Option value="name">Tên A-Z</Option>
                  <Option value="rating">Đánh giá cao nhất</Option>
                </Select>

                <div className="hidden sm:flex items-center gap-1">
                  <Button
                    icon={<AppstoreOutlined />}
                    type={viewMode === 'grid' ? 'primary' : 'default'}
                    onClick={() => setViewMode('grid')}
                    size="middle"
                  />
                  <Button
                    icon={<BarsOutlined />}
                    type={viewMode === 'list' ? 'primary' : 'default'}
                    onClick={() => setViewMode('list')}
                    size="middle"
                  />
                </div>
              </div>
            </div>

            {/* Products */}
            {loading ? (
              <div className="text-center py-16">
                <Spin size="large" />
              </div>
            ) : products.length === 0 ? (
              <Empty
                description="Không tìm thấy sản phẩm"
                className="py-16"
              />
            ) : (
              <>
                <Row gutter={[12, 12]}>
                  {products.map(product => (
                    <Col
                      key={product.id}
                      xs={24}
                      sm={viewMode === 'grid' ? 12 : 24}
                      lg={viewMode === 'grid' ? 8 : 24}
                    >
                      <Card
                        hoverable
                        className="h-full"
                        styles={{ body: { padding: '16px' } }}
                        cover={
                          <Link to={`/products/${product.id}`}>
                            <div className="h-40 flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50 overflow-hidden">
                              {product.image || product.images?.[0] ? (
                                <img
                                  src={product.image || product.images[0]}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSIjY2NjIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';
                                  }}
                                />
                              ) : (
                                <div className="text-6xl">📦</div>
                              )}
                            </div>
                          </Link>
                        }
                      >
                        <div className="mb-2 flex items-center gap-2 flex-wrap">
                          {product.brand && (
                            <Tag color="blue" className="!m-0">{product.brand}</Tag>
                          )}
                          {product.stockQuantity === 0 ? (
                            <Tag color="red" className="!m-0">Hết hàng</Tag>
                          ) : product.stockQuantity < 20 && (
                            <Tag color="orange" className="!m-0">Còn {product.stockQuantity}</Tag>
                          )}
                        </div>

                        <Link to={`/products/${product.id}`}>
                          <Title level={5} className="!mb-1 !mt-0" ellipsis={{ rows: 2 }}>
                            {product.name}
                          </Title>
                        </Link>

                        <Paragraph
                          className="text-gray-600 text-sm !mb-3"
                          ellipsis={{ rows: 2 }}
                        >
                          {product.description}
                        </Paragraph>

                        <div className="flex items-center justify-between mt-auto">
                          <Text className="text-xl font-bold text-medical-primary">
                            {formatPrice(product.price)}
                          </Text>
                          <Button
                            type="primary"
                            icon={<ShoppingCartOutlined />}
                            size="small"
                            disabled={product.stockQuantity === 0}
                            onClick={() => {
                              if (!product.variantId) {
                                message.warning('Sản phẩm chưa có phiên bản');
                                return;
                              }
                              addItem({
                                variantId: product.variantId,
                                productId: product.id,
                                productName: product.name,
                                price: product.price,
                                image: product.image || product.images?.[0],
                              });
                            }}
                          >
                            {product.stockQuantity === 0 ? 'Hết hàng' : 'Mua'}
                          </Button>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>

                {/* Pagination */}
                {totalProducts > pageSize && (
                  <div className="mt-6 flex justify-center">
                    <Pagination
                      current={currentPage}
                      pageSize={pageSize}
                      total={totalProducts}
                      onChange={setCurrentPage}
                      showSizeChanger={false}
                      showTotal={(total) => `Tổng ${total} sản phẩm`}
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
