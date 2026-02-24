import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

export default function AdminUserCourseQuizResults() {
  const { uid, courseTitle } = useParams();
  const { token, apiBase } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);

  const totalVideos = useMemo(() => {
    const tv = Number(meta?.totalVideos || 0);
    if (tv) return tv;
    const maxNo = Math.max(0, ...(rows || []).map((r) => Number(r.videoNo || 0)));
    return maxNo || null;
  }, [meta, rows]);

  const fetchData = async () => {
    if (!token || !uid || !courseTitle) return;
    setLoading(true);
    setError("");
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch(
        `${apiBase}/admin/user/${encodeURIComponent(uid)}/course/${encodeURIComponent(courseTitle)}/quiz-results`,
        { headers }
      );
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.ok) throw new Error(j?.error || `HTTP ${res.status}`);
      setRows(j.rows || []);
      setMeta(j.meta || null);
    } catch (e) {
      setError(String(e?.message || e));
      setRows([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, uid, courseTitle]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => navigate(-1)}
              className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm font-semibold"
            >
              ← Back
            </button>
            <Pill>User</Pill>
            <Pill>Course</Pill>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text)]">{decodeURIComponent(courseTitle || "")}</h1>
          <div className="text-sm text-[var(--muted)] mt-1">
            Video-wise quiz results {totalVideos ? `(total videos: ${totalVideos})` : ""} • user: {uid}
          </div>
        </div>

        <button
          onClick={fetchData}
          className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-sm hover:bg-[var(--accent-2)]"
        >
          Refresh
        </button>
      </div>

      {error ? <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700">{error}</div> : null}

      <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="font-semibold text-[var(--text)]">Quiz results by video</div>
          {loading ? <div className="text-sm text-[var(--muted)]">Loading…</div> : null}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[rgba(16,185,129,0.08)] text-[var(--muted)]">
              <tr>
                <th className="text-left px-6 py-3 font-medium">Video No</th>
                <th className="text-left px-6 py-3 font-medium">Video title</th>
                <th className="text-right px-6 py-3 font-medium">Marks</th>
                <th className="text-left px-6 py-3 font-medium">Status</th>
                <th className="text-right px-6 py-3 font-medium">Attempts</th>
                <th className="text-left px-6 py-3 font-medium">Video link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {(rows || []).map((r) => {
                const score = Number(r.lastScore ?? 0);
                const total = Number(r.totalQuestions ?? 0);
                const attempts = Number(r.attemptsUsed ?? 0);
                const url = (r.video_url || r.videoUrl || "").trim();
                const attempted = !!r.attempted;
                const statusLabel = !attempted ? "Not attempted" : r.passed ? "Passed" : "Failed";
                const statusClass =
                  !attempted
                    ? "bg-[rgba(148,163,184,0.18)] text-[var(--muted)] border border-[rgba(148,163,184,0.35)]"
                    : r.passed
                      ? "bg-[rgba(16,185,129,0.12)] text-emerald-700 border border-[rgba(16,185,129,0.35)]"
                      : "bg-[rgba(239,68,68,0.12)] text-red-700 border border-[rgba(239,68,68,0.35)]";
                return (
                  <tr key={`${r.videoNo}-${url}`} className="hover:bg-[var(--bg)]">
                    <td className="px-6 py-3 font-semibold">{r.videoNo ?? "-"}</td>
                    <td className="px-6 py-3">
                      <div className="font-semibold text-[var(--text)]">{r.videoTitle || `Video ${r.videoNo ?? ""}`}</div>
                      <div className="text-xs text-[var(--muted)] mt-0.5">
                        {!attempted ? "Not attempted" : r.passed ? "Passed" : "Failed"}
                        {r.lastAttemptAt || r.updatedAt ? ` • ${fmtDate(r.lastAttemptAt || r.updatedAt)}` : ""}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-right font-semibold">
                      {total ? `${score}/${total}` : "—"}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusClass}`}>
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">{Number.isFinite(attempts) ? attempts : 0}</td>
                    <td className="px-6 py-3">
                      {url ? (
                        <a href={url} target="_blank" rel="noreferrer" className="text-[var(--accent)] hover:underline">
                          Open
                        </a>
                      ) : (
                        <span className="text-[var(--muted)]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!loading && !(rows || []).length ? (
                <tr>
                  <td className="px-6 py-10 text-[var(--muted)]" colSpan={6}>
                    No quiz attempts found for this course.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
