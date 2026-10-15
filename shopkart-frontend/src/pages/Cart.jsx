import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import CartItem from "../components/CartItem";

export default function Cart() {
  const { cartItems, loading, error, subtotal, totalUnits, refreshCart } = useCart();
  const navigate = useNavigate();

  if (loading && cartItems.length === 0) {
    return <p className="text-center text-gray-400 text-sm py-16">Loading your cart...</p>;
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-900 font-medium">Unable to load your cart.</p>
        <button onClick={refreshCart} className="mt-4 rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2 hover:bg-indigo-700">
          Try Again
        </button>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-3">🛒</div>
        <p className="text-gray-900 font-medium">Your cart is empty</p>
        <p className="text-gray-500 text-sm mt-1 mb-4">Looks like you haven't added anything yet.</p>
        <Link to="/products" className="inline-block rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2 hover:bg-indigo-700">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">My Cart</h1>
      <div className="grid md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-2 space-y-4">
          {cartItems.map((item) => (
            <CartItem key={item.product._id} item={item} />
          ))}
        </div>

        <aside className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Order Summary</h2>
          <div className="flex justify-between text-sm text-gray-600 py-1">
            <span>Items</span>
            <span>{totalUnits}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold text-gray-900 py-1 border-t border-gray-100 mt-2 pt-3">
            <span>Subtotal</span>
            <span>₹{subtotal.toLocaleString("en-IN")}</span>
          </div>
          <button
            onClick={() => navigate("/checkout")}
            className="mt-4 w-full rounded-lg bg-indigo-600 text-white text-sm font-medium py-2.5 hover:bg-indigo-700 transition-colors"
          >
            Proceed to Checkout
          </button>
        </aside>
      </div>
    </div>
  );
}