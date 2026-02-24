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
  const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || import.meta.env.VITE_ADMIN_EMAIL || "admin@zenithlearning.site")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="w-12 h-12 border-4 border-blue-400 border-dashed rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

      const email = (user?.email || "").toLowerCase();
  const isAdmin = ADMIN_EMAILS.includes(email);
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
