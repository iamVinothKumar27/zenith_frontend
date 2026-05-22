import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, ClipboardList, RefreshCw, FileText, ExternalLink,
  Trash2, Calendar, BarChart2, CheckCircle2, Clock,
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
  const color = pct === null ? ""
    : pct >= 70 ? "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800"
    : pct >= 40 ? "text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800"
    : "text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800";
  return (
    <div className={`px-3.5 py-2 rounded-xl border text-center shrink-0 min-w-[72px] ${color || "bg-[var(--surface)] border-[var(--border)]"}`}>
      <div className="text-[10px] font-semibold opacity-70 mb-0.5">Score</div>
      <div className="text-sm font-bold">{score ?? "—"} / {total ?? "—"}</div>
    </div>
  );
}

export default function MockTestHistory() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [err, setErr] = useState("");
  const [openReportId, setOpenReportId] = useState(null);

  async function loadAll() {
    setErr("");
    setLoading(true);
    try {
      const token = user ? await user.getIdToken() : "";
      const [mockRes, practiceRes] = await Promise.all([
        fetchWithFallback(`/mocktest/sessions?kind=mock`, { headers: { Authorization: `Bearer ${token}` } }),
        fetchWithFallback(`/mocktest/sessions?kind=practice`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const mockData = await mockRes.json().catch(() => ({}));
      const practiceData = await practiceRes.json().catch(() => ({}));
      if (!mockRes.ok || !mockData?.ok) throw new Error(mockData?.error || "Failed to load mock history");
      if (!practiceRes.ok || !practiceData?.ok) throw new Error(practiceData?.error || "Failed to load practice history");

      const mockSessions = (Array.isArray(mockData.sessions) ? mockData.sessions : []).map((s) => ({ ...s, kind: "mock" }));
      const practiceSessions = (Array.isArray(practiceData.sessions) ? practiceData.sessions : []).map((s) => ({ ...s, kind: "practice" }));

      const merged = [...mockSessions, ...practiceSessions].sort((a, b) => {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });
      setSessions(merged);
    } catch (e) {
      setErr(e?.message || "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function del(session_id, kind) {
    const label = kind === "practice" ? "practice" : "mock";
    if (!confirm(`Delete this ${label} test session?`)) return;
    try {
      const token = user ? await user.getIdToken() : "";
      const res = await fetchWithFallback(`/mocktest/sessions/${session_id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Delete failed");
      await loadAll();
    } catch (e) {
      alert(e?.message || "Delete failed");
    }
  }

  useEffect(() => {
    if (!user) return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const mockCount = sessions.filter((s) => s.kind === "mock").length;
  const practiceCount = sessions.filter((s) => s.kind === "practice").length;

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text)]">Full History</h1>
            <p className="text-sm text-[var(--muted)] mt-0.5">All your past Mock & Practice test sessions</p>
          </div>
          <button
            onClick={loadAll}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm font-medium text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Nav tabs */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex gap-1 bg-[var(--surface)] p-1 rounded-2xl border border-[var(--border)]">
            <Link
              to="/my-tests?tab=mock"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-[var(--muted)] hover:text-[var(--text)] transition-all"
            >
              <Brain className="w-4 h-4" />
              Mock Tests
            </Link>
            <Link
              to="/my-tests?tab=practice"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-[var(--muted)] hover:text-[var(--text)] transition-all"
            >
              <ClipboardList className="w-4 h-4" />
              Practice Tests
            </Link>
            <Link
              to="/mock-test-history"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[var(--accent)] text-white shadow-sm"
            >
              <BarChart2 className="w-4 h-4" />
              Full History
            </Link>
          </div>
        </div>

        {/* Stats */}
        {!loading && sessions.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            {[
              { label: "Total Sessions", value: sessions.length, icon: Clock, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
              { label: "Mock Tests", value: mockCount, icon: Brain, color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-900/20" },
              { label: "Practice Tests", value: practiceCount, icon: ClipboardList, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 flex items-center gap-3"
              >
                <div className={`w-10 h-10 rounded-xl ${s.bg} grid place-items-center shrink-0`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div>
                  <div className="text-xl font-bold text-[var(--text)]">{s.value}</div>
                  <div className="text-xs text-[var(--muted)]">{s.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {err && (
          <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">{err}</div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-[var(--card)] border border-[var(--border)] rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && !err && sessions.length === 0 && (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-12 text-center">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 grid place-items-center"
              style={{ background: "var(--accent-light)" }}>
              <BarChart2 className="w-6 h-6" style={{ color: "var(--accent)" }} />
            </div>
            <h3 className="text-lg font-semibold text-[var(--text)] mb-2">No sessions yet</h3>
            <p className="text-sm text-[var(--muted)] mb-5">Start a mock or practice test from the home page.</p>
            <Link to="/#mock-tests" className="primary-btn gap-2 inline-flex">
              Start a Test
            </Link>
          </div>
        )}

        {/* Sessions */}
        {!loading && sessions.length > 0 && (
          <div className="space-y-3">
            {sessions.map((s, idx) => {
              const isOpen = openReportId === s.session_id;
              const isPractice = s.kind === "practice";

              return (
                <motion.div
                  key={s.session_id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(idx * 0.03, 0.3) }}
                  className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 hover:border-[var(--accent-border)] hover:shadow-sm transition-all duration-300"
                >
                  <div className="flex flex-wrap items-start gap-4">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${
                      isPractice ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-indigo-50 dark:bg-indigo-900/20"
                    }`}>
                      {isPractice
                        ? <ClipboardList className="w-5 h-5 text-emerald-500" />
                        : <Brain className="w-5 h-5 text-indigo-500" />
                      }
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-sm text-[var(--text)]">
                          {s.title || (isPractice ? "Practice Test" : "Mock Test")}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          isPractice
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                            : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                        }`}>
                          {isPractice ? "Practice" : "Mock"}
                        </span>
                      </div>
                      <div className="text-xs text-[var(--muted)] space-x-2">
                        {isPractice ? (
                          <>
                            <span>Section: {s.mode || "practice"}</span>
                            {s.topic && typeof s.topic === "string" && <span>• {s.topic}</span>}
                            {s.difficulty && <span>• {s.difficulty.toUpperCase()}</span>}
                          </>
                        ) : (
                          <>
                            <span>Mode: {s.mode}</span>
                            {s.pattern && <span>• G:{s.pattern.general ?? 0} T:{s.pattern.tech ?? 0} C:{s.pattern.coding ?? 0}</span>}
                          </>
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
                        to={isPractice ? `/practice-test/${s.session_id}` : `/mock-test/${s.session_id}`}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-xs font-semibold text-[var(--muted)] hover:text-[var(--accent)] hover:border-[var(--accent-border)] transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open
                      </Link>
                      <button
                        onClick={() => del(s.session_id, s.kind)}
                        className="w-8 h-8 rounded-xl border border-red-200 text-red-400 hover:bg-red-50 hover:border-red-300 dark:border-red-900 dark:hover:bg-red-900/20 grid place-items-center transition-all"
                        title="Delete session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
          </div>
        )}
      </div>
    </div>
  );
}
