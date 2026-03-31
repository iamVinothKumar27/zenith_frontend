import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso || "";
  }
}

function renderReport(analysis) {
  if (!analysis) return "Complete the test to generate a report.";
  const parts = [analysis.summary, analysis.feedback, analysis.improvements].filter(Boolean);
  return parts.length ? parts.join("\n\n") : "Complete the test to generate a report.";
}

export default function MyTests() {
  const { user } = useAuth();
  const [tab, setTab] = useState("mock"); // mock | practice
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [sessions, setSessions] = useState([]);
  const [openReportId, setOpenReportId] = useState(null);

  // Start New should take user to Home page section (not the generator form route)
  const startLink = tab === "mock" ? "/#mock-tests" : "/#practice-tests";
  const historyLink = "/mock-test-history?tab=" + tab;

  const headerHint = useMemo(() => {
    return tab === "mock"
      ? "Full screening style (General + Tech + Coding)"
      : "Topic-wise drills (General / Tech / DSA)";
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
    }
  }

  useEffect(() => {
    if (!user) return;
    load(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, tab]);

  return (
    <div className="max-w-6xl mx-auto px-4 pt-10 pb-28">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">My Tests</h1>
          </div>
          <div className="text-sm text-[var(--muted)] mt-1">{headerHint}</div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={startLink}
            className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white font-semibold hover:brightness-110"
          >
            Start New
          </Link>
          <button
            onClick={() => load(tab)}
            className="px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:brightness-95"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Toggle */}
      <div className="inline-flex rounded-2xl border border-[var(--border)] bg-[var(--card)] p-1">
        <button
          onClick={() => setTab("mock")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
            tab === "mock" ? "bg-[var(--accent)] text-white" : "text-[var(--text)] hover:bg-[var(--bg)]"
          }`}
        >
          Mock Tests
        </button>
        <button
          onClick={() => setTab("practice")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
            tab === "practice" ? "bg-[var(--accent)] text-white" : "text-[var(--text)] hover:bg-[var(--bg)]"
          }`}
        >
          Practice Tests
        </button>
        <Link
          to={historyLink}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-[var(--text)] hover:bg-[var(--bg)]"
          title="Open full history page"
        >
          Full History
        </Link>
      </div>

      {err ? <div className="mt-4 text-red-500">{err}</div> : null}

      <div className="mt-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)] font-semibold text-[var(--text)]">Sessions</div>

        {loading ? (
          <div className="p-5 text-[var(--muted)]">Loading…</div>
        ) : sessions.length === 0 ? (
          <div className="p-5 text-[var(--muted)]">No {tab} sessions yet.</div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {sessions.map((s) => (
              <div key={s.session_id} className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-[260px]">
                    <div className="text-sm font-semibold text-[var(--text)]">{s.title || (tab === "mock" ? "Mock Test" : "Practice Test")}</div>

                    {tab === "mock" ? (
                      <div className="text-xs text-[var(--muted)]">
                        Mode: {s.mode} • Pattern: G {s.pattern?.general ?? 0}, T {s.pattern?.tech ?? 0}, C {s.pattern?.coding ?? 0}
                      </div>
                    ) : (
                      <div className="text-xs text-[var(--muted)]">
                        Area: {s.mode || "practice"}
                        {s.topic ? ` • Topic: ${typeof s.topic === "string" ? s.topic : "Mixed"}` : ""}
                        {s.difficulty ? ` • Difficulty: ${String(s.difficulty).toUpperCase()}` : ""}
                      </div>
                    )}

                    <div className="text-xs text-[var(--muted)] mt-1">Created: {fmtDate(s.created_at)}</div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Score (mock + practice) */}
                    <div className="px-4 py-2 rounded-2xl bg-[var(--bg)] border border-[var(--border)]">
                      <div className="text-[11px] text-[var(--muted)]">Score</div>
                      <div className="text-sm font-semibold text-[var(--text)]">
                        {s.total_score ?? "-"} / {s.total_marks ?? "-"}
                      </div>
                    </div>

                    {(tab === "mock" || tab === "practice") ? (
                      <button
                        onClick={() => setOpenReportId((v) => (v === s.session_id ? null : s.session_id))}
                        className="px-4 py-2 rounded-xl border border-[var(--border)] hover:bg-[var(--bg)] text-sm"
                      >
                        Report
                      </button>
                    ) : null}

                    <Link
                      to={tab === "mock" ? `/mock-test/${s.session_id}` : `/practice-test/${s.session_id}`}
                      className="px-4 py-2 rounded-xl border border-[var(--border)] hover:bg-[var(--bg)] text-sm"
                    >
                      Open
                    </Link>

                    <button
                      onClick={() => del(s.session_id)}
                      className="px-4 py-2 rounded-xl border border-red-500/40 text-red-300 hover:bg-red-500/10 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {openReportId === s.session_id ? (
                  <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
                    <div className="text-sm font-semibold text-[var(--text)]">Performance Report</div>
                    <div className="mt-2 text-sm text-[var(--muted)] leading-relaxed whitespace-pre-wrap">
                      {renderReport(s.analysis)}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
