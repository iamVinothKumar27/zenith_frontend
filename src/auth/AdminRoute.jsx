import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider.jsx";

/**
 * Blocks routes unless the user is an admin.
 * - Requires Firebase login (user)
 * - Requires user.email === ADMIN_EMAIL
 */
export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || "admin@zenithlearning.site").toLowerCase();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="w-12 h-12 border-4 border-blue-400 border-dashed rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

    const isAdmin = (user?.email || "").toLowerCase() === ADMIN_EMAIL;
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
