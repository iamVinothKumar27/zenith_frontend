import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider.jsx";

const API_BASES = (
  import.meta.env.VITE_API_BASES ||
  import.meta.env.VITE_API_BASE ||
  "http://127.0.0.1:5000"
)
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

function clampInt(v, min, max) {
  const n = Math.floor(Number(v || 0));
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

export default function StartMockTest() {
  const { user } = useAuth();
  const [sp] = useSearchParams();
  const navigate = useNavigate();

  const mode = (sp.get("mode") || "general").toLowerCase();
  const normalizedMode = ["general", "tech", "coding", "all", "sql"].includes(mode) ? mode : "general";

  const [title, setTitle] = useState("Mock Test");
  const [difficulty, setDifficulty] = useState("mixed");

  // simple modes
  const [count, setCount] = useState(15);
  // all-in-one pattern
  const [g, setG] = useState(10);
  const [t, setT] = useState(10);
  const [c, setC] = useState(2);
  const [s, setS] = useState(2);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    // defaults per mode
    if (normalizedMode === "general") setCount(15);
    if (normalizedMode === "tech") setCount(15);
    if (normalizedMode === "coding") setCount(2);
    if (normalizedMode === "sql") setCount(3);
    if (normalizedMode === "all") {
      setG(10);
      setT(10);
      setC(2);
      setS(2);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedMode]);

  const modeLabel = useMemo(() => {
    if (normalizedMode === "general") return "General Aptitude";
    if (normalizedMode === "tech") return "Tech Aptitude";
    if (normalizedMode === "coding") return "Coding";
    if (normalizedMode === "sql") return "SQL";
    return "All-in-One";
  }, [normalizedMode]);

  async function createSession() {
    setErr("");
    setLoading(true);
    try {
      const token = user ? await user.getIdToken() : "";
      const pattern =
        normalizedMode === "all"
          ? {
              general: clampInt(g, 0, 100),
              tech: clampInt(t, 0, 100),
              coding: clampInt(c, 0, 20),
              sql: clampInt(s, 0, 10),
            }
          : normalizedMode === "coding"
          ? { general: 0, tech: 0, coding: clampInt(count, 1, 20) }
          : normalizedMode === "sql"
          ? { general: 0, tech: 0, coding: clampInt(count, 1, 10) }
          : normalizedMode === "tech"
          ? { general: 0, tech: clampInt(count, 1, 60), coding: 0 }
          : { general: clampInt(count, 1, 60), tech: 0, coding: 0 };

      const res = await fetchWithFallback("/mocktest/session/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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
          throw new Error((data?.error || "Gemini generation failed") + " — click Create Session to regenerate.");
        }
        throw new Error(data?.error || "Could not create session");
      }
      const sid = data?.session?.session_id;
      if (!sid) throw new Error("Missing session id");
      navigate(`/mock-test/${sid}`);
    } catch (e) {
      setErr(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-4 py-10 min-h-[calc(100vh-96px)] flex items-center justify-center bg-[var(--bg)] text-[var(--text)]">
      <div className="w-full max-w-xl rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-sm overflow-hidden">
        <div className="px-6 py-6 border-b border-[var(--border)] text-center">
          <div className="text-2xl font-extrabold text-[var(--text)]">Start Mock Test</div>
          <div className="mt-1 text-sm text-[var(--muted)]">
            Selected: <span className="font-semibold text-[var(--text)]">{modeLabel}</span>
          </div>
          <div className="mt-4 flex justify-center">
            <Link
              to="/"
              className="px-4 py-2 rounded-2xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm hover:opacity-90"
            >
              Back
            </Link>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <div className="text-sm font-semibold text-[var(--text)]">Test name</div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2 w-full px-4 py-3 rounded-2xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] outline-none focus:ring-2 focus:ring-green-500/20"
              placeholder="e.g., Screening Mock - DSA + Apti"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-semibold text-[var(--text)]">Difficulty</div>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="mt-2 w-full px-4 py-3 rounded-2xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] outline-none"
              >
                <option value="mixed">Mixed</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            {normalizedMode !== "all" ? (
              <div>
                <div className="text-sm font-semibold text-[var(--text)]">
                  No. of {normalizedMode === "coding" || normalizedMode === "sql" ? "problems" : "questions"}
                </div>
                <input
                  type="number"
                  min={1}
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                  className="mt-2 w-full px-4 py-3 rounded-2xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] outline-none"
                />
              </div>
            ) : (
              <div>
                <div className="text-sm font-semibold text-[var(--text)]">Pattern (All-in-One)</div>
                <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div>
                    <div className="text-[11px] text-[var(--muted)]">General</div>
                    <input
                      type="number"
                      min={0}
                      value={g}
                      onChange={(e) => setG(e.target.value)}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] outline-none"
                    />
                  </div>
                  <div>
                    <div className="text-[11px] text-[var(--muted)]">Tech</div>
                    <input
                      type="number"
                      min={0}
                      value={t}
                      onChange={(e) => setT(e.target.value)}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] outline-none"
                    />
                  </div>
                  <div>
                    <div className="text-[11px] text-[var(--muted)]">Coding</div>
                    <input
                      type="number"
                      min={0}
                      value={c}
                      onChange={(e) => setC(e.target.value)}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] outline-none"
                    />
                  </div>
                  <div>
                    <div className="text-[11px] text-[var(--muted)]">SQL</div>
                    <input
                      type="number"
                      min={0}
                      value={s}
                      onChange={(e) => setS(e.target.value)}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {err ? <div className="text-sm text-red-600">{err}</div> : null}

          <button
            onClick={createSession}
            disabled={loading}
            className="w-full px-6 py-4 rounded-2xl bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-60"
          >
            {loading ? "Creating..." : "Start Test"}
          </button>

          <div className="text-xs text-[var(--muted)]">
            Tip: Run will test sample cases; Submit runs samples + hidden in the coding panel.
          </div>
        </div>
      </div>
    </div>
  );
}
