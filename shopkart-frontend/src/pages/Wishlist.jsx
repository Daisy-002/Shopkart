import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getWishlist, removeFromWishlist } from "../services/api";
import WishlistCard from "../components/WishlistCard";

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [removingId, setRemovingId] = useState(null);
  const [actionError, setActionError] = useState("");

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await getWishlist();
      setItems(res.data.wishlist);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleRemove = async (productId) => {
    setActionError("");
    setRemovingId(productId);
    try {
      await removeFromWishlist(productId);
      setItems((prev) => prev.filter((p) => p._id !== productId)); // no refetch/refresh needed
    } catch {
      setActionError("Couldn't remove that product. Please try again.");
    } finally {
      setRemovingId(null);
    }
  };

  if (status === "loading") {
    return <p className="text-center text-gray-400 text-sm py-16">Loading your wishlist...</p>;
  }

  if (status === "error") {
    return (
      <div className="text-center py-16">
        <p className="text-gray-900 font-medium">Something went wrong.</p>
        <p className="text-gray-500 text-sm mt-1 mb-4">We couldn't load your wishlist.</p>
        <button onClick={load} className="rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2 hover:bg-indigo-700">
          Try Again
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-3">❤️</div>
        <p className="text-gray-900 font-medium">Your wishlist is empty</p>
        <p className="text-gray-500 text-sm mt-1 mb-4">Save products you love and find them here later.</p>
        <Link to="/products" className="inline-block rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2 hover:bg-indigo-700">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold text-gray-900">My Wishlist</h1>
      <p className="text-sm text-gray-500 mb-6">
        {items.length} {items.length === 1 ? "product" : "products"} saved
      </p>
      {actionError && <p className="text-sm text-red-600 mb-4">{actionError}</p>}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
        {items.map((p) => (
          <WishlistCard key={p._id} product={p} removing={removingId === p._id} onRemove={handleRemove} />
        ))}
      </div>
    </div>
  );
}