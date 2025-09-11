import { Card, Typography, Space, Badge } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  variants?: Array<{
    price: number;
    stock_quantity: number;
  }>;
}

interface ProductGridProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
}

export default function ProductGrid({ products, onAddProduct }: ProductGridProps) {
  if (!products || products.length === 0) {
    return (
      <div className="text-center py-8">
        <Text type="secondary">No products found</Text>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => {
        const price = product.variants?.[0]?.price || product.price || 0;
        const stock = product.variants?.[0]?.stock_quantity || 0;
        
        return (
          <Badge.Ribbon 
            key={product.id}
            text={stock > 0 ? `Stock: ${stock}` : 'Out of Stock'} 
            color={stock > 0 ? 'green' : 'red'}
          >
            <Card
              hoverable
              className="h-full"
              cover={
                <div className="h-32 bg-gray-100 flex items-center justify-center">
                  <ShoppingCartOutlined className="text-4xl text-gray-400" />
                </div>
              }
              onClick={() => onAddProduct(product)}
            >
              <Card.Meta
                title={
                  <Text ellipsis className="text-sm">
                    {product.name}
                  </Text>
                }
                description={
                  <Space direction="vertical" className="w-full">
                    <Text type="secondary" className="text-xs">
                      SKU: {product.sku}
                    </Text>
                    <Title level={4} className="m-0 text-blue-600">
                      {formatCurrency(price)}
                    </Title>
                  </Space>
                }
              />
            </Card>
          </Badge.Ribbon>
        );
      })}
    </div>
  );
}