import axios from "axios";

const BASE_URL = "http://localhost:3000";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

export const registerCustomer = (data) => api.post("/customers/register", data);
export const loginCustomer = (data) => api.post("/customers/login", data);
export const getMyProfile = () => api.get("/customers/me");
export const logoutCustomer = () => api.post("/customers/logout");

export const getProducts = (params = {}) => api.get("/products", { params });
export const getProductById = (id) => api.get(`/products/${id}`);

// ---- Wishlist (Lab 04) ----
export const addToWishlist = (productId) => api.post(`/wishlist/${productId}`);
export const getWishlist = () => api.get("/wishlist");
export const removeFromWishlist = (productId) => api.delete(`/wishlist/${productId}`);

// ---- Cart (Lab 05) ----
export const getCart = () => api.get("/cart");
export const addCartItem = (productId) => api.post(`/cart/${productId}`);
export const updateCartItem = (productId, quantity) => api.patch(`/cart/${productId}`, { quantity });
export const removeCartItem = (productId) => api.delete(`/cart/${productId}`);

// ---- Orders + Razorpay (Lab 06) ----
export const createPaymentOrder = (shippingAddress) =>
  api.post("/orders/create-payment-order", { shippingAddress }); // address ONLY, never totals
export const verifyPayment = (data) => api.post("/orders/verify-payment", data);
export const getMyOrders = () => api.get("/orders");
export const getOrderById = (id) => api.get(`/orders/${id}`);

export default api;