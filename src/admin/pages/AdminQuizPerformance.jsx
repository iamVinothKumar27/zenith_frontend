import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../auth/AuthProvider.jsx";
import { BarChart, SimplePie } from "../components/Charts.jsx";

export default function AdminQuizPerformance() {
  const { token, apiBase } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [courses, setCourses] = useState([]);

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${apiBase}/admin/quiz-performance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Failed to fetch");
      setCourses(j.courses || []);
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

  const bar = useMemo(
    () => (courses || []).slice(0, 10).map((c) => ({ label: c.courseTitle, value: c.passRatePercent })),
    [courses]
  );

  const pie = useMemo(() => {
    const top = (courses || []).slice(0, 4);
    const rest = (courses || []).slice(4);
    const restVal = rest.reduce((a, c) => a + (Number(c.passRatePercent) || 0), 0);
    // Varied palette for better readability (avoid only green shades)
    // Keep green as the primary brand color, but add distinct hues.
    const colors = [
      "#22c55e", // green
      "#3b82f6", // blue
      "#f59e0b", // amber
      "#a855f7", // purple
      "#ef4444", // red (Others)
    ];
    const slices = top.map((c, i) => ({ label: c.courseTitle, value: Number(c.passRatePercent) || 0, color: colors[i] }));
    if (rest.length) slices.push({ label: "Others", value: restVal, color: colors[4] });
    return slices;
  }, [courses]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">User Quiz Performance</h1>
          <p className="text-sm text-[var(--muted)]">Course-wise quiz pass rate (across all users).</p>
        </div>
        <button onClick={fetchData} className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-sm hover:bg-[var(--accent-2)]">Refresh</button>
      </div>

      {error && <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[var(--card)] text-[var(--text)] rounded-2xl border border-[var(--border)] p-6 shadow-sm">
          <div className="font-semibold text-[var(--text)] mb-4">Pass-rate bar chart (top 10)</div>
          <BarChart data={bar} />
          {loading && <div className="mt-3 text-sm text-[var(--muted)]">Loading…</div>}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[var(--card)] text-[var(--text)] rounded-2xl border border-[var(--border)] p-6 shadow-sm">
          <div className="font-semibold text-[var(--text)] mb-4">Distribution (top courses)</div>
          <SimplePie slices={pie} />
        </motion.div>
      </div>

      <div className="mt-4 bg-[var(--card)] text-[var(--text)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="font-semibold text-[var(--text)]">Details</div>
          {loading && <div className="text-sm text-[var(--muted)]">Loading…</div>}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[rgba(16,185,129,0.08)] text-[var(--muted)]">
              <tr>
                <th className="text-left px-6 py-3 font-medium">Course</th>
                <th className="text-right px-6 py-3 font-medium">Users</th>
                <th className="text-right px-6 py-3 font-medium">Quizzes/user</th>
                <th className="text-right px-6 py-3 font-medium">Passed total</th>
                <th className="text-right px-6 py-3 font-medium">Pass rate %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {(courses || []).map((c) => (
                <tr key={c.courseTitle} className="hover:bg-[rgba(16,185,129,0.06)]">
                  <td className="px-6 py-3 font-medium text-[var(--text)]">{c.courseTitle}</td>
                  <td className="px-6 py-3 text-right text-[var(--text)]">{c.usersStudying}</td>
                  <td className="px-6 py-3 text-right text-[var(--text)]">{c.totalQuizzesPerUser}</td>
                  <td className="px-6 py-3 text-right text-[var(--text)]">{c.passedQuizzesTotal}</td>
                  <td className="px-6 py-3 text-right font-semibold text-[var(--text)]">{c.passRatePercent}%</td>
                </tr>
              ))}
              {!loading && (!courses || courses.length === 0) && (
                <tr><td className="px-6 py-10 text-center text-[var(--muted)]" colSpan={5}>No quiz data.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
