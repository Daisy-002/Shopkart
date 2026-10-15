import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { createPaymentOrder, verifyPayment } from "../services/api";

const FIELDS = [
  { name: "fullName", label: "Full Name", placeholder: "Aarav Sharma" },
  { name: "phone", label: "Phone", placeholder: "9876543210" },
  { name: "addressLine1", label: "Address", placeholder: "22 MG Road" },
  { name: "city", label: "City", placeholder: "Bengaluru" },
  { name: "state", label: "State", placeholder: "Karnataka" },
  { name: "pincode", label: "Pincode", placeholder: "560001" },
];

const initialForm = { fullName: "", phone: "", addressLine1: "", city: "", state: "", pincode: "" };

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

function validate(form) {
  const errors = {};
  for (const f of FIELDS) {
    if (!form[f.name].trim()) errors[f.name] = `${f.label} is required`;
  }
  if (!errors.phone && !/^\d{10}$/.test(form.phone.trim())) errors.phone = "Phone must contain 10 digits";
  if (!errors.pincode && !/^\d{6}$/.test(form.pincode.trim())) errors.pincode = "Pincode must contain 6 digits";
  return errors;
}

export default function Checkout() {
  const { cartItems, loading, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm); // form state lives here, in the page that owns it
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [paying, setPaying] = useState(false); // Razorpay window is open

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // While the cart is still loading, don't redirect yet (a refresh would bounce you out wrongly)
  if (loading && cartItems.length === 0) {
    return <p className="text-center text-gray-400 text-sm py-16">Loading your cart...</p>;
  }
  // Empty cart + direct visit to /checkout -> back to the cart
  // (not while an order is being finalised, because clearCart() empties it on success)
  if (cartItems.length === 0 && !submitting && !paying) {
    return <Navigate to="/cart" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return; // no backend call if client validation fails

    setSubmitting(true);
    try {
      const shippingAddress = Object.fromEntries(
        Object.entries(form).map(([k, v]) => [k, v.trim()])
      );

      // 1. Server validates cart + stock, computes total, creates pending order + Razorpay order
      const { data } = await createPaymentOrder(shippingAddress);

      // 2. Load Razorpay's script
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setServerError("Couldn't load the payment window. Check your connection and try again.");
        setSubmitting(false);
        return;
      }

      // 3. Open Razorpay Checkout
      setPaying(true);
      const rzp = new window.Razorpay({
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: "ShopKart",
        description: "ShopKart Order",
        order_id: data.razorpayOrderId,
        prefill: { name: shippingAddress.fullName, contact: shippingAddress.phone },

        // The browser does NOT decide that payment worked. It forwards proof to the server.
        handler: async (response) => {
          try {
            await verifyPayment({
              shopKartOrderId: data.shopKartOrderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            clearCart(); // server cleared its cart; Navbar -> Cart (0)
            navigate(`/orders/${data.shopKartOrderId}`, { state: { justPlaced: true }, replace: true });
          } catch (err) {
            setPaying(false);
            setSubmitting(false);
            setServerError(
              err.response?.data?.message ||
                "We couldn't confirm your payment. If money was deducted, it will be reflected in My Orders shortly."
            );
          }
        },

        modal: {
          // User closed the window without paying
          ondismiss: () => {
            setPaying(false);
            setSubmitting(false);
          },
        },
      });

      rzp.on("payment.failed", () => {
        setPaying(false);
        setSubmitting(false);
        setServerError("Payment failed. Your cart has not been cleared. Please try again.");
      });

      rzp.open();
    } catch (err) {
      setServerError(err.response?.data?.message || "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Checkout</h1>

      <div className="grid md:grid-cols-3 gap-6 items-start">
        <form onSubmit={handleSubmit} noValidate className="md:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Shipping Details</h2>

          {serverError && (
            <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{serverError}</div>
          )}

          {FIELDS.map((f) => (
            <div key={f.name}>
              <label htmlFor={f.name} className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <input
                id={f.name}
                name={f.name}
                value={form[f.name]}
                onChange={handleChange}
                placeholder={f.placeholder}
                disabled={submitting}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
              />
              {errors[f.name] && <p className="mt-1 text-xs text-red-600">{errors[f.name]}.</p>}
            </div>
          ))}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-indigo-600 text-white text-sm font-medium py-2.5 hover:bg-indigo-700 transition-colors disabled:opacity-60"
          >
            {paying ? "Complete payment in the Razorpay window..." : submitting ? "Preparing payment..." : "Place Order"}
          </button>
          <p className="text-xs text-gray-400 text-center">Test Mode: no real money is charged.</p>
        </form>

        <aside className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Order Summary</h2>
          <ul className="space-y-2 text-sm">
            {cartItems.map(({ product, quantity }) => (
              <li key={product._id} className="flex justify-between gap-3 text-gray-600">
                <span className="truncate">{product.name} × {quantity}</span>
                <span>₹{(product.price * quantity).toLocaleString("en-IN")}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between text-sm font-semibold text-gray-900 border-t border-gray-100 mt-3 pt-3">
            <span>Total</span>
            <span>₹{subtotal.toLocaleString("en-IN")}</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">The final amount is recalculated on the server.</p>
          <Link to="/cart" className="block mt-3 text-sm text-indigo-600 hover:underline">← Back to cart</Link>
        </aside>
      </div>
    </div>
  );
}