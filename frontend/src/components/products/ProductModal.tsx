import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Upload,
  Button,
  Row,
  Col,
  message,
  Spin,
  Typography,
  DatePicker
} from 'antd';
import {
  PlusOutlined,
  PictureOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  CameraOutlined
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
const { Text } = Typography;

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
  const [mainImageUploading, setMainImageUploading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [imageList, setImageList] = useState<UploadFile[]>([]);
  const [image, setImage] = useState<string>('');
  const [previewImage, setPreviewImage] = useState('');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [statusToggle, setStatusToggle] = useState(true);

  // Load categories
  useEffect(() => {
    loadCategories();
  }, []);

  // Load product data for edit mode
  useEffect(() => {
    if (!visible) return; // Only run when modal is visible

    if (mode === 'edit' && product) {
      form.setFieldsValue({
        ...product,
        categoryId: product.category?.id
      });

      // Set status toggle state
      setStatusToggle(product.status === 'active');

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
      // Set main image
      if (product.image) {
        setImage(product.image);
      } else if (product.images && product.images.length > 0) {
        setImage(product.images[0]);
      }
    } else if (mode === 'create') {
      form.resetFields();
      setImageList([]);
      setImage('');
      setStatusToggle(true); // Reset to active for new products
    }
  }, [product, mode, form, visible]);

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

  // Handle main image upload
  const handleMainImageUpload = async (file: RcFile): Promise<void> => {
    try {
      setMainImageUploading(true);

      // Validate image file
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Only images are allowed');
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('File size exceeds 5MB limit');
      }

      // Create FormData for backend upload
      const formData = new FormData();
      formData.append('image', file);

      const response = await uploadService.uploadProductImage(formData);
      setImage(response.url);
      message.success('Main image uploaded successfully');
    } catch (error: any) {
      console.error('Main image upload error:', error);
      message.error(error.message || 'Failed to upload main image');
    } finally {
      setMainImageUploading(false);
    }
  };

  // Handle image upload
  const handleUpload = async (file: RcFile): Promise<string> => {
    try {
      // Validate image file
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Only images are allowed');
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('File size exceeds 5MB limit');
      }

      // Create FormData for backend upload
      const formData = new FormData();
      formData.append('image', file);

      const response = await uploadService.uploadProductImage(formData);
      const url = response.url;

      // If no main image is set, use the first uploaded image as main
      if (!image && imageList.length === 0) {
        setImage(url);
      }

      return url;
    } catch (error: any) {
      console.error('Image upload error:', error);
      message.error(error.message || 'Failed to upload image');
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

      // Include main image if it's not already in the image list
      const allImages = image && !imageUrls.includes(image)
        ? [image, ...imageUrls]
        : imageUrls.length > 0 ? imageUrls : (image ? [image] : []);

      const productData = {
        ...values,
        images: allImages,
        image: image || (allImages.length > 0 ? allImages[0] : null),
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
    setImage('');
    setPreviewImage('');
    setPreviewVisible(false);
    setStatusToggle(true); // Reset to active
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


  return (
    <>
      <Modal
        title={
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <div style={{
              width: 20,
              height: 20,
              borderRadius: 4,
              background: 'linear-gradient(135deg, #00A6B8 0%, #26C6DA 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 11
            }}>
              {mode === 'edit' ? <PictureOutlined /> : <PlusOutlined />}
            </div>
            <span style={{
              fontSize: 14,
              fontWeight: 500,
              color: '#262626'
            }}>
              {mode === 'edit' ? 'Edit Product' : 'New Product'}
            </span>
          </div>
        }
        open={visible}
        onCancel={handleClose}
        width={680}
        style={{ top: 20 }}
        styles={{
          body: {
            padding: 0,
            maxHeight: 'calc(100vh - 160px)',
            overflow: 'hidden'
          },
          header: {
            borderBottom: '1px solid #f0f0f0',
            marginBottom: 0,
            padding: '12px 16px',
            minHeight: 'auto'
          }
        }}
        footer={
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            padding: '10px 16px',
            borderTop: '1px solid #f0f0f0',
            background: '#fafafa'
          }}>
            <Button onClick={handleClose} size="small">
              Cancel
            </Button>
            <Button
              type="primary"
              size="small"
              loading={loading}
              onClick={() => form.submit()}
              icon={mode === 'edit' ? <CheckCircleOutlined /> : <PlusOutlined />}
              style={{
                background: 'linear-gradient(135deg, #00A6B8 0%, #26C6DA 100%)',
                border: 'none',
                fontWeight: 500,
                boxShadow: '0 2px 6px rgba(0, 166, 184, 0.3)'
              }}
            >
              {mode === 'edit' ? 'Update' : 'Create'}
            </Button>
          </div>
        }
      >
        <div style={{
          maxHeight: 'calc(100vh - 180px)',
          overflowY: 'auto',
          padding: '12px 16px'
        }}>
          <Spin spinning={loading || uploading}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              autoComplete="off"
              size="middle"
            >
              {/* Main Product Image */}
              <div style={{ marginBottom: 16 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 12,
                  paddingBottom: 6,
                  borderBottom: '1px solid #f0f0f0'
                }}>
                  <CameraOutlined style={{ color: '#00A6B8', fontSize: 14 }} />
                  <Text strong style={{ fontSize: 13 }}>Main Image</Text>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <Upload
                    accept="image/*"
                    showUploadList={false}
                    beforeUpload={beforeUpload}
                    customRequest={async ({ file }) => {
                      await handleMainImageUpload(file as RcFile);
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      width: 120,
                      height: 120,
                      border: '2px dashed #d9d9d9',
                      borderRadius: 8,
                      background: image ? 'transparent' : '#fafafa',
                      position: 'relative',
                      overflow: 'hidden',
                      margin: '0 auto',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#00A6B8';
                      e.currentTarget.style.background = image ? 'rgba(0, 166, 184, 0.1)' : '#f0f9fa';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#d9d9d9';
                      e.currentTarget.style.background = image ? 'transparent' : '#fafafa';
                    }}
                    >
                      {mainImageUploading ? (
                        <div style={{ textAlign: 'center', color: '#00A6B8' }}>
                          <div className="ant-spin-dot ant-spin-dot-spin" style={{ fontSize: 20, marginBottom: 8 }}>
                            <i className="ant-spin-dot-item"></i>
                            <i className="ant-spin-dot-item"></i>
                            <i className="ant-spin-dot-item"></i>
                            <i className="ant-spin-dot-item"></i>
                          </div>
                          <div style={{ fontSize: 11 }}>Uploading...</div>
                        </div>
                      ) : image ? (
                        <>
                          <img
                            src={image}
                            alt="Main product"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0, 0, 0, 0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: 0,
                            transition: 'opacity 0.3s ease'
                          }}
                          className="upload-overlay"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = '1';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = '0';
                          }}
                          >
                            <div style={{ textAlign: 'center', color: 'white' }}>
                              <CameraOutlined style={{ fontSize: 16, marginBottom: 4 }} />
                              <div style={{ fontSize: 10 }}>Change</div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div style={{ textAlign: 'center', color: '#8c8c8c' }}>
                          <CameraOutlined style={{ fontSize: 24, marginBottom: 8 }} />
                          <div style={{ fontSize: 12 }}>Click to upload</div>
                        </div>
                      )}
                    </div>
                  </Upload>
                </div>
              </div>

              {/* Basic Information Section */}
              <div style={{ marginBottom: 16 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 12,
                  paddingBottom: 6,
                  borderBottom: '1px solid #f0f0f0'
                }}>
                  <InfoCircleOutlined style={{ color: '#00A6B8', fontSize: 14 }} />
                  <Text strong style={{ fontSize: 13 }}>Product Details</Text>
                </div>
                <Row gutter={[12, 8]}>
                  <Col span={24}>
                    <Form.Item
                      name="name"
                      label="Product Name"
                      style={{ marginBottom: 8 }}
                      rules={[
                        { required: true, message: 'Product name is required' },
                        { min: 2, message: 'Product name must be at least 2 characters' },
                        { max: 100, message: 'Product name must be less than 100 characters' }
                      ]}
                    >
                      <Input placeholder="Enter product name" showCount maxLength={100} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="sku"
                      label="SKU"
                      style={{ marginBottom: 8 }}
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
                  <Col span={8}>
                    <Form.Item
                      name="categoryId"
                      label="Category"
                      style={{ marginBottom: 8 }}
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
                  <Col span={8}>
                    <Form.Item
                      name="brand"
                      label="Brand"
                      style={{ marginBottom: 8 }}
                    >
                      <Input placeholder="Brand name" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="unit"
                      label="Unit"
                      style={{ marginBottom: 8 }}
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
                  <Col span={8}>
                    <Form.Item
                      name="status"
                      label="Status"
                      style={{ marginBottom: 8 }}
                    >
                      <div style={{ height: 32, display: 'flex', alignItems: 'center' }}>
                        <div
                          style={{
                            position: 'relative',
                            width: 58,
                            height: 28,
                            borderRadius: 14,
                            cursor: 'pointer',
                            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            background: statusToggle
                              ? 'linear-gradient(135deg, #00A6B8 0%, #26C6DA 100%)'
                              : 'linear-gradient(135deg, #f1f3f4 0%, #e8eaed 100%)',
                            border: '1px solid transparent',
                            boxShadow: statusToggle
                              ? '0 4px 16px rgba(0, 166, 184, 0.25), inset 0 1px 0 rgba(255,255,255,0.2)'
                              : '0 2px 8px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
                            overflow: 'hidden'
                          }}
                          onClick={() => {
                            const newStatus = !statusToggle;
                            setStatusToggle(newStatus);
                            form.setFieldsValue({ status: newStatus ? 'active' : 'inactive' });
                          }}
                          onMouseEnter={(e) => {
                            if (statusToggle) {
                              e.currentTarget.style.background = 'linear-gradient(135deg, #008A96 0%, #1FA8B8 100%)';
                              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 166, 184, 0.35), inset 0 1px 0 rgba(255,255,255,0.2)';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                            } else {
                              e.currentTarget.style.background = 'linear-gradient(135deg, #e8eaed 0%, #dadce0 100%)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255,255,255,0.8)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (statusToggle) {
                              e.currentTarget.style.background = 'linear-gradient(135deg, #00A6B8 0%, #26C6DA 100%)';
                              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 166, 184, 0.25), inset 0 1px 0 rgba(255,255,255,0.2)';
                              e.currentTarget.style.transform = 'translateY(0)';
                            } else {
                              e.currentTarget.style.background = 'linear-gradient(135deg, #f1f3f4 0%, #e8eaed 100%)';
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255,255,255,0.8)';
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
                              borderRadius: '14px 14px 0 0',
                              background: statusToggle
                                ? 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)'
                                : 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.3) 100%)',
                              pointerEvents: 'none'
                            }}
                          />

                          {/* Switch Handle */}
                          <div
                            style={{
                              position: 'absolute',
                              top: 2,
                              left: statusToggle ? 32 : 2,
                              width: 24,
                              height: 24,
                              borderRadius: 12,
                              background: '#ffffff',
                              transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                              boxShadow: statusToggle
                                ? '0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)'
                                : '0 3px 8px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.08)',
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
                                borderRadius: '11px 11px 0 0',
                                background: 'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.4) 100%)',
                                pointerEvents: 'none'
                              }}
                            />

                            {/* Status Indicator */}
                            {statusToggle && (
                              <div
                                style={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: 5,
                                  background: 'linear-gradient(135deg, #00A6B8 0%, #26C6DA 100%)',
                                  boxShadow: '0 1px 3px rgba(0, 166, 184, 0.4)',
                                  animation: 'pulse 2s infinite'
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
                              justifyContent: statusToggle ? 'flex-start' : 'flex-end',
                              paddingLeft: statusToggle ? 8 : 0,
                              paddingRight: statusToggle ? 0 : 8,
                              fontSize: 9,
                              fontWeight: 700,
                              letterSpacing: '0.5px',
                              color: statusToggle ? 'rgba(255,255,255,0.95)' : '#6c757d',
                              textShadow: statusToggle ? '0 1px 2px rgba(0,0,0,0.2)' : 'none',
                              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                            }}
                          >
                            {statusToggle ? 'ON' : 'OFF'}
                          </div>
                        </div>
                      </div>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="price"
                      label="Price"
                      style={{ marginBottom: 8 }}
                      rules={[
                        { required: true, message: 'Price is required' },
                        { type: 'number', min: 0.01, message: 'Price must be greater than $0' },
                        { type: 'number', max: 999999.99, message: 'Price must be less than $1,000,000' }
                      ]}
                    >
                      <InputNumber<number>
                        style={{ width: '100%' }}
                        formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => {
                          const numericValue = value?.replace(/\$\s?|(,*)/g, '') || '';
                          return parseFloat(numericValue) || 0;
                        }}
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
                      label="Stock Qty"
                      style={{ marginBottom: 8 }}
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
                      label="Reorder Level"
                      style={{ marginBottom: 8 }}
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        min={0}
                        placeholder="10"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="expiryDate"
                      label="Expiry Date"
                      style={{ marginBottom: 8 }}
                    >
                      <DatePicker
                        style={{ width: '100%' }}
                        placeholder="Select date"
                        format="DD/MM/YYYY"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={16}>
                    <Form.Item
                      name="description"
                      label="Description"
                      style={{ marginBottom: 0 }}
                    >
                      <TextArea
                        rows={2}
                        placeholder="Product description"
                        showCount
                        maxLength={500}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </div>

              {/* Product Images Gallery - Moved to bottom */}
              <div style={{ marginBottom: 0 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 12,
                  paddingBottom: 6,
                  borderBottom: '1px solid #f0f0f0'
                }}>
                  <PictureOutlined style={{ color: '#722ed1', fontSize: 14 }} />
                  <Text strong style={{ fontSize: 13 }}>Image Gallery</Text>
                  <Text type="secondary" style={{ fontSize: 11, marginLeft: 'auto' }}>
                    Max 5 images
                  </Text>
                </div>
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
                    <div style={{ padding: '12px', textAlign: 'center' }}>
                      <PlusOutlined style={{ fontSize: 14, marginBottom: 4, color: '#8c8c8c' }} />
                      <div style={{ color: '#8c8c8c', fontSize: 11 }}>
                        Upload
                      </div>
                    </div>
                  )}
                </Upload>
              </div>
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