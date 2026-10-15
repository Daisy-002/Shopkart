import { useNavigate, Link } from "react-router-dom";
import { logoutCustomer } from "../services/api";
import { useCart } from "../context/CartContext";

export default function Navbar({ isAuthenticated, onLogout }) {
  const navigate = useNavigate();
  const { totalUnits } = useCart();

  const handleLogout = async () => {
    try {
      await logoutCustomer();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      onLogout?.();
      navigate("/login");
    }
  };

  const linkClass = "text-sm font-medium text-gray-600 hover:text-indigo-600";

  return (
    <nav className="w-full bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <span className="text-lg font-semibold text-indigo-600">ShopKart</span>
        {isAuthenticated && (
          <>
            <Link to="/home" className={linkClass}>Home</Link>
            <Link to="/products" className={linkClass}>Products</Link>
            <Link to="/wishlist" className={linkClass}>Wishlist</Link>
            <Link to="/cart" className={linkClass}>Cart ({totalUnits})</Link>
            <Link to="/orders" className={linkClass}>Orders</Link>
          </>
        )}
      </div>
      {isAuthenticated && (
        <button
          onClick={handleLogout}
          className="text-sm font-medium text-gray-600 hover:text-red-600 transition-colors"
        >
          Logout
        </button>
      )}
    </nav>
  );
}