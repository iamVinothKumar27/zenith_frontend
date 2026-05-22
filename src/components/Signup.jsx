import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Rocket, CheckCircle2 } from "lucide-react";
import { auth, createUserWithEmailAndPassword, updateProfile, signInWithPopup, googleProvider, signOut } from "../firebase.js";

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

const checkPwRules = (pw) => {
  const length = pw.length >= 6;
  const uppercase = /[A-Z]/.test(pw);
  const number = /[0-9]/.test(pw);
  const special = /[^A-Za-z0-9]/.test(pw);
  const passedCount = [length, uppercase, number, special].filter(Boolean).length;
  return { length, uppercase, number, special, passedCount, total: 4, ok: passedCount === 4 };
};

const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLORS = ["", "#EF4444", "#F59E0B", "#3B82F6", "#10B981"];

function PasswordStrength({ password }) {
  if (!password) return null;
  const rules = checkPwRules(password);
  const label = STRENGTH_LABELS[rules.passedCount] || "";
  const color = STRENGTH_COLORS[rules.passedCount] || "#EF4444";

  return (
    <div className="mt-2.5 space-y-2">
      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-[var(--border)] overflow-hidden flex gap-1">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex-1 h-full rounded-full transition-all duration-300"
              style={{ background: i < rules.passedCount ? color : "transparent" }}
            />
          ))}
        </div>
        <span className="text-xs font-semibold" style={{ color }}>{label}</span>
      </div>

      {/* Rules list */}
      <div className="grid grid-cols-2 gap-1">
        {[
          { ok: rules.length, text: "6+ characters" },
          { ok: rules.uppercase, text: "1 uppercase" },
          { ok: rules.number, text: "1 number" },
          { ok: rules.special, text: "1 special char" },
        ].map((r, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs">
            <span className={r.ok ? "text-emerald-500" : "text-[var(--muted-light)]"}>
              {r.ok ? "✓" : "·"}
            </span>
            <span className={r.ok ? "text-emerald-600" : "text-[var(--muted)]"}>{r.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const BENEFITS = [
  "Free access to all beginner courses",
  "Mock tests & DSA practice",
  "AI-powered resume analysis",
  "Progress tracking & certificates",
];

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    setErr("");
    const r = checkPwRules(password);
    if (!r.ok) {
      setErr("Password must be 6+ chars and include 1 uppercase, 1 number, and 1 special character.");
      return;
    }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (name?.trim()) {
        await updateProfile(cred.user, { displayName: name.trim() });
      }
      const idToken = await cred.user.getIdToken();
      await fetchWithFallback(`/auth/send-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({}),
      });
      await signOut(auth);
      navigate("/check-email", { replace: true, state: { email } });
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
    <div className="min-h-[calc(100vh-65px)] flex bg-[var(--bg)]">
      {/* Left: Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #059669 0%, #0D9488 50%, #0284C7 100%)" }}>
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-white/5" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-white/5" />

        <div className="relative z-10 max-w-md text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur grid place-items-center mx-auto mb-6">
              <Rocket className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">Start Learning Today</h2>
            <p className="text-white/75 text-base mb-10">
              Join 500,000+ developers already accelerating their careers with Zenith.
            </p>

            <div className="flex flex-col gap-3">
              {BENEFITS.map((b, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-3 text-left"
                >
                  <CheckCircle2 className="w-5 h-5 text-white/90 shrink-0" />
                  <span className="text-white/85 text-sm font-medium">{b}</span>
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
          {/* Mobile brand */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl grid place-items-center text-white text-sm font-bold"
                style={{ background: "var(--grad)" }}>Z</div>
              <span className="text-lg font-bold text-[var(--text)]">Zenith</span>
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-[var(--text)] mb-1">Create your account</h1>
          <p className="text-sm text-[var(--muted)] mb-6">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold hover:underline" style={{ color: "var(--accent)" }}>
              Log in
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

          <form onSubmit={handleEmailSignup} className="space-y-4">
            <div>
              <label className="ui-label mb-1.5 block">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="ui-input"
                placeholder="Your full name"
                required
              />
            </div>

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
              <label className="ui-label mb-1.5 block">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="ui-input pr-11"
                  placeholder="Create a strong password"
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
              <PasswordStrength password={password} />
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
                  Creating account...
                </span>
              ) : (
                <>
                  Create account
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="mt-5 text-xs text-[var(--muted)] text-center">
            By creating an account, you agree to our{" "}
            <Link to="/" className="hover:underline" style={{ color: "var(--accent)" }}>Terms of Service</Link>
            {" "}and{" "}
            <Link to="/" className="hover:underline" style={{ color: "var(--accent)" }}>Privacy Policy</Link>.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
