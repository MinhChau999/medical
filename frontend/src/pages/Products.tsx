import { useState } from 'react';
import { Table, Button, Space, Card, Input, Select, Tag, Modal, Form, InputNumber, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

const { Search } = Input;

const Products = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['products', searchTerm, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      params.append('limit', '20');
      
      const response = await api.get(`/products?${params}`);
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      if (editingProduct) {
        return api.put(`/products/${editingProduct.id}`, values);
      }
      return api.post('/products', values);
    },
    onSuccess: () => {
      message.success(editingProduct ? 'Product updated!' : 'Product created!');
      setIsModalOpen(false);
      form.resetFields();
      setEditingProduct(null);
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => {
      message.success('Product deleted!');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const columns = [
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      width: 120,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontWeight: 500 }}>{text}</span>
          <span style={{ fontSize: 12, color: '#999' }}>{record.category_name || 'Uncategorized'}</span>
        </Space>
      ),
    },
    {
      title: 'Brand',
      dataIndex: 'brand_name',
      key: 'brand_name',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: any = {
          active: 'green',
          inactive: 'red',
          draft: 'orange',
          out_of_stock: 'gray',
        };
        return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Stock',
      key: 'stock',
      render: (_: any, record: any) => {
        const stock = record.variants?.[0]?.stock_quantity || 0;
        return (
          <span style={{ color: stock <= 10 ? 'red' : 'inherit' }}>
            {stock}
          </span>
        );
      },
    },
    {
      title: 'Price',
      key: 'price',
      render: (_: any, record: any) => {
        const price = record.variants?.[0]?.price || 0;
        return `₫${Number(price).toLocaleString()}`;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
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

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    form.setFieldsValue({
      sku: product.sku,
      name: product.name,
      description: product.description,
      status: product.status,
      price: product.variants?.[0]?.price,
      cost: product.variants?.[0]?.cost,
      stockQuantity: product.variants?.[0]?.stock_quantity,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Delete Product',
      content: 'Are you sure you want to delete this product?',
      onOk: () => deleteMutation.mutate(id),
    });
  };

  const handleSubmit = (values: any) => {
    createMutation.mutate(values);
  };

  return (
    <div style={{ padding: 24 }}>
      <Card className="product-card">
        <div style={{ padding: 20 }}>
        <div className="table-operations">
          <Space>
            <Search
              placeholder="Search products..."
              allowClear
              onSearch={setSearchTerm}
              style={{ width: 300 }}
            />
            <Select
              placeholder="Status"
              allowClear
              style={{ width: 150 }}
              onChange={setStatusFilter}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'draft', label: 'Draft' },
                { value: 'out_of_stock', label: 'Out of Stock' },
              ]}
            />
          </Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingProduct(null);
              form.resetFields();
              setIsModalOpen(true);
            }}
          >
            Add Product
          </Button>
        </div>
        </div>

        <Table
          columns={columns}
          dataSource={data?.data || []}
          loading={isLoading}
          rowKey="id"
          pagination={{
            total: data?.pagination?.totalCount,
            pageSize: data?.pagination?.limit,
            current: data?.pagination?.page,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} products`,
          }}
          style={{ marginTop: 0 }}
        />
      </Card>

      <Modal
        title={editingProduct ? 'Edit Product' : 'Add Product'}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="sku"
            label="SKU"
            rules={[{ required: true, message: 'Please enter SKU' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="name"
            label="Product Name"
            rules={[{ required: true, message: 'Please enter product name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item
            name="status"
            label="Status"
            initialValue="draft"
          >
            <Select
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'draft', label: 'Draft' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="price"
            label="Price (VND)"
            rules={[{ required: true, message: 'Please enter price' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            />
          </Form.Item>
          <Form.Item
            name="cost"
            label="Cost (VND)"
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            />
          </Form.Item>
          <Form.Item
            name="stockQuantity"
            label="Stock Quantity"
          >
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
                {editingProduct ? 'Update' : 'Create'}
              </Button>
              <Button onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Products;