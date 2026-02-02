import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../auth/AuthProvider.jsx";
import { BarChart } from "../components/Charts.jsx";

export default function AdminCourseProgress() {
  const { token, apiBase } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);
  const [courseFilter, setCourseFilter] = useState("All");

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${apiBase}/admin/course-progress`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Failed to fetch");
      setRows(j.rows || []);
    } catch (e) {
      setError(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const courses = useMemo(() => {
    const set = new Set();
    (rows || []).forEach((r) => r.courseTitle && set.add(r.courseTitle));
    return ["All", ...Array.from(set).sort()];
  }, [rows]);

  const filtered = useMemo(() => {
    if (courseFilter === "All") return rows;
    return (rows || []).filter((r) => r.courseTitle === courseFilter);
  }, [rows, courseFilter]);

  const chart = useMemo(() => {
    const agg = {};
    (rows || []).forEach((r) => {
      const ct = r.courseTitle || "(unknown)";
      agg[ct] = agg[ct] || { label: ct, value: 0, n: 0 };
      agg[ct].value += Number(r.percent) || 0;
      agg[ct].n += 1;
    });
    const out = Object.values(agg).map((x) => ({ label: x.label, value: x.n ? x.value / x.n : 0 }));
    out.sort((a, b) => b.value - a.value);
    return out.slice(0, 10);
  }, [rows]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">User Course Progress</h1>
          <p className="text-sm text-[var(--muted)]">Quiz-based completion (quizzes passed / total).</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className="px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--text)] text-sm">
            {courses.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button onClick={fetchData} className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-sm hover:bg-[var(--accent-2)]">Refresh</button>
        </div>
      </div>

      {error && <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700">{error}</div>}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6 shadow-sm">
        <div className="font-semibold text-[var(--text)] mb-4">Average completion by course (top 10)</div>
        <BarChart data={chart} />
      </motion.div>

      <div className="mt-4 bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div className="font-semibold text-[var(--text)]">Details</div>
          {loading && <div className="text-sm text-[var(--muted)]">Loading…</div>}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[var(--bg)] text-[var(--muted)]">
              <tr>
                <th className="text-left px-6 py-3 font-medium">User</th>
                <th className="text-left px-6 py-3 font-medium">Course</th>
                <th className="text-right px-6 py-3 font-medium">Passed</th>
                <th className="text-right px-6 py-3 font-medium">Total</th>
                <th className="text-right px-6 py-3 font-medium">%</th>
                <th className="text-left px-6 py-3 font-medium">Hold</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.map((r, idx) => (
                <tr key={`${r.uid}:${r.courseTitle}:${idx}`} className="hover:bg-[rgba(16,185,129,0.06)]">
                  <td className="px-6 py-3">
                    <div className="font-medium text-[var(--text)]">{r.name || r.email || r.uid}</div>
                    <div className="text-xs text-[var(--muted)]">{r.email || ""}</div>
                  </td>
                  <td className="px-6 py-3 text-[var(--text)]">{r.courseTitle}</td>
                  <td className="px-6 py-3 text-right text-[var(--text)]">{r.passedQuizzes}</td>
                  <td className="px-6 py-3 text-right text-[var(--text)]">{r.totalQuizzes}</td>
                  <td className="px-6 py-3 text-right font-semibold text-[var(--text)]">{r.percent}%</td>
                  <td className="px-6 py-3">
                    {r.held ? (
                      <span className="inline-flex items-center px-2 py-1 text-xs rounded-full border border-[var(--border)] bg-[rgba(245,158,11,0.16)] text-[var(--text)]">On hold</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 text-xs rounded-full border border-[var(--border)] bg-[rgba(16,185,129,0.16)] text-[var(--text)]">Active</span>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td className="px-6 py-10 text-center text-[var(--muted)]" colSpan={6}>No data.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
