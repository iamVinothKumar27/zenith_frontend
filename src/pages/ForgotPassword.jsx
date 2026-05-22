import React, { useState } from "react";
import { Link } from "react-router-dom";

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


export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    setLoading(true);
    try {
      const res = await fetchWithFallback("/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Failed");
      setMsg("If this email exists, a reset link has been sent. Please check your inbox (and Spam).");
    } catch (e2) {
      setErr(e2?.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-65px)] flex items-center justify-center px-4 py-12 bg-[var(--bg)] text-[var(--text)]">
      <div className="w-full max-w-md bg-[var(--card)] border border-[var(--border)] shadow-card rounded-2xl p-8">
        <div className="w-12 h-12 rounded-2xl mb-5 grid place-items-center" style={{ background: "var(--accent-light)" }}>
          <svg className="w-6 h-6" style={{ color: "var(--accent)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Reset your password</h1>
        <p className="text-sm text-[var(--muted)] mt-1.5 mb-6">
          Enter your account email and we&apos;ll send you a password reset link.
        </p>

        {msg && (
          <div className="mb-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
            {msg}
          </div>
        )}
        {err && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
            {err}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="ui-label mb-1.5 block">Email address</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              className="ui-input"
              placeholder="you@domain.com"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full primary-btn py-3 text-base disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <div className="mt-5 text-sm text-[var(--muted)]">
          Back to{" "}
          <Link to="/login" className="font-semibold hover:underline" style={{ color: "var(--accent)" }}>
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
