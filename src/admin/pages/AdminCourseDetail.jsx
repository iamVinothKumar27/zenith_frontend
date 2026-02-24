import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider.jsx";

function fmtDate(v) {
  if (!v) return "";
  try {
    const d = new Date(v);
    if (!Number.isFinite(d.getTime())) return String(v);
    return d.toLocaleString();
  } catch {
    return String(v);
  }
}

function Pill({ children, tone = "default" }) {
  const cls =
    tone === "ok"
      ? "bg-green-50 text-green-700 border-green-200"
      : tone === "bad"
      ? "bg-red-50 text-red-700 border-red-200"
      : "bg-[var(--bg)] text-[var(--muted)] border-[var(--border)]";
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold ${cls}`}>{children}</span>;
}

export default function AdminCourseDetail() {
  const { courseTitle } = useParams();
  const decodedTitle = useMemo(() => {
    try {
      return decodeURIComponent(courseTitle || "");
    } catch {
      return courseTitle || "";
    }
  }, [courseTitle]);

  const { token, apiBase } = useAuth();
  const navigate = useNavigate();

  const [sp, setSp] = useSearchParams();
  const tab = (sp.get("tab") || "overview").toLowerCase();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [quizLoading, setQuizLoading] = useState(false);

  const setTab = (t) => {
    const next = new URLSearchParams(sp);
    next.set("tab", t);
    setSp(next, { replace: true });
  };

  const fetchAll = async () => {
    if (!token || !decodedTitle) return;
    setLoading(true);
    setError("");
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [a, b] = await Promise.all([
        fetch(`${apiBase}/admin/course/${encodeURIComponent(decodedTitle)}/summary`, { headers }),
        fetch(`${apiBase}/admin/course/${encodeURIComponent(decodedTitle)}/progress`, { headers }),
      ]);
      const aj = await a.json().catch(() => ({}));
      if (!a.ok) throw new Error(aj?.error || "Failed to load course summary");
      setSummary(aj);

      const bj = await b.json().catch(() => ({}));
      if (!b.ok) throw new Error(bj?.error || "Failed to load course progress");
      setRows(bj?.rows || []);
    } catch (e) {
      setError(e?.message || "Error");
      setSummary(null);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizAttempts = async () => {
    if (!token || !decodedTitle) return;
    setQuizLoading(true);
    setError("");
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch(`${apiBase}/admin/course/${encodeURIComponent(decodedTitle)}/quiz-attempts`, { headers });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.ok) throw new Error(j?.error || "Failed to load quiz attempts");
      setQuizAttempts(j.rows || []);
    } catch (e) {
      setError(e?.message || "Error");
      setQuizAttempts([]);
    } finally {
      setQuizLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, decodedTitle]);

  useEffect(() => {
    if (tab === "quizzes") fetchQuizAttempts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return (rows || []).filter((r) => {
      const name = String(r?.name || "").toLowerCase();
      const email = String(r?.email || "").toLowerCase();
      return name.includes(term) || email.includes(term);
    });
  }, [rows, q]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={() => navigate(-1)}
              className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm font-semibold"
            >
              ← Back
            </button>
            <Pill>Course</Pill>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text)] truncate">{decodedTitle}</h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-2xl border border-[var(--border)] bg-[var(--card)] p-1">
            <button
              onClick={() => setTab("overview")}
              className={`px-3 py-2 rounded-2xl text-sm font-semibold transition ${
                tab === "overview" ? "bg-[var(--accent)] text-white" : "text-[var(--muted)] hover:opacity-90"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setTab("progress")}
              className={`px-3 py-2 rounded-2xl text-sm font-semibold transition ${
                tab === "progress" ? "bg-[var(--accent)] text-white" : "text-[var(--muted)] hover:opacity-90"
              }`}
            >
              Progress
            </button>

            <button
              onClick={() => setTab("quizzes")}
              className={`px-3 py-2 rounded-2xl text-sm font-semibold transition ${
                tab === "quizzes" ? "bg-[var(--accent)] text-white" : "text-[var(--muted)] hover:opacity-90"
              }`}
            >
              Quizzes
            </button>
          </div>

          <button
            onClick={fetchAll}
            className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-sm hover:bg-[var(--accent-2)]"
          >
            Refresh
          </button>
        </div>
      </div>

      {error ? <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 mb-6">{error}</div> : null}

      {loading ? (
        <div className="text-[var(--muted)]">Loading…</div>
      ) : !summary ? (
        <div className="text-[var(--muted)]">No data.</div>
      ) : (
        <>
          {tab === "overview" ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="ui-card p-5">
                <div className="text-sm text-[var(--muted)]">Users studying</div>
                <div className="text-3xl font-bold mt-2 text-[var(--text)]">{summary?.usersStudying ?? 0}</div>
              </div>
              <div className="ui-card p-5">
                <div className="text-sm text-[var(--muted)]">Users on hold</div>
                <div className="text-3xl font-bold mt-2 text-[var(--text)]">{summary?.usersOnHold ?? 0}</div>
              </div>
              <div className="ui-card p-5">
                <div className="text-sm text-[var(--muted)]">Progress docs</div>
                <div className="text-3xl font-bold mt-2 text-[var(--text)]">{summary?.progressDocs ?? 0}</div>
                <div className="text-xs text-[var(--muted)] mt-1">Total passed quizzes (sum): {summary?.passedQuizCount ?? 0}</div>
              </div>
            </div>
          ) : null}

          {tab === "progress" ? (
            <>
              <div className="ui-card p-4 mb-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div className="text-sm text-[var(--muted)]">Click a user row to open user drilldown.</div>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search by name/email"
                  className="w-full sm:w-[280px] px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-sm"
                />
              </div>

              <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] overflow-hidden">
                <div className="px-6 py-4 border-b border-[var(--border)] font-semibold">User progress</div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-[rgba(16,185,129,0.08)] text-[var(--muted)]">
                      <tr>
                        <th className="text-left px-6 py-3 font-medium">User</th>
                        <th className="text-right px-6 py-3 font-medium">Passed</th>
                        <th className="text-right px-6 py-3 font-medium">Total</th>
                        <th className="text-right px-6 py-3 font-medium">%</th>
                        <th className="text-left px-6 py-3 font-medium">Status</th>
                        <th className="text-left px-6 py-3 font-medium">Updated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {filtered.map((r) => (
                        <tr
                          key={r.uid}
                          className="hover:bg-[var(--bg)] cursor-pointer"
                          onClick={() => navigate(`/admin/user/${encodeURIComponent(r.uid)}?tab=progress`)}
                          title="Open user details"
                        >
                          <td className="px-6 py-3">
                            <div className="font-semibold">{r.name || "(no name)"}</div>
                            <div className="text-xs text-[var(--muted)]">{r.email || r.uid}</div>
                          </td>
                          <td className="px-6 py-3 text-right">{r.passedQuizzes ?? 0}</td>
                          <td className="px-6 py-3 text-right">{r.totalQuizzes ?? 0}</td>
                          <td className="px-6 py-3 text-right font-semibold">{r.percent ?? 0}%</td>
                          <td className="px-6 py-3">{r.held ? <Pill tone="bad">On hold</Pill> : <Pill tone="ok">Active</Pill>}</td>
                          <td className="px-6 py-3 text-[var(--muted)]">{fmtDate(r.updatedAt)}</td>
                        </tr>
                      ))}
                      {!filtered.length ? (
                        <tr>
                          <td className="px-6 py-8 text-[var(--muted)]" colSpan={6}>
                            No rows.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}

          {tab === "quizzes" ? (
            <>
              <div className="ui-card p-4 mb-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div className="text-sm text-[var(--muted)]">Per-video quiz marks. Click a row to open user drilldown.</div>
                <button
                  onClick={fetchQuizAttempts}
                  className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-sm hover:bg-[var(--accent-2)]"
                  disabled={quizLoading}
                >
                  {quizLoading ? "Loading…" : "Refresh"}
                </button>
              </div>

              <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] overflow-hidden">
                <div className="px-6 py-4 border-b border-[var(--border)] font-semibold">Quiz attempts</div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-[rgba(16,185,129,0.08)] text-[var(--muted)]">
                      <tr>
                        <th className="text-left px-6 py-3 font-medium">Video</th>
                        <th className="text-left px-6 py-3 font-medium">User</th>
                        <th className="text-right px-6 py-3 font-medium">Last</th>
                        <th className="text-right px-6 py-3 font-medium">Best</th>
                        <th className="text-right px-6 py-3 font-medium">Total</th>
                        <th className="text-left px-6 py-3 font-medium">Status</th>
                        <th className="text-left px-6 py-3 font-medium">Last attempt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {(quizAttempts || []).map((r, i) => (
                        <tr
                          key={`${r.uid || "u"}-${r.videoNo || i}`}
                          className="hover:bg-[var(--bg)] cursor-pointer"
                          onClick={() => r.uid && navigate(`/admin/user/${encodeURIComponent(r.uid)}?tab=quizzes`)}
                          title="Open user details"
                        >
                          <td className="px-6 py-3 font-semibold">
                            {r.videoNo ? `Video ${r.videoNo}${r.totalVideos ? `/${r.totalVideos}` : ""}` : "—"}
                          </td>
                          <td className="px-6 py-3">
                            <div className="font-semibold">{r.name || "(no name)"}</div>
                            <div className="text-xs text-[var(--muted)] truncate max-w-[320px]">{r.email || r.uid}</div>
                          </td>
                          <td className="px-6 py-3 text-right font-semibold">{r.lastScore == null ? "—" : r.lastScore}</td>
                          <td className="px-6 py-3 text-right font-semibold">{r.bestScore == null ? "—" : r.bestScore}</td>
                          <td className="px-6 py-3 text-right text-[var(--muted)]">{r.totalQuestions == null ? "—" : r.totalQuestions}</td>
                          <td className="px-6 py-3">{r.passed ? <Pill tone="ok">Passed</Pill> : <Pill>Not passed</Pill>}</td>
                          <td className="px-6 py-3 text-[var(--muted)]">{fmtDate(r.lastAttemptAt)}</td>
                        </tr>
                      ))}
                      {!quizLoading && !(quizAttempts || []).length ? (
                        <tr>
                          <td className="px-6 py-8 text-[var(--muted)]" colSpan={7}>
                            No quiz attempts yet.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
