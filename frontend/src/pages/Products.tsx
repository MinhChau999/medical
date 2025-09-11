import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  Select,
  Card,
  Tag,
  Dropdown,
  message,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Badge,
  Avatar,
  Tooltip,
  Typography,
  Image
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  ShoppingCartOutlined,
  ExclamationCircleOutlined,
  DownloadOutlined,
  UploadOutlined,
  ReloadOutlined,
  DollarOutlined,
  InboxOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import { productsService } from '@/services/products';
import { categoriesService } from '@/services/categories';
import type { Product } from '@/types/product';
import type { Category } from '@/services/categories';
import { ProductModal } from '@/components/products/ProductModal';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  
  // Filters
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);
  
  // Pagination
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    lowStock: 0,
    outOfStock: 0,
    totalValue: 0
  });

  // Load data on mount
  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchStats();
  }, []);

  // Fetch products
  const fetchProducts = async (params?: any) => {
    try {
      setLoading(true);
      const filters = {
        search: searchText || undefined,
        categoryId: selectedCategory || undefined,
        status: selectedStatus || undefined,
        minPrice: priceRange?.[0],
        maxPrice: priceRange?.[1],
        page: params?.current || pagination.current,
        limit: params?.pageSize || pagination.pageSize,
        sortBy: params?.field || 'createdAt',
        sortOrder: params?.order === 'ascend' ? 'asc' : 'desc'
      };

      const response = await productsService.getProducts(filters);
      setProducts(response.data);
      setPagination({
        ...pagination,
        total: response.total,
        current: response.page,
        pageSize: response.limit
      });
    } catch (error) {
      message.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const data = await categoriesService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories');
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const data = await productsService.getProductStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  };

  // Handle search
  const handleSearch = () => {
    fetchProducts({ current: 1 });
  };

  // Handle filters
  const handleFilterChange = () => {
    fetchProducts({ current: 1 });
  };

  // Handle create/edit
  const handleCreateEdit = (product?: Product) => {
    if (product) {
      setSelectedProduct(product);
      setModalMode('edit');
    } else {
      setSelectedProduct(null);
      setModalMode('create');
    }
    setModalVisible(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      await productsService.deleteProduct(id);
      message.success('Product deleted successfully');
      fetchProducts();
      fetchStats();
    } catch (error) {
      message.error('Failed to delete product');
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    try {
      await productsService.bulkDeleteProducts(selectedRowKeys as string[]);
      message.success('Products deleted successfully');
      setSelectedRowKeys([]);
      fetchProducts();
      fetchStats();
    } catch (error) {
      message.error('Failed to delete products');
    }
  };

  // Handle stock update
  const handleStockUpdate = async (id: string, quantity: number) => {
    try {
      await productsService.updateStock(id, quantity);
      message.success('Stock updated successfully');
      fetchProducts();
      fetchStats();
    } catch (error) {
      message.error('Failed to update stock');
    }
  };

  // Handle export
  const handleExport = async () => {
    try {
      const blob = await productsService.exportProducts({
        search: searchText,
        categoryId: selectedCategory,
        status: selectedStatus as any
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products-${new Date().toISOString()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      message.success('Products exported successfully');
    } catch (error) {
      message.error('Failed to export products');
    }
  };

  // More actions menu
  const moreActions: MenuProps['items'] = [
    {
      key: 'export',
      icon: <DownloadOutlined />,
      label: 'Export to CSV'
    },
    {
      key: 'import',
      icon: <UploadOutlined />,
      label: 'Import from CSV'
    },
    {
      type: 'divider'
    },
    {
      key: 'bulk-delete',
      icon: <DeleteOutlined />,
      label: 'Delete Selected',
      danger: true,
      disabled: selectedRowKeys.length === 0
    }
  ];

  const handleMoreAction: MenuProps['onClick'] = ({ key }) => {
    switch (key) {
      case 'export':
        handleExport();
        break;
      case 'bulk-delete':
        handleBulkDelete();
        break;
    }
  };

  // Table columns
  const columns: ColumnsType<Product> = [
    {
      title: 'Image',
      dataIndex: 'images',
      key: 'images',
      width: 80,
      render: (images: string[]) => (
        images && images.length > 0 ? (
          <Image
            src={images[0]}
            alt="Product"
            width={50}
            height={50}
            style={{ objectFit: 'cover', borderRadius: 4 }}
            preview={{
              src: images[0]
            }}
          />
        ) : (
          <Avatar icon={<InboxOutlined />} shape="square" size={50} />
        )
      )
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      render: (text: string, record: Product) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{text}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            SKU: {record.sku}
          </Typography.Text>
        </Space>
      )
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category: any) => (
        category ? <Tag color="blue">{category.name}</Tag> : '-'
      )
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      sorter: true,
      render: (price: number) => (
        <Typography.Text strong>
          ${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </Typography.Text>
      )
    },
    {
      title: 'Stock',
      dataIndex: 'stockQuantity',
      key: 'stockQuantity',
      sorter: true,
      render: (stock: number, record: Product) => {
        let color = 'green';
        let icon = null;
        
        if (stock === 0) {
          color = 'red';
          icon = <ExclamationCircleOutlined />;
        } else if (stock <= record.reorderLevel) {
          color = 'orange';
          icon = <ExclamationCircleOutlined />;
        }
        
        return (
          <Space>
            <Badge count={stock} showZero style={{ backgroundColor: color }} />
            {icon}
            {record.unit && <Typography.Text type="secondary">{record.unit}</Typography.Text>}
          </Space>
        );
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space>
          <Tooltip title="Update Stock">
            <Button
              type="text"
              icon={<ShoppingCartOutlined />}
              onClick={() => {
                const newQuantity = prompt('Enter new stock quantity:', record.stockQuantity.toString());
                if (newQuantity !== null && !isNaN(Number(newQuantity))) {
                  handleStockUpdate(record.id, Number(newQuantity));
                }
              }}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleCreateEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Are you sure you want to delete this product?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys)
  };

  return (
    <div style={{ padding: '24px' }}>

      {/* Simple Stats */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 24,
        fontSize: 14,
        color: '#8c8c8c'
      }}>
        <div>
          Total Products: <span style={{ fontWeight: 600, color: '#262626' }}>{stats.total}</span>
        </div>
        <div>
          Total Value: <span style={{ fontWeight: 600, color: '#262626' }}>${stats.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Filters and Actions */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Search
              placeholder="Search products..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={handleSearch}
              enterButton={<SearchOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Select
              placeholder="Category"
              style={{ width: '100%' }}
              value={selectedCategory}
              onChange={(value) => {
                setSelectedCategory(value);
                handleFilterChange();
              }}
              allowClear
            >
              {categories.map(cat => (
                <Option key={cat.id} value={cat.id}>{cat.name}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Select
              placeholder="Status"
              style={{ width: '100%' }}
              value={selectedStatus}
              onChange={(value) => {
                setSelectedStatus(value);
                handleFilterChange();
              }}
              allowClear
            >
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={10} style={{ textAlign: 'right' }}>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  setSearchText('');
                  setSelectedCategory('');
                  setSelectedStatus('');
                  setPriceRange(null);
                  fetchProducts({ current: 1 });
                }}
              >
                Reset
              </Button>
              <Dropdown menu={{ items: moreActions, onClick: handleMoreAction }}>
                <Button icon={<MoreOutlined />}>More</Button>
              </Dropdown>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => handleCreateEdit()}
              >
                Add Product
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Products Table */}
      <Card>
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={products}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} products`,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          onChange={(pag, filters, sorter: any) => {
            fetchProducts({
              current: pag.current,
              pageSize: pag.pageSize,
              field: sorter.field,
              order: sorter.order
            });
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Product Modal */}
      <ProductModal
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onSuccess={() => {
          setModalVisible(false);
          fetchProducts();
          fetchStats();
        }}
        product={selectedProduct}
        mode={modalMode}
      />
    </div>
  );
};

export default Products;