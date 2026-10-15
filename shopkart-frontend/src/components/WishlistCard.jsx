import { Link } from "react-router-dom";

export default function WishlistCard({ product, removing, onRemove }) {
  const outOfStock = product.stock <= 0;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
      <div className="aspect-square bg-gray-50 overflow-hidden">
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
        <p className={`text-xs ${outOfStock ? "text-red-500" : "text-gray-500"}`}>
          {outOfStock ? "Out of stock" : `${product.stock} units left`}
        </p>
        <Link
          to={`/products/${product._id}`}
          className="mt-3 text-center text-sm font-medium rounded-lg bg-indigo-600 text-white py-2 hover:bg-indigo-700 transition-colors"
        >
          View Details
        </Link>
        <button
          onClick={() => onRemove(product._id)}
          disabled={removing}
          className="text-sm font-medium rounded-lg border border-gray-300 text-gray-700 py-2 hover:text-red-600 hover:border-red-300 transition-colors disabled:opacity-60"
        >
          {removing ? "Removing..." : "Remove ♥"}
        </button>
      </div>
    </div>
  );
}