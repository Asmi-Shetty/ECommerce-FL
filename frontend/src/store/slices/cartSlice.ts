import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  discountPrice: number | null;
  imageUrl: string;
  quantity: number;
  unit: string;
}

export interface CouponInfo {
  code: string;
  discount: number;
  isPercentage: boolean;
  minOrderVal: number;
}

interface CartState {
  items: CartItem[];
  coupon: CouponInfo | null;
  deliveryCharge: number;
  subtotal: number;
  discountAmount: number;
  total: number;
}

const calculateTotals = (state: CartState) => {
  let subtotal = 0;
  state.items.forEach((item) => {
    const activePrice = item.discountPrice !== null ? item.discountPrice : item.price;
    subtotal += activePrice * item.quantity;
  });

  state.subtotal = subtotal;

  let discount = 0;
  if (state.coupon) {
    if (subtotal >= state.coupon.minOrderVal) {
      if (state.coupon.isPercentage) {
        discount = (subtotal * state.coupon.discount) / 100;
      } else {
        discount = state.coupon.discount;
      }
    } else {
      state.coupon = null; // Remove coupon if min order value not met
    }
  }

  state.discountAmount = discount;

  // Free delivery for orders above ₹300, otherwise ₹30
  state.deliveryCharge = subtotal > 300 || subtotal === 0 ? 0 : 30;
  state.total = Math.max(0, subtotal - discount + state.deliveryCharge);
};

const getInitialState = (): CartState => {
  if (typeof window !== 'undefined') {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        return parsed;
      } catch (e) {
        localStorage.removeItem('cart');
      }
    }
  }
  return {
    items: [],
    coupon: null,
    deliveryCharge: 0,
    subtotal: 0,
    discountAmount: 0,
    total: 0,
  };
};

const saveCartToStorage = (state: CartState) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('cart', JSON.stringify(state));
  }
};

const cartSlice = createSlice({
  name: 'cart',
  initialState: getInitialState(),
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const existing = state.items.find((item) => item.productId === action.payload.productId);
      if (existing) {
        existing.quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
      }
      calculateTotals(state);
      saveCartToStorage(state);
    },
    updateQuantity: (state, action: PayloadAction<{ productId: string; quantity: number }>) => {
      const existing = state.items.find((item) => item.productId === action.payload.productId);
      if (existing) {
        existing.quantity = action.payload.quantity;
        if (existing.quantity <= 0) {
          state.items = state.items.filter((item) => item.productId !== action.payload.productId);
        }
      }
      calculateTotals(state);
      saveCartToStorage(state);
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.productId !== action.payload);
      calculateTotals(state);
      saveCartToStorage(state);
    },
    applyCoupon: (state, action: PayloadAction<CouponInfo>) => {
      state.coupon = action.payload;
      calculateTotals(state);
      saveCartToStorage(state);
    },
    removeCoupon: (state) => {
      state.coupon = null;
      calculateTotals(state);
      saveCartToStorage(state);
    },
    clearCart: (state) => {
      state.items = [];
      state.coupon = null;
      state.subtotal = 0;
      state.discountAmount = 0;
      state.deliveryCharge = 0;
      state.total = 0;
      saveCartToStorage(state);
    },
    setCartState: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload;
      calculateTotals(state);
      saveCartToStorage(state);
    }
  },
});

export const {
  addToCart,
  updateQuantity,
  removeFromCart,
  applyCoupon,
  removeCoupon,
  clearCart,
  setCartState,
} = cartSlice.actions;

export default cartSlice.reducer;
