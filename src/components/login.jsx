import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth, signInWithEmailAndPassword, signInWithPopup, googleProvider } from "../firebase.js";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (e2) {
      setErr(e2?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setErr("");
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate("/");
    } catch (e2) {
      setErr(e2?.message || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center px-4 py-10 bg-[var(--bg)] text-[var(--text)]">
      <div className="w-full max-w-md bg-[var(--card)] border border-[var(--border)] shadow-sm rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-[var(--text)]">Welcome back</h1>
        <p className="text-sm text-[var(--muted)] mt-1">Login to continue your learning journey.</p>

        {err && (
          <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
            {err}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          className="mt-5 w-full flex items-center justify-center gap-2 border border-[var(--border)] bg-[var(--card)] rounded-xl py-2.5 hover:opacity-90 disabled:opacity-60"
        >
          <img src="/google.svg" alt="Google" className="w-5 h-5" />
          <span className="text-sm font-medium text-[var(--text)]">Continue with Google</span>
        </button>

        <div className="flex justify-end mt-3">
          <Link to="/forgot-password" className="text-xs font-medium text-blue-600 hover:underline">Forgot password?</Link>
        </div>

        <div className="flex items-center gap-3 my-5">
          <div className="h-px bg-[var(--border)] flex-1" />
          <div className="text-xs text-[var(--muted)]">or</div>
          <div className="h-px bg-[var(--border)] flex-1" />
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-[var(--border)] bg-transparent text-[var(--text)] rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[rgba(16,185,129,0.35)]"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-[var(--border)] bg-transparent text-[var(--text)] rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[rgba(16,185,129,0.35)]"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--accent)] text-white rounded-xl py-2.5 font-medium hover:brightness-95 disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-5 text-sm text-[var(--muted)]">
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="text-blue-700 font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
