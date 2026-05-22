import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Users, BookOpen, ShieldCheck, PauseCircle, RefreshCw, TrendingUp, Award } from "lucide-react";
import { useAuth } from "../../auth/AuthProvider.jsx";
import { BarChart, Donut } from "../components/Charts.jsx";

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.35 } }),
};

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
    return { totalUsers, totalCoursesTracked, admins, heldCourses, learners: learners.length };
  }, [users]);

  const topCourses = useMemo(() => {
    return (courses || []).slice(0, 8).map((c) => ({ label: c.courseTitle, value: c.usersStudying }));
  }, [courses]);

  const topUsers = useMemo(() => {
    return (users || [])
      .filter((u) => !u.isAdmin)
      .map((u) => {
        const passed = (u.courses || []).reduce((a, c) => a + Number(c.passedQuizzes || 0), 0);
        const label = ((u.name || u.email || "User") + "").split("@")[0].slice(0, 16);
        return { label, value: passed };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [users]);

  const STAT_CARDS = [
    {
      label: "Total Users",
      value: totals.totalUsers,
      icon: Users,
      color: "text-indigo-500",
      bg: "bg-indigo-50 dark:bg-indigo-900/20",
      change: "+12%",
    },
    {
      label: "Learners",
      value: totals.learners,
      icon: TrendingUp,
      color: "text-violet-500",
      bg: "bg-violet-50 dark:bg-violet-900/20",
      change: "+8%",
    },
    {
      label: "Courses Tracked",
      value: totals.totalCoursesTracked,
      icon: BookOpen,
      color: "text-emerald-500",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      change: "+23%",
    },
    {
      label: "Admins",
      value: totals.admins,
      icon: ShieldCheck,
      color: "text-sky-500",
      bg: "bg-sky-50 dark:bg-sky-900/20",
      change: null,
    },
    {
      label: "Held Courses",
      value: totals.heldCourses,
      icon: PauseCircle,
      color: "text-amber-500",
      bg: "bg-amber-50 dark:bg-amber-900/20",
      change: null,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Admin Overview</h1>
          <p className="text-sm text-[var(--muted)] mt-0.5">Platform analytics and activity at a glance</p>
        </div>
        <button
          onClick={fetchAll}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm font-semibold text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl border border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {STAT_CARDS.map((card, i) => (
          <motion.div
            key={card.label}
            variants={cardVariants}
            initial="hidden"
            animate="show"
            custom={i}
            className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-5 hover:border-[var(--accent-border)] hover:-translate-y-0.5 hover:shadow-md transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${card.bg} grid place-items-center shrink-0`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              {card.change && (
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                  {card.change}
                </span>
              )}
            </div>
            <div className="text-2xl font-bold text-[var(--text)]">
              {loading ? <span className="opacity-30">…</span> : card.value}
            </div>
            <div className="text-xs text-[var(--muted)] mt-0.5">{card.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6 shadow-sm"
        >
          <div className="mb-5">
            <div className="font-semibold text-[var(--text)]">Top Courses by Enrollment</div>
            <div className="text-xs text-[var(--muted)] mt-0.5">Based on saved course states</div>
          </div>
          {loading ? (
            <div className="h-40 bg-[var(--surface)] rounded-2xl animate-pulse" />
          ) : (
            <BarChart data={topCourses} />
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6 shadow-sm"
        >
          <div className="mb-5">
            <div className="font-semibold text-[var(--text)]">Learner Completion Progress</div>
            <div className="text-xs text-[var(--muted)] mt-0.5">Mean quiz-pass % across users</div>
          </div>
          {loading ? (
            <div className="h-40 bg-[var(--surface)] rounded-2xl animate-pulse" />
          ) : (
            <div className="flex flex-wrap gap-6">
              {(users || []).filter((u) => !u.isAdmin).slice(0, 6).map((u) => (
                <div key={u.uid} className="flex items-center gap-3">
                  <Donut percent={u.overallPercent || 0} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[var(--text)] truncate max-w-[140px]">
                      {u.name || u.email}
                    </div>
                    <div className="text-xs text-[var(--muted)]">{u.overallPercent || 0}% done</div>
                  </div>
                </div>
              ))}
              {(!users || users.filter((u) => !u.isAdmin).length === 0) && (
                <div className="text-sm text-[var(--muted)]">No learners yet.</div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6 shadow-sm"
        >
          <div className="mb-5">
            <div className="font-semibold text-[var(--text)]">Top Users by Quizzes Passed</div>
            <div className="text-xs text-[var(--muted)] mt-0.5">Across all enrolled courses</div>
          </div>
          {loading ? (
            <div className="h-32 bg-[var(--surface)] rounded-2xl animate-pulse" />
          ) : topUsers.length ? (
            <BarChart data={topUsers} />
          ) : (
            <div className="text-sm text-[var(--muted)]">No quiz data yet.</div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6 shadow-sm"
        >
          <div className="mb-5">
            <div className="font-semibold text-[var(--text)]">Users Snapshot</div>
            <div className="text-xs text-[var(--muted)] mt-0.5">Admins vs learners breakdown</div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            {[
              { label: "Learners", value: users.filter((u) => !u.isAdmin).length, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-900/20", icon: Users },
              { label: "Admins", value: users.filter((u) => u.isAdmin).length, color: "text-sky-500", bg: "bg-sky-50 dark:bg-sky-900/20", icon: ShieldCheck },
            ].map((s) => (
              <div key={s.label} className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl ${s.bg} grid place-items-center shrink-0`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <div>
                  <div className="text-xl font-bold text-[var(--text)]">{loading ? "…" : s.value}</div>
                  <div className="text-xs text-[var(--muted)]">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-xs text-[var(--muted)] p-3 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
            Open{" "}
            <a href="/admin/users" className="font-semibold" style={{ color: "var(--accent)" }}>Users</a>
            {" "}to drill down into user-wise course, quiz, and test reports.
          </div>
        </motion.div>
      </div>
    </div>
  );
}
