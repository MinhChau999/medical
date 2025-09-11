import { useState } from 'react';
import { Modal, Input, Button, List, Avatar, Space, Typography, Spin } from 'antd';
import { SearchOutlined, UserOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';

const { Text } = Typography;

interface CustomerDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: any) => void;
}

export default function CustomerDialog({ 
  open, 
  onClose,
  onSelectCustomer 
}: CustomerDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers', searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      params.append('limit', '10');
      
      const response = await apiService.get(`/customers?${params}`);
      return response.data || [];
    },
    enabled: open,
  });

  const handleSelectCustomer = (customer: any) => {
    onSelectCustomer(customer);
    onClose();
  };

  const handleWalkIn = () => {
    onSelectCustomer(null);
    onClose();
  };

  return (
    <Modal
      title="Select Customer"
      open={open}
      onCancel={onClose}
      footer={null}
      width={500}
    >
      <Space direction="vertical" className="w-full" size="middle">
        <Input
          placeholder="Search by name, email, or phone..."
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="large"
        />

        <Button
          block
          size="large"
          onClick={handleWalkIn}
        >
          Walk-in Customer (No Account)
        </Button>

        {isLoading ? (
          <div className="text-center py-4">
            <Spin />
          </div>
        ) : (
          <List
            dataSource={customers}
            renderItem={(customer: any) => (
              <List.Item
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSelectCustomer(customer)}
              >
                <List.Item.Meta
                  avatar={<Avatar icon={<UserOutlined />} />}
                  title={`${customer.first_name} ${customer.last_name}`}
                  description={
                    <Space direction="vertical" size={0}>
                      <Text type="secondary">{customer.email}</Text>
                      <Text type="secondary">{customer.phone}</Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
            locale={{ emptyText: 'No customers found' }}
          />
        )}
      </Space>
    </Modal>
  );
}