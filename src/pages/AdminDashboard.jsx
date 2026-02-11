import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthProvider.jsx";

// Simple donut SVG (no external libs)
function Donut({ percent = 0, size = 64, stroke = 8 }) {
  const p = Math.max(0, Math.min(100, Number(percent) || 0));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (p / 100) * c;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} stroke="#e5e7eb" strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="#22c55e"
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={`${dash} ${c - dash}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fontSize="14" fill="#111827">
        {Math.round(p)}%
      </text>
    </svg>
  );
}

export default function AdminDashboard() {
  const { token, apiBase, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [busyUid, setBusyUid] = useState("");

  async function fetchUsers() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${apiBase}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Failed to fetch users");
      setUsers(j.users || []);
    } catch (e) {
      setError(e.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  async function promote(uid) {
    if (!uid) return;
    setBusyUid(uid);
    setError("");
    try {
      const res = await fetch(`${apiBase}/admin/promote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ uid }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Failed to promote");
      await fetchUsers();
    } catch (e) {
      setError(e.message || "Error");
    } finally {
      setBusyUid("");
    }
  }

  async function demote(uid) {
    if (!uid) return;
    setBusyUid(uid);
    setError("");
    try {
      const res = await fetch(`${apiBase}/admin/demote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ uid }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Failed to demote");
      await fetchUsers();
    } catch (e) {
      setError(e.message || "Error");
    } finally {
      setBusyUid("");
    }
  }

  useEffect(() => {
    if (token) fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const totals = useMemo(() => {
    const totalUsers = users.length;
    const totalCourses = users.reduce((a, u) => a + (u.courses?.length || 0), 0);
    return { totalUsers, totalCourses };
  }, [users]);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Manage users, courses, and progress.</p>
          </div>
          <button
            onClick={fetchUsers}
            className="px-4 py-2 rounded-lg bg-black text-white hover:opacity-90"
          >
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5">
            <div className="text-sm text-gray-500">Total Users</div>
            <div className="text-3xl font-semibold text-gray-900">{totals.totalUsers}</div>
          </div>
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5">
            <div className="text-sm text-gray-500">Total Courses Tracked</div>
            <div className="text-3xl font-semibold text-gray-900">{totals.totalCourses}</div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg border border-[var(--border)]-red-200 bg-red-50 text-red-700">{error}</div>
        )}

        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="px-6 py-4 border border-[var(--border)]-b flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Users</h2>
            {loading && <span className="text-sm text-gray-500">Loading…</span>}
          </div>

          <div className="divide-y">
            {users.map((u) => (
              <div key={u.uid} className="px-6 py-5 flex items-start justify-between gap-6">
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 truncate">{u.name || "(no name)"}</div>
                  <div className="text-sm text-gray-600 truncate">{u.email || ""}</div>
                  <div className="mt-2 text-sm text-gray-500">
                    Role: <span className="font-medium text-gray-800">{u.isAdmin ? "admin" : "user"}</span>
                    <span className="mx-2">•</span>
                    Courses: <span className="font-medium text-gray-800">{u.courses?.length || 0}</span>
                  </div>

                  {u.courses?.length ? (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                      {u.courses.map((c) => (
                        <div key={c.courseKey} className="rounded-lg border border-[var(--border)] p-3">
                          <div className="text-sm font-medium text-gray-900 truncate">{c.courseTitle}</div>
                          <div className="text-xs text-gray-600">
                            {c.passedQuizzes}/{c.totalQuizzes} quizzes passed
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex flex-col items-end gap-2">
                    {u.isAdmin ? (
                      <button
                        onClick={() => demote(u.uid)}
                        disabled={busyUid === u.uid || profile?.uid === u.uid}
                        className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-sm hover:bg-[var(--bg)] disabled:opacity-50"
                        title={profile?.uid === u.uid ? "You cannot demote yourself" : "Demote to user"}
                      >
                        {busyUid === u.uid ? "Working…" : "Demote"}
                      </button>
                    ) : (
                      <button
                        onClick={() => promote(u.uid)}
                        disabled={busyUid === u.uid}
                        className="px-3 py-1.5 rounded-lg bg-black text-white text-sm hover:opacity-90 disabled:opacity-50"
                        title="Promote to admin"
                      >
                        {busyUid === u.uid ? "Working…" : "Promote"}
                      </button>
                    )}
                    <Donut percent={u.overallPercent} />
                  </div>
                </div>
              </div>
            ))}

            {!loading && users.length === 0 && (
              <div className="px-6 py-10 text-center text-gray-500">No users found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
