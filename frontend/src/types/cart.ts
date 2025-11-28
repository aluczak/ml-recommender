export interface CartProductSummary {
  id: number;
  name: string;
  price: number;
  currency: string;
  image_url?: string | null;
}

export interface CartItem {
  id: number;
  quantity: number;
  unit_price: number;
  line_total: number;
  product: CartProductSummary;
}

export interface Cart {
  id: number;
  status: string;
  currency: string;
  item_count: number;
  subtotal: number;
  items: CartItem[];
  created_at?: string | null;
  updated_at?: string | null;
}

export interface CartResponse {
  cart: Cart;
}

export interface CheckoutOrder {
  id: number;
  status: string;
  total_amount: number;
  currency: string;
  reference: string;
  created_at?: string | null;
}

export interface CheckoutResponse {
  order: CheckoutOrder;
  cart: Cart;
}
