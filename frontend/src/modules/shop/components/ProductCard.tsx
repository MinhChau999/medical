import { Card, Button, Typography, Space, Tag, message } from 'antd';
import { ShoppingCartOutlined, HeartOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addToCart } from '@/stores/slices/cartSlice';

const { Text, Title } = Typography;

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    image?: string;
    price: number;
    compareAtPrice?: number;
    status: string;
    category?: string;
    variantId?: string;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const dispatch = useDispatch();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    dispatch(addToCart({
      id: product.id,
      variantId: product.variantId || product.id,
      productName: product.name,
      price: product.price,
      quantity: 1,
      image: product.image,
    }));
    
    message.success('Added to cart!');
  };

  const handleAddToWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    message.info('Added to wishlist!');
  };

  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  return (
    <Link to={`/shop/products/${product.slug}`} style={{ textDecoration: 'none' }}>
      <Card
        hoverable
        cover={
          <div className="relative h-48 bg-gray-100 flex items-center justify-center">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <Text type="secondary">No Image</Text>
            )}
            {discount > 0 && (
              <Tag
                color="red"
                className="absolute top-2 left-2"
              >
                -{discount}%
              </Tag>
            )}
            <Button
              icon={<HeartOutlined />}
              shape="circle"
              className="absolute top-2 right-2 opacity-0 hover:opacity-100 transition-opacity"
              onClick={handleAddToWishlist}
            />
          </div>
        }
        actions={[
          <Button
            type="primary"
            icon={<ShoppingCartOutlined />}
            onClick={handleAddToCart}
            block
          >
            Add to Cart
          </Button>,
        ]}
      >
        <Card.Meta
          title={
            <Space direction="vertical" size={0} className="w-full">
              <Text type="secondary" className="text-xs">
                {product.category || 'Uncategorized'}
              </Text>
              <Text ellipsis={{ rows: 2 }} className="font-semibold">
                {product.name}
              </Text>
            </Space>
          }
          description={
            <Space direction="vertical" size={0}>
              <Title level={4} className="m-0 text-blue-600">
                {formatPrice(product.price)}
              </Title>
              {product.compareAtPrice && (
                <Text delete type="secondary">
                  {formatPrice(product.compareAtPrice)}
                </Text>
              )}
            </Space>
          }
        />
      </Card>
    </Link>
  );
}