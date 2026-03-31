import React, { useEffect, useMemo, useState } from "react";
import { getPreferredProfilePhoto } from "../../utils/profilePhoto.js";
import Avatar from "../../components/common/Avatar.jsx";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import { useAuth } from "../../auth/AuthProvider.jsx";
import { BarChart, Donut, SimplePie } from "../components/Charts.jsx";

export default function AdminPracticeTestAnalytics() {
  const { token, apiBase } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState("overview"); // overview | users

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersErr, setUsersErr] = useState("");
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");

  const fetchOverview = async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${apiBase}/admin/practicetest-analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Failed to load analytics");
      setData(j);
    } catch (e) {
      setError(e?.message || "Error");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (!token) return;
    setLoadingUsers(true);
    setUsersErr("");
    try {
      const res = await fetch(`${apiBase}/admin/practicetest-analytics/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Failed to load user analytics");
      setRows(j?.rows || []);
    } catch (e) {
      setUsersErr(e?.message || "Error");
      setRows([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const refresh = async () => {
    if (tab === "users") return fetchUsers();
    return fetchOverview();
  };

  useEffect(() => {
    fetchOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (tab === "users" && token) fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const filteredRows = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return (rows || []).filter((r) => {
      const name = String(r?.name || "").toLowerCase();
      const email = String(r?.email || "").toLowerCase();
      return name.includes(term) || email.includes(term);
    });
  }, [rows, q]);

  const timelineBars = useMemo(() => {
    const t = data?.timeline || [];
    return t.map((x) => ({ label: (x.day || "").slice(5), value: x.count || 0 }));
  }, [data]);

  const modePie = useMemo(() => {
    const arr = data?.modeBreakdown || [];
    // Admin-only colors
    const colors = ["#60a5fa", "#22c55e", "#f59e0b", "#a78bfa", "#f87171", "#06b6d4"];
    return arr
      .slice(0, 6)
      .map((m, i) => ({ label: m.mode, value: m.count, color: colors[i % colors.length] }));
  }, [data]);

  const passRate = Number(data?.passRate || 0);
  const avgScore = Number(data?.avgScorePercent || 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Practice Test Analytics</h1>
          <p className="text-sm text-[var(--muted)]">
            {tab === "overview" ? "System-wide overview of practice test sessions." : "User-wise performance across practice tests."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-2xl border border-[var(--border)] bg-[var(--card)] p-1">
            <button
              onClick={() => setTab("overview")}
              className={`px-3 py-2 rounded-2xl text-sm font-semibold transition ${tab === "overview" ? "bg-[var(--accent)] text-white" : "text-[var(--muted)] hover:opacity-90"
                }`}
            >
              Overview
            </button>
            <button
              onClick={() => setTab("users")}
              className={`px-3 py-2 rounded-2xl text-sm font-semibold transition ${tab === "users" ? "bg-[var(--accent)] text-white" : "text-[var(--muted)] hover:opacity-90"
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

      {tab === "overview" ? (
        <>
          {error ? (
            <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 mb-6">{error}</div>
          ) : null}

          {loading ? (
            <div className="text-[var(--muted)]">Loading…</div>
          ) : !data ? (
            <div className="text-[var(--muted)]">No data.</div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="ui-card p-5">
                  <div className="text-sm text-[var(--muted)]">Total sessions</div>
                  <div className="text-3xl font-bold mt-2 text-[var(--text)]">{data.totalSessions ?? 0}</div>
                </div>
                <div className="ui-card p-5">
                  <div className="text-sm text-[var(--muted)]">Unique users</div>
                  <div className="text-3xl font-bold mt-2 text-[var(--text)]">{data.uniqueUsers ?? 0}</div>
                </div>
                <div className="ui-card p-5">
                  <div className="text-sm text-[var(--muted)]">Submitted</div>
                  <div className="text-3xl font-bold mt-2 text-[var(--text)]">{data.submittedSessions ?? 0}</div>
                  <div className="text-xs text-[var(--muted)] mt-1">Sessions with a score</div>
                </div>
                <div className="ui-card p-5">
                  <div className="text-sm text-[var(--muted)]">Passed</div>
                  <div className="text-3xl font-bold mt-2 text-[var(--text)]">{data.passedSessions ?? 0}</div>
                  <div className="text-xs text-[var(--muted)] mt-1">Score ≥ 60%</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                <div className="ui-card p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-[var(--muted)]">Pass rate</div>
                      <div className="text-xl font-bold text-[var(--text)] mt-1">{passRate.toFixed(2)}%</div>
                    </div>
                    <Donut percent={passRate} />
                  </div>
                </div>

                <div className="ui-card p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-[var(--muted)]">Avg score</div>
                      <div className="text-xl font-bold text-[var(--text)] mt-1">{avgScore.toFixed(2)}%</div>
                    </div>
                    <Donut percent={avgScore} />
                  </div>
                </div>

                <div className="ui-card p-5">
                  <div className="text-sm text-[var(--muted)] mb-3">Mode breakdown</div>
                  <SimplePie slices={modePie} size={150} />
                </div>
              </div>

              <div className="ui-card p-5">
                <div className="text-sm text-[var(--muted)] mb-3">Sessions (last 14 days)</div>
                <BarChart data={timelineBars} height={190} />
              </div>
            </motion.div>
          )}
        </>
      ) : (
        <>
          {usersErr ? (
            <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 mb-6">{usersErr}</div>
          ) : null}

          <div className="ui-card p-4 mb-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="text-sm text-[var(--muted)]">Sorted by pass rate, then avg score.</div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name/email"
              className="w-full sm:w-[280px] px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-sm"
            />
          </div>

          <div className="bg-[var(--card)] text-[var(--text)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <div className="font-semibold text-[var(--text)]">User-wise practice test performance</div>
              {loadingUsers && <div className="text-sm text-[var(--muted)]">Loading…</div>}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-[rgba(16,185,129,0.08)] text-[var(--muted)]">
                  <tr>
                    <th className="text-left px-6 py-3 font-medium">User</th>
                    <th className="text-right px-6 py-3 font-medium">Sessions</th>
                    <th className="text-right px-6 py-3 font-medium">Submitted</th>
                    <th className="text-right px-6 py-3 font-medium">Passed</th>
                    <th className="text-right px-6 py-3 font-medium">Pass rate %</th>
                    <th className="text-right px-6 py-3 font-medium">Avg score %</th>
                    <th className="text-left px-6 py-3 font-medium">Modes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {(filteredRows || []).map((r) => {
                    const name = r?.name || (r?.email ? String(r.email).split("@")[0] : "User");
                    const email = r?.email || "";
                    const modes = (r?.modeBreakdown || []).slice(0, 3);
                    return (
                      <tr
                        key={r.uid}
                        className="hover:bg-[rgba(16,185,129,0.06)] cursor-pointer"
                        onClick={() => navigate(`/admin/user/${encodeURIComponent(r.uid)}?tab=practicetests`)}
                        title="Open user drilldown"
                      >
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3 min-w-[240px]">
                            <Avatar
                              name={name}
                              email={email}
                              imageUrl={getPreferredProfilePhoto(r, { photoURL: r?.authPhotoURL || "" })}
                              size={36}
                            />
                            <div className="min-w-0">
                              <div className="font-semibold truncate">{name}</div>
                              <div className="text-xs text-[var(--muted)] truncate">{email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="text-right px-6 py-3">{r.sessions ?? 0}</td>
                        <td className="text-right px-6 py-3">{r.submitted ?? 0}</td>
                        <td className="text-right px-6 py-3">{r.passed ?? 0}</td>
                        <td className="text-right px-6 py-3 font-semibold">{Number(r.passRate || 0).toFixed(2)}%</td>
                        <td className="text-right px-6 py-3 font-semibold">{Number(r.avgScorePercent || 0).toFixed(2)}%</td>
                        <td className="px-6 py-3">
                          <div className="flex flex-wrap gap-2">
                            {modes.map((m) => (
                              <span
                                key={m.mode}
                                className="px-2 py-1 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs"
                              >
                                {m.mode}: {m.count}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!loadingUsers && (!filteredRows || filteredRows.length === 0) ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-6 text-[var(--muted)]">
                        No users found.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 text-xs text-[var(--muted)]">
            Tip: Open a user profile to view detailed session logs.
            {" "}
            <Link to="/admin/users" className="underline">Manage users</Link>
          </div>
        </>
      )}
    </div>
  );
}
