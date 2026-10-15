import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getCart, addCartItem, updateCartItem, removeCartItem } from "../services/api";

const CartContext = createContext(null);

export function CartProvider({ isAuthenticated, children }) {
  const [cartItems, setCartItems] = useState([]); // [{ product, quantity }]
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pending, setPending] = useState({}); // { [productId]: true } per-item loading

  const refreshCart = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCart();
      setCartItems(res.data.cart);
    } catch {
      setError("Unable to load your cart.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load once when logged in; clear when logged out. No other component fetches the cart.
  useEffect(() => {
    if (isAuthenticated) refreshCart();
    else setCartItems([]);
  }, [isAuthenticated, refreshCart]);

  // Every mutation: mark item busy -> call API -> replace state with server's cart.
  const mutate = async (productId, apiCall) => {
    setPending((p) => ({ ...p, [productId]: true }));
    try {
      const res = await apiCall();
      setCartItems(res.data.cart);
      return { ok: true };
    } catch (err) {
      return { ok: false, message: err.response?.data?.message || "Something went wrong" };
    } finally {
      setPending((p) => ({ ...p, [productId]: false }));
    }
  };

  // Called after verified payment: the server already emptied the cart, mirror that here
  const clearCart = () => setCartItems([]);

  const addToCart = (productId) => mutate(productId, () => addCartItem(productId));
  const updateQuantity = (productId, qty) => mutate(productId, () => updateCartItem(productId, qty));
  const removeFromCart = (productId) => mutate(productId, () => removeCartItem(productId));

  // Derived values: never stored, always computed from cartItems
  const totalUnits = useMemo(() => cartItems.reduce((sum, i) => sum + i.quantity, 0), [cartItems]);
  const subtotal = useMemo(
    () => cartItems.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    [cartItems]
  );

  const value = {
    cartItems, loading, error, pending, totalUnits, subtotal,
    addToCart, updateQuantity, removeFromCart, refreshCart, clearCart,
  };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
};