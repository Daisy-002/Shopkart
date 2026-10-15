import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function CartItem({ item }) {
  const { product, quantity } = item;
  const { updateQuantity, removeFromCart, pending } = useCart();
  const [error, setError] = useState("");
  const busy = !!pending[product._id]; // only THIS row is disabled

  const run = async (promise) => {
    setError("");
    const result = await promise;
    if (!result.ok) setError(result.message);
  };

  return (
    <div className="flex gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <img
        src={product.image}
        alt={product.name}
        className="w-24 h-24 rounded-lg object-cover bg-gray-50"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = "https://placehold.co/200x200?text=No+Image";
        }}
      />
      <div className="flex-1 min-w-0">
        <Link to={`/products/${product._id}`} className="text-sm font-semibold text-gray-900 hover:text-indigo-600 line-clamp-2">
          {product.name}
        </Link>
        <p className="text-sm text-gray-500 mt-0.5">₹{product.price.toLocaleString("en-IN")}</p>

        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button
              aria-label="Decrease quantity"
              disabled={busy || quantity <= 1}
              onClick={() => run(updateQuantity(product._id, quantity - 1))}
              className="px-3 py-1 text-gray-700 disabled:opacity-40"
            >
              −
            </button>
            <span className="px-3 text-sm font-medium">{quantity}</span>
            <button
              aria-label="Increase quantity"
              disabled={busy || quantity >= product.stock}
              onClick={() => run(updateQuantity(product._id, quantity + 1))}
              className="px-3 py-1 text-gray-700 disabled:opacity-40"
            >
              +
            </button>
          </div>
          <button
            disabled={busy}
            onClick={() => run(removeFromCart(product._id))}
            className="text-sm text-gray-500 hover:text-red-600 disabled:opacity-50"
          >
            {busy ? "Updating..." : "Remove"}
          </button>
        </div>
        {quantity >= product.stock && <p className="text-xs text-amber-600 mt-1">Maximum available stock reached</p>}
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
      <p className="text-sm font-semibold text-gray-900">
        ₹{(product.price * quantity).toLocaleString("en-IN")}
      </p>
    </div>
  );
}