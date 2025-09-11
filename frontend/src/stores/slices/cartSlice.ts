import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface CartItem {
  id: string
  variantId: string
  productName: string
  variantName?: string
  price: number
  quantity: number
  image?: string
}

interface CartState {
  items: CartItem[]
  total: number
  itemCount: number
}

const initialState: CartState = {
  items: [],
  total: 0,
  itemCount: 0,
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const existingItem = state.items.find(item => item.variantId === action.payload.variantId)
      
      if (existingItem) {
        existingItem.quantity += action.payload.quantity
      } else {
        state.items.push(action.payload)
      }
      
      state.itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0)
      state.total = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.variantId !== action.payload)
      state.itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0)
      state.total = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    },
    updateQuantity: (state, action: PayloadAction<{ variantId: string; quantity: number }>) => {
      const item = state.items.find(item => item.variantId === action.payload.variantId)
      if (item) {
        item.quantity = action.payload.quantity
        state.itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0)
        state.total = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      }
    },
    clearCart: (state) => {
      state.items = []
      state.total = 0
      state.itemCount = 0
    },
  },
})

export const { addToCart, removeFromCart, updateQuantity, clearCart } = cartSlice.actions
export default cartSlice.reducer