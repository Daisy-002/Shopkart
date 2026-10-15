import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyOrders } from "../services/api";
import OrderCard from "../components/OrderCard";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | success | error

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await getMyOrders();
      setOrders(res.data.orders);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (status === "loading") return <p className="text-center text-gray-400 text-sm py-16">Loading your orders...</p>;

  if (status === "error") {
    return (
      <div className="text-center py-16">
        <p className="text-gray-900 font-medium">Something went wrong.</p>
        <p className="text-gray-500 text-sm mt-1 mb-4">We couldn't load your orders.</p>
        <button onClick={load} className="rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2 hover:bg-indigo-700">Try Again</button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-3">📦</div>
        <p className="text-gray-900 font-medium">You have not placed any orders yet.</p>
        <Link to="/products" className="inline-block mt-4 rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2 hover:bg-indigo-700">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">My Orders</h1>
      <div className="space-y-4">
        {orders.map((o) => <OrderCard key={o._id} order={o} />)}
      </div>
    </div>
  );
}