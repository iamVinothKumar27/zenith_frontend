import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  TestTube, Brain, RefreshCw, Plus, ChevronRight, Trash2,
  ExternalLink, FileText, Calendar, Target, BarChart2, Loader2,
  ClipboardList, CheckCircle2,
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

function fmtDate(iso) {
  try { return new Date(iso).toLocaleString(); } catch { return iso || ""; }
}

function renderReport(analysis) {
  if (!analysis) return "Complete the test to generate a report.";
  const parts = [analysis.summary, analysis.feedback, analysis.improvements].filter(Boolean);
  return parts.length ? parts.join("\n\n") : "Complete the test to generate a report.";
}

function ScoreBadge({ score, total }) {
  const pct = total ? Math.round((score / total) * 100) : null;
  const color = pct === null ? "" : pct >= 70 ? "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800"
    : pct >= 40 ? "text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800"
    : "text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800";
  return (
    <div className={`px-3.5 py-2 rounded-xl border text-center shrink-0 ${color || "bg-[var(--surface)] border-[var(--border)]"}`}>
      <div className="text-[10px] font-semibold opacity-70 mb-0.5">Score</div>
      <div className="text-sm font-bold">{score ?? "—"} / {total ?? "—"}</div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-[var(--surface)] shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-[var(--surface)] rounded w-3/4" />
          <div className="h-3 bg-[var(--surface)] rounded w-1/2" />
        </div>
        <div className="w-20 h-10 bg-[var(--surface)] rounded-xl shrink-0" />
      </div>
    </div>
  );
}

export default function MyTests() {
  const { user } = useAuth();
  const [tab, setTab] = useState("mock");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [sessions, setSessions] = useState([]);
  const [openReportId, setOpenReportId] = useState(null);
  const [deleting, setDeleting] = useState({});

  const startLink = tab === "mock" ? "/#mock-tests" : "/#practice-tests";
  const historyLink = "/mock-test-history?tab=" + tab;

  const headerHint = useMemo(() => {
    return tab === "mock"
      ? "Full screening style — General + Tech + Coding"
      : "Topic-wise drills — General / Tech / DSA / SQL";
  }, [tab]);

  async function load(kind = tab) {
    setErr("");
    setLoading(true);
    try {
      const token = user ? await user.getIdToken() : "";
      const res = await fetchWithFallback(`/mocktest/sessions?kind=${kind}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to load sessions");
      setSessions(Array.isArray(data.sessions) ? data.sessions : []);
    } catch (e) {
      setErr(e?.message || "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function del(session_id) {
    if (!confirm("Delete this session?")) return;
    setDeleting((p) => ({ ...p, [session_id]: true }));
    try {
      const token = user ? await user.getIdToken() : "";
      const res = await fetchWithFallback(`/mocktest/sessions/${session_id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Delete failed");
      await load();
    } catch (e) {
      alert(e?.message || "Delete failed");
    } finally {
      setDeleting((p) => { const n = { ...p }; delete n[session_id]; return n; });
    }
  }

  useEffect(() => {
    if (!user) return;
    load(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, tab]);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text)]">My Tests</h1>
            <p className="text-sm text-[var(--muted)] mt-0.5">{headerHint}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={startLink}
              className="flex items-center gap-2 primary-btn"
            >
              <Plus className="w-4 h-4" />
              Start New
            </Link>
            <button
              onClick={() => load(tab)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm font-medium text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex gap-1 bg-[var(--surface)] p-1 rounded-2xl border border-[var(--border)]">
            <button
              onClick={() => setTab("mock")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                tab === "mock"
                  ? "bg-[var(--card)] text-[var(--accent)] shadow-sm border border-[var(--border)]"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              <Brain className="w-4 h-4" />
              Mock Tests
            </button>
            <button
              onClick={() => setTab("practice")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                tab === "practice"
                  ? "bg-[var(--card)] text-[var(--accent)] shadow-sm border border-[var(--border)]"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              <TestTube className="w-4 h-4" />
              Practice Tests
            </button>
          </div>
          <Link
            to={historyLink}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm font-medium text-[var(--muted)] hover:text-[var(--accent)] transition-all"
          >
            <BarChart2 className="w-4 h-4" />
            Full History
          </Link>
        </div>

        {err && (
          <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">{err}</div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Empty */}
        {!loading && !err && sessions.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-14 text-center"
          >
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 grid place-items-center"
              style={{ background: "var(--accent-light)" }}>
              <TestTube className="w-7 h-7" style={{ color: "var(--accent)" }} />
            </div>
            <h3 className="text-lg font-semibold text-[var(--text)] mb-2">
              No {tab} sessions yet
            </h3>
            <p className="text-sm text-[var(--muted)] mb-6 max-w-xs mx-auto">
              {tab === "mock"
                ? "Take a mock test to simulate real screening interviews."
                : "Start a practice session to drill specific topics."}
            </p>
            <Link to={startLink} className="primary-btn gap-2 inline-flex">
              <Plus className="w-4 h-4" />
              Start {tab === "mock" ? "Mock" : "Practice"} Test
            </Link>
          </motion.div>
        )}

        {/* Sessions list */}
        {!loading && sessions.length > 0 && (
          <div className="space-y-3">
            <AnimatePresence>
              {sessions.map((s, idx) => {
                const isOpen = openReportId === s.session_id;
                const isDeleting = !!deleting[s.session_id];

                return (
                  <motion.div
                    key={s.session_id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, delay: idx * 0.04 }}
                    className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 hover:border-[var(--accent-border)] hover:shadow-sm transition-all duration-300"
                  >
                    <div className="flex flex-wrap items-start gap-4">
                      {/* Icon */}
                      <div className="w-11 h-11 rounded-xl grid place-items-center shrink-0"
                        style={{ background: "var(--accent-light)" }}>
                        {tab === "mock"
                          ? <Brain className="w-5 h-5" style={{ color: "var(--accent)" }} />
                          : <ClipboardList className="w-5 h-5" style={{ color: "var(--accent)" }} />
                        }
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-[var(--text)] mb-1">
                          {s.title || (tab === "mock" ? "Mock Test" : "Practice Test")}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted)]">
                          {tab === "mock" ? (
                            <span>Mode: <span className="font-medium text-[var(--text)]">{s.mode}</span></span>
                          ) : (
                            <>
                              <span>Section: <span className="font-medium text-[var(--text)]">{s.mode || "practice"}</span></span>
                              {s.topic && typeof s.topic === "string" && (
                                <span>Topic: <span className="font-medium text-[var(--text)]">{s.topic}</span></span>
                              )}
                              {s.difficulty && (
                                <span>Difficulty: <span className="font-medium text-[var(--text)] uppercase">{s.difficulty}</span></span>
                              )}
                            </>
                          )}
                          {tab === "mock" && s.pattern && (
                            <span className="text-[var(--muted-light)]">
                              G:{s.pattern.general ?? 0} T:{s.pattern.tech ?? 0} C:{s.pattern.coding ?? 0}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-[var(--muted)]">
                          <Calendar className="w-3 h-3" />
                          {fmtDate(s.created_at)}
                        </div>
                      </div>

                      {/* Score */}
                      <ScoreBadge score={s.total_score} total={s.total_marks} />

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setOpenReportId((v) => (v === s.session_id ? null : s.session_id))}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                            isOpen
                              ? "border-[var(--accent-border)] bg-[var(--accent-light)] text-[var(--accent)]"
                              : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--accent)]"
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Report
                        </button>

                        <Link
                          to={tab === "mock" ? `/mock-test/${s.session_id}` : `/practice-test/${s.session_id}`}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-xs font-semibold text-[var(--muted)] hover:text-[var(--accent)] hover:border-[var(--accent-border)] transition-all"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Open
                        </Link>

                        <button
                          onClick={() => del(s.session_id)}
                          disabled={isDeleting}
                          className="w-8 h-8 rounded-xl border border-red-200 text-red-400 hover:bg-red-50 hover:border-red-300 dark:border-red-900 dark:hover:bg-red-900/20 grid place-items-center transition-all disabled:opacity-50"
                          title="Delete session"
                        >
                          {isDeleting
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Trash2 className="w-3.5 h-3.5" />
                          }
                        </button>
                      </div>
                    </div>

                    {/* Report panel */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-4 pt-4 border-t border-[var(--border)]">
                            <div className="flex items-center gap-2 mb-3">
                              <CheckCircle2 className="w-4 h-4 text-[var(--accent)]" />
                              <span className="text-sm font-semibold text-[var(--text)]">Performance Report</span>
                            </div>
                            <div className="bg-[var(--surface)] rounded-xl p-4 text-sm text-[var(--muted)] leading-relaxed whitespace-pre-wrap border border-[var(--border)]">
                              {renderReport(s.analysis)}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
