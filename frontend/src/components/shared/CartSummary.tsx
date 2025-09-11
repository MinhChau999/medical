import { Card, List, Button, InputNumber, Space, Typography, Empty, Divider } from 'antd';
import { DeleteOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/stores/store';
import { removeFromCart, updateQuantity } from '@/stores/slices/cartSlice';

const { Text, Title } = Typography;

interface CartSummaryProps {
  showActions?: boolean;
  onCheckout?: () => void;
}

export default function CartSummary({ showActions = true, onCheckout }: CartSummaryProps) {
  const dispatch = useDispatch();
  const { items, total, itemCount } = useSelector((state: RootState) => state.cart);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleQuantityChange = (variantId: string, quantity: number) => {
    if (quantity > 0) {
      dispatch(updateQuantity({ variantId, quantity }));
    }
  };

  const handleRemove = (variantId: string) => {
    dispatch(removeFromCart(variantId));
  };

  if (items.length === 0) {
    return (
      <Card>
        <Empty
          image={<ShoppingCartOutlined style={{ fontSize: 48, color: '#ccc' }} />}
          description="Your cart is empty"
        >
          <Button type="primary" href="/shop/products">
            Continue Shopping
          </Button>
        </Empty>
      </Card>
    );
  }

  return (
    <Card title={`Shopping Cart (${itemCount} items)`}>
      <List
        dataSource={items}
        renderItem={(item) => (
          <List.Item
            actions={
              showActions
                ? [
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      size="small"
                      onClick={() => handleRemove(item.variantId)}
                    />,
                  ]
                : []
            }
          >
            <List.Item.Meta
              avatar={
                item.image ? (
                  <img src={item.image} alt={item.productName} className="w-16 h-16 object-cover rounded" />
                ) : (
                  <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                    <ShoppingCartOutlined />
                  </div>
                )
              }
              title={item.productName}
              description={
                <Space direction="vertical">
                  {item.variantName && <Text type="secondary">{item.variantName}</Text>}
                  <Text strong>{formatCurrency(item.price)}</Text>
                </Space>
              }
            />
            <div className="flex items-center gap-4">
              {showActions ? (
                <InputNumber
                  min={1}
                  value={item.quantity}
                  onChange={(value) => handleQuantityChange(item.variantId, value || 1)}
                  size="small"
                />
              ) : (
                <Text>Qty: {item.quantity}</Text>
              )}
              <Title level={5} className="m-0">
                {formatCurrency(item.price * item.quantity)}
              </Title>
            </div>
          </List.Item>
        )}
      />

      <Divider />

      <div className="space-y-2">
        <div className="flex justify-between">
          <Text>Subtotal:</Text>
          <Text strong>{formatCurrency(total)}</Text>
        </div>
        <div className="flex justify-between">
          <Text>Tax (10%):</Text>
          <Text strong>{formatCurrency(total * 0.1)}</Text>
        </div>
        <div className="flex justify-between">
          <Text>Shipping:</Text>
          <Text strong>Free</Text>
        </div>
        <Divider />
        <div className="flex justify-between">
          <Title level={4}>Total:</Title>
          <Title level={4} type="success">
            {formatCurrency(total * 1.1)}
          </Title>
        </div>
      </div>

      {showActions && onCheckout && (
        <Button type="primary" size="large" block className="mt-4" onClick={onCheckout}>
          Proceed to Checkout
        </Button>
      )}
    </Card>
  );
}