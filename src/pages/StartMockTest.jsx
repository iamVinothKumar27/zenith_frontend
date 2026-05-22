import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Brain, Puzzle, Code2, Database, Flame, ArrowLeft,
  ChevronRight, Loader2, AlertCircle, Settings2, Hash, FileText,
} from "lucide-react";
import { useAuth } from "../auth/AuthProvider.jsx";

const API_BASES = (import.meta.env.VITE_API_BASES || import.meta.env.VITE_API_BASE || "http://127.0.0.1:5000")
  .split(",").map((s) => s.trim().replace(/\/$/, "")).filter(Boolean);

async function fetchWithFallback(path, options) {
  let lastErr = null;
  const p = path.startsWith("/") ? path : `/${path}`;
  for (const base of API_BASES) {
    try {
      const res = await fetch(`${base}${p}`, options);
      if (res.status < 500) return res;
      lastErr = new Error(`HTTP ${res.status}`);
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error("All backends failed");
}

function clampInt(v, min, max) {
  const n = Math.floor(Number(v || 0));
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

const MODES = [
  {
    key: "general",
    label: "General Aptitude",
    desc: "Quant · Logical · Verbal screening",
    icon: Brain,
    color: "text-indigo-500",
    bg: "bg-indigo-50 dark:bg-indigo-900/20",
    border: "border-indigo-200 dark:border-indigo-800",
    activeBorder: "border-indigo-500",
  },
  {
    key: "tech",
    label: "Tech Aptitude",
    desc: "DSA · OOP · OS · CN · DBMS",
    icon: Puzzle,
    color: "text-violet-500",
    bg: "bg-violet-50 dark:bg-violet-900/20",
    border: "border-violet-200 dark:border-violet-800",
    activeBorder: "border-violet-500",
  },
  {
    key: "coding",
    label: "Coding",
    desc: "DSA problems with hidden testcases",
    icon: Code2,
    color: "text-sky-500",
    bg: "bg-sky-50 dark:bg-sky-900/20",
    border: "border-sky-200 dark:border-sky-800",
    activeBorder: "border-sky-500",
  },
  {
    key: "sql",
    label: "SQL",
    desc: "Schema-based SQL screening",
    icon: Database,
    color: "text-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    border: "border-emerald-200 dark:border-emerald-800",
    activeBorder: "border-emerald-500",
  },
  {
    key: "all",
    label: "All-in-One",
    desc: "General + Tech + Coding + SQL full test",
    icon: Flame,
    color: "text-rose-500",
    bg: "bg-rose-50 dark:bg-rose-900/20",
    border: "border-rose-200 dark:border-rose-800",
    activeBorder: "border-rose-500",
  },
];

export default function StartMockTest() {
  const { user } = useAuth();
  const [sp] = useSearchParams();
  const navigate = useNavigate();

  const mode = (sp.get("mode") || "general").toLowerCase();
  const normalizedMode = ["general", "tech", "coding", "all", "sql"].includes(mode) ? mode : "general";

  const [title, setTitle] = useState("Mock Test");
  const [difficulty, setDifficulty] = useState("mixed");
  const [count, setCount] = useState(15);
  const [g, setG] = useState(10);
  const [t, setT] = useState(10);
  const [c, setC] = useState(2);
  const [s, setS] = useState(2);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (normalizedMode === "general") setCount(15);
    if (normalizedMode === "tech") setCount(15);
    if (normalizedMode === "coding") setCount(2);
    if (normalizedMode === "sql") setCount(3);
    if (normalizedMode === "all") { setG(10); setT(10); setC(2); setS(2); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedMode]);

  const modeInfo = useMemo(() => MODES.find((m) => m.key === normalizedMode) || MODES[0], [normalizedMode]);

  async function createSession() {
    setErr("");
    setLoading(true);
    try {
      const token = user ? await user.getIdToken() : "";
      const pattern =
        normalizedMode === "all"
          ? { general: clampInt(g, 0, 100), tech: clampInt(t, 0, 100), coding: clampInt(c, 0, 20), sql: clampInt(s, 0, 10) }
          : normalizedMode === "coding"
          ? { general: 0, tech: 0, coding: clampInt(count, 1, 20) }
          : normalizedMode === "sql"
          ? { general: 0, tech: 0, coding: clampInt(count, 1, 10) }
          : normalizedMode === "tech"
          ? { general: 0, tech: clampInt(count, 1, 60), coding: 0 }
          : { general: clampInt(count, 1, 60), tech: 0, coding: 0 };

      const res = await fetchWithFallback("/mocktest/session/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: title || "Mock Test",
          mode: normalizedMode,
          difficulty,
          pattern,
          sql: normalizedMode === "sql",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        if (res.status === 503 && data?.code === "GEMINI_GENERATION_FAILED") {
          throw new Error((data?.error || "Generation failed") + " — click Start Test to regenerate.");
        }
        throw new Error(data?.error || "Could not create session");
      }
      const sid = data?.session?.session_id;
      if (!sid) throw new Error("Missing session id");
      // Navigate to proctoring check before entering the test
      navigate(`/proctor-check/${sid}`);
    } catch (e) {
      setErr(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const Icon = modeInfo.icon;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Link
            to="/#mock-tests"
            className="w-10 h-10 rounded-xl border border-[var(--border)] bg-[var(--card)] grid place-items-center text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text)]">Configure Mock Test</h1>
            <p className="text-sm text-[var(--muted)]">Set up your test parameters and start</p>
          </div>
        </motion.div>

        {/* Selected mode card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className={`bg-[var(--card)] border-2 ${modeInfo.activeBorder} rounded-3xl p-5 mb-5 flex items-center gap-4 shadow-sm`}
        >
          <div className={`w-14 h-14 rounded-2xl ${modeInfo.bg} grid place-items-center shrink-0`}>
            <Icon className={`w-7 h-7 ${modeInfo.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-[var(--text)]">{modeInfo.label}</div>
            <div className="text-sm text-[var(--muted)]">{modeInfo.desc}</div>
          </div>
          <span className="badge badge-indigo text-xs">Selected Mode</span>
        </motion.div>

        {/* Configuration form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6"
        >
          {/* Test name */}
          <div>
            <label className="ui-label mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Test Name
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="ui-input"
              placeholder="e.g., Screening Mock - DSA + Apti"
            />
          </div>

          {/* Difficulty */}
          <div>
            <label className="ui-label mb-2 flex items-center gap-1.5">
              <Settings2 className="w-3.5 h-3.5" />
              Difficulty Level
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { val: "easy", label: "Easy", color: "text-emerald-600", border: "border-emerald-300 dark:border-emerald-700", activeBg: "bg-emerald-50 dark:bg-emerald-900/30" },
                { val: "medium", label: "Medium", color: "text-yellow-600", border: "border-yellow-300 dark:border-yellow-700", activeBg: "bg-yellow-50 dark:bg-yellow-900/30" },
                { val: "hard", label: "Hard", color: "text-red-600", border: "border-red-300 dark:border-red-700", activeBg: "bg-red-50 dark:bg-red-900/30" },
                { val: "mixed", label: "Mixed", color: "text-indigo-600", border: "border-indigo-300 dark:border-indigo-700", activeBg: "bg-indigo-50 dark:bg-indigo-900/30" },
              ].map((d) => (
                <button
                  key={d.val}
                  type="button"
                  onClick={() => setDifficulty(d.val)}
                  className={`py-2.5 rounded-xl border text-sm font-semibold transition-all duration-200 ${
                    difficulty === d.val
                      ? `${d.border} ${d.activeBg} ${d.color}`
                      : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--accent-border)]"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Question count */}
          <div>
            <label className="ui-label mb-1.5 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5" />
              {normalizedMode === "all" ? "Pattern (All-in-One)" : `Number of ${normalizedMode === "coding" || normalizedMode === "sql" ? "Problems" : "Questions"}`}
            </label>

            {normalizedMode !== "all" ? (
              <input
                type="number"
                min={1}
                value={count}
                onChange={(e) => setCount(e.target.value)}
                className="ui-input"
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "General", val: g, set: setG, max: 100 },
                  { label: "Tech", val: t, set: setT, max: 60 },
                  { label: "Coding", val: c, set: setC, max: 20 },
                  { label: "SQL", val: s, set: setS, max: 10 },
                ].map((f) => (
                  <div key={f.label}>
                    <div className="text-xs text-[var(--muted)] font-medium mb-1">{f.label}</div>
                    <input
                      type="number"
                      min={0}
                      max={f.max}
                      value={f.val}
                      onChange={(e) => f.set(e.target.value)}
                      className="ui-input"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error */}
          {err && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {err}
            </motion.div>
          )}

          {/* Submit */}
          <button
            onClick={createSession}
            disabled={loading}
            className="w-full primary-btn py-3.5 text-base gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating test…
              </>
            ) : (
              <>
                Start Mock Test
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-xs text-[var(--muted)] text-center">
            Tip: Run tests sample cases; Submit runs samples + hidden cases in the coding panel.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

