import React, { useState } from 'react';
import { Modal, Form, InputNumber, Button, Space, Typography, message, Alert, Divider } from 'antd';
import { GiftOutlined, TrophyOutlined } from '@ant-design/icons';
import api from '@/services/api';

const { Text, Title } = Typography;

interface LoyaltyPointsModalProps {
  visible: boolean;
  onClose: () => void;
  customerId: string | null;
  onApplyDiscount: (discount: number, pointsUsed: number) => void;
}

export const LoyaltyPointsModal: React.FC<LoyaltyPointsModalProps> = ({
  visible,
  onClose,
  customerId,
  onApplyDiscount
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  const handlePreview = async () => {
    if (!customerId) {
      message.warning('Vui lòng chọn khách hàng');
      return;
    }

    try {
      const values = await form.validateFields();
      setLoading(true);

      const response = await api.post('/pos/loyalty/apply', {
        customerId,
        points: values.points
      });

      setPreviewData(response.data.data);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Lỗi khi tính toán điểm');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (previewData) {
      onApplyDiscount(previewData.discountAmount, previewData.pointsUsed);
      message.success(`Đã áp dụng ${previewData.pointsUsed} điểm (-${previewData.discountAmount.toLocaleString()}₫)`);
      setPreviewData(null);
      form.resetFields();
      onClose();
    }
  };

  const handleCancel = () => {
    setPreviewData(null);
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={
        <Space>
          <GiftOutlined style={{ color: '#faad14' }} />
          <span>Sử dụng điểm thưởng</span>
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      footer={
        previewData ? [
          <Button key="cancel" onClick={handleCancel}>
            Hủy
          </Button>,
          <Button key="apply" type="primary" onClick={handleApply}>
            Áp dụng giảm giá
          </Button>
        ] : [
          <Button key="cancel" onClick={handleCancel}>
            Đóng
          </Button>,
          <Button key="preview" type="primary" loading={loading} onClick={handlePreview}>
            Tính toán
          </Button>
        ]
      }
      width={450}
    >
      {!customerId ? (
        <Alert
          message="Chưa chọn khách hàng"
          description="Vui lòng chọn khách hàng để sử dụng điểm thưởng"
          type="warning"
          showIcon
        />
      ) : (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Alert
            message="Quy đổi điểm"
            description="1 điểm = 1,000₫ giảm giá"
            type="info"
            showIcon
            icon={<TrophyOutlined />}
          />

          {!previewData ? (
            <Form form={form} layout="vertical">
              <Form.Item
                label="Số điểm muốn sử dụng"
                name="points"
                rules={[
                  { required: true, message: 'Vui lòng nhập số điểm' },
                  { type: 'number', min: 1, message: 'Số điểm phải lớn hơn 0' }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="Nhập số điểm..."
                  min={1}
                  addonAfter="điểm"
                />
              </Form.Item>
            </Form>
          ) : (
            <div>
              <Divider orientation="left">Kết quả</Divider>

              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>Khách hàng:</Text>
                  <Text strong>{previewData.customerName}</Text>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>Điểm sử dụng:</Text>
                  <Text strong style={{ color: '#faad14' }}>
                    {previewData.pointsUsed} điểm
                  </Text>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>Giảm giá:</Text>
                  <Text strong style={{ color: '#52c41a', fontSize: 18 }}>
                    -{previewData.discountAmount.toLocaleString()}₫
                  </Text>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>Điểm còn lại:</Text>
                  <Text strong>{previewData.remainingPoints} điểm</Text>
                </div>
              </Space>
            </div>
          )}
        </Space>
      )}
    </Modal>
  );
};
