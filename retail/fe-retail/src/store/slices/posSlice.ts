import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CartItem, Product, Customer, Promotion } from "../../types";

interface PosState {
  cart: CartItem[];
  selectedCustomer: Customer | null;
  appliedPromotion: Promotion | null;
  subtotal: number;
  discountAmount: number;
  total: number;
  paymentMethod: "cash" | "card" | "transfer";
  amountPaid: number;
  change: number;
  isProcessing: boolean;
}

const initialState: PosState = {
  cart: [],
  selectedCustomer: null,
  appliedPromotion: null,
  subtotal: 0,
  discountAmount: 0,
  total: 0,
  paymentMethod: "cash",
  amountPaid: 0,
  change: 0,
  isProcessing: false,
};

const posSlice = createSlice({
  name: "pos",
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<Product>) => {
      const product = action.payload;
      const existingItem = state.cart.find(
        (item) => item.product.id === product.id
      );

      if (existingItem) {
        existingItem.quantity += 1;
        existingItem.subtotal =
          existingItem.quantity * existingItem.product.price;
      } else {
        state.cart.push({
          product,
          quantity: 1,
          subtotal: product.price,
        });
      }

      // Recalculate totals
      posSlice.caseReducers.calculateTotals(state);
    },
    removeFromCart: (state, action: PayloadAction<number>) => {
      state.cart = state.cart.filter(
        (item) => item.product.id !== action.payload
      );
      posSlice.caseReducers.calculateTotals(state);
    },
    updateQuantity: (
      state,
      action: PayloadAction<{ productId: number; quantity: number }>
    ) => {
      const { productId, quantity } = action.payload;
      const item = state.cart.find((item) => item.product.id === productId);

      if (item) {
        if (quantity <= 0) {
          state.cart = state.cart.filter(
            (item) => item.product.id !== productId
          );
        } else {
          item.quantity = quantity;
          item.subtotal = item.quantity * item.product.price;
        }
      }

      posSlice.caseReducers.calculateTotals(state);
    },
    setCustomer: (state, action: PayloadAction<Customer | null>) => {
      state.selectedCustomer = action.payload;
    },
    applyPromotion: (state, action: PayloadAction<Promotion | null>) => {
      state.appliedPromotion = action.payload;
      posSlice.caseReducers.calculateTotals(state);
    },
    setPaymentMethod: (
      state,
      action: PayloadAction<"cash" | "card" | "transfer">
    ) => {
      state.paymentMethod = action.payload;
    },
    setAmountPaid: (state, action: PayloadAction<number>) => {
      state.amountPaid = action.payload;
      state.change = Math.max(0, action.payload - state.total);
    },
    clearCart: (state) => {
      state.cart = [];
      state.selectedCustomer = null;
      state.appliedPromotion = null;
      state.subtotal = 0;
      state.discountAmount = 0;
      state.total = 0;
      state.amountPaid = 0;
      state.change = 0;
    },
    setProcessing: (state, action: PayloadAction<boolean>) => {
      state.isProcessing = action.payload;
    },
    calculateTotals: (state) => {
      // Calculate subtotal
      state.subtotal = state.cart.reduce((sum, item) => sum + item.subtotal, 0);

      // Calculate discount
      state.discountAmount = 0;
      if (
        state.appliedPromotion &&
        state.subtotal >= (state.appliedPromotion.min_order_amount || 0)
      ) {
        if (state.appliedPromotion.discount_type === "percentage") {
          state.discountAmount =
            (state.subtotal * state.appliedPromotion.discount_value) / 100;
        } else {
          state.discountAmount = state.appliedPromotion.discount_value;
        }
      }

      // Calculate total
      state.total = state.subtotal - state.discountAmount;

      // Recalculate change
      state.change = Math.max(0, state.amountPaid - state.total);
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  setCustomer,
  applyPromotion,
  setPaymentMethod,
  setAmountPaid,
  clearCart,
  setProcessing,
  calculateTotals,
} = posSlice.actions;

export default posSlice.reducer;
