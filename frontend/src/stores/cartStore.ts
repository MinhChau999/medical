import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { message } from 'antd';

export interface CartItem {
  variantId: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  image?: string;
  variantName?: string;
}

interface CartState {
  items: CartItem[];

  // Actions
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;

  // Getters
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item, quantity = 1) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (i) => i.variantId === item.variantId
          );

          if (existingIndex >= 0) {
            const updated = [...state.items];
            updated[existingIndex].quantity += quantity;
            message.success('Đã cập nhật số lượng trong giỏ hàng');
            return { items: updated };
          } else {
            message.success('Đã thêm sản phẩm vào giỏ hàng');
            return { items: [...state.items, { ...item, quantity }] };
          }
        });
      },

      removeItem: (variantId) => {
        set((state) => ({
          items: state.items.filter((item) => item.variantId !== variantId),
        }));
        message.success('Đã xóa sản phẩm khỏi giỏ hàng');
      },

      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.variantId === variantId ? { ...item, quantity } : item
          ),
        }));
      },

      clearCart: () => {
        set({ items: [] });
        message.success('Đã xóa tất cả sản phẩm trong giỏ hàng');
      },

      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
