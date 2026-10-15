import { useState } from "react";
import { Link } from "react-router-dom";
import { addToWishlist } from "../services/api";
import { useCart } from "../context/CartContext";

export default function ProductCard({ product }) {
  const outOfStock = product.stock <= 0;
  const { addToCart, pending } = useCart();
  const [wishStatus, setWishStatus] = useState("idle"); // idle | saving | saved | error
  const [cartError, setCartError] = useState("");
  const adding = !!pending[product._id];

  const handleWishlist = async () => {
    if (wishStatus === "saving" || wishStatus === "saved") return; // block duplicate clicks
    setWishStatus("saving");
    try {
      await addToWishlist(product._id);
      setWishStatus("saved");
    } catch (err) {
      // 409 = already saved earlier (e.g. before a refresh). Treat as saved.
      setWishStatus(err.response?.status === 409 ? "saved" : "error");
    }
  };

  const handleAddToCart = async () => {
    setCartError("");
    const result = await addToCart(product._id);
    if (!result.ok) setCartError(result.message);
  };

  const wishLabel = {
    idle: "♡ Add to Wishlist",
    saving: "⏳ Saving...",
    saved: "♥ Added to Wishlist",
    error: "♡ Try again",
  }[wishStatus];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
      <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://placehold.co/400x400?text=No+Image";
          }}
        />
      </div>

      <div className="p-4 flex flex-col gap-1 flex-1">
        <span className="text-xs text-indigo-600 font-medium">{product.category}</span>
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
        <p className="text-lg font-bold text-gray-900 mt-1">₹{product.price.toLocaleString("en-IN")}</p>
        <p className={`text-xs mt-1 ${outOfStock ? "text-red-500" : "text-gray-500"}`}>
          {outOfStock ? "Out of stock" : `${product.stock} units left`}
        </p>

        <Link
          to={`/products/${product._id}`}
          className="mt-3 text-center text-sm font-medium rounded-lg border border-indigo-600 text-indigo-600 py-2 hover:bg-indigo-50 transition-colors"
        >
          View Details
        </Link>

        <button
          onClick={handleAddToCart}
          disabled={outOfStock || adding}
          className="text-sm font-medium rounded-lg bg-indigo-600 text-white py-2 hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {outOfStock ? "Out of Stock" : adding ? "Adding..." : "Add to Cart"}
        </button>
        {cartError && <p className="text-xs text-red-600">{cartError}</p>}

        <button
          onClick={handleWishlist}
          disabled={wishStatus === "saving"}
          className="text-sm font-medium rounded-lg border border-gray-300 text-gray-700 py-2 hover:bg-gray-50 transition-colors disabled:opacity-60"
        >
          {wishLabel}
        </button>
        {wishStatus === "error" && (
          <p className="text-xs text-red-600">Unable to save product. Please try again.</p>
        )}
      </div>
    </div>
  );
}