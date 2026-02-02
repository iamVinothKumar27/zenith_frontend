import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../auth/AuthProvider.jsx";
import { BarChart } from "../components/Charts.jsx";

export default function AdminCoursesStudying() {
  const { token, apiBase } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [courses, setCourses] = useState([]);

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${apiBase}/admin/courses-studying`, {
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

  const chart = useMemo(() => (courses || []).slice(0, 10).map((c) => ({ label: c.courseTitle, value: c.usersStudying })), [courses]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Courses Users Studying</h1>
          <p className="text-sm text-[var(--muted)]">Counts based on saved course states (uniform UI + smooth animations).</p>
        </div>
        <button onClick={fetchData} className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-sm hover:bg-[var(--accent-2)]">Refresh</button>
      </div>

      {error && <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700">{error}</div>}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[var(--card)] text-[var(--text)] rounded-2xl border border-[var(--border)] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="font-semibold text-[var(--text)]">Top courses</div>
          {loading && <div className="text-sm text-[var(--muted)]">Loading…</div>}
        </div>
        <BarChart data={chart} />
      </motion.div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {(courses || []).map((c) => (
          <motion.div
            key={c.courseTitle}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="bg-[var(--card)] text-[var(--text)] rounded-2xl border border-[var(--border)] p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold text-[var(--text)] truncate">{c.courseTitle}</div>
                <div className="text-sm text-[var(--muted)] mt-1">Users studying: <span className="font-semibold text-[var(--text)]">{c.usersStudying}</span></div>
              </div>
              <div className="text-xs px-2 py-1 rounded-full border border-[var(--border)] bg-[rgba(16,185,129,0.12)] text-[var(--text)]">
                On hold: <span className="font-semibold">{c.usersOnHold || 0}</span>
              </div>
            </div>
          </motion.div>
        ))}
        {(!loading && (!courses || courses.length === 0)) && <div className="text-sm text-[var(--muted)]">No course data yet.</div>}
      </div>
    </div>
  );
}
