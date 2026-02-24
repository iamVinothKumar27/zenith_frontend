import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider.jsx";
import { BarChart, SimplePie } from "../components/Charts.jsx";

function initials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  const a = parts[0]?.[0] || "U";
  const b = parts.length > 1 ? (parts[parts.length - 1]?.[0] || "") : "";
  return (a + b).toUpperCase();
}

export default function AdminQuizPerformance() {
  const { token, apiBase } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("courses"); // courses | users

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [courses, setCourses] = useState([]);

  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersErr, setUsersErr] = useState("");
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");

  const fetchCourses = async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${apiBase}/admin/quiz-performance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Failed to fetch");
      setCourses(j.courses || []);
    } catch (e) {
      setError(e?.message || "Error");
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (!token) return;
    setLoadingUsers(true);
    setUsersErr("");
    try {
      const res = await fetch(`${apiBase}/admin/quiz-analytics/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Failed to fetch user analytics");
      setRows(j.rows || []);
    } catch (e) {
      setUsersErr(e?.message || "Error");
      setRows([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const refresh = async () => {
    if (tab === "users") return fetchUsers();
    return fetchCourses();
  };

  useEffect(() => {
    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (tab === "users" && token) fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const bar = useMemo(
    () => (courses || []).slice(0, 10).map((c) => ({ label: c.courseTitle, value: c.passRatePercent })),
    [courses]
  );

  const pie = useMemo(() => {
    const top = (courses || []).slice(0, 4);
    const rest = (courses || []).slice(4);
    const restVal = rest.reduce((a, c) => a + (Number(c.passRatePercent) || 0), 0);
    const colors = [
      "#22c55e", // green
      "#3b82f6", // blue
      "#f59e0b", // amber
      "#a855f7", // purple
      "#ef4444", // red (Others)
    ];
    const slices = top.map((c, i) => ({
      label: c.courseTitle,
      value: Number(c.passRatePercent) || 0,
      color: colors[i],
    }));
    if (rest.length) slices.push({ label: "Others", value: restVal, color: colors[4] });
    return slices;
  }, [courses]);

  const filteredRows = useMemo(() => {
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
          <h1 className="text-2xl font-bold text-[var(--text)]">Quiz Performance</h1>
          <p className="text-sm text-[var(--muted)]">
            {tab === "courses" ? "Course-wise quiz pass rate (across all users)." : "User-wise quiz performance across all courses."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-2xl border border-[var(--border)] bg-[var(--card)] p-1">
            <button
              onClick={() => setTab("courses")}
              className={`px-3 py-2 rounded-2xl text-sm font-semibold transition ${
                tab === "courses" ? "bg-[var(--accent)] text-white" : "text-[var(--muted)] hover:opacity-90"
              }`}
            >
              By Course
            </button>
            <button
              onClick={() => setTab("users")}
              className={`px-3 py-2 rounded-2xl text-sm font-semibold transition ${
                tab === "users" ? "bg-[var(--accent)] text-white" : "text-[var(--muted)] hover:opacity-90"
              }`}
            >
              By User
            </button>
          </div>

          <button
            onClick={refresh}
            className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-sm hover:bg-[var(--accent-2)]"
          >
            Refresh
          </button>
        </div>
      </div>

      {tab === "courses" ? (
        <>
          {error && <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700">{error}</div>}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-[var(--card)] text-[var(--text)] rounded-2xl border border-[var(--border)] p-6 shadow-sm"
            >
              <div className="font-semibold text-[var(--text)] mb-4">Pass-rate bar chart (top 10)</div>
              <BarChart data={bar} />
              {loading && <div className="mt-3 text-sm text-[var(--muted)]">Loading…</div>}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-[var(--card)] text-[var(--text)] rounded-2xl border border-[var(--border)] p-6 shadow-sm"
            >
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
                    <tr
                      key={c.courseTitle}
                      className="hover:bg-[rgba(16,185,129,0.06)] cursor-pointer"
                      onClick={() => navigate(`/admin/course/${encodeURIComponent(c.courseTitle)}`)}
                      title="Open course details"
                    >
                      <td className="px-6 py-3 font-medium text-[var(--text)]">{c.courseTitle}</td>
                      <td className="px-6 py-3 text-right text-[var(--text)]">{c.usersStudying}</td>
                      <td className="px-6 py-3 text-right text-[var(--text)]">{c.totalQuizzesPerUser}</td>
                      <td className="px-6 py-3 text-right text-[var(--text)]">{c.passedQuizzesTotal}</td>
                      <td className="px-6 py-3 text-right font-semibold text-[var(--text)]">{c.passRatePercent}%</td>
                    </tr>
                  ))}
                  {!loading && (!courses || courses.length === 0) && (
                    <tr>
                      <td className="px-6 py-10 text-center text-[var(--muted)]" colSpan={5}>
                        No quiz data.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          {usersErr && <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700">{usersErr}</div>}

          <div className="ui-card p-4 mb-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="text-sm text-[var(--muted)]">Sorted by average percent across all quizzes.</div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name/email"
              className="w-full sm:w-[280px] px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-sm"
            />
          </div>

          <div className="bg-[var(--card)] text-[var(--text)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <div className="font-semibold text-[var(--text)]">User-wise quiz performance</div>
              {loadingUsers && <div className="text-sm text-[var(--muted)]">Loading…</div>}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-[rgba(16,185,129,0.08)] text-[var(--muted)]">
                  <tr>
                    <th className="text-left px-6 py-3 font-medium">User</th>
                    <th className="text-right px-6 py-3 font-medium">Courses</th>
                    <th className="text-right px-6 py-3 font-medium">Total quizzes</th>
                    <th className="text-right px-6 py-3 font-medium">Passed</th>
                    <th className="text-right px-6 py-3 font-medium">Avg %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {(filteredRows || []).map((r) => {
                    const name = r?.name || (r?.email ? String(r.email).split("@")[0] : "User");
                    const email = r?.email || "";
                    const avatar = (r?.photoLocalURL || r?.photoURL || "").trim();
                    return (
                      <tr
                        key={r.uid}
                        className="hover:bg-[rgba(16,185,129,0.06)] cursor-pointer"
                        onClick={() => navigate(`/admin/user/${encodeURIComponent(r.uid)}?tab=quizzes`)}
                        title="Open user drilldown"
                      >
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3 min-w-[240px]">
                            {avatar ? (
                              <img src={avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-[var(--accent)] text-white text-xs font-bold grid place-items-center">
                                {initials(name)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="font-semibold truncate">{name}</div>
                              <div className="text-xs text-[var(--muted)] truncate">{email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-right">{r.courses ?? 0}</td>
                        <td className="px-6 py-3 text-right">{r.totalQuizzes ?? 0}</td>
                        <td className="px-6 py-3 text-right">{r.passedQuizzes ?? 0}</td>
                        <td className="px-6 py-3 text-right font-semibold">{Number(r.avgPercent || 0).toFixed(2)}%</td>
                      </tr>
                    );
                  })}

                  {!loadingUsers && (!filteredRows || filteredRows.length === 0) && (
                    <tr>
                      <td className="px-6 py-10 text-center text-[var(--muted)]" colSpan={5}>
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
