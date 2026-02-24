import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider.jsx";

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

export default function MockTestHistory() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [err, setErr] = useState("");
  const [openReportId, setOpenReportId] = useState(null);

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const token = user ? await user.getIdToken() : "";
      const res = await fetchWithFallback("/mocktest/sessions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load history");
      setSessions(data.sessions || []);
    } catch (e) {
      setErr(e.message || "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function del(session_id) {
    if (!confirm("Delete this mock test session?")) return;
    try {
      const token = user ? await user.getIdToken() : "";
      const res = await fetchWithFallback(`/mocktest/sessions/${session_id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Delete failed");
      await load();
    } catch (e) {
      alert(e.message || "Delete failed");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">My Tests</h1>
          <p className="text-sm text-[var(--muted)]">Your past test sessions (General / Tech / Coding)</p>
        </div>
        <Link to="/#mock-tests" className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white font-semibold text-sm">
          Start New Test
        </Link>
      </div>

      {err && <div className="text-red-400">{err}</div>}

      <div className="rounded-2xl bg-[var(--card)] border border-[var(--border)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)] font-semibold text-[var(--text)]">Sessions</div>

        {loading ? (
          <div className="p-5 text-[var(--muted)]">Loading...</div>
        ) : sessions.length === 0 ? (
          <div className="p-5 text-[var(--muted)]">No sessions yet.</div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {sessions.map((s) => (
              <div key={s.session_id} className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-[260px]">
                    <div className="text-sm font-semibold text-[var(--text)]">{s.title || "Mock Test"}</div>
                    <div className="text-xs text-[var(--muted)]">
                      Mode: {s.mode} • Pattern: G {s.pattern?.general ?? 0}, T {s.pattern?.tech ?? 0}, C {s.pattern?.coding ?? 0}
                    </div>
                    <div className="text-xs text-[var(--muted)] mt-1">Created: {fmtDate(s.created_at)}</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="px-4 py-2 rounded-2xl bg-[var(--bg)] border border-[var(--border)]">
                      <div className="text-[11px] text-[var(--muted)]">Score</div>
                      <div className="text-sm font-semibold text-[var(--text)]">
                        {s.total_score ?? "-"} / {s.total_marks ?? "-"}
                      </div>
                    </div>

                    <button
                      onClick={() => setOpenReportId((v) => (v === s.session_id ? null : s.session_id))}
                      className="px-4 py-2 rounded-xl border border-[var(--border)] hover:bg-[var(--bg)] text-sm"
                    >
                      Report
                    </button>

                    <Link
                      to={`/mock-test/${s.session_id}`}
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
