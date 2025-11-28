import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { API_BASE_URL } from "../config";
import { useAuth } from "./AuthContext";
import type { Cart, CartResponse, CheckoutResponse } from "../types/cart";

const CartContext = createContext<CartContextValue | undefined>(undefined);

type CartContextValue = {
  cart: Cart | null;
  loading: boolean;
  mutating: boolean;
  error: string | null;
  refreshCart: () => Promise<void>;
  addItem: (productId: number, quantity?: number) => Promise<void>;
  updateItem: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  checkout: () => Promise<CheckoutResponse>;
};

const parseError = async (response: Response): Promise<string> => {
  try {
    const data = await response.json();
    if (typeof data?.error === "string") {
      return data.error;
    }
  } catch {
    // ignore
  }
  return `Request failed (${response.status})`;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { token, user, initializing } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authenticatedFetch = useCallback(
    async (input: string, init?: RequestInit) => {
      if (!token) {
        throw new Error("Authentication required.");
      }
      const headers = new Headers(init?.headers || {});
      headers.set("Authorization", `Bearer ${token}`);
      if (init?.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
      const response = await fetch(input, {
        ...init,
        headers,
      });
      if (!response.ok) {
        throw new Error(await parseError(response));
      }
      return response;
    },
    [token]
  );

  const loadCart = useCallback(async () => {
    if (!user || !token) {
      setCart(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/cart`);
      const data = (await response.json()) as CartResponse;
      setCart(data.cart);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load cart");
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch, token, user]);

  useEffect(() => {
    if (initializing) {
      return;
    }
    loadCart();
  }, [initializing, loadCart]);

  const refreshCart = useCallback(async () => {
    await loadCart();
  }, [loadCart]);

  const addItem = useCallback(
    async (productId: number, quantity = 1) => {
      setMutating(true);
      try {
        const response = await authenticatedFetch(`${API_BASE_URL}/cart/items`, {
          method: "POST",
          body: JSON.stringify({ product_id: productId, quantity }),
        });
        const data = (await response.json()) as CartResponse;
        setCart(data.cart);
      } finally {
        setMutating(false);
      }
    },
    [authenticatedFetch]
  );

  const updateItem = useCallback(
    async (itemId: number, quantity: number) => {
      setMutating(true);
      try {
        const response = await authenticatedFetch(`${API_BASE_URL}/cart/items/${itemId}`, {
          method: "PATCH",
          body: JSON.stringify({ quantity }),
        });
        const data = (await response.json()) as CartResponse;
        setCart(data.cart);
      } finally {
        setMutating(false);
      }
    },
    [authenticatedFetch]
  );

  const removeItem = useCallback(
    async (itemId: number) => {
      setMutating(true);
      try {
        const response = await authenticatedFetch(`${API_BASE_URL}/cart/items/${itemId}`, {
          method: "DELETE",
        });
        const data = (await response.json()) as CartResponse;
        setCart(data.cart);
      } finally {
        setMutating(false);
      }
    },
    [authenticatedFetch]
  );

  const checkout = useCallback(async () => {
    setMutating(true);
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/cart/checkout`, {
        method: "POST",
      });
      const data = (await response.json()) as CheckoutResponse;
      setCart(data.cart);
      return data;
    } finally {
      setMutating(false);
    }
  }, [authenticatedFetch]);

  const value = useMemo<CartContextValue>(
    () => ({ cart, loading, mutating, error, refreshCart, addItem, updateItem, removeItem, checkout }),
    [addItem, cart, checkout, error, loading, mutating, refreshCart, removeItem, updateItem]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
