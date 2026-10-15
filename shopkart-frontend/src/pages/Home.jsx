import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyProfile } from "../services/api";

export default function Home() {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    // Because the "token" cookie is HttpOnly, this component can't just
    // read it — the only way to know who's logged in is to ask the
    // backend, which reads the cookie itself and returns the customer.
    getMyProfile()
      .then((res) => {
        if (!cancelled) setCustomer(res.data);
      })
      .catch(() => {
        // Not logged in / expired token -> bounce to login
        if (!cancelled) navigate("/login");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex items-center justify-center text-gray-400 text-sm">
        Loading your profile...
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div className="min-h-[calc(100vh-65px)] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">
          Welcome, {customer.fullName} 👋
        </h1>
        <p className="text-sm text-gray-500 mb-6">Here's your ShopKart profile.</p>

        <dl className="space-y-3 text-sm">
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <dt className="text-gray-500">Name</dt>
            <dd className="text-gray-900 font-medium">{customer.fullName}</dd>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <dt className="text-gray-500">Email</dt>
            <dd className="text-gray-900 font-medium">{customer.email}</dd>
          </div>
          <div className="flex justify-between pb-2">
            <dt className="text-gray-500">Phone</dt>
            <dd className="text-gray-900 font-medium">{customer.phone}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
