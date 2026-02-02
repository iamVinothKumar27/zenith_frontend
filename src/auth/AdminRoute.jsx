import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider.jsx";

/**
 * Blocks routes unless the user is an admin.
 * - Requires Firebase login (user)
 * - Requires Mongo profile.role === 'admin'
 */
export default function AdminRoute({ children }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="w-12 h-12 border-4 border-blue-400 border-dashed rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  // If profile isn't loaded (backend down, or sync failed), treat as non-admin.
  if (!profile || profile.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}
