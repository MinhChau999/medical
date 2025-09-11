import { useState } from 'react';
import { Input, Select, Space, Button } from 'antd';
import { SearchOutlined, FilterOutlined } from '@ant-design/icons';

const { Option } = Select;

interface ProductSearchProps {
  onSearch: (filters: any) => void;
  placeholder?: string;
  showFilters?: boolean;
}

export default function ProductSearch({ 
  onSearch, 
  placeholder = "Search products...",
  showFilters = true 
}: ProductSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  const handleSearch = () => {
    onSearch({
      search: searchTerm,
      category: category !== 'all' ? category : undefined,
      priceRange: priceRange !== 'all' ? priceRange : undefined,
      sortBy,
    });
  };

  const handleReset = () => {
    setSearchTerm('');
    setCategory('all');
    setPriceRange('all');
    setSortBy('name');
    onSearch({});
  };

  return (
    <Space direction="vertical" className="w-full" size="middle">
      <Space.Compact className="w-full">
        <Input
          placeholder={placeholder}
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onPressEnter={handleSearch}
          size="large"
        />
        <Button type="primary" icon={<SearchOutlined />} size="large" onClick={handleSearch}>
          Search
        </Button>
      </Space.Compact>

      {showFilters && (
        <Space wrap>
          <Select
            value={category}
            onChange={setCategory}
            style={{ width: 150 }}
            placeholder="Category"
          >
            <Option value="all">All Categories</Option>
            <Option value="monitoring">Monitoring</Option>
            <Option value="diagnostic">Diagnostic</Option>
            <Option value="firstaid">First Aid</Option>
            <Option value="mobility">Mobility</Option>
          </Select>

          <Select
            value={priceRange}
            onChange={setPriceRange}
            style={{ width: 150 }}
            placeholder="Price Range"
          >
            <Option value="all">All Prices</Option>
            <Option value="0-50">$0 - $50</Option>
            <Option value="50-100">$50 - $100</Option>
            <Option value="100-200">$100 - $200</Option>
            <Option value="200+">$200+</Option>
          </Select>

          <Select
            value={sortBy}
            onChange={setSortBy}
            style={{ width: 150 }}
            placeholder="Sort By"
          >
            <Option value="name">Name</Option>
            <Option value="price-asc">Price: Low to High</Option>
            <Option value="price-desc">Price: High to Low</Option>
            <Option value="newest">Newest</Option>
          </Select>

          <Button icon={<FilterOutlined />} onClick={handleReset}>
            Reset Filters
          </Button>
        </Space>
      )}
    </Space>
  );
}