import { useState, useMemo } from 'react';
import { Table, Card, Tag, Button, Input, Select, Space, Row, Col, Modal, Form, message, Avatar, Dropdown } from 'antd';
import {
  SearchOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  DollarOutlined,
  ShoppingOutlined,
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  MoreOutlined,
  TeamOutlined,
  TrophyOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useThemeStore } from '@/stores/themeStore';
import api from '@/services/api';
import type { ColumnsType } from 'antd/es/table';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  total_orders: number;
  total_spent: number;
  last_order_date: string;
  status: 'active' | 'inactive';
  customer_type: 'regular' | 'vip' | 'wholesale';
  created_at: string;
}

const Customers = () => {
  const { isDarkMode } = useThemeStore();
  const queryClient = useQueryClient();

  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState<string | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [form] = Form.useForm();

  // Fetch customers
  const { data: customers, isLoading, refetch } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const response = await api.get('/customers');
      return response.data;
    },
  });

  // Calculate stats
  const stats = useMemo(() => {
    const items = customers?.data || [];
    const totalCustomers = items.length;
    const activeCustomers = items.filter((c: Customer) => c.status === 'active').length;
    const vipCustomers = items.filter((c: Customer) => c.customer_type === 'vip').length;
    const totalRevenue = items.reduce((sum: number, c: Customer) => sum + Number(c.total_spent || 0), 0);

    return { totalCustomers, activeCustomers, vipCustomers, totalRevenue };
  }, [customers]);

  // Filter data
  const filteredData = useMemo(() => {
    let data = customers?.data || [];

    if (searchText) {
      const search = searchText.toLowerCase();
      data = data.filter((customer: Customer) =>
        customer.name?.toLowerCase().includes(search) ||
        customer.email?.toLowerCase().includes(search) ||
        customer.phone?.toLowerCase().includes(search)
      );
    }

    if (selectedType) {
      data = data.filter((customer: Customer) => customer.customer_type === selectedType);
    }

    if (selectedStatus) {
      data = data.filter((customer: Customer) => customer.status === selectedStatus);
    }

    return data;
  }, [customers, searchText, selectedType, selectedStatus]);

  const handleReset = () => {
    setSearchText('');
    setSelectedType(undefined);
    setSelectedStatus(undefined);
  };

  const handleViewDetail = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDetailModalVisible(true);
  };

  const columns: ColumnsType<Customer> = [
    {
      title: 'Khách hàng',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Customer) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar
            size={40}
            style={{
              background: record.customer_type === 'vip'
                ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                : record.customer_type === 'wholesale'
                ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}
          >
            {text?.charAt(0)?.toUpperCase()}
          </Avatar>
          <div>
            <div style={{
              fontWeight: 500,
              color: isDarkMode ? '#e6e6e6' : '#262626',
              marginBottom: 2
            }}>
              {text}
            </div>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>
              <MailOutlined style={{ marginRight: 4 }} />
              {record.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      width: 140,
      render: (text: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <PhoneOutlined style={{ color: '#52c41a' }} />
          <span style={{ color: isDarkMode ? '#e6e6e6' : '#262626' }}>{text}</span>
        </div>
      ),
    },
    {
      title: 'Loại KH',
      dataIndex: 'customer_type',
      key: 'customer_type',
      width: 120,
      filters: [
        { text: 'VIP', value: 'vip' },
        { text: 'Bán sỉ', value: 'wholesale' },
        { text: 'Thường', value: 'regular' },
      ],
      onFilter: (value, record) => record.customer_type === value,
      render: (type: string) => {
        const config = {
          vip: { color: 'error', icon: <TrophyOutlined />, text: 'VIP' },
          wholesale: { color: 'processing', icon: <TeamOutlined />, text: 'Bán sỉ' },
          regular: { color: 'default', icon: <UserOutlined />, text: 'Thường' }
        };
        const { color, icon, text } = config[type as keyof typeof config] || config.regular;
        return (
          <Tag color={color} icon={icon} style={{ fontWeight: 500 }}>
            {text}
          </Tag>
        );
      },
    },
    {
      title: 'Đơn hàng',
      dataIndex: 'total_orders',
      key: 'total_orders',
      width: 100,
      sorter: (a, b) => a.total_orders - b.total_orders,
      render: (value: number) => (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: isDarkMode ? '#e6e6e6' : '#262626',
          fontWeight: 600
        }}>
          <ShoppingOutlined style={{ color: '#1890ff' }} />
          {value || 0}
        </div>
      ),
    },
    {
      title: 'Tổng chi tiêu',
      dataIndex: 'total_spent',
      key: 'total_spent',
      width: 140,
      sorter: (a, b) => Number(a.total_spent) - Number(b.total_spent),
      render: (value: number) => (
        <div style={{
          fontWeight: 600,
          color: value > 5000000 ? '#52c41a' : isDarkMode ? '#e6e6e6' : '#262626'
        }}>
          {Math.round(Number(value || 0)).toLocaleString('vi-VN')}₫
        </div>
      ),
    },
    {
      title: 'Đơn cuối',
      dataIndex: 'last_order_date',
      key: 'last_order_date',
      width: 130,
      render: (date: string) => (
        <div style={{ fontSize: 13, color: '#8c8c8c' }}>
          <ClockCircleOutlined style={{ marginRight: 4 }} />
          {date ? new Date(date).toLocaleDateString('vi-VN') : '-'}
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      filters: [
        { text: 'Hoạt động', value: 'active' },
        { text: 'Ngừng', value: 'inactive' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'success' : 'default'} style={{ fontWeight: 500 }}>
          {status === 'active' ? 'Hoạt động' : 'Ngừng'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      fixed: 'right',
      width: 100,
      render: (_: any, record: Customer) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'view',
                label: 'Xem chi tiết',
                icon: <EyeOutlined />,
                onClick: () => handleViewDetail(record),
              },
              {
                key: 'edit',
                label: 'Chỉnh sửa',
                icon: <EditOutlined />,
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
                  Tổng KH
                </div>
                <div style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: '#ffffff'
                }}>
                  {stats.totalCustomers}
                </div>
                <div style={{
                  fontSize: 11,
                  color: '#ffffff',
                  marginTop: 4,
                  opacity: 0.85
                }}>
                  Khách hàng
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
                <TeamOutlined style={{ fontSize: 24, color: '#ffffff' }} />
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
                  Hoạt động
                </div>
                <div style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: '#ffffff'
                }}>
                  {stats.activeCustomers}
                </div>
                <div style={{
                  fontSize: 11,
                  color: '#ffffff',
                  marginTop: 4,
                  opacity: 0.85
                }}>
                  Đang hoạt động
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
                <UserOutlined style={{ fontSize: 24, color: '#ffffff' }} />
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
                  VIP
                </div>
                <div style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: '#ffffff'
                }}>
                  {stats.vipCustomers}
                </div>
                <div style={{
                  fontSize: 11,
                  color: '#ffffff',
                  marginTop: 4,
                  opacity: 0.85
                }}>
                  Khách VIP
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
                <TrophyOutlined style={{ fontSize: 24, color: '#ffffff' }} />
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
                  Doanh thu
                </div>
                <div style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: '#ffffff',
                  wordBreak: 'break-word',
                  lineHeight: 1.2
                }}>
                  {Math.round(stats.totalRevenue).toLocaleString('vi-VN')}₫
                </div>
                <div style={{
                  fontSize: 11,
                  color: '#ffffff',
                  marginTop: 4,
                  opacity: 0.85
                }}>
                  Tổng chi tiêu
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
              placeholder="Tìm theo tên, email, SĐT..."
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
              placeholder="Loại KH"
              value={selectedType}
              onChange={setSelectedType}
              allowClear
              style={{ width: 150 }}
              size="large"
              classNames={{
                popup: isDarkMode ? 'dark-select-dropdown' : ''
              }}
            >
              <Select.Option value="vip">VIP</Select.Option>
              <Select.Option value="wholesale">Bán sỉ</Select.Option>
              <Select.Option value="regular">Thường</Select.Option>
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
              <Select.Option value="active">Hoạt động</Select.Option>
              <Select.Option value="inactive">Ngừng</Select.Option>
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
          </div>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => setIsModalVisible(true)}
            style={{
              background: 'linear-gradient(135deg, #00A6B8 0%, #26C6DA 100%)',
              border: 'none'
            }}
          >
            Thêm khách hàng
          </Button>
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
            showTotal: (total) => `Tổng ${total} khách hàng`,
            defaultPageSize: 20,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          style={{
            background: isDarkMode ? '#141414' : '#ffffff'
          }}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EyeOutlined style={{ color: '#00A6B8' }} />
            <span>Chi tiết khách hàng</span>
          </div>
        }
        open={isDetailModalVisible}
        onCancel={() => {
          setIsDetailModalVisible(false);
          setSelectedCustomer(null);
        }}
        footer={null}
        width={700}
        style={{ top: 20 }}
        styles={{
          body: {
            padding: 24,
            background: isDarkMode ? '#141414' : '#ffffff'
          }
        }}
      >
        {selectedCustomer && (
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              marginBottom: 24,
              padding: 20,
              background: isDarkMode ? '#1f1f1f' : '#f5f5f5',
              borderRadius: 8
            }}>
              <Avatar
                size={64}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}
              >
                {selectedCustomer.name?.charAt(0)?.toUpperCase()}
              </Avatar>
              <div>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
                  {selectedCustomer.name}
                </div>
                <div style={{ fontSize: 13, color: '#8c8c8c' }}>
                  {selectedCustomer.email}
                </div>
              </div>
            </div>

            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>
                    Số điện thoại
                  </div>
                  <div style={{ fontWeight: 500 }}>{selectedCustomer.phone}</div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>
                    Loại khách hàng
                  </div>
                  <div style={{ fontWeight: 500 }}>
                    {selectedCustomer.customer_type === 'vip' ? 'VIP' :
                     selectedCustomer.customer_type === 'wholesale' ? 'Bán sỉ' : 'Thường'}
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>
                    Tổng đơn hàng
                  </div>
                  <div style={{ fontWeight: 500, color: '#1890ff' }}>
                    {selectedCustomer.total_orders || 0} đơn
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>
                    Tổng chi tiêu
                  </div>
                  <div style={{ fontWeight: 600, color: '#52c41a' }}>
                    {Math.round(Number(selectedCustomer.total_spent || 0)).toLocaleString('vi-VN')}₫
                  </div>
                </div>
              </Col>
              <Col span={24}>
                <div>
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>
                    Địa chỉ
                  </div>
                  <div style={{ fontWeight: 500 }}>{selectedCustomer.address || '-'}</div>
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Customers;
