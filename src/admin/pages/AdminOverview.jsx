import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../auth/AuthProvider.jsx";
import { BarChart, Donut } from "../components/Charts.jsx";

export default function AdminOverview() {
  const { token, apiBase } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);

  const fetchAll = async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const [uRes, cRes] = await Promise.all([
        fetch(`${apiBase}/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiBase}/admin/courses-studying`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const uj = await uRes.json();
      const cj = await cRes.json();
      if (!uRes.ok) throw new Error(uj?.error || "Failed to fetch users");
      if (!cRes.ok) throw new Error(cj?.error || "Failed to fetch courses");
      setUsers(uj.users || []);
      setCourses(cj.courses || []);
    } catch (e) {
      setError(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const totals = useMemo(() => {
    const totalUsers = users.length;
    const admins = users.filter((u) => u.isAdmin).length;
    const learners = users.filter((u) => !u.isAdmin);
    const totalCoursesTracked = learners.reduce((a, u) => a + (u.courses?.length || 0), 0);
    const heldCourses = learners.reduce((a, u) => a + (u.heldCourses?.length || 0), 0);
    return { totalUsers, totalCoursesTracked, admins, heldCourses };
  }, [users]);

  const topCourses = useMemo(() => {
    const data = (courses || []).slice(0, 8).map((c) => ({ label: c.courseTitle, value: c.usersStudying }));
    return data;
  }, [courses]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Admin Overview</h1>
          <p className="text-sm text-[var(--muted)]">Quick stats + top activity.</p>
        </div>
        <button onClick={fetchAll} className="px-4 py-2 rounded-xl bg-black text-white text-sm hover:opacity-90">
          Refresh
        </button>
      </div>

      {error && <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[{
          label: "Total Users",
          value: totals.totalUsers,
        }, {
          label: "Admins",
          value: totals.admins,
        }, {
          label: "Courses Tracked",
          value: totals.totalCoursesTracked,
        }, {
          label: "Held Courses",
          value: totals.heldCourses,
        }].map((card) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-5 shadow-sm"
          >
            <div className="text-sm text-[var(--muted)]">{card.label}</div>
            <div className="text-3xl font-semibold text-[var(--text)] mt-1">{loading ? "…" : card.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-semibold text-[var(--text)]">Top courses (users studying)</div>
              <div className="text-sm text-[var(--muted)]">Based on saved course states</div>
            </div>
          </div>
          <BarChart data={topCourses} />
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-semibold text-[var(--text)]">Average completion</div>
              <div className="text-sm text-[var(--muted)]">Mean quiz-pass % across users</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-6">
            {(users || []).filter((u) => !u.isAdmin).slice(0, 6).map((u) => (
              <div key={u.uid} className="flex items-center gap-3">
                <Donut percent={u.overallPercent || 0} />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[var(--text)] truncate max-w-[180px]">{u.name || u.email}</div>
                  <div className="text-xs text-[var(--muted)]">{u.isAdmin ? "admin" : "user"}</div>
                </div>
              </div>
            ))}
            {(!users || users.length === 0) && <div className="text-sm text-[var(--muted)]">No users yet.</div>}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
