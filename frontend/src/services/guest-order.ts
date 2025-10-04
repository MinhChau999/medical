import api from './api';

export interface GuestOrderItem {
  variantId: string;
  quantity: number;
}

export interface CustomerInfo {
  name: string;
  phone: string;
  email?: string;
}

export interface ShippingAddress {
  address: string;
  ward?: string;
  district?: string;
  city?: string;
}

export interface CreateGuestOrderRequest {
  customerInfo: CustomerInfo;
  shippingAddress: ShippingAddress;
  items: GuestOrderItem[];
  paymentMethod?: 'cod' | 'bank_transfer';
  notes?: string;
}

export interface GuestOrder {
  id: string;
  orderNumber: string;
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  notes?: string;
  metadata: {
    customerInfo: CustomerInfo;
    shippingAddress: ShippingAddress;
    isGuest: boolean;
  };
  createdAt: string;
  items: Array<{
    productName: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
}

export const guestOrderService = {
  async createOrder(data: CreateGuestOrderRequest) {
    const response = await api.post('/guest-orders', data);
    return response.data;
  },

  async getOrderByNumber(orderNumber: string): Promise<GuestOrder> {
    const response = await api.get(`/guest-orders/${orderNumber}`);
    return response.data.data;
  },
};
