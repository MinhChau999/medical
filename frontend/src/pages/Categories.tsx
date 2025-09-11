import React, { useState, useEffect } from 'react';
import { 
  Tree, 
  Button, 
  Space, 
  Card, 
  Input, 
  Tag, 
  Tooltip, 
  Modal, 
  Form, 
  Select, 
  message, 
  Popconfirm, 
  Badge, 
  Row, 
  Col, 
  Image,
  Typography,
  Dropdown,
  Menu,
  Spin
} from 'antd';
import type { DataNode, TreeProps } from 'antd/es/tree';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined,
  MenuOutlined,
  HolderOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useThemeStore } from '@/stores/themeStore';
import { categoriesService, type Category as CategoryType } from '@/services/categories';

const { Title, Text } = Typography;

interface Category extends CategoryType {
  key: string;
  productCount?: number;
  parentName?: string;
}

interface TreeDataNode extends DataNode {
  data: Category;
  children?: TreeDataNode[];
}

const Categories: React.FC = () => {
  const { t } = useTranslation();
  const { isDarkMode } = useThemeStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form] = Form.useForm();
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [autoExpandParent, setAutoExpandParent] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch categories from API
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await categoriesService.getCategories();
      // Add key field for Tree component
      const categoriesWithKeys = data.map(cat => ({
        ...cat,
        key: cat.id,
        children: cat.children?.map(child => ({ ...child, key: child.id }))
      }));
      setCategories(categoriesWithKeys as Category[]);
      // Auto expand categories with children
      const keys = categoriesWithKeys.filter(cat => cat.children && cat.children.length > 0).map(cat => cat.key);
      setExpandedKeys(keys);
    } catch (error) {
      message.error(t('failedToLoadCategories'));
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const handleAdd = () => {
    setEditingCategory(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record: Category) => {
    setEditingCategory(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await categoriesService.deleteCategory(id);
      message.success(t('categoryDeleted'));
      // Refresh categories list
      await fetchCategories();
    } catch (error: any) {
      message.error(error.response?.data?.message || t('failedToDeleteCategory'));
      console.error('Failed to delete category:', error);
    }
  };

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      if (editingCategory) {
        // Update existing category
        await categoriesService.updateCategory(editingCategory.id, values);
        message.success(t('categoryUpdated'));
      } else {
        // Create new category
        await categoriesService.createCategory(values);
        message.success(t('categoryAdded'));
      }
      setIsModalVisible(false);
      form.resetFields();
      // Refresh categories list
      await fetchCategories();
    } catch (error: any) {
      message.error(error.response?.data?.message || t('failedToSaveCategory'));
      console.error('Failed to save category:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Chuyển đổi categories thành tree data
  const convertToTreeData = (items: Category[]): TreeDataNode[] => {
    // Sort by order first, then by name
    const sortedItems = [...items].sort((a, b) => {
      if (a.order !== b.order) {
        return a.order - b.order;
      }
      return a.name.localeCompare(b.name);
    });

    return sortedItems.map(item => ({
      key: item.key,
      title: (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderRadius: 6,
          transition: 'all 0.2s ease',
          width: '100%',
        }}
        className="category-tree-node"
        >
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
            <HolderOutlined style={{ 
              fontSize: 14, 
              color: isDarkMode ? '#5F6B7C' : '#A0AEC0',
              cursor: 'move' 
            }} />
            <div>
              <div style={{ 
                fontWeight: 500, 
                fontSize: 15,
                color: isDarkMode ? '#E8EAED' : '#1A2332',
                marginBottom: 2
              }}>
                {item.name}
              </div>
              <div style={{ 
                fontSize: 13, 
                color: isDarkMode ? '#8B92A0' : '#718096' 
              }}>
                {item.nameEn}
                {item.description && (
                  <span style={{ marginLeft: 8 }}>• {item.description}</span>
                )}
              </div>
            </div>
          </div>
          
          <Space size="middle" style={{ marginLeft: 16 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 6,
              background: isDarkMode ? 'rgba(0, 166, 184, 0.15)' : 'rgba(0, 166, 184, 0.08)',
            }}>
              <span style={{ 
                fontSize: 14, 
                fontWeight: 600,
                color: '#00A6B8'
              }}>
                {item.productCount}
              </span>
              <span style={{ 
                fontSize: 12, 
                color: '#00A6B8'
              }}>
                sản phẩm
              </span>
            </div>
            
            <Tag 
              color={item.status === 'active' ? 'success' : 'default'}
              style={{ margin: 0 }}
            >
              {item.status === 'active' ? t('active') : t('inactive')}
            </Tag>
            
            <Space size={4}>
              <Tooltip title={t('edit')}>
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(item);
                  }}
                  style={{ color: '#00A6B8' }}
                />
              </Tooltip>
              <Popconfirm
                title={t('confirmDelete')}
                onConfirm={(e) => {
                  e?.stopPropagation();
                  handleDelete(item.id);
                }}
                onCancel={(e) => e?.stopPropagation()}
                okText={t('yes')}
                cancelText={t('no')}
              >
                <Tooltip title={t('delete')}>
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Tooltip>
              </Popconfirm>
            </Space>
          </Space>
        </div>
      ),
      data: item,
      children: item.children ? convertToTreeData(item.children) : undefined,
    }));
  };

  const onDrop: TreeProps['onDrop'] = async (info) => {
    const dropKey = info.node.key;
    const dragKey = info.dragNode.key;
    const dropPos = info.node.pos.split('-');
    const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1]);

    const loop = (
      data: Category[],
      key: React.Key,
      callback: (node: Category, i: number, data: Category[]) => void,
    ) => {
      for (let i = 0; i < data.length; i++) {
        if (data[i].key === key) {
          return callback(data[i], i, data);
        }
        if (data[i].children) {
          loop(data[i].children!, key, callback);
        }
      }
    };

    const data = [...categories];

    // Find dragObject
    let dragObj: Category;
    loop(data, dragKey, (item, index, arr) => {
      arr.splice(index, 1);
      dragObj = item;
    });

    let newParentId: string | null = null;
    if (!info.dropToGap) {
      // Drop on the content
      loop(data, dropKey, item => {
        item.children = item.children || [];
        item.children.unshift(dragObj);
        newParentId = item.id;
      });
    } else if (
      ((info.node as any).props.children || []).length > 0 &&
      (info.node as any).props.expanded &&
      dropPosition === 1
    ) {
      loop(data, dropKey, item => {
        item.children = item.children || [];
        item.children.unshift(dragObj);
        newParentId = item.id;
      });
    } else {
      let ar: Category[] = [];
      let i: number;
      loop(data, dropKey, (_item, index, arr) => {
        ar = arr;
        i = index;
      });
      if (dropPosition === -1) {
        ar.splice(i!, 0, dragObj!);
      } else {
        ar.splice(i! + 1, 0, dragObj!);
      }
    }
    
    // Update local state immediately for better UX
    setCategories(data);
    
    // Prepare categories order data
    const categoriesOrder: { id: string; parentId?: string | null; order: number }[] = [];
    
    const collectOrder = (items: Category[], parentId: string | null = null) => {
      items.forEach((item, index) => {
        categoriesOrder.push({
          id: item.id,
          parentId: parentId,
          order: index
        });
        if (item.children && item.children.length > 0) {
          collectOrder(item.children, item.id);
        }
      });
    };
    
    collectOrder(data);
    
    try {
      // Save to backend
      await categoriesService.updateCategoriesOrder(categoriesOrder);
      message.success('Đã cập nhật thứ tự danh mục');
      
      // Save current expanded keys
      const currentExpandedKeys = [...expandedKeys];
      // Add the drop target to expanded keys if it's a parent
      if (!info.dropToGap || (((info.node as any).props.children || []).length > 0 && (info.node as any).props.expanded && dropPosition === 1)) {
        if (!currentExpandedKeys.includes(dropKey)) {
          currentExpandedKeys.push(dropKey);
        }
      }
      
      // Reload data from backend to ensure consistency
      await fetchCategories();
      
      // Restore expanded keys
      setExpandedKeys(currentExpandedKeys);
      setAutoExpandParent(false);
    } catch (error) {
      message.error('Lỗi khi cập nhật thứ tự danh mục');
      // Revert on error
      fetchCategories();
    }
  };

  const onExpand = (expandedKeysValue: React.Key[]) => {
    setExpandedKeys(expandedKeysValue);
    setAutoExpandParent(false);
  };

  const parentCategories = categories.filter(cat => !cat.parentId);
  const treeData = convertToTreeData(categories);

  return (
    <div style={{ padding: 24 }}>
      {/* Main Content */}
      <Card className="category-card" style={{ marginTop: 0 }}>
        <div style={{ padding: 20 }}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Input
              placeholder={t('searchCategories')}
              prefix={<SearchOutlined />}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ width: 300 }}
              allowClear
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
              style={{
                background: 'linear-gradient(135deg, #00A6B8 0%, #26C6DA 100%)',
                border: 'none',
                height: 36,
                borderRadius: 8,
                fontWeight: 500,
                boxShadow: '0 2px 8px rgba(0, 166, 184, 0.25)',
              }}
            >
              {t('addCategory')}
            </Button>
          </Space>
          
          <Space>
            <Button
              icon={<MenuOutlined />}
              onClick={() => setExpandedKeys(categories.filter(cat => cat.children && cat.children.length > 0).map(cat => cat.key))}
            >
              Mở rộng tất cả
            </Button>
            <Button
              onClick={() => setExpandedKeys([])}
            >
              Thu gọn tất cả
            </Button>
          </Space>
        </div>

        <div style={{
          background: isDarkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
          borderRadius: 12,
          padding: 12,
          minHeight: 400,
        }}>
          <Spin spinning={loading} tip={t('loadingCategories')}>
          <Tree
            className="medical-tree"
            draggable
            blockNode
            onDrop={onDrop}
            treeData={treeData}
            expandedKeys={expandedKeys}
            onExpand={onExpand}
            autoExpandParent={autoExpandParent}
            showLine={false}
            showIcon={false}
            switcherIcon={() => null}
            style={{
              background: 'transparent',
              fontSize: 14,
            }}
          />
          </Spin>
        </div>

        <div style={{ 
          marginTop: 12, 
          padding: 10, 
          background: isDarkMode ? 'rgba(0, 166, 184, 0.08)' : 'rgba(0, 166, 184, 0.04)',
          borderRadius: 6,
          border: `1px solid ${isDarkMode ? 'rgba(0, 166, 184, 0.2)' : 'rgba(0, 166, 184, 0.15)'}`,
        }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Kéo và thả để sắp xếp lại thứ tự
          </Text>
        </div>
        </div>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingCategory ? t('editCategory') : t('addCategory')}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
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
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label={t('categoryNameVi')}
                rules={[{ required: true, message: t('pleaseEnterCategoryName') }]}
              >
                <Input placeholder={t('enterCategoryName')} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="nameEn"
                label={t('categoryNameEn')}
              >
                <Input placeholder={t('enterCategoryNameEn')} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="slug"
            label={t('slug')}
            rules={[{ required: true, message: t('pleaseEnterSlug') }]}
          >
            <Input placeholder={t('enterSlug')} />
          </Form.Item>

          <Form.Item
            name="description"
            label={t('description')}
          >
            <Input.TextArea rows={3} placeholder={t('enterDescription')} />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setIsModalVisible(false);
                form.resetFields();
              }}>
                {t('cancel')}
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={submitting}
                style={{
                  background: 'linear-gradient(135deg, #00A6B8 0%, #26C6DA 100%)',
                  border: 'none',
                }}
              >
                {editingCategory ? t('update') : t('add')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <style>
        {`
          .category-tree-node:hover {
            background: ${isDarkMode ? 'rgba(0, 166, 184, 0.1)' : 'rgba(0, 166, 184, 0.05)'} !important;
          }
          
          .draggable-tree .ant-tree-node-content-wrapper {
            width: 100%;
          }
          
          .draggable-tree .ant-tree-treenode {
            width: 100%;
          }
          
          .draggable-tree .ant-tree-node-content-wrapper:hover {
            background: transparent !important;
          }
          
          .draggable-tree .ant-tree-node-selected .category-tree-node {
            background: ${isDarkMode ? 'rgba(0, 166, 184, 0.15)' : 'rgba(0, 166, 184, 0.08)'} !important;
          }
          
          .draggable-tree .ant-tree-switcher {
            color: #00A6B8;
          }
          
          .ant-tree-draggable-icon {
            visibility: hidden;
          }
          
          /* Fix tree line alignment */
          .medical-tree .ant-tree-indent {
            align-self: stretch;
            white-space: nowrap;
            user-select: none;
          }
          
          .medical-tree .ant-tree-indent-unit {
            display: inline-block;
            width: 24px;
          }
          
          .medical-tree .ant-tree-switcher {
            position: relative;
            flex: none;
            align-self: stretch;
            width: 24px;
            margin: 0;
            text-align: center;
            cursor: pointer;
            user-select: none;
          }
          
          .medical-tree .ant-tree-switcher-leaf-line {
            position: relative;
            z-index: 1;
            display: inline-block;
            width: 100%;
            height: 100%;
          }
          
          .medical-tree .ant-tree-switcher-leaf-line::before {
            position: absolute;
            top: 0;
            right: 12px;
            bottom: -4px;
            margin-left: -1px;
            border-right: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
            content: ' ';
          }
          
          .medical-tree .ant-tree-switcher-leaf-line::after {
            position: absolute;
            width: 10px;
            height: 14px;
            border-bottom: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
            content: ' ';
            top: 50%;
            right: 12px;
            transform: translateY(-50%);
          }
          
          .medical-tree .ant-tree-treenode-leaf-last .ant-tree-switcher-leaf-line::before {
            bottom: auto;
            height: 14px;
            top: auto;
            bottom: 50%;
          }
          
          /* Tree line styles */
          .medical-tree.ant-tree-show-line .ant-tree-indent-unit::before {
            position: absolute;
            top: 0;
            right: 12px;
            bottom: -4px;
            border-right: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
            content: '';
          }
          
          .medical-tree.ant-tree-show-line .ant-tree-indent-unit-end::before {
            display: none;
          }
          
          /* Tree node alignment */
          .medical-tree .ant-tree-node-content-wrapper {
            position: relative;
            z-index: 1;
            min-height: 24px;
            margin: 0;
            padding: 0;
            background: transparent;
            border-radius: 2px;
            cursor: pointer;
            transition: all 0.3s;
          }
          
          .medical-tree .ant-tree-title {
            width: 100%;
          }
          
          /* Icon alignment */
          .medical-tree .ant-tree-iconEle {
            display: inline-block;
            width: 24px;
            height: 24px;
            line-height: 24px;
            text-align: center;
            vertical-align: middle;
          }
        `}
      </style>
    </div>
  );
};

export default Categories;