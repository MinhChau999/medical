import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Upload,
  Button,
  Space,
  Row,
  Col,
  message,
  Spin,
  Card,
  Divider,
  Typography,
  Badge,
  Tooltip,
  Steps
} from 'antd';
import {
  PlusOutlined,
  PictureOutlined,
  InfoCircleOutlined,
  DollarOutlined,
  InboxOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload';
import type { RcFile } from 'antd/es/upload/interface';
import { categoriesService } from '@/services/categories';
import { productsService } from '@/services/products';
import { uploadService } from '@/services/upload';
import type { Product } from '@/types/product';
import type { Category } from '@/services/categories';

const { TextArea } = Input;
const { Option } = Select;
const { Text, Title } = Typography;

interface ProductModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  product?: Product | null;
  mode: 'create' | 'edit';
}

export const ProductModal: React.FC<ProductModalProps> = ({
  visible,
  onCancel,
  onSuccess,
  product,
  mode
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [imageList, setImageList] = useState<UploadFile[]>([]);
  const [previewImage, setPreviewImage] = useState('');
  const [previewVisible, setPreviewVisible] = useState(false);

  // Load categories
  useEffect(() => {
    loadCategories();
  }, []);

  // Load product data for edit mode
  useEffect(() => {
    if (mode === 'edit' && product) {
      form.setFieldsValue({
        ...product,
        categoryId: product.category?.id
      });
      
      // Load existing images
      if (product.images && product.images.length > 0) {
        const existingImages: UploadFile[] = product.images.map((url, index) => ({
          uid: `-${index}`,
          name: `Image ${index + 1}`,
          status: 'done',
          url: url,
          thumbUrl: url
        }));
        setImageList(existingImages);
      }
    } else {
      form.resetFields();
      setImageList([]);
    }
  }, [product, mode, form]);

  const loadCategories = async () => {
    try {
      const data = await categoriesService.getCategories();
      setCategories(data);
    } catch (error) {
      message.error('Failed to load categories');
    }
  };

  // Convert file to base64 for preview
  const getBase64 = (file: RcFile): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });

  // Handle image upload
  const handleUpload = async (file: RcFile): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const response = await uploadService.uploadProductImage(formData);
      return response.url;
    } catch (error) {
      message.error('Failed to upload image');
      throw error;
    }
  };

  // Custom upload request
  const customRequest: UploadProps['customRequest'] = async ({ file, onSuccess, onError }) => {
    try {
      setUploading(true);
      const url = await handleUpload(file as RcFile);
      onSuccess?.({ url });
    } catch (error) {
      onError?.(error as Error);
    } finally {
      setUploading(false);
    }
  };

  // Before upload validation
  const beforeUpload = (file: RcFile) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('You can only upload image files!');
      return false;
    }
    
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('Image must be smaller than 5MB!');
      return false;
    }
    
    return true;
  };

  // Handle form submission
  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      
      // Collect image URLs
      const imageUrls = imageList
        .filter(file => file.status === 'done')
        .map(file => file.response?.url || file.url)
        .filter(Boolean);

      const productData = {
        ...values,
        images: imageUrls,
        price: parseFloat(values.price),
        stockQuantity: parseInt(values.stockQuantity || 0),
        reorderLevel: parseInt(values.reorderLevel || 10),
        status: values.status ? 'active' : 'inactive'
      };

      if (mode === 'edit' && product) {
        await productsService.updateProduct(product.id, productData);
        message.success('Product updated successfully');
      } else {
        await productsService.createProduct(productData);
        message.success('Product created successfully');
      }
      
      onSuccess();
      handleClose();
    } catch (error: any) {
      message.error(error.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.resetFields();
    setImageList([]);
    setPreviewImage('');
    setPreviewVisible(false);
    onCancel();
  };

  // Handle image preview
  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as RcFile);
    }
    setPreviewImage(file.url || file.preview || '');
    setPreviewVisible(true);
  };

  // Handle image removal
  const handleRemove = (file: UploadFile) => {
    const newList = imageList.filter(item => item.uid !== file.uid);
    setImageList(newList);
  };

  const uploadButton = (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <PlusOutlined style={{ fontSize: 16, marginBottom: 8, color: '#8c8c8c' }} />
      <div style={{ color: '#8c8c8c', fontSize: 14 }}>Upload Photo</div>
    </div>
  );

  return (
    <>
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              {mode === 'edit' ? <PictureOutlined /> : <PlusOutlined />}
            </div>
            <div>
              <Title level={4} style={{ margin: 0, color: '#262626' }}>
                {mode === 'edit' ? 'Edit Product' : 'Create New Product'}
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {mode === 'edit' ? 'Update product information' : 'Add a new product to your inventory'}
              </Text>
            </div>
          </div>
        }
        open={visible}
        onCancel={handleClose}
        width={800}
        style={{ top: 20 }}
        styles={{
          body: { 
            padding: 0,
            maxHeight: 'calc(100vh - 200px)',
            overflow: 'hidden'
          },
          header: { 
            borderBottom: '1px solid #f0f0f0', 
            marginBottom: 0,
            padding: '20px 24px'
          }
        }}
        footer={[
          <Button key="cancel" onClick={handleClose} size="large">
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            size="large"
            loading={loading}
            onClick={() => form.submit()}
            icon={mode === 'edit' ? <CheckCircleOutlined /> : <PlusOutlined />}
          >
            {mode === 'edit' ? 'Update Product' : 'Create Product'}
          </Button>
        ]}
      >
        <div style={{ 
          maxHeight: 'calc(100vh - 200px)', 
          overflowY: 'auto',
          padding: '24px'
        }}>
          <Spin spinning={loading || uploading}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              autoComplete="off"
              size="large"
            >
              {/* Basic Information Section */}
              <Card 
                size="small" 
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <InfoCircleOutlined style={{ color: '#1890ff' }} />
                    <Text strong>Basic Information</Text>
                  </div>
                }
                style={{ marginBottom: 20, border: '1px solid #f0f0f0' }}
                bodyStyle={{ padding: '16px 20px' }}
              >
                <Row gutter={[20, 16]}>
                  <Col span={24}>
                    <Form.Item
                      name="name"
                      label={<Text strong>Product Name</Text>}
                      rules={[
                        { required: true, message: 'Product name is required' },
                        { min: 2, message: 'Product name must be at least 2 characters' },
                        { max: 100, message: 'Product name must be less than 100 characters' }
                      ]}
                    >
                      <Input placeholder="Enter product name" showCount maxLength={100} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="sku"
                      label={<Text strong>SKU</Text>}
                      rules={[
                        { required: true, message: 'SKU is required' },
                        { pattern: /^[A-Z0-9-]+$/, message: 'SKU must contain only uppercase letters, numbers, and hyphens' },
                        { min: 3, message: 'SKU must be at least 3 characters' },
                        { max: 20, message: 'SKU must be less than 20 characters' }
                      ]}
                    >
                      <Input placeholder="e.g. MED-001" showCount maxLength={20} style={{ textTransform: 'uppercase' }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="categoryId"
                      label={<Text strong>Category</Text>}
                      rules={[{ required: true, message: 'Please select category' }]}
                    >
                      <Select placeholder="Select category" showSearch>
                        {categories.map(category => (
                          <Option key={category.id} value={category.id}>
                            {category.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="brand"
                      label={<Text strong>Brand</Text>}
                    >
                      <Input placeholder="Brand name" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="unit"
                      label={<Text strong>Unit</Text>}
                    >
                      <Select placeholder="Select unit">
                        <Option value="piece">Piece</Option>
                        <Option value="box">Box</Option>
                        <Option value="bottle">Bottle</Option>
                        <Option value="pack">Pack</Option>
                        <Option value="roll">Roll</Option>
                        <Option value="kg">Kilogram</Option>
                        <Option value="liter">Liter</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item
                      name="description"
                      label={<Text strong>Description</Text>}
                    >
                      <TextArea
                        rows={3}
                        placeholder="Product description"
                        showCount
                        maxLength={500}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              {/* Pricing & Inventory Section */}
              <Card 
                size="small" 
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <DollarOutlined style={{ color: '#52c41a' }} />
                    <Text strong>Pricing & Inventory</Text>
                  </div>
                }
                style={{ marginBottom: 20, border: '1px solid #f0f0f0' }}
                bodyStyle={{ padding: '16px 20px' }}
              >
                <Row gutter={[20, 16]}>
                  <Col span={8}>
                    <Form.Item
                      name="price"
                      label={<Text strong>Price</Text>}
                      rules={[
                        { required: true, message: 'Price is required' },
                        { type: 'number', min: 0.01, message: 'Price must be greater than $0' },
                        { type: 'number', max: 999999.99, message: 'Price must be less than $1,000,000' }
                      ]}
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => value?.replace(/\$\s?|(,*)/g, '') || ''}
                        min={0}
                        max={999999.99}
                        step={0.01}
                        placeholder="0.00"
                        precision={2}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="stockQuantity"
                      label={<Text strong>Stock Quantity</Text>}
                      rules={[
                        { required: true, message: 'Stock quantity is required' },
                        { type: 'number', min: 0, message: 'Stock quantity must be 0 or greater' },
                        { type: 'number', max: 999999, message: 'Stock quantity must be less than 1,000,000' }
                      ]}
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        min={0}
                        max={999999}
                        placeholder="0"
                        precision={0}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="reorderLevel"
                      label={<Text strong>Reorder Level</Text>}
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        min={0}
                        placeholder="10"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              {/* Product Images Section */}
              <Card 
                size="small" 
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <PictureOutlined style={{ color: '#722ed1' }} />
                    <Text strong>Product Images</Text>
                  </div>
                }
                style={{ marginBottom: 20, border: '1px solid #f0f0f0' }}
                bodyStyle={{ padding: '20px' }}
              >
                <Upload
                  listType="picture-card"
                  fileList={imageList}
                  customRequest={customRequest}
                  beforeUpload={beforeUpload}
                  onPreview={handlePreview}
                  onRemove={handleRemove}
                  onChange={({ fileList }) => setImageList(fileList)}
                  maxCount={5}
                  style={{ width: '100%' }}
                >
                  {imageList.length >= 5 ? null : (
                    <div style={{ padding: '20px', textAlign: 'center' }}>
                      <PlusOutlined style={{ fontSize: 20, marginBottom: 8, color: '#8c8c8c' }} />
                      <div style={{ color: '#8c8c8c', fontSize: 14 }}>
                        Upload Photos
                        <div style={{ fontSize: 12, color: '#bfbfbf', marginTop: 4 }}>
                          Max 5 images, 5MB each
                        </div>
                      </div>
                    </div>
                  )}
                </Upload>
              </Card>

              {/* Status Section */}
              <Card 
                size="small" 
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircleOutlined style={{ color: '#fa8c16' }} />
                    <Text strong>Status</Text>
                  </div>
                }
                style={{ marginBottom: 0, border: '1px solid #f0f0f0' }}
                bodyStyle={{ padding: '16px 20px' }}
              >
                <Row>
                  <Col span={12}>
                    <Form.Item
                      name="status"
                      label={<Text strong>Product Status</Text>}
                      valuePropName="checked"
                      style={{ marginBottom: 0 }}
                    >
                      <Switch
                        checkedChildren="Active"
                        unCheckedChildren="Inactive"
                        defaultChecked
                        size="default"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Form>
          </Spin>
        </div>
      </Modal>

      {/* Image preview modal */}
      <Modal
        open={previewVisible}
        title="Image Preview"
        footer={null}
        onCancel={() => setPreviewVisible(false)}
      >
        <img alt="preview" style={{ width: '100%' }} src={previewImage} />
      </Modal>
    </>
  );
};