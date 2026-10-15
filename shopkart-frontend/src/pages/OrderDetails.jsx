import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { getOrderById } from "../services/api";

export default function OrderDetails() {
  const { id } = useParams();
  const { state } = useLocation();
  const justPlaced = !!state?.justPlaced; // set by Checkout after verified payment
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | success | error | not-found

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    getOrderById(id)
      .then((res) => { if (!cancelled) { setOrder(res.data.order); setStatus("success"); } })
      .catch((err) => { if (!cancelled) setStatus(err.response?.status === 404 ? "not-found" : "error"); });
    return () => { cancelled = true; };
  }, [id]);

  if (status === "loading") return <p className="text-center text-gray-400 text-sm py-16">Loading order...</p>;
  if (status === "not-found") {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-sm mb-4">Order not found.</p>
        <Link to="/orders" className="text-indigo-600 text-sm font-medium hover:underline">Back to my orders</Link>
      </div>
    );
  }
  if (status === "error") return <p className="text-center text-red-500 text-sm py-16">Something went wrong while loading this order.</p>;

  const a = order.shippingAddress;
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {justPlaced && (
        <div className="text-center mb-6">
          <div className="text-4xl">✅</div>
          <h1 className="text-xl font-semibold text-gray-900 mt-2">Order Placed Successfully</h1>
          <p className="text-sm text-gray-500 mt-1">Your order has been saved successfully.</p>
        </div>
      )}
      {!justPlaced && <h1 className="text-2xl font-semibold text-gray-900 mb-6">Order Details</h1>}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="text-sm space-y-1">
          <p><span className="text-gray-500">Order ID:</span> <span className="font-mono">{order._id}</span></p>
          <p><span className="text-gray-500">Status:</span> {order.status} · Payment: {order.paymentStatus}</p>
        </div>

        <ul className="divide-y divide-gray-100">
          {order.items.map((it) => (
            <li key={it.product} className="flex gap-3 py-3 text-sm">
              <img src={it.image} alt={it.name} className="w-14 h-14 rounded-lg object-cover bg-gray-50"
                onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/100x100?text=No+Image"; }} />
              <div className="flex-1">
                <p className="font-medium text-gray-900">{it.name}</p>
                <p className="text-gray-500">₹{it.price.toLocaleString("en-IN")} × {it.quantity}</p>
              </div>
              <p className="font-semibold text-gray-900">₹{(it.price * it.quantity).toLocaleString("en-IN")}</p>
            </li>
          ))}
        </ul>

        <div className="flex justify-between font-semibold text-gray-900 border-t border-gray-100 pt-3 text-sm">
          <span>Total</span><span>₹{order.totalAmount.toLocaleString("en-IN")}</span>
        </div>

        <div className="text-sm text-gray-600 border-t border-gray-100 pt-3">
          <p className="font-medium text-gray-900 mb-1">Delivering to</p>
          <p>{a.fullName} · {a.phone}</p>
          <p>{a.addressLine1}, {a.city}, {a.state} {a.pincode}</p>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <Link to="/orders" className="flex-1 text-center rounded-lg bg-indigo-600 text-white text-sm font-medium py-2.5 hover:bg-indigo-700">View My Orders</Link>
        <Link to="/products" className="flex-1 text-center rounded-lg border border-gray-300 text-gray-700 text-sm font-medium py-2.5 hover:bg-gray-50">Continue Shopping</Link>
      </div>
    </div>
  );
}