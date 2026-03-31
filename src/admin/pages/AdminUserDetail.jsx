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


function toDisplay(v, fallback = "—") {
  if (v == null || v === "") return fallback;
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return v.map((x) => toDisplay(x, "")).filter(Boolean).join(", ") || fallback;
  if (typeof v === "object") {
    if (typeof v.name === "string" && v.name.trim()) return v.name;
    if (typeof v.title === "string" && v.title.trim()) return v.title;
    if (typeof v.label === "string" && v.label.trim()) return v.label;
    try {
      return JSON.stringify(v);
    } catch {
      return fallback;
    }
  }
  return String(v);
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

export default function AdminUserDetail() {
  const { uid } = useParams();
  const [sp, setSp] = useSearchParams();
  const tab = (sp.get("tab") || "overview").toLowerCase();

  const { token, apiBase } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);

  const [courses, setCourses] = useState([]);
  const [progress, setProgress] = useState([]);
  const [mocktests, setMocktests] = useState([]);
  const [practicetests, setPracticetests] = useState([]);

  const setTab = (t) => {
    const next = new URLSearchParams(sp);
    next.set("tab", t);
    setSp(next, { replace: true });
  };

  const fetchAll = async () => {
    if (!token || !uid) return;
    setLoading(true);
    setError("");
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [a, b, c, d, e] = await Promise.all([
        fetch(`${apiBase}/admin/user/${encodeURIComponent(uid)}/summary`, { headers }),
        fetch(`${apiBase}/admin/user/${encodeURIComponent(uid)}/courses-studying`, { headers }),
        fetch(`${apiBase}/admin/user/${encodeURIComponent(uid)}/course-progress`, { headers }),
        fetch(`${apiBase}/admin/user/${encodeURIComponent(uid)}/mocktests`, { headers }),
        fetch(`${apiBase}/admin/user/${encodeURIComponent(uid)}/practicetests`, { headers }),
      ]);

      const aj = await a.json().catch(() => ({}));
      if (!a.ok) throw new Error(aj?.error || "Failed to load user summary");
      setSummary(aj);

      const bj = await b.json().catch(() => ({}));
      setCourses(bj?.courses || []);

      const cj = await c.json().catch(() => ({}));
      const rows = Array.isArray(cj?.rows) ? cj.rows.slice() : [];
      // Show most recently added/updated courses first (instead of alphabetical)
      rows.sort((a, b) => {
        const da = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const db = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return db - da;
      });
      setProgress(rows);

      const dj = await d.json().catch(() => ({}));
      setMocktests(dj?.rows || []);

      const ej = await e.json().catch(() => ({}));
      setPracticetests(ej?.rows || []);
    } catch (e) {
      setError(e?.message || "Error");
      setSummary(null);
      setCourses([]);
      setProgress([]);
      setMocktests([]);
      setPracticetests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, uid]);

  const user = summary?.user || {};
  const title = toDisplay(user?.name, "") || toDisplay(user?.email, "") || uid;

  const heldSet = useMemo(() => new Set((summary?.heldCourses || []).map((x) => String(x))), [summary]);

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
            <Pill>{uid}</Pill>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text)] truncate">{title}</h1>
          <p className="text-sm text-[var(--muted)] truncate">{toDisplay(user?.email, "")}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-2xl border border-[var(--border)] bg-[var(--card)] p-1">
            {[
              ["overview", "Overview"],
              ["courses", "Courses"],
              ["progress", "Progress"],
              ["quizzes", "Quizzes"],
              ["mocktests", "Mock Tests"],
              ["practicetests", "Practice Tests"],
            ].map(([k, label]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`px-3 py-2 rounded-2xl text-sm font-semibold transition ${
                  tab === k ? "bg-[var(--accent)] text-white" : "text-[var(--muted)] hover:opacity-90"
                }`}
              >
                {label}
              </button>
            ))}
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="ui-card p-5">
                <div className="text-sm text-[var(--muted)]">Courses studying</div>
                <div className="text-3xl font-bold mt-2 text-[var(--text)]">{(summary?.studyingCourses || []).length}</div>
                <div className="text-xs text-[var(--muted)] mt-1">Held: {(summary?.heldCourses || []).length}</div>
              </div>
              <div className="ui-card p-5">
                <div className="text-sm text-[var(--muted)]">Course progress docs</div>
                <div className="text-3xl font-bold mt-2 text-[var(--text)]">{summary?.courseProgressCount ?? 0}</div>
              </div>
              <div className="ui-card p-5">
                <div className="text-sm text-[var(--muted)]">Mock tests</div>
                <div className="text-3xl font-bold mt-2 text-[var(--text)]">{summary?.mocktests?.total ?? 0}</div>
                <div className="text-xs text-[var(--muted)] mt-1">Submitted: {summary?.mocktests?.submitted ?? 0}</div>
              </div>

              <div className="ui-card p-5">
                <div className="text-sm text-[var(--muted)]">Practice tests</div>
                <div className="text-3xl font-bold mt-2 text-[var(--text)]">{practicetests.length}</div>
                <div className="text-xs text-[var(--muted)] mt-1">Recent sessions</div>
              </div>
            </div>
          ) : null}

          {tab === "courses" ? (
            <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] overflow-hidden">
              <div className="px-6 py-4 border-b border-[var(--border)] font-semibold">Courses</div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-[rgba(16,185,129,0.08)] text-[var(--muted)]">
                    <tr>
                      <th className="text-left px-6 py-3 font-medium">Course</th>
                      <th className="text-left px-6 py-3 font-medium">Status</th>
                      <th className="text-left px-6 py-3 font-medium">Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {courses.map((c) => (
                      <tr
                        key={toDisplay(c.courseTitle)}
                        className="hover:bg-[var(--bg)] cursor-pointer"
                        onClick={() => navigate(`/admin/course/${encodeURIComponent(c.courseTitle)}`)}
                        title="Open course details"
                      >
                        <td className="px-6 py-3 font-semibold">{toDisplay(c.courseTitle)}</td>
                        <td className="px-6 py-3">
                          {c.held ? <Pill tone="bad">On hold</Pill> : <Pill tone="ok">Active</Pill>}
                        </td>
                        <td className="px-6 py-3 text-[var(--muted)]">{fmtDate(c.updatedAt)}</td>
                      </tr>
                    ))}
                    {!courses.length ? (
                      <tr>
                        <td className="px-6 py-8 text-[var(--muted)]" colSpan={3}>
                          No courses.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {tab === "progress" || tab === "quizzes" ? (
            <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] overflow-hidden">
              <div className="px-6 py-4 border-b border-[var(--border)] font-semibold">Per-course progress</div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-[rgba(16,185,129,0.08)] text-[var(--muted)]">
                    <tr>
                      <th className="text-left px-6 py-3 font-medium">Course</th>
                      <th className="text-right px-6 py-3 font-medium">Passed</th>
                      <th className="text-right px-6 py-3 font-medium">Total</th>
                      <th className="text-right px-6 py-3 font-medium">%</th>
                      <th className="text-left px-6 py-3 font-medium">Status</th>
                      <th className="text-left px-6 py-3 font-medium">Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {progress.map((r) => (
                      <tr
                        key={r.courseTitle}
                        className="hover:bg-[var(--bg)] cursor-pointer"
                        onClick={() => navigate(`/admin/user/${encodeURIComponent(uid)}/course/${encodeURIComponent(r.courseTitle)}/quizzes`)}
                        title="Open course details"
                      >
                        <td className="px-6 py-3 font-semibold">{r.courseTitle}</td>
                        <td className="px-6 py-3 text-right">{r.passedQuizzes ?? 0}</td>
                        <td className="px-6 py-3 text-right">{r.totalQuizzes ?? 0}</td>
                        <td className="px-6 py-3 text-right font-semibold">{r.percent ?? 0}%</td>
                        <td className="px-6 py-3">
                          {r.held || heldSet.has(r.courseTitle) ? <Pill tone="bad">On hold</Pill> : <Pill tone="ok">Active</Pill>}
                        </td>
                        <td className="px-6 py-3 text-[var(--muted)]">{fmtDate(r.updatedAt)}</td>
                      </tr>
                    ))}
                    {!progress.length ? (
                      <tr>
                        <td className="px-6 py-8 text-[var(--muted)]" colSpan={6}>
                          No progress yet.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {tab === "mocktests" ? (
            <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] overflow-hidden">
              <div className="px-6 py-4 border-b border-[var(--border)] font-semibold">Mock test sessions</div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-[rgba(16,185,129,0.08)] text-[var(--muted)]">
                    <tr>
                      <th className="text-left px-6 py-3 font-medium">Mode</th>
                      <th className="text-left px-6 py-3 font-medium">Created</th>
                      <th className="text-left px-6 py-3 font-medium">Submitted</th>
                      <th className="text-right px-6 py-3 font-medium">Score %</th>
                      <th className="text-left px-6 py-3 font-medium">Result</th>
                      <th className="text-right px-6 py-3 font-medium"> </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {mocktests.map((r, i) => (
                      <tr key={`${r.sessionId || i}`} className="hover:bg-[var(--bg)]">
                        <td className="px-6 py-3 font-semibold">{r.mode || "unknown"}</td>
                        <td className="px-6 py-3 text-[var(--muted)]">{fmtDate(r.createdAt)}</td>
                        <td className="px-6 py-3 text-[var(--muted)]">{fmtDate(r.submittedAt) || "—"}</td>
                        <td className="px-6 py-3 text-right font-semibold">{r.scorePercent == null ? "—" : `${Number(r.scorePercent).toFixed(2)}%`}</td>
                        <td className="px-6 py-3">
                          {r.submittedAt ? (r.passed ? <Pill tone="ok">Passed</Pill> : <Pill tone="bad">Failed</Pill>) : <Pill>Not submitted</Pill>}
                        </td>
                        <td className="px-6 py-3 text-right">
                          {r.sessionId ? (
                            <button
                              onClick={() => navigate(`/admin/user/${encodeURIComponent(uid)}/mocktests/${encodeURIComponent(r.sessionId)}`)}
                              className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--card)] text-xs font-semibold"
                            >
                              View
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                    {!mocktests.length ? (
                      <tr>
                        <td className="px-6 py-8 text-[var(--muted)]" colSpan={6}>
                          No sessions.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {tab === "practicetests" ? (
            <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] overflow-hidden">
              <div className="px-6 py-4 border-b border-[var(--border)] font-semibold">Practice test sessions</div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-[rgba(16,185,129,0.08)] text-[var(--muted)]">
                    <tr>
                      <th className="text-left px-6 py-3 font-medium">Mode</th>
                      <th className="text-left px-6 py-3 font-medium">Topic</th>
                      <th className="text-left px-6 py-3 font-medium">Created</th>
                      <th className="text-left px-6 py-3 font-medium">Submitted</th>
                      <th className="text-right px-6 py-3 font-medium">Score %</th>
                      <th className="text-left px-6 py-3 font-medium">Result</th>
                      <th className="text-right px-6 py-3 font-medium"> </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {practicetests.map((r, i) => (
                      <tr key={`${r.sessionId || i}`} className="hover:bg-[var(--bg)]">
                        <td className="px-6 py-3 font-semibold">{toDisplay(r.mode, "practice")}</td>
                        <td className="px-6 py-3 text-[var(--muted)]">{toDisplay(r.topic)}</td>
                        <td className="px-6 py-3 text-[var(--muted)]">{fmtDate(r.createdAt)}</td>
                        <td className="px-6 py-3 text-[var(--muted)]">{fmtDate(r.submittedAt) || "—"}</td>
                        <td className="px-6 py-3 text-right font-semibold">{r.scorePercent == null ? "—" : `${Number(r.scorePercent).toFixed(2)}%`}</td>
                        <td className="px-6 py-3">
                          {r.submittedAt ? (r.passed ? <Pill tone="ok">Passed</Pill> : <Pill tone="bad">Failed</Pill>) : <Pill>Not submitted</Pill>}
                        </td>
                        <td className="px-6 py-3 text-right">
                          {r.sessionId ? (
                            <button
                              onClick={() => navigate(`/admin/user/${encodeURIComponent(uid)}/practicetests/${encodeURIComponent(r.sessionId)}`)}
                              className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--card)] text-xs font-semibold"
                            >
                              View
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                    {!practicetests.length ? (
                      <tr>
                        <td className="px-6 py-8 text-[var(--muted)]" colSpan={7}>
                          No sessions.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
