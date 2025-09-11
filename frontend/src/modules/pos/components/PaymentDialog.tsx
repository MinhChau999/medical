import { useState } from 'react';
import { Modal, Button, InputNumber, Radio, Space, Typography, message, Row, Col, Divider } from 'antd';
import {
  DollarOutlined,
  CreditCardOutlined,
  BankOutlined,
  MobileOutlined,
} from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/stores/store';
import { clearCart } from '@/stores/slices/cartSlice';
import { ordersAPI } from '@/services/api';

const { Title, Text } = Typography;

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  total: number;
  onPaymentComplete: () => void;
}

const paymentMethods = [
  { value: 'cash', label: 'Cash', icon: <DollarOutlined /> },
  { value: 'card', label: 'Card', icon: <CreditCardOutlined /> },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: <BankOutlined /> },
  { value: 'e_wallet', label: 'E-Wallet', icon: <MobileOutlined /> },
];

export default function PaymentDialog({
  open,
  onClose,
  total,
  onPaymentComplete,
}: PaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [processing, setProcessing] = useState(false);
  
  const dispatch = useDispatch();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  
  const change = amountReceived - total;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleQuickAmount = (amount: number) => {
    setAmountReceived(amount);
  };

  const quickAmounts = [
    Math.ceil(total / 10) * 10,
    Math.ceil(total / 50) * 50,
    Math.ceil(total / 100) * 100,
    Math.ceil(total / 100) * 100 + 100,
  ];

  const handlePayment = async () => {
    if (paymentMethod === 'cash' && amountReceived < total) {
      message.error('Insufficient amount received');
      return;
    }

    setProcessing(true);
    try {
      const orderData = {
        items: cartItems.map((item) => ({
          variantId: item.variantId,
          productName: item.productName,
          variantName: item.variantName,
          quantity: item.quantity,
          price: item.price,
        })),
        paymentMethod: paymentMethod,
        subtotal: total,
        totalAmount: total,
        notes: 'POS Sale',
      };

      await ordersAPI.create(orderData);
      
      message.success('Payment completed successfully!');
      dispatch(clearCart());
      onPaymentComplete();
      onClose();
    } catch (error) {
      message.error('Payment failed. Please try again.');
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Modal
      title="Process Payment"
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={processing}
          onClick={handlePayment}
          disabled={paymentMethod === 'cash' && amountReceived < total}
        >
          Complete Payment
        </Button>,
      ]}
      width={500}
    >
      <div className="text-center mb-6">
        <Title level={2} className="m-0">
          {formatCurrency(total)}
        </Title>
        <Text type="secondary">Total Amount Due</Text>
      </div>

      <div className="mb-4">
        <Text strong className="block mb-2">Payment Method</Text>
        <Radio.Group
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="w-full"
        >
          <Space direction="vertical" className="w-full">
            {paymentMethods.map((method) => (
              <Radio key={method.value} value={method.value}>
                <Space>
                  {method.icon}
                  {method.label}
                </Space>
              </Radio>
            ))}
          </Space>
        </Radio.Group>
      </div>

      {paymentMethod === 'cash' && (
        <>
          <Divider />
          <div className="mb-4">
            <Text strong className="block mb-2">Amount Received</Text>
            <InputNumber
              value={amountReceived}
              onChange={(value) => setAmountReceived(value || 0)}
              formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
              className="w-full"
              size="large"
              min={0}
            />
          </div>

          <div className="mb-4">
            <Text type="secondary" className="block mb-2">Quick Amount</Text>
            <Row gutter={[8, 8]}>
              {quickAmounts.map((amount) => (
                <Col span={12} key={amount}>
                  <Button
                    block
                    onClick={() => handleQuickAmount(amount)}
                    type={amountReceived === amount ? 'primary' : 'default'}
                  >
                    {formatCurrency(amount)}
                  </Button>
                </Col>
              ))}
            </Row>
          </div>

          {amountReceived > 0 && (
            <div className="text-center p-4 bg-gray-50 rounded">
              <Text className="block">Change Due</Text>
              <Title level={3} type={change >= 0 ? 'success' : 'danger'}>
                {formatCurrency(Math.abs(change))}
              </Title>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}