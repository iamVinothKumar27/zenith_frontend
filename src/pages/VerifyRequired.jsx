import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider.jsx";
import { auth, signOut } from "../firebase.js";

// ✅ Multi-backend support (comma-separated)
const API_BASES = (import.meta.env.VITE_API_BASES || import.meta.env.VITE_API_BASE || "http://127.0.0.1:5000")
  .split(",")
  .map((s) => s.trim().replace(/\/$/, ""))
  .filter(Boolean);

async function fetchWithFallback(path, options) {
  let lastErr = null;
  const p = path.startsWith("/") ? path : `/${path}`;
  for (const base of API_BASES) {
    try {
      const res = await fetch(`${base}${p}`, options);
      if (res.status < 500) return res;
      lastErr = new Error(`HTTP ${res.status}`);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("All backends failed");
}


export default function VerifyRequired() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const resend = async () => {
    setErr("");
    setMsg("");
    if (!user) {
      setErr("Please login first.");
      return;
    }
    setLoading(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetchWithFallback("/auth/send-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({}),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Failed to send email");
      if (j?.alreadyVerified) setMsg("Your email is already verified. Please refresh and continue.");
      else setMsg("Verification email sent. Please check your inbox (and Spam).");
    } catch (e) {
      setErr(e?.message || "Failed to send verification email");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center px-4 py-10 bg-[var(--bg)] text-[var(--text)]">
      <div className="w-full max-w-lg bg-[var(--card)] border border-[var(--border)] shadow-sm rounded-2xl p-6">
        <h1 className="text-2xl font-bold">Email verification required</h1>
        <p className="text-sm text-[var(--muted)] mt-2">
          Please verify your email to access protected features (My Courses, Notes, Profile, and course learning pages).
        </p>

        {msg && (
          <div className="mt-4 text-sm text-green-800 bg-green-50 border border-green-200 rounded-xl p-3">
            {msg}
          </div>
        )}

        {err && (
          <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
            {err}
          </div>
        )}

        <button
          onClick={resend}
          disabled={loading}
          className="mt-6 w-full rounded-xl py-3 bg-blue-600 text-white font-semibold hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Sending..." : "Resend verification email"}
        </button>

        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <Link
            to="/contact"
            className="inline-flex justify-center items-center rounded-xl px-4 py-2.5 border border-[var(--border)] bg-[var(--card)] font-semibold hover:opacity-90"
          >
            Contact support
          </Link>
          <button
            onClick={logout}
            className="inline-flex justify-center items-center rounded-xl px-4 py-2.5 bg-gray-900 text-white font-semibold hover:opacity-90"
          >
            Logout
          </button>
        </div>

        <p className="mt-4 text-xs text-[var(--muted)]">
          After verification, logout and login again if your session still shows as unverified.
        </p>
      </div>
    </div>
  );
}
