import { useState, useMemo } from 'react';
import { Table, Card, Tag, Button, Input, Select, Space, Row, Col, Badge, Dropdown, Modal, Form, InputNumber, message } from 'antd';
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
  const [form] = Form.useForm();

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
      return api.post(`/inventory/${data.id}/adjust`, {
        quantity: data.quantity,
        type: data.type,
        reason: data.reason
      });
    },
    onSuccess: () => {
      message.success('Cập nhật tồn kho thành công');
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-low-stock'] });
      setIsStockModalVisible(false);
      form.resetFields();
    },
    onError: () => {
      message.error('Cập nhật tồn kho thất bại');
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
          id: selectedItem.id,
          quantity: values.quantity,
          type: stockModalType,
          reason: values.reason
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
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            variant="borderless"
            style={{
              background: isDarkMode
                ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: 12,
              boxShadow: isDarkMode
                ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                : '0 4px 12px rgba(102, 126, 234, 0.2)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{
                  fontSize: 14,
                  color: 'rgba(255, 255, 255, 0.85)',
                  marginBottom: 8
                }}>
                  Tổng SKU
                </div>
                <div style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: '#ffffff'
                }}>
                  {stats.totalItems.toLocaleString()}
                </div>
                <div style={{
                  fontSize: 12,
                  color: 'rgba(255, 255, 255, 0.65)',
                  marginTop: 4
                }}>
                  {stats.totalStock.toLocaleString()} sản phẩm
                </div>
              </div>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <InboxOutlined style={{ fontSize: 28, color: '#ffffff' }} />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            variant="borderless"
            style={{
              background: isDarkMode
                ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
                : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              border: 'none',
              borderRadius: 12,
              boxShadow: isDarkMode
                ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                : '0 4px 12px rgba(245, 87, 108, 0.2)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{
                  fontSize: 14,
                  color: 'rgba(255, 255, 255, 0.85)',
                  marginBottom: 8
                }}>
                  Cảnh báo tồn kho
                </div>
                <div style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: '#ffffff'
                }}>
                  <Badge count={stats.lowStockCount} style={{ background: '#faad14' }}>
                    <span style={{ color: '#ffffff' }}>{stats.lowStockCount}</span>
                  </Badge>
                </div>
                <div style={{
                  fontSize: 12,
                  color: 'rgba(255, 255, 255, 0.65)',
                  marginTop: 4
                }}>
                  Sắp hết hàng
                </div>
              </div>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AlertOutlined style={{ fontSize: 28, color: '#ffffff' }} />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            variant="borderless"
            style={{
              background: isDarkMode
                ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
                : 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              border: 'none',
              borderRadius: 12,
              boxShadow: isDarkMode
                ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                : '0 4px 12px rgba(250, 112, 154, 0.2)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{
                  fontSize: 14,
                  color: 'rgba(255, 255, 255, 0.85)',
                  marginBottom: 8
                }}>
                  Hết hàng
                </div>
                <div style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: '#ffffff'
                }}>
                  {stats.outOfStockCount}
                </div>
                <div style={{
                  fontSize: 12,
                  color: 'rgba(255, 255, 255, 0.65)',
                  marginTop: 4
                }}>
                  Cần nhập hàng
                </div>
              </div>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <WarningOutlined style={{ fontSize: 28, color: '#ffffff' }} />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            variant="borderless"
            style={{
              background: isDarkMode
                ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
                : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              border: 'none',
              borderRadius: 12,
              boxShadow: isDarkMode
                ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                : '0 4px 12px rgba(79, 172, 254, 0.2)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{
                  fontSize: 14,
                  color: 'rgba(255, 255, 255, 0.85)',
                  marginBottom: 8
                }}>
                  Giá trị tồn kho
                </div>
                <div style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: '#ffffff',
                  wordBreak: 'break-all'
                }}>
                  {Math.round(stats.totalValue).toLocaleString('vi-VN')}₫
                </div>
                <div style={{
                  fontSize: 12,
                  color: 'rgba(255, 255, 255, 0.65)',
                  marginTop: 4
                }}>
                  {stats.totalReserved} đã đặt
                </div>
              </div>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <DollarOutlined style={{ fontSize: 28, color: '#ffffff' }} />
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
        title={stockModalType === 'in' ? 'Nhập kho' : 'Xuất kho'}
        open={isStockModalVisible}
        onOk={handleStockSubmit}
        onCancel={() => {
          setIsStockModalVisible(false);
          form.resetFields();
        }}
        confirmLoading={stockMutation.isPending}
        style={{ top: 20 }}
        styles={{
          body: {
            padding: 24,
            background: isDarkMode ? '#141414' : '#ffffff'
          }
        }}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
          <Form.Item label="Sản phẩm">
            <div>
              <div style={{ fontWeight: 500 }}>{selectedItem?.product_name}</div>
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                SKU: {selectedItem?.variant_sku} | Kho: {selectedItem?.warehouse_name}
              </div>
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                Tồn kho hiện tại: {selectedItem?.quantity}
              </div>
            </div>
          </Form.Item>

          <Form.Item
            name="quantity"
            label="Số lượng"
            rules={[
              { required: true, message: 'Vui lòng nhập số lượng' },
              { type: 'number', min: 1, message: 'Số lượng phải lớn hơn 0' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={1}
              placeholder="Nhập số lượng"
            />
          </Form.Item>

          <Form.Item
            name="reason"
            label="Lý do"
          >
            <Input.TextArea
              rows={3}
              placeholder="Nhập lý do (tùy chọn)"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Inventory;