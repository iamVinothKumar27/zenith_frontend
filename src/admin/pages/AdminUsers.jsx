import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../auth/AuthProvider.jsx";
import { Donut } from "../components/Charts.jsx";

function Chip({ children, tone = "gray" }) {
  const map = {
    gray: "bg-gray-100 text-[var(--muted)] border-[var(--border)]",
    green: "bg-green-100 text-green-700 border-green-200",
    amber: "bg-amber-100 text-amber-700 border-amber-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs border rounded-full ${map[tone] || map.gray}`}>
      {children}
    </span>
  );
}

export default function AdminUsers() {
  const { token, apiBase, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [busy, setBusy] = useState("");
  const [query, setQuery] = useState("");

  const fetchUsers = async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${apiBase}/admin/users`, { headers: { Authorization: `Bearer ${token}` } });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Failed to fetch users");
      setUsers(j.users || []);
    } catch (e) {
      setError(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => (u.email || "").toLowerCase().includes(q) || (u.name || "").toLowerCase().includes(q));
  }, [users, query]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const admins = filtered.filter((u) => !!u.isAdmin).length;
    const learners = filtered.filter((u) => !u.isAdmin);
    const coursesTracked = learners.reduce((acc, u) => acc + (u.courses?.length || 0), 0);
    const avgPass = learners.length ? Math.round(learners.reduce((acc, u) => acc + (u.overallPercent || 0), 0) / learners.length) : 0;
    return { total, admins, coursesTracked, avgPass };
  }, [filtered]);

  const call = async (path, body) => {
    setError("");
    const res = await fetch(`${apiBase}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body || {}),
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j?.error || "Request failed");
    return j;
  };

  const del = async (uid) => {
    if (!uid) return;
    if (!window.confirm("Delete this user and all their data?")) return;
    setBusy(uid);
    try {
      await call("/admin/delete-user", { uid });
      await fetchUsers();
    } catch (e) {
      setError(e?.message || "Error");
    } finally {
      setBusy("");
    }
  };

  const toggleHold = async (uid, courseTitle, held) => {
    setBusy(`${uid}:${courseTitle}`);
    try {
      await call("/admin/course-hold", { uid, courseTitle, held });
      await fetchUsers();
    } catch (e) {
      setError(e?.message || "Error");
    } finally {
      setBusy("");
    }
  };

  const selfUid = user?.uid;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Users</h1>
          <p className="text-sm text-[var(--muted)]">Hold courses or delete users. Admin is fixed to admin@zenithlearning.site.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name/email"
            className="px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--text)] placeholder:text-[var(--muted)] text-sm w-64"
          />
          <button onClick={fetchUsers} className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-sm hover:bg-[var(--accent-2)]">
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Shown users", value: stats.total },
          { label: "Admins", value: stats.admins },
          { label: "Courses tracked", value: stats.coursesTracked },
          { label: "Avg pass % (learners)", value: `${stats.avgPass}%` },
        ].map((c) => (
          <div key={c.label} className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-5 shadow-sm">
            <div className="text-sm text-[var(--muted)]">{c.label}</div>
            <div className="text-3xl font-semibold text-[var(--text)] mt-1">{loading ? "…" : c.value}</div>
          </div>
        ))}
      </div>

      {error && <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700">{error}</div>}

      <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="font-semibold text-[var(--text)]">All Users</div>
          {loading && <div className="text-sm text-[var(--muted)]">Loading…</div>}
        </div>
        <div className="divide-y">
          {filtered.map((u) => (
            <motion.div
              key={u.uid}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="px-6 py-5 flex flex-col lg:flex-row lg:items-start justify-between gap-5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="font-semibold text-[var(--text)] truncate max-w-[420px]">{u.name || "(no name)"}</div>
                  <Chip tone={u.isAdmin ? "green" : "gray"}>{u.isAdmin ? "admin" : "user"}</Chip>
                  {(u.heldCourses?.length || 0) > 0 && <Chip tone="amber">{u.heldCourses.length} held</Chip>}
                </div>
                <div className="text-sm text-[var(--muted)] truncate">{u.email || ""}</div>

                {!u.isAdmin && (u.courses?.length ? (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {u.courses.map((c) => (
                      <div key={c.courseKey} className="rounded-xl border p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-[var(--text)] truncate">{c.courseTitle}</div>
                            <div className="text-xs text-[var(--muted)] mt-1">
                              {c.passedQuizzes}/{c.totalQuizzes} quizzes passed • {Math.round(c.percent)}%
                            </div>
                          </div>
                          <button
                            onClick={() => toggleHold(u.uid, c.courseTitle, !c.held)}
                            disabled={busy === `${u.uid}:${c.courseTitle}`}
                            className={`px-3 py-1.5 rounded-lg text-xs border transition ${
                              c.held ? "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100" : "bg-[var(--card)] border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface)]"
                            } disabled:opacity-50`}
                            title={c.held ? "Unhold course" : "Hold course"}
                          >
                            {busy === `${u.uid}:${c.courseTitle}` ? "…" : c.held ? "Unhold" : "Hold"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 text-sm text-[var(--muted)]">No courses yet.</div>
                ))}
              </div>

              <div className="flex items-center gap-3 shrink-0 justify-between lg:justify-end">
                {!u.isAdmin ? (
                  <div className="flex items-center gap-3">
                    <Donut percent={u.overallPercent || 0} />
                    <div className="text-xs text-[var(--muted)]">
                      Avg pass %
                      <div className="text-sm font-semibold text-[var(--text)]">{Math.round(u.overallPercent || 0)}%</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-[var(--muted)]">Admin account</div>
                )}

                <button
                  onClick={() => del(u.uid)}
                  disabled={busy === u.uid || selfUid === u.uid}
                  className="px-3 py-2 rounded-xl border border-red-200 text-red-700 text-sm hover:bg-red-50 disabled:opacity-50"
                  title={selfUid === u.uid ? "You cannot delete yourself" : "Delete user"}
                >
                  {busy === u.uid ? "…" : "Delete"}
                </button>
              </div>
            </motion.div>
          ))}

          {!loading && filtered.length === 0 && <div className="px-6 py-10 text-center text-[var(--muted)]">No users found.</div>}
        </div>
      </div>
    </div>
  );
}
