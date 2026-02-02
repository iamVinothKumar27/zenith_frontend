import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth, createUserWithEmailAndPassword, updateProfile, signInWithPopup, googleProvider } from "../firebase.js";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (name?.trim()) {
        await updateProfile(cred.user, { displayName: name.trim() });
      }
      navigate("/");
    } catch (e2) {
      setErr(e2?.message || "Signup failed");
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
      setErr(e2?.message || "Google sign-up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center px-4 py-10 bg-[var(--bg)] text-[var(--text)]">
      <div className="w-full max-w-md bg-[var(--card)] border border-[var(--border)] shadow-sm rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-[var(--text)]">Create your account</h1>
        <p className="text-sm text-[var(--muted)] mt-1">Sign up to save courses, progress, and resume anytime.</p>

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

        <div className="flex items-center gap-3 my-5">
          <div className="h-px bg-[var(--border)] flex-1" />
          <div className="text-xs text-[var(--muted)]">or</div>
          <div className="h-px bg-[var(--border)] flex-1" />
        </div>

        <form onSubmit={handleEmailSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-transparent text-[var(--text)] border border-[var(--border)] rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[rgba(16,185,129,0.35)]"
              placeholder="Your name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent text-[var(--text)] border border-[var(--border)] rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[rgba(16,185,129,0.35)]"
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
              className="w-full bg-transparent text-[var(--text)] border border-[var(--border)] rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[rgba(16,185,129,0.35)]"
              placeholder="Minimum 6 characters"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--accent)] text-white rounded-xl py-2.5 font-medium hover:brightness-95 disabled:opacity-60"
          >
            {loading ? "Creating..." : "Sign up"}
          </button>
        </form>

        <p className="mt-5 text-sm text-[var(--muted)]">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-700 font-medium hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
