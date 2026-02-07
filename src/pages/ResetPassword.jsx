// ResetPassword.jsx
import React, { useMemo, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";

// ✅ Multi-backend support (comma-separated)
const API_BASES = (import.meta.env.VITE_API_BASES ||
  import.meta.env.VITE_API_BASE ||
  "http://127.0.0.1:5000")
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

// ✅ Password rules helpers
const checkPwRules = (pw) => {
  const length = pw.length >= 6;
  const uppercase = /[A-Z]/.test(pw);
  const number = /[0-9]/.test(pw);
  const special = /[^A-Za-z0-9]/.test(pw); // any non-alphanumeric
  const passedCount = [length, uppercase, number, special].filter(Boolean)
    .length;

  return {
    length,
    uppercase,
    number,
    special,
    passedCount,
    total: 4,
    ok: passedCount === 4,
  };
};

function PasswordProgress({ password }) {
  // ✅ show only after user starts typing
  if (!password) return null;

  const rules = checkPwRules(password);
  const pct = Math.round((rules.passedCount / rules.total) * 100);

  const Item = ({ ok, children }) => (
    <div className="flex items-center gap-2 text-sm">
      <span
        className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${
          ok
            ? "bg-green-50 border-green-200 text-green-700"
            : "bg-red-50 border-red-200 text-red-700"
        }`}
      >
        {ok ? "✓" : "×"}
      </span>
      <span className={`${ok ? "text-green-700" : "text-red-700"}`}>
        {children}
      </span>
    </div>
  );

  return (
    <div className="mt-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-[var(--muted)]">
          Password strength
        </div>
        <div className="text-xs font-semibold text-[var(--muted)]">{pct}%</div>
      </div>

      <div className="mt-2 h-2 w-full rounded-full bg-[var(--border)] overflow-hidden">
        <div className="h-full bg-blue-600" style={{ width: `${pct}%` }} />
      </div>

      <div className="mt-3 space-y-2">
        <Item ok={rules.length}>Minimum 6 characters</Item>
        <Item ok={rules.uppercase}>At least 1 uppercase letter (A-Z)</Item>
        <Item ok={rules.number}>At least 1 number (0-9)</Item>
        <Item ok={rules.special}>
          At least 1 special character (!@#$…)
        </Item>
      </div>
    </div>
  );
}

function PasswordMatchHint({ pw1, pw2 }) {
  // ✅ show only after user starts typing confirm password
  if (!pw2) return null;

  const match = pw1 === pw2;
  return (
    <div
      className={`mt-2 text-sm rounded-xl border p-3 ${
        match
          ? "text-green-700 bg-green-50 border-green-200"
          : "text-red-700 bg-red-50 border-red-200"
      }`}
    >
      {match ? "✓ Passwords match" : "× Passwords do not match"}
    </div>
  );
}

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const navigate = useNavigate();
  const hasToken = useMemo(() => Boolean(token), [token]);

  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");

    if (!hasToken) {
      setErr("Reset token is missing.");
      return;
    }

    const r = checkPwRules(pw1);
    if (!r.ok) {
      setErr(
        "Password must be 6+ chars and include 1 uppercase, 1 number, and 1 special character."
      );
      return;
    }

    if (pw1 !== pw2) {
      setErr("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetchWithFallback("/auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: pw1 }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Reset failed");

      setMsg("Password updated successfully. Redirecting to login...");
      setTimeout(() => navigate("/login", { replace: true }), 1200);
    } catch (e2) {
      setErr(e2?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center px-4 py-10 bg-[var(--bg)] text-[var(--text)]">
      <div className="w-full max-w-lg bg-[var(--card)] border border-[var(--border)] shadow-sm rounded-2xl p-6">
        <h1 className="text-2xl font-bold">Set a new password</h1>
        <p className="text-sm text-[var(--muted)] mt-2">
          Create a strong password for your Zenith account.
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

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium">New password</label>
            <input
              value={pw1}
              onChange={(e) => setPw1(e.target.value)}
              type="password"
              required
              className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 outline-none"
              placeholder="Min 6 chars, 1 uppercase, 1 number, 1 special"
            />

            {/* ✅ show rules only after user starts typing */}
            <PasswordProgress password={pw1} />
          </div>

          <div>
            <label className="text-sm font-medium">Confirm password</label>
            <input
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              type="password"
              required
              className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 outline-none"
              placeholder="Re-enter password"
            />

            {/* ✅ match hint below confirm password */}
            <PasswordMatchHint pw1={pw1} pw2={pw2} />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-3 bg-blue-600 text-white font-semibold hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Updating..." : "Update password"}
          </button>
        </form>

        <div className="mt-5 text-sm text-[var(--muted)]">
          Back to{" "}
          <Link to="/login" className="text-blue-600 font-semibold hover:underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
