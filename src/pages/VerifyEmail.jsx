import React, { useMemo, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";

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


export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const hasToken = useMemo(() => Boolean(token), [token]);

  const handleVerify = async () => {
    setErr("");
    setMsg("");
    if (!hasToken) {
      setErr("Verification token is missing.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetchWithFallback("/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Verification failed");
      setMsg("Email verified successfully. You can login now.");
      setTimeout(() => navigate("/login", { replace: true }), 1200);
    } catch (e) {
      setErr(e?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center px-4 py-10 bg-[var(--bg)] text-[var(--text)]">
      <div className="w-full max-w-lg bg-[var(--card)] border border-[var(--border)] shadow-sm rounded-2xl p-6">
        <h1 className="text-2xl font-bold">Verify your email</h1>
        <p className="text-sm text-[var(--muted)] mt-2">
          Click the button below to verify your email and activate your Zenith account.
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
          onClick={handleVerify}
          disabled={loading || !hasToken}
          className="mt-6 w-full rounded-xl py-3 bg-blue-600 text-white font-semibold hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Verifying..." : "Verify my email"}
        </button>

        <div className="mt-5 text-sm text-[var(--muted)]">
          If you already verified, you can{" "}
          <Link to="/login" className="text-blue-600 font-semibold hover:underline">
            login
          </Link>
          .
        </div>
      </div>
    </div>
  );
}
