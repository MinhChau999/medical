import React, { useState, useCallback } from 'react';
import { AutoComplete, Input, Typography, Space, Tag } from 'antd';
import { SearchOutlined, BarcodeOutlined } from '@ant-design/icons';
import { debounce } from 'lodash';
import api from '@/services/api';

const { Text } = Typography;

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  price: string;
  stock_quantity: number;
  unit: string;
  image: string;
  category_name: string;
  category_slug: string;
}

interface ProductAutocompleteProps {
  onSelect: (product: any) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  inputRef?: any;
}

export const ProductAutocomplete: React.FC<ProductAutocompleteProps> = ({
  onSelect,
  placeholder = 'Tìm sản phẩm...',
  style,
  inputRef
}) => {
  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const searchProducts = useCallback(
    debounce(async (value: string) => {
      if (!value || value.length < 2) {
        setOptions([]);
        return;
      }

      setLoading(true);
      try {
        const response = await api.get(`/pos/products/search?q=${encodeURIComponent(value)}`);
        const products: Product[] = response.data.data;

        const formattedOptions = products.map(product => ({
          value: product.id,
          label: (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
              <Space>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 6,
                    overflow: 'hidden',
                    background: product.image ? 'transparent' : 'linear-gradient(135deg, #F0F0F0 0%, #E6E6E6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #f0f0f0'
                  }}
                >
                  {product.image ? (
                    <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <svg viewBox="0 0 1024 1024" style={{ fontSize: 16, color: '#bfbfbf', width: '1em', height: '1em', fill: 'currentColor' }}>
                      <path d="M885.2 446.3l-.2-.8-112.2-285.1c-5-16.1-19.9-27.2-36.8-27.2H281.2c-17 0-32.1 11.3-36.9 27.6L139.4 443l-.3.7-.2.8c-1.3 4.9-1.7 9.9-1 14.8-.1 1.6-.2 3.2-.2 4.8V830a60.9 60.9 0 0060.8 60.8h627.2c33.5 0 60.8-27.3 60.9-60.8V464.1c0-1.3 0-2.6-.1-3.7.4-4.9 0-9.6-1.3-14.1zm-295.8-43l-.3 15.7c-.8 44.9-31.8 75.1-77.1 75.1-22.1 0-41.1-7.1-54.8-20.6S436 441.2 435.6 419l-.3-15.7H229.5L309 210h399.2l81.7 193.3H589.4zm-375 76.8h157.3c24.3 57.1 76 90.8 140.4 90.8 33.7 0 65-9.4 90.3-27.2 22.2-15.6 39.5-37.4 50.7-63.6h156.5V814H214.4V480.1z"></path>
                    </svg>
                  )}
                </div>
                <div>
                  <div>
                    <Text strong style={{ fontSize: 13 }}>{product.name}</Text>
                  </div>
                  <div>
                    <Space size={4}>
                      {product.barcode && (
                        <Tag icon={<BarcodeOutlined />} style={{ fontSize: 10, margin: 0 }}>
                          {product.barcode}
                        </Tag>
                      )}
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {product.sku}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        •
                      </Text>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        Kho: {product.stock_quantity} {product.unit}
                      </Text>
                    </Space>
                  </div>
                </div>
              </Space>
              <Text strong style={{ color: '#52c41a', fontSize: 14 }}>
                {parseFloat(product.price).toLocaleString()}₫
              </Text>
            </div>
          ),
          product
        }));

        setOptions(formattedOptions);
      } catch (error) {
        console.error('Error searching products:', error);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  const handleSearch = (value: string) => {
    setSearchValue(value);
    searchProducts(value);
  };

  const handleSelect = (value: string, option: any) => {
    const product = option.product;
    onSelect({
      id: product.id,
      barcode: product.barcode || product.sku,
      name: product.name,
      price: parseFloat(product.price),
      stock: product.stock_quantity,
      unit: product.unit,
      category: product.category_slug || 'device',
      image: product.image || '',
      discount: 0
    });
    setSearchValue('');
    setOptions([]);
  };

  return (
    <AutoComplete
      ref={inputRef}
      value={searchValue}
      options={options}
      onSearch={handleSearch}
      onSelect={handleSelect}
      style={style}
      dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
      listHeight={400}
      notFoundContent={
        loading ? (
          <div style={{ textAlign: 'center', padding: 16 }}>
            <Text type="secondary">Đang tìm kiếm...</Text>
          </div>
        ) : searchValue.length > 0 && searchValue.length < 2 ? (
          <div style={{ textAlign: 'center', padding: 16 }}>
            <Text type="secondary">Nhập ít nhất 2 ký tự để tìm kiếm</Text>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 16 }}>
            <Text type="secondary">Không tìm thấy sản phẩm</Text>
          </div>
        )
      }
    >
      <Input
        size="large"
        placeholder={placeholder}
        prefix={<SearchOutlined style={{ color: '#00A6B8' }} />}
        allowClear
      />
    </AutoComplete>
  );
};
