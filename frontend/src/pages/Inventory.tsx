import { useState, useMemo } from 'react';
import { Table, Card, Tag, Button, Input, Select, Space, Row, Col, Badge, Dropdown, Modal, Form, InputNumber, message, Divider } from 'antd';
import {
  SearchOutlined,
  WarningOutlined,
  PlusOutlined,
  ExportOutlined,
  ImportOutlined,
  SwapOutlined,
  ReloadOutlined,
  MoreOutlined,
  InboxOutlined,
  DollarOutlined,
  ShopOutlined,
  AlertOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useThemeStore } from '@/stores/themeStore';
import { useTranslation } from 'react-i18next';
import api from '@/services/api';
import type { ColumnsType } from 'antd/es/table';

interface InventoryItem {
  id: string;
  variant_id: string;
  warehouse_id: string;
  product_name: string;
  variant_name: string;
  variant_sku: string;
  warehouse_name: string;
  warehouse_code: string;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  price: string;
  isLowStock: boolean;
  low_stock_threshold: number;
  last_restocked_at: string;
}

const Inventory = () => {
  const { isDarkMode } = useThemeStore();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [searchText, setSearchText] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);
  const [isStockModalVisible, setIsStockModalVisible] = useState(false);
  const [stockModalType, setStockModalType] = useState<'in' | 'out'>('in');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isBulkStockModalVisible, setIsBulkStockModalVisible] = useState(false);
  const [bulkStockType, setBulkStockType] = useState<'in' | 'out'>('in');
  const [form] = Form.useForm();
  const [bulkForm] = Form.useForm();
  const [selectedBulkWarehouse, setSelectedBulkWarehouse] = useState<string | undefined>(undefined);
  const [bulkItems, setBulkItems] = useState<Array<{ variantId: string; quantity: number }>>([]);

  // Fetch inventory data
  const { data: inventory, isLoading, refetch } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const response = await api.get('/inventory');
      return response.data;
    },
  });

  // Fetch low stock items
  const { data: lowStock } = useQuery({
    queryKey: ['inventory-low-stock'],
    queryFn: async () => {
      const response = await api.get('/inventory/low-stock');
      return response.data;
    },
  });

  // Fetch warehouses for filter
  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const response = await api.get('/warehouses');
      return response.data;
    },
  });

  // Calculate stats
  const stats = useMemo(() => {
    const items = inventory?.data || [];
    const totalItems = items.length;
    const lowStockCount = items.filter((i: InventoryItem) => i.isLowStock && i.quantity > 0).length;
    const outOfStockCount = items.filter((i: InventoryItem) => i.quantity === 0).length;
    const totalValue = items.reduce((sum: number, i: InventoryItem) => {
      return sum + (i.quantity * Number(i.price));
    }, 0);
    const totalStock = items.reduce((sum: number, i: InventoryItem) => sum + i.quantity, 0);
    const totalReserved = items.reduce((sum: number, i: InventoryItem) => sum + i.reserved_quantity, 0);

    return { totalItems, lowStockCount, outOfStockCount, totalValue, totalStock, totalReserved };
  }, [inventory]);

  // Filter data
  const filteredData = useMemo(() => {
    let data = inventory?.data || [];

    if (searchText) {
      const search = searchText.toLowerCase();
      data = data.filter((item: InventoryItem) =>
        item.product_name?.toLowerCase().includes(search) ||
        item.variant_name?.toLowerCase().includes(search) ||
        item.variant_sku?.toLowerCase().includes(search) ||
        item.warehouse_name?.toLowerCase().includes(search)
      );
    }

    if (selectedWarehouse) {
      data = data.filter((item: InventoryItem) => item.warehouse_id === selectedWarehouse);
    }

    if (selectedStatus) {
      data = data.filter((item: InventoryItem) => {
        if (selectedStatus === 'out_of_stock') return item.quantity === 0;
        if (selectedStatus === 'low_stock') return item.isLowStock && item.quantity > 0;
        if (selectedStatus === 'in_stock') return !item.isLowStock && item.quantity > 0;
        return true;
      });
    }

    return data;
  }, [inventory, searchText, selectedWarehouse, selectedStatus]);

  // Stock mutation
  const stockMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/inventory/adjust', {
        warehouseId: data.warehouseId,
        variantId: data.variantId,
        quantity: data.quantity,
        type: data.type,
        notes: data.notes,
        referenceType: 'manual_adjustment',
        referenceId: null
      });
    },
    onSuccess: () => {
      message.success('Cập nhật tồn kho thành công');
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-low-stock'] });
      setIsStockModalVisible(false);
      form.resetFields();
      setSelectedItem(null);
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'Cập nhật tồn kho thất bại');
    }
  });

  // Bulk stock mutation
  const bulkStockMutation = useMutation({
    mutationFn: async (data: any) => {
      const promises = data.items.map((item: any) =>
        api.post('/inventory/adjust', {
          warehouseId: data.warehouseId,
          variantId: item.variantId,
          quantity: item.quantity,
          type: data.type,
          notes: data.notes,
          referenceType: 'manual_adjustment',
          referenceId: null
        })
      );
      return Promise.all(promises);
    },
    onSuccess: (_, variables) => {
      message.success(`Đã ${variables.type === 'in' ? 'nhập' : 'xuất'} ${variables.items.length} sản phẩm thành công`);
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-low-stock'] });
      setIsBulkStockModalVisible(false);
      bulkForm.resetFields();
      setSelectedBulkWarehouse(undefined);
      setBulkItems([]);
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'Cập nhật tồn kho hàng loạt thất bại');
    }
  });

  const handleStockIn = (record: InventoryItem) => {
    setSelectedItem(record);
    setStockModalType('in');
    setIsStockModalVisible(true);
  };

  const handleStockOut = (record: InventoryItem) => {
    setSelectedItem(record);
    setStockModalType('out');
    setIsStockModalVisible(true);
  };

  const handleStockSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (selectedItem) {
        await stockMutation.mutateAsync({
          warehouseId: selectedItem.warehouse_id,
          variantId: selectedItem.variant_id,
          quantity: values.quantity,
          type: stockModalType,
          notes: values.notes || ''
        });
      }
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleReset = () => {
    setSearchText('');
    setSelectedWarehouse(undefined);
    setSelectedStatus(undefined);
  };

  const columns: ColumnsType<InventoryItem> = [
    {
      title: 'Sản phẩm',
      dataIndex: 'product_name',
      key: 'product_name',
      render: (text: string, record: InventoryItem) => (
        <div>
          <div style={{ fontWeight: 500, color: isDarkMode ? '#e6e6e6' : '#262626' }}>
            {text}
          </div>
          {record.variant_name && (
            <div style={{ fontSize: 12, color: isDarkMode ? '#8c8c8c' : '#8c8c8c' }}>
              {record.variant_name}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'SKU',
      dataIndex: 'variant_sku',
      key: 'variant_sku',
      width: 120,
      render: (text: string) => (
        <Tag style={{
          background: isDarkMode ? '#262626' : '#f5f5f5',
          color: isDarkMode ? '#e6e6e6' : '#595959',
          border: `1px solid ${isDarkMode ? '#434343' : '#d9d9d9'}`,
          fontFamily: 'monospace'
        }}>
          {text}
        </Tag>
      ),
    },
    {
      title: 'Kho',
      dataIndex: 'warehouse_name',
      key: 'warehouse_name',
      width: 150,
      render: (text: string, record: InventoryItem) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShopOutlined style={{ color: isDarkMode ? '#8c8c8c' : '#8c8c8c' }} />
          <span style={{ color: isDarkMode ? '#e6e6e6' : '#262626' }}>{text}</span>
        </div>
      ),
    },
    {
      title: 'Tồn kho',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      sorter: (a, b) => a.quantity - b.quantity,
      render: (value: number, record: InventoryItem) => (
        <span style={{
          color: record.quantity === 0 ? '#ff4d4f' : record.isLowStock ? '#faad14' : isDarkMode ? '#52c41a' : '#52c41a',
          fontWeight: 600,
          fontSize: 14
        }}>
          {value.toLocaleString()}
        </span>
      ),
    },
    {
      title: 'Đã đặt',
      dataIndex: 'reserved_quantity',
      key: 'reserved_quantity',
      width: 100,
      render: (value: number) => (
        <span style={{ color: isDarkMode ? '#8c8c8c' : '#595959' }}>
          {value.toLocaleString()}
        </span>
      ),
    },
    {
      title: 'Khả dụng',
      key: 'available',
      width: 100,
      render: (_: any, record: InventoryItem) => {
        const available = record.quantity - record.reserved_quantity;
        return (
          <span style={{
            color: available <= 0 ? '#ff4d4f' : isDarkMode ? '#e6e6e6' : '#262626',
            fontWeight: 500
          }}>
            {available.toLocaleString()}
          </span>
        );
      },
    },
    {
      title: 'Giá trị',
      key: 'value',
      width: 120,
      sorter: (a, b) => (a.quantity * Number(a.price)) - (b.quantity * Number(b.price)),
      render: (_: any, record: InventoryItem) => {
        const value = record.quantity * Number(record.price);
        return (
          <span style={{ color: isDarkMode ? '#e6e6e6' : '#262626', fontWeight: 500 }}>
            {Math.round(value).toLocaleString('vi-VN')}₫
          </span>
        );
      },
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 120,
      filters: [
        { text: 'Hết hàng', value: 'out_of_stock' },
        { text: 'Sắp hết', value: 'low_stock' },
        { text: 'Còn hàng', value: 'in_stock' },
      ],
      onFilter: (value, record) => {
        if (value === 'out_of_stock') return record.quantity === 0;
        if (value === 'low_stock') return record.isLowStock && record.quantity > 0;
        if (value === 'in_stock') return !record.isLowStock && record.quantity > 0;
        return false;
      },
      render: (_: any, record: InventoryItem) => {
        if (record.quantity === 0) {
          return (
            <Tag color="error" style={{ fontWeight: 500 }}>
              Hết hàng
            </Tag>
          );
        }
        if (record.isLowStock) {
          return (
            <Tag color="warning" icon={<WarningOutlined />} style={{ fontWeight: 500 }}>
              Sắp hết
            </Tag>
          );
        }
        return (
          <Tag color="success" style={{ fontWeight: 500 }}>
            Còn hàng
          </Tag>
        );
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      fixed: 'right',
      width: 100,
      render: (_: any, record: InventoryItem) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'in',
                label: 'Nhập kho',
                icon: <ImportOutlined />,
                onClick: () => handleStockIn(record),
              },
              {
                key: 'out',
                label: 'Xuất kho',
                icon: <ExportOutlined />,
                onClick: () => handleStockOut(record),
              },
              {
                key: 'transfer',
                label: 'Chuyển kho',
                icon: <SwapOutlined />,
              },
            ],
          }}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div style={{
      padding: 24,
      background: isDarkMode ? '#000000' : '#f0f2f5',
      minHeight: '100vh'
    }}>
      {/* Stats Cards */}
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} md={12} lg={6}>
          <Card
            variant="borderless"
            style={{
              background: isDarkMode
                ? 'linear-gradient(135deg, #2d2d2d 0%, #3d3d3d 100%)'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: 8,
              boxShadow: isDarkMode
                ? '0 2px 8px rgba(0, 0, 0, 0.3)'
                : '0 2px 8px rgba(102, 126, 234, 0.15)',
              padding: 16,
              height: '100%'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 14,
                  color: '#ffffff',
                  marginBottom: 6,
                  whiteSpace: 'nowrap',
                  fontWeight: 500
                }}>
                  Tổng SKU
                </div>
                <div style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: '#ffffff'
                }}>
                  {stats.totalItems.toLocaleString()}
                </div>
                <div style={{
                  fontSize: 11,
                  color: '#ffffff',
                  marginTop: 4,
                  opacity: 0.85
                }}>
                  {stats.totalStock.toLocaleString()} sản phẩm
                </div>
              </div>
              <div style={{
                width: 48,
                height: 48,
                minWidth: 48,
                borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <InboxOutlined style={{ fontSize: 24, color: '#ffffff' }} />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={12} lg={6}>
          <Card
            variant="borderless"
            style={{
              background: isDarkMode
                ? 'linear-gradient(135deg, #2d2d2d 0%, #3d3d3d 100%)'
                : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              border: 'none',
              borderRadius: 8,
              boxShadow: isDarkMode
                ? '0 2px 8px rgba(0, 0, 0, 0.3)'
                : '0 2px 8px rgba(245, 87, 108, 0.15)',
              padding: 16,
              height: '100%'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 14,
                  color: '#ffffff',
                  marginBottom: 6,
                  whiteSpace: 'nowrap',
                  fontWeight: 500
                }}>
                  Cảnh báo
                </div>
                <div style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: '#ffffff'
                }}>
                  {stats.lowStockCount}
                </div>
                <div style={{
                  fontSize: 11,
                  color: '#ffffff',
                  marginTop: 4,
                  opacity: 0.85
                }}>
                  Sắp hết hàng
                </div>
              </div>
              <div style={{
                width: 48,
                height: 48,
                minWidth: 48,
                borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AlertOutlined style={{ fontSize: 24, color: '#ffffff' }} />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={12} lg={6}>
          <Card
            variant="borderless"
            style={{
              background: isDarkMode
                ? 'linear-gradient(135deg, #2d2d2d 0%, #3d3d3d 100%)'
                : 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              border: 'none',
              borderRadius: 8,
              boxShadow: isDarkMode
                ? '0 2px 8px rgba(0, 0, 0, 0.3)'
                : '0 2px 8px rgba(250, 112, 154, 0.15)',
              padding: 16,
              height: '100%'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 14,
                  color: '#ffffff',
                  marginBottom: 6,
                  whiteSpace: 'nowrap',
                  fontWeight: 500
                }}>
                  Hết hàng
                </div>
                <div style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: '#ffffff'
                }}>
                  {stats.outOfStockCount}
                </div>
                <div style={{
                  fontSize: 11,
                  color: '#ffffff',
                  marginTop: 4,
                  opacity: 0.85
                }}>
                  Cần nhập hàng
                </div>
              </div>
              <div style={{
                width: 48,
                height: 48,
                minWidth: 48,
                borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <WarningOutlined style={{ fontSize: 24, color: '#ffffff' }} />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={12} lg={6}>
          <Card
            variant="borderless"
            style={{
              background: isDarkMode
                ? 'linear-gradient(135deg, #2d2d2d 0%, #3d3d3d 100%)'
                : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              border: 'none',
              borderRadius: 8,
              boxShadow: isDarkMode
                ? '0 2px 8px rgba(0, 0, 0, 0.3)'
                : '0 2px 8px rgba(79, 172, 254, 0.15)',
              padding: 16,
              height: '100%'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 14,
                  color: '#ffffff',
                  marginBottom: 6,
                  whiteSpace: 'nowrap',
                  fontWeight: 500
                }}>
                  Giá trị kho
                </div>
                <div style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: '#ffffff',
                  wordBreak: 'break-word',
                  lineHeight: 1.2
                }}>
                  {Math.round(stats.totalValue).toLocaleString('vi-VN')}₫
                </div>
                <div style={{
                  fontSize: 11,
                  color: '#ffffff',
                  marginTop: 4,
                  opacity: 0.85
                }}>
                  {stats.totalReserved} đã đặt
                </div>
              </div>
              <div style={{
                width: 48,
                height: 48,
                minWidth: 48,
                borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <DollarOutlined style={{ fontSize: 24, color: '#ffffff' }} />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Main Card */}
      <Card
        variant="borderless"
        style={{
          background: isDarkMode ? '#141414' : '#ffffff',
          borderRadius: 12,
          boxShadow: isDarkMode
            ? '0 2px 8px rgba(0, 0, 0, 0.45)'
            : '0 2px 8px rgba(0, 0, 0, 0.09)',
          padding: 24
        }}
      >
        {/* Filters */}
        <div style={{
          marginBottom: 20,
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12
        }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 12,
            flex: '1 1 auto',
            minWidth: 0
          }}>
            <Input
              placeholder="Tìm sản phẩm, SKU, kho..."
              prefix={<SearchOutlined style={{ color: isDarkMode ? '#8c8c8c' : '#bfbfbf' }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{
                width: 280,
                background: isDarkMode ? '#1f1f1f' : '#ffffff',
                color: isDarkMode ? '#e6e6e6' : '#262626',
                borderColor: isDarkMode ? '#434343' : '#d9d9d9'
              }}
              size="large"
            />

            <Select
              placeholder="Kho"
              value={selectedWarehouse}
              onChange={setSelectedWarehouse}
              allowClear
              style={{ width: 180 }}
              size="large"
              classNames={{
                popup: isDarkMode ? 'dark-select-dropdown' : ''
              }}
            >
              {warehouses?.data?.map((wh: any) => (
                <Select.Option key={wh.id} value={wh.id}>
                  {wh.name}
                </Select.Option>
              ))}
            </Select>

            <Select
              placeholder="Trạng thái"
              value={selectedStatus}
              onChange={setSelectedStatus}
              allowClear
              style={{ width: 150 }}
              size="large"
              classNames={{
                popup: isDarkMode ? 'dark-select-dropdown' : ''
              }}
            >
              <Select.Option value="in_stock">Còn hàng</Select.Option>
              <Select.Option value="low_stock">Sắp hết</Select.Option>
              <Select.Option value="out_of_stock">Hết hàng</Select.Option>
            </Select>

            <Button
              onClick={handleReset}
              style={{
                color: isDarkMode ? '#d9d9d9' : '#8c8c8c',
                borderColor: isDarkMode ? '#595959' : '#d9d9d9',
                background: isDarkMode ? '#262626' : '#ffffff'
              }}
              size="large"
            >
              Đặt lại
            </Button>

            <Button
              icon={<ReloadOutlined />}
              onClick={() => refetch()}
              style={{
                color: isDarkMode ? '#d9d9d9' : '#8c8c8c',
                borderColor: isDarkMode ? '#595959' : '#d9d9d9',
                background: isDarkMode ? '#262626' : '#ffffff'
              }}
              size="large"
            >
              Làm mới
            </Button>
          </div>

          <Space size="middle">
            <Button
              type="primary"
              icon={<ImportOutlined />}
              size="large"
              onClick={() => {
                setBulkStockType('in');
                setIsBulkStockModalVisible(true);
              }}
              style={{
                background: 'linear-gradient(135deg, #00A6B8 0%, #26C6DA 100%)',
                border: 'none'
              }}
            >
              Nhập kho
            </Button>
            <Button
              type="primary"
              icon={<ExportOutlined />}
              size="large"
              onClick={() => {
                setBulkStockType('out');
                setIsBulkStockModalVisible(true);
              }}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none'
              }}
            >
              Xuất kho
            </Button>
          </Space>
        </div>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={filteredData}
          loading={isLoading}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} mục`,
            defaultPageSize: 20,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          style={{
            background: isDarkMode ? '#141414' : '#ffffff'
          }}
        />
      </Card>

      {/* Stock Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {stockModalType === 'in' ? (
              <>
                <ImportOutlined style={{ color: '#00A6B8' }} />
                <span>Nhập kho</span>
              </>
            ) : (
              <>
                <ExportOutlined style={{ color: '#667eea' }} />
                <span>Xuất kho</span>
              </>
            )}
          </div>
        }
        open={isStockModalVisible}
        onOk={handleStockSubmit}
        onCancel={() => {
          setIsStockModalVisible(false);
          form.resetFields();
          setSelectedItem(null);
        }}
        confirmLoading={stockMutation.isPending}
        okText={stockModalType === 'in' ? 'Nhập kho' : 'Xuất kho'}
        cancelText="Hủy"
        width={600}
        style={{ top: 20 }}
        styles={{
          body: {
            padding: 24,
            background: isDarkMode ? '#141414' : '#ffffff'
          }
        }}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
          {/* Product Info */}
          <div style={{
            background: isDarkMode ? '#1f1f1f' : '#f5f5f5',
            padding: 16,
            borderRadius: 8,
            marginBottom: 20
          }}>
            <div style={{
              fontWeight: 600,
              fontSize: 15,
              color: isDarkMode ? '#e6e6e6' : '#262626',
              marginBottom: 8
            }}>
              {selectedItem?.product_name}
            </div>
            <div style={{
              fontSize: 13,
              color: isDarkMode ? '#8c8c8c' : '#8c8c8c',
              marginBottom: 4
            }}>
              {selectedItem?.variant_name && `${selectedItem.variant_name} • `}
              SKU: {selectedItem?.variant_sku}
            </div>
            <div style={{
              fontSize: 13,
              color: isDarkMode ? '#8c8c8c' : '#8c8c8c',
              marginBottom: 8
            }}>
              Kho: {selectedItem?.warehouse_name}
            </div>

            <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 4 }}>
                  Tồn kho hiện tại
                </div>
                <div style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: selectedItem?.quantity === 0 ? '#ff4d4f' :
                         selectedItem?.isLowStock ? '#faad14' : '#52c41a'
                }}>
                  {selectedItem?.quantity?.toLocaleString() || 0}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 4 }}>
                  Đã đặt
                </div>
                <div style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: isDarkMode ? '#e6e6e6' : '#595959'
                }}>
                  {selectedItem?.reserved_quantity?.toLocaleString() || 0}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 4 }}>
                  Khả dụng
                </div>
                <div style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: isDarkMode ? '#e6e6e6' : '#262626'
                }}>
                  {((selectedItem?.quantity || 0) - (selectedItem?.reserved_quantity || 0)).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Quantity Input */}
          <Form.Item
            name="quantity"
            label={
              <span style={{ fontWeight: 500 }}>
                Số lượng {stockModalType === 'in' ? 'nhập' : 'xuất'}
              </span>
            }
            rules={[
              { required: true, message: 'Vui lòng nhập số lượng' },
              { type: 'number', min: 1, message: 'Số lượng phải lớn hơn 0' },
              stockModalType === 'out' ? {
                validator: (_, value) => {
                  const available = (selectedItem?.quantity || 0) - (selectedItem?.reserved_quantity || 0);
                  if (value > available) {
                    return Promise.reject(`Số lượng xuất không được vượt quá ${available}`);
                  }
                  return Promise.resolve();
                }
              } : {}
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              size="large"
              min={1}
              max={stockModalType === 'out' ? (selectedItem?.quantity || 0) - (selectedItem?.reserved_quantity || 0) : undefined}
              placeholder={`Nhập số lượng ${stockModalType === 'in' ? 'nhập kho' : 'xuất kho'}`}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value!.replace(/\$\s?|(,*)/g, '')}
            />
          </Form.Item>

          {/* Notes */}
          <Form.Item
            name="notes"
            label={<span style={{ fontWeight: 500 }}>Ghi chú</span>}
          >
            <Input.TextArea
              rows={3}
              placeholder="Nhập lý do hoặc ghi chú (không bắt buộc)"
              style={{
                background: isDarkMode ? '#1f1f1f' : '#ffffff',
                color: isDarkMode ? '#e6e6e6' : '#262626',
                borderColor: isDarkMode ? '#434343' : '#d9d9d9'
              }}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Bulk Stock Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {bulkStockType === 'in' ? (
              <>
                <ImportOutlined style={{ color: '#00A6B8' }} />
                <span>Nhập kho hàng loạt</span>
              </>
            ) : (
              <>
                <ExportOutlined style={{ color: '#667eea' }} />
                <span>Xuất kho hàng loạt</span>
              </>
            )}
          </div>
        }
        open={isBulkStockModalVisible}
        onOk={async () => {
          try {
            const values = await bulkForm.validateFields();

            if (!selectedBulkWarehouse) {
              message.error('Vui lòng chọn kho');
              return;
            }

            if (bulkItems.length === 0) {
              message.error('Vui lòng thêm ít nhất một sản phẩm');
              return;
            }

            await bulkStockMutation.mutateAsync({
              warehouseId: selectedBulkWarehouse,
              items: bulkItems,
              type: bulkStockType,
              notes: values.notes || ''
            });
          } catch (error) {
            console.error('Validation failed:', error);
          }
        }}
        onCancel={() => {
          setIsBulkStockModalVisible(false);
          bulkForm.resetFields();
          setSelectedBulkWarehouse(undefined);
          setBulkItems([]);
        }}
        confirmLoading={bulkStockMutation.isPending}
        okText={bulkStockType === 'in' ? 'Nhập kho' : 'Xuất kho'}
        cancelText="Hủy"
        width={900}
        style={{ top: 20 }}
        styles={{
          body: {
            padding: 24,
            background: isDarkMode ? '#141414' : '#ffffff',
            maxHeight: 'calc(100vh - 200px)',
            overflowY: 'auto'
          }
        }}
      >
        <Form form={bulkForm} layout="vertical">
          {/* Warehouse Selection */}
          <Form.Item
            label={<span style={{ fontWeight: 500 }}>Chọn kho</span>}
            required
          >
            <Select
              placeholder="Chọn kho để nhập/xuất"
              value={selectedBulkWarehouse}
              onChange={setSelectedBulkWarehouse}
              size="large"
              style={{ width: '100%' }}
              classNames={{
                popup: isDarkMode ? 'dark-select-dropdown' : ''
              }}
            >
              {warehouses?.data?.map((wh: any) => (
                <Select.Option key={wh.id} value={wh.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ShopOutlined />
                    <span>{wh.name}</span>
                  </div>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Divider />

          {/* Product Selection */}
          <div style={{ marginBottom: 16 }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12
            }}>
              <span style={{ fontWeight: 500, fontSize: 14 }}>
                Danh sách sản phẩm ({bulkItems.length})
              </span>
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() => {
                  bulkForm.setFieldsValue({
                    [`variant_${Date.now()}`]: undefined,
                    [`quantity_${Date.now()}`]: 1
                  });
                }}
              >
                Thêm sản phẩm
              </Button>
            </div>

            {/* Product List */}
            <div style={{
              background: isDarkMode ? '#1f1f1f' : '#fafafa',
              padding: 16,
              borderRadius: 8,
              minHeight: 200
            }}>
              {bulkItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#8c8c8c' }}>
                  <InboxOutlined style={{ fontSize: 48, marginBottom: 12 }} />
                  <div>Chưa có sản phẩm nào</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>
                    Nhấn "Thêm sản phẩm" để bắt đầu
                  </div>
                </div>
              ) : (
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  {bulkItems.map((item, index) => {
                    const inventoryItem = inventory?.data?.find(
                      (inv: InventoryItem) =>
                        inv.variant_id === item.variantId &&
                        inv.warehouse_id === selectedBulkWarehouse
                    );

                    return (
                      <div
                        key={index}
                        style={{
                          background: isDarkMode ? '#141414' : '#ffffff',
                          padding: 12,
                          borderRadius: 6,
                          border: `1px solid ${isDarkMode ? '#434343' : '#d9d9d9'}`
                        }}
                      >
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 500, marginBottom: 4 }}>
                              {inventoryItem?.product_name}
                            </div>
                            <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                              SKU: {inventoryItem?.variant_sku}
                              {' • '}
                              Tồn kho: {inventoryItem?.quantity || 0}
                            </div>
                          </div>
                          <div style={{ width: 120 }}>
                            <InputNumber
                              value={item.quantity}
                              onChange={(value) => {
                                const newItems = [...bulkItems];
                                newItems[index].quantity = value || 1;
                                setBulkItems(newItems);
                              }}
                              min={1}
                              style={{ width: '100%' }}
                              placeholder="Số lượng"
                            />
                          </div>
                          <Button
                            type="text"
                            danger
                            icon={<WarningOutlined />}
                            onClick={() => {
                              setBulkItems(bulkItems.filter((_, i) => i !== index));
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </Space>
              )}
            </div>

            {/* Add Product Form */}
            {selectedBulkWarehouse && (
              <div style={{
                marginTop: 12,
                background: isDarkMode ? '#1f1f1f' : '#f5f5f5',
                padding: 12,
                borderRadius: 6
              }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Select
                    placeholder="Chọn sản phẩm"
                    style={{ flex: 1 }}
                    showSearch
                    filterOption={(input, option: any) => {
                      const item = inventory?.data?.find(
                        (inv: InventoryItem) => inv.variant_id === option.value
                      );
                      return (
                        item?.product_name?.toLowerCase().includes(input.toLowerCase()) ||
                        item?.variant_sku?.toLowerCase().includes(input.toLowerCase())
                      );
                    }}
                    onChange={(variantId) => {
                      if (!bulkItems.find(item => item.variantId === variantId)) {
                        setBulkItems([...bulkItems, { variantId, quantity: 1 }]);
                      } else {
                        message.warning('Sản phẩm đã được thêm');
                      }
                    }}
                    value={null}
                    classNames={{
                      popup: isDarkMode ? 'dark-select-dropdown' : ''
                    }}
                  >
                    {inventory?.data
                      ?.filter((inv: InventoryItem) => inv.warehouse_id === selectedBulkWarehouse)
                      ?.map((inv: InventoryItem) => (
                        <Select.Option key={inv.variant_id} value={inv.variant_id}>
                          <div>
                            <div>{inv.product_name}</div>
                            <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                              SKU: {inv.variant_sku} • Tồn: {inv.quantity}
                            </div>
                          </div>
                        </Select.Option>
                      ))}
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <Form.Item
            name="notes"
            label={<span style={{ fontWeight: 500 }}>Ghi chú</span>}
          >
            <Input.TextArea
              rows={3}
              placeholder="Nhập lý do hoặc ghi chú (không bắt buộc)"
              style={{
                background: isDarkMode ? '#1f1f1f' : '#ffffff',
                color: isDarkMode ? '#e6e6e6' : '#262626',
                borderColor: isDarkMode ? '#434343' : '#d9d9d9'
              }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Inventory;