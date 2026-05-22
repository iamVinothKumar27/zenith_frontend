import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Sparkles, BookOpen, Award, Users } from "lucide-react";
import { auth, signInWithEmailAndPassword, signInWithPopup, googleProvider } from "../firebase.js";

const PERKS = [
  { icon: BookOpen, text: "Access 10,000+ expert courses" },
  { icon: Award, text: "Track progress with certificates" },
  { icon: Users, text: "Join 500K+ global learners" },
];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
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
    <div className="min-h-[calc(100vh-65px)] flex bg-[var(--bg)]">
      {/* Left: Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative overflow-hidden"
        style={{ background: "var(--grad)" }}>
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute top-1/3 right-8 w-32 h-32 rounded-full bg-white/5" />

        <div className="relative z-10 max-w-md text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur grid place-items-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">Welcome Back!</h2>
            <p className="text-white/75 text-base mb-10">
              Continue your learning journey. Everything you&apos;ve saved is right where you left it.
            </p>

            <div className="flex flex-col gap-4">
              {PERKS.map((p, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3 text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/20 grid place-items-center shrink-0">
                    <p.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white/90 text-sm font-medium">{p.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right: Form Panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile brand header */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl grid place-items-center text-white text-sm font-bold"
                style={{ background: "var(--grad)" }}>Z</div>
              <span className="text-lg font-bold text-[var(--text)]">Zenith</span>
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-[var(--text)] mb-1">Log in to your account</h1>
          <p className="text-sm text-[var(--muted)] mb-6">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="font-semibold hover:underline" style={{ color: "var(--accent)" }}>
              Sign up free
            </Link>
          </p>

          {err && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3"
            >
              {err}
            </motion.div>
          )}

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 border border-[var(--border)] bg-[var(--card)] text-[var(--text)] rounded-xl py-3 text-sm font-medium hover:bg-[var(--surface)] hover:border-[var(--accent-border)] disabled:opacity-60 transition-all duration-200 mb-5 shadow-sm"
          >
            <img src="/google.svg" alt="Google" className="w-5 h-5" />
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="h-px flex-1" style={{ background: "var(--border)" }} />
            <span className="text-xs font-medium text-[var(--muted)]">or with email</span>
            <div className="h-px flex-1" style={{ background: "var(--border)" }} />
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="ui-label mb-1.5 block">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="ui-input"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="ui-label">Password</label>
                <Link to="/forgot-password" className="text-xs font-semibold hover:underline"
                  style={{ color: "var(--accent)" }}>
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="ui-input pr-11"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--text)] transition-colors"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full primary-btn py-3 text-base gap-2 group disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
