import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '@/stores/themeStore';
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
  const { t } = useTranslation();
  const { isDarkMode } = useThemeStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  
  // Filters
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);
  
  // Pagination
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
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
      title: '',
      dataIndex: 'images',
      key: 'images',
      width: 70,
      render: (images: string[]) => (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 60
        }}>
          {images && images.length > 0 ? (
            <Image
              src={images[0]}
              alt="Product"
              width={50}
              height={50}
              style={{
                objectFit: 'cover',
                borderRadius: 8,
                border: isDarkMode ? '2px solid #434343' : '2px solid #f0f0f0',
                boxShadow: isDarkMode ? '0 2px 8px rgba(255,255,255,0.1)' : '0 2px 8px rgba(0,0,0,0.1)'
              }}
              preview={{
                src: images[0]
              }}
            />
          ) : (
            <div style={{
              width: 50,
              height: 50,
              borderRadius: 8,
              background: isDarkMode
                ? 'linear-gradient(135deg, #262626 0%, #1f1f1f 100%)'
                : 'linear-gradient(135deg, #f0f0f0 0%, #e6e6e6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: isDarkMode ? '2px solid #434343' : '2px solid #f0f0f0'
            }}>
              <InboxOutlined style={{ fontSize: 20, color: isDarkMode ? '#595959' : '#bfbfbf' }} />
            </div>
          )}
        </div>
      )
    },
    {
      title: (
        <div style={{ fontWeight: 600, color: isDarkMode ? '#ffffff' : '#262626' }}>
          {t('productInformation')}
        </div>
      ),
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      width: 250,
      render: (text: string, record: Product) => (
        <div style={{ padding: '4px 0' }}>
          <div style={{
            fontSize: 14,
            fontWeight: 600,
            color: isDarkMode ? '#ffffff' : '#262626',
            marginBottom: 2,
            lineHeight: 1.3
          }}>
            {text}
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 2
          }}>
            <Tag size="small" color="blue" style={{
              fontSize: 10,
              padding: '1px 4px',
              margin: 0,
              borderRadius: 3,
              lineHeight: '14px'
            }}>
              {record.sku}
            </Tag>
            {record.barcode && (
              <Typography.Text type="secondary" style={{ fontSize: 10 }}>
                {record.barcode}
              </Typography.Text>
            )}
          </div>
          {record.description && (
            <Typography.Text
              type="secondary"
              style={{
                fontSize: 11,
                display: '-webkit-box',
                WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: 1.2
              }}
            >
              {record.description}
            </Typography.Text>
          )}
        </div>
      )
    },
    {
      title: (
        <div style={{ fontWeight: 600, color: isDarkMode ? '#ffffff' : '#262626' }}>
          {t('category')}
        </div>
      ),
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: any) => (
        <div style={{ padding: '4px 0' }}>
          {category ? (
            <Tag
              color="blue"
              style={{
                padding: '2px 6px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 500,
                border: 'none',
                background: isDarkMode ? '#003a52' : '#e6f7ff',
                color: isDarkMode ? '#40a9ff' : '#1890ff',
                lineHeight: '16px'
              }}
            >
              {category.name}
            </Tag>
          ) : (
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              None
            </Typography.Text>
          )}
        </div>
      )
    },
    {
      title: (
        <div style={{ fontWeight: 600, color: isDarkMode ? '#ffffff' : '#262626' }}>
          {t('price')}
        </div>
      ),
      dataIndex: 'price',
      key: 'price',
      sorter: true,
      width: 100,
      align: 'right' as const,
      render: (price: number) => (
        <div style={{ padding: '4px 0', textAlign: 'right' }}>
          <div style={{
            fontSize: 14,
            fontWeight: 700,
            color: '#00A6B8'
          }}>
            {Math.round(Number(price)).toLocaleString('vi-VN')}₫
          </div>
        </div>
      )
    },
    {
      title: (
        <div style={{ fontWeight: 600, color: isDarkMode ? '#ffffff' : '#262626' }}>
          {t('stockStatus')}
        </div>
      ),
      dataIndex: 'stockQuantity',
      key: 'stockQuantity',
      sorter: true,
      width: 100,
      align: 'left' as const,
      render: (stock: number, record: Product) => {
        let statusColor = '#52c41a';
        let statusDot = '●';

        if (stock === 0) {
          statusColor = '#ff4d4f';
        } else if (stock <= record.reorderLevel) {
          statusColor = '#fa8c16';
        }

        return (
          <div style={{ padding: '4px 0' }}>
            <div style={{
              fontSize: 14,
              fontWeight: 600,
              color: isDarkMode ? '#ffffff' : '#262626',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}>
              <span style={{ color: statusColor }}>
                {statusDot}
              </span>
              <span>{stock.toLocaleString()}</span>
              {record.unit && (
                <Typography.Text type="secondary" style={{ fontSize: 10 }}>
                  {record.unit}
                </Typography.Text>
              )}
            </div>
          </div>
        );
      }
    },
    {
      title: (
        <div style={{ fontWeight: 600, color: isDarkMode ? '#ffffff' : '#262626' }}>
          {t('expiryDate')}
        </div>
      ),
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      width: 120,
      sorter: true,
      render: (expiryDate: string) => {
        if (!expiryDate) {
          return (
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              No expiry
            </Typography.Text>
          );
        }

        const expiry = new Date(expiryDate);
        const today = new Date();
        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let statusColor = '#52c41a';
        let statusBg = '#f6ffed';
        let statusText = 'Good';

        if (diffDays <= 0) {
          statusColor = '#ff4d4f';
          statusBg = '#fff2f0';
          statusText = 'Expired';
        } else if (diffDays <= 30) {
          statusColor = '#fa8c16';
          statusBg = '#fff7e6';
          statusText = 'Soon';
        } else if (diffDays <= 90) {
          statusColor = '#faad14';
          statusBg = '#fffbe6';
          statusText = 'Warning';
        }

        return (
          <div style={{ padding: '4px 0' }}>
            <div style={{
              fontSize: 12,
              fontWeight: 600,
              color: isDarkMode ? '#ffffff' : '#262626',
              marginBottom: 2
            }}>
              {expiry.toLocaleDateString('en-GB')}
            </div>
            <div style={{
              display: 'inline-block',
              padding: '2px 6px',
              borderRadius: 4,
              fontSize: 10,
              fontWeight: 500,
              background: statusBg,
              color: statusColor,
              border: `1px solid ${statusColor}20`
            }}>
              {statusText}
            </div>
          </div>
        );
      }
    },
    {
      title: (
        <div style={{ fontWeight: 600, color: isDarkMode ? '#ffffff' : '#262626' }}>
          {t('status')}
        </div>
      ),
      dataIndex: 'status',
      key: 'status',
      width: 80,
      align: 'center' as const,
      render: (status: string, record: Product) => {
        const isActive = status === 'active';

        const handleStatusToggle = async () => {
          try {
            const newStatus = isActive ? 'inactive' : 'active';

            await productsService.updateProduct(record.id, {
              ...record,
              status: newStatus
            });

            message.success(newStatus === 'active' ? t('productActivated') : t('productDeactivated'));
            loadProducts();
          } catch (error: any) {
            message.error(t('failedToUpdateStatus'));
          }
        };

        return (
          <div style={{ padding: '4px 0', textAlign: 'center' }}>
            <div
              onClick={handleStatusToggle}
              style={{
                position: 'relative',
                width: 52,
                height: 24,
                borderRadius: 12,
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                background: isActive
                  ? 'linear-gradient(135deg, #00A6B8 0%, #26C6DA 100%)'
                  : isDarkMode
                    ? 'linear-gradient(135deg, #262626 0%, #1f1f1f 100%)'
                    : 'linear-gradient(135deg, #f1f3f4 0%, #e8eaed 100%)',
                border: '1px solid transparent',
                boxShadow: isActive
                  ? '0 3px 12px rgba(0, 166, 184, 0.25), inset 0 1px 0 rgba(255,255,255,0.2)'
                  : '0 2px 6px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                if (isActive) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #008A96 0%, #1FA8B8 100%)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 166, 184, 0.35), inset 0 1px 0 rgba(255,255,255,0.2)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                } else {
                  e.currentTarget.style.background = isDarkMode
                    ? 'linear-gradient(135deg, #1f1f1f 0%, #141414 100%)'
                    : 'linear-gradient(135deg, #e8eaed 0%, #dadce0 100%)';
                  e.currentTarget.style.boxShadow = isDarkMode
                    ? '0 3px 8px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)'
                    : '0 3px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255,255,255,0.8)';
                }
              }}
              onMouseLeave={(e) => {
                if (isActive) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #00A6B8 0%, #26C6DA 100%)';
                  e.currentTarget.style.boxShadow = '0 3px 12px rgba(0, 166, 184, 0.25), inset 0 1px 0 rgba(255,255,255,0.2)';
                  e.currentTarget.style.transform = 'translateY(0)';
                } else {
                  e.currentTarget.style.background = isDarkMode
                    ? 'linear-gradient(135deg, #262626 0%, #1f1f1f 100%)'
                    : 'linear-gradient(135deg, #f1f3f4 0%, #e8eaed 100%)';
                  e.currentTarget.style.boxShadow = isDarkMode
                    ? '0 2px 6px rgba(255, 255, 255, 0.06), inset 0 1px 0 rgba(255,255,255,0.05)'
                    : '0 2px 6px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255,255,255,0.8)';
                }
              }}
            >
              {/* Switch Track Highlight */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '50%',
                  borderRadius: '12px 12px 0 0',
                  background: isActive
                    ? 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)'
                    : isDarkMode
                      ? 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
                      : 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.3) 100%)',
                  pointerEvents: 'none'
                }}
              />

              {/* Switch Handle */}
              <div
                style={{
                  position: 'absolute',
                  top: 2,
                  left: isActive ? 28 : 2,
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  background: '#ffffff',
                  transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  boxShadow: isActive
                    ? '0 3px 8px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1)'
                    : '0 2px 6px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(0,0,0,0.04)'
                }}
              >
                {/* Handle Inner Gradient */}
                <div
                  style={{
                    position: 'absolute',
                    top: 1,
                    left: 1,
                    right: 1,
                    height: '40%',
                    borderRadius: '9px 9px 0 0',
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.4) 100%)',
                    pointerEvents: 'none'
                  }}
                />

                {/* Status Indicator */}
                {isActive && (
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      background: 'linear-gradient(135deg, #00A6B8 0%, #26C6DA 100%)',
                      boxShadow: '0 1px 2px rgba(0, 166, 184, 0.4)'
                    }}
                  />
                )}
              </div>

              {/* Status Text */}
              <div
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isActive ? 'flex-start' : 'flex-end',
                  paddingLeft: isActive ? 6 : 0,
                  paddingRight: isActive ? 0 : 6,
                  fontSize: 7,
                  fontWeight: 700,
                  letterSpacing: '0.3px',
                  color: isActive ? 'rgba(255,255,255,0.95)' : isDarkMode ? '#8c8c8c' : '#6c757d',
                  textShadow: isActive ? '0 1px 2px rgba(0,0,0,0.2)' : 'none',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}
              >
                {isActive ? 'ON' : 'OFF'}
              </div>
            </div>
          </div>
        );
      }
    },
    {
      title: (
        <div style={{ fontWeight: 600, color: isDarkMode ? '#ffffff' : '#262626', textAlign: 'center' }}>
          {t('actions')}
        </div>
      ),
      key: 'actions',
      fixed: 'right',
      width: 110,
      align: 'center' as const,
      render: (_, record) => (
        <div style={{ padding: '4px 0' }}>
          <Space size={4}>
            <Tooltip title="Stock">
              <Button
                type="text"
                size="small"
                icon={<ShoppingCartOutlined />}
                onClick={() => {
                  const newQuantity = prompt('Enter new stock quantity:', record.stockQuantity.toString());
                  if (newQuantity !== null && !isNaN(Number(newQuantity))) {
                    handleStockUpdate(record.id, Number(newQuantity));
                  }
                }}
                style={{
                  border: '1px solid #00A6B8',
                  color: '#00A6B8',
                  borderRadius: 4,
                  width: 28,
                  height: 28,
                  fontSize: 12,
                  background: isDarkMode ? '#141414' : 'transparent'
                }}
                className="action-button"
              />
            </Tooltip>
            <Tooltip title="Edit">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleCreateEdit(record)}
                style={{
                  border: '1px solid #52c41a',
                  color: '#52c41a',
                  borderRadius: 4,
                  width: 28,
                  height: 28,
                  fontSize: 12,
                  background: isDarkMode ? '#141414' : 'transparent'
                }}
                className="action-button"
              />
            </Tooltip>
            <Popconfirm
              title="Delete?"
              onConfirm={() => handleDelete(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Tooltip title="Delete">
                <Button
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  style={{
                    border: '1px solid #ff4d4f',
                    color: '#ff4d4f',
                    borderRadius: 4,
                    width: 28,
                    height: 28,
                    fontSize: 12,
                    background: isDarkMode ? '#141414' : 'transparent'
                  }}
                  className="action-button"
                />
              </Tooltip>
            </Popconfirm>
          </Space>
        </div>
      )
    }
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys)
  };

  return (
    <div style={{ padding: '24px' }}>

      {/* Compact Stats Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        padding: '12px 16px',
        background: isDarkMode
          ? 'linear-gradient(135deg, #1f1f1f 0%, #262626 100%)'
          : 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)',
        borderRadius: 8,
        border: isDarkMode ? '1px solid #434343' : '1px solid #e8e8e8'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: isDarkMode ? '#ffffff' : '#262626' }}>
            {t('products')} ({stats.total})
          </div>
          <div style={{ fontSize: 13, color: isDarkMode ? '#bfbfbf' : '#8c8c8c' }}>
            {t('active')}: <span style={{ color: '#52c41a', fontWeight: 500 }}>{stats.active}</span> •
            {t('lowStock')}: <span style={{ color: '#fa8c16', fontWeight: 500 }}>{stats.lowStock}</span>
          </div>
        </div>
        <div style={{ fontSize: 14, color: '#00A6B8', fontWeight: 600 }}>
          Total Value: {Math.round(Number(stats.totalValue || 0)).toLocaleString('vi-VN')}₫
        </div>
      </div>

      {/* Compact Filters Bar */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 12,
        padding: '8px 12px',
        background: isDarkMode ? '#141414' : '#ffffff',
        borderRadius: 8,
        border: isDarkMode ? '1px solid #434343' : '1px solid #f0f0f0',
        boxShadow: isDarkMode
          ? '0 1px 4px rgba(255,255,255,0.04)'
          : '0 1px 4px rgba(0,0,0,0.04)'
      }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 12,
          flex: '1 1 auto',
          minWidth: 0
        }}>
          <Search
            placeholder={t('searchProducts')}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={handleSearch}
            size="middle"
            style={{
              width: '100%',
              maxWidth: 220,
              minWidth: 180
            }}
            enterButton={
              <Button
                icon={
                  <SearchOutlined
                    style={{
                      color: '#ffffff',
                      fontSize: 16
                    }}
                  />
                }
                style={{
                  background: 'linear-gradient(135deg, #00A6B8 0%, #26C6DA 100%)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              />
            }
            styles={{
              input: {
                backgroundColor: isDarkMode ? '#262626' : '#ffffff',
                color: isDarkMode ? '#d9d9d9' : '#000000',
                borderColor: isDarkMode ? '#595959' : '#d9d9d9',
                height: 32
              }
            }}
          />
          <Select
            placeholder={t('category')}
            size="middle"
            style={{
              minWidth: 120,
              flex: '1 1 auto',
              maxWidth: 140,
              backgroundColor: isDarkMode ? '#262626' : '#ffffff'
            }}
            value={selectedCategory}
            onChange={(value) => {
              setSelectedCategory(value);
              handleFilterChange();
            }}
            allowClear
            popupMatchSelectWidth={false}
            classNames={{
              popup: isDarkMode ? 'dark-select-dropdown' : ''
            }}
          >
            {categories.map(cat => (
              <Option key={cat.id} value={cat.id}>{cat.name}</Option>
            ))}
          </Select>
          <Select
            placeholder={t('status')}
            size="middle"
            style={{
              minWidth: 100,
              flex: '1 1 auto',
              maxWidth: 120,
              backgroundColor: isDarkMode ? '#262626' : '#ffffff'
            }}
            value={selectedStatus}
            onChange={(value) => {
              setSelectedStatus(value);
              handleFilterChange();
            }}
            allowClear
            popupMatchSelectWidth={false}
            classNames={{
              popup: isDarkMode ? 'dark-select-dropdown' : ''
            }}
          >
            <Option value="active">{t('active')}</Option>
            <Option value="inactive">{t('inactive')}</Option>
          </Select>
          <Button
            size="middle"
            icon={<ReloadOutlined />}
            onClick={() => {
              setSearchText('');
              setSelectedCategory(undefined);
              setSelectedStatus(undefined);
              setPriceRange(null);
              fetchProducts({ current: 1 });
            }}
            style={{
              color: isDarkMode ? '#d9d9d9' : '#8c8c8c',
              borderColor: isDarkMode ? '#595959' : '#d9d9d9',
              background: isDarkMode ? '#262626' : '#ffffff'
            }}
          >
            {t('reset')}
          </Button>
        </div>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 8,
          flex: '0 0 auto'
        }}>
          <Dropdown menu={{ items: moreActions, onClick: handleMoreAction }}>
            <Button
              size="middle"
              icon={<MoreOutlined />}
              style={{
                color: isDarkMode ? '#d9d9d9' : '#8c8c8c',
                borderColor: isDarkMode ? '#595959' : '#d9d9d9',
                background: isDarkMode ? '#262626' : '#ffffff'
              }}
            >
              {t('more')}
            </Button>
          </Dropdown>
          <Button
            type="primary"
            size="middle"
            icon={<PlusOutlined />}
            onClick={() => handleCreateEdit()}
            style={{
              background: 'linear-gradient(135deg, #00A6B8 0%, #26C6DA 100%)',
              border: 'none',
              borderRadius: 6,
              fontWeight: 500,
              boxShadow: '0 2px 6px rgba(0, 166, 184, 0.3)',
              whiteSpace: 'nowrap'
            }}
          >
{t('addProduct')}
          </Button>
        </div>
      </div>

      {/* Products Table */}
      <Card
        style={{
          borderRadius: 12,
          border: isDarkMode ? '1px solid #434343' : '1px solid #f0f0f0',
          boxShadow: isDarkMode
            ? '0 2px 8px rgba(0,0,0,0.3)'
            : '0 2px 8px rgba(0,0,0,0.06)',
          background: isDarkMode ? '#141414' : '#ffffff'
        }}
        styles={{ body: { padding: 0 } }}
      >
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={products}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total, range) => (
              <span style={{ fontSize: 14, color: '#8c8c8c' }}>
                Showing {range[0]}-{range[1]} of {total} products
              </span>
            ),
            pageSizeOptions: ['20', '50', '100', '200'],
            size: 'default'
          }}
          onChange={(pag, filters, sorter: any) => {
            fetchProducts({
              current: pag.current,
              pageSize: pag.pageSize,
              field: sorter.field,
              order: sorter.order
            });
          }}
          scroll={{ x: 1020 }}
          size="small"
          className="professional-table compact-table"
          style={{
            borderRadius: 12,
            overflow: 'hidden'
          }}
        />
      </Card>

      {/* Custom Styles */}
      <style>
        {`
          .professional-table .ant-table-thead > tr > th {
            background: ${isDarkMode
              ? 'linear-gradient(135deg, #1f1f1f 0%, #262626 100%)'
              : 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)'};
            border-bottom: 2px solid ${isDarkMode ? '#434343' : '#e8e8e8'};
            padding: 12px 8px;
            font-weight: 600;
            font-size: 12px;
            color: ${isDarkMode ? '#ffffff' : '#262626'};
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .compact-table .ant-table-tbody > tr {
            transition: all 0.15s ease;
            border-bottom: 1px solid ${isDarkMode ? '#303030' : '#f5f5f5'};
            background: ${isDarkMode ? '#141414' : '#ffffff'};
          }

          .compact-table .ant-table-tbody > tr:hover {
            background-color: ${isDarkMode ? '#1f1f1f' : '#fafafa'};
            box-shadow: 0 2px 8px ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'};
          }

          .compact-table .ant-table-tbody > tr > td {
            padding: 8px;
            border-bottom: 1px solid ${isDarkMode ? '#303030' : '#f5f5f5'};
            vertical-align: middle;
            color: ${isDarkMode ? '#d9d9d9' : '#262626'};
          }

          .compact-table .ant-table-thead > tr > th {
            padding: 10px 8px;
            font-size: 11px;
          }

          .professional-table .ant-table-tbody > tr:last-child > td {
            border-bottom: none;
          }

          .action-button:hover {
            transform: scale(1.1);
            box-shadow: 0 2px 8px ${isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'};
            transition: all 0.2s ease;
          }

          .professional-table .ant-table-pagination {
            padding: 20px 24px;
            border-top: 1px solid ${isDarkMode ? '#303030' : '#f0f0f0'};
            background: ${isDarkMode ? '#1f1f1f' : '#fafafa'};
          }

          .professional-table .ant-table-selection-column {
            padding-left: 24px;
          }

          .professional-table .ant-checkbox-wrapper {
            transform: scale(1.1);
          }

          .professional-table .ant-table-thead > tr > th:first-child {
            border-top-left-radius: 12px;
          }

          .professional-table .ant-table-thead > tr > th:last-child {
            border-top-right-radius: 12px;
          }

          .professional-table .ant-table {
            background: ${isDarkMode ? '#141414' : '#ffffff'};
          }

          .professional-table .ant-card {
            background: ${isDarkMode ? '#141414' : '#ffffff'};
            border-color: ${isDarkMode ? '#434343' : '#f0f0f0'};
          }

          .professional-table .ant-pagination-item {
            background: ${isDarkMode ? '#262626' : '#ffffff'};
            border-color: ${isDarkMode ? '#434343' : '#d9d9d9'};
          }

          .professional-table .ant-pagination-item a {
            color: ${isDarkMode ? '#d9d9d9' : '#262626'};
          }

          .professional-table .ant-pagination-item-active {
            background: ${isDarkMode ? '#00A6B8' : '#00A6B8'};
            border-color: ${isDarkMode ? '#00A6B8' : '#00A6B8'};
          }

          .professional-table .ant-pagination-item-active a {
            color: #ffffff;
          }

          .professional-table .ant-select-selector {
            background: ${isDarkMode ? '#262626 !important' : '#ffffff !important'};
            border-color: ${isDarkMode ? '#434343 !important' : '#d9d9d9 !important'};
            color: ${isDarkMode ? '#d9d9d9 !important' : '#262626 !important'};
          }

          .professional-table .ant-pagination-total-text {
            color: ${isDarkMode ? '#8c8c8c' : '#8c8c8c'};
          }
        `}
      </style>

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