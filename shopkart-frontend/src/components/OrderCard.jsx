import { Link } from "react-router-dom";

export default function OrderCard({ order }) {
  const date = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex justify-between text-sm">
        <span className="font-semibold text-gray-900">Order #{order._id.slice(-8)}</span>
        <span className="text-gray-500">{date}</span>
      </div>
      <ul className="mt-3 space-y-1 text-sm text-gray-600">
        {order.items.map((it) => (
          <li key={it.product}>{it.name} × {it.quantity}</li>
        ))}
      </ul>
      <div className="flex justify-between items-center mt-4">
        <div className="text-sm">
          <p className="font-semibold text-gray-900">Total: ₹{order.totalAmount.toLocaleString("en-IN")}</p>
          <p className="text-gray-500">Status: {order.status}</p>
        </div>
        <Link to={`/orders/${order._id}`} className="rounded-lg border border-indigo-600 text-indigo-600 text-sm font-medium px-4 py-2 hover:bg-indigo-50">
          View Details
        </Link>
      </div>
    </div>
  );
}