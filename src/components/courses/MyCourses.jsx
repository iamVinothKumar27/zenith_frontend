import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Play, RotateCcw, PauseCircle, Trash2, ChevronRight, ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "../../auth/AuthProvider.jsx";

const STATUS_CONFIG = {
  Completed: { label: "Completed", cls: "badge-green" },
  "In Progress": { label: "In Progress", cls: "badge-indigo" },
  "On Hold": { label: "On Hold", cls: "bg-amber-50 text-amber-700 border border-amber-200" },
  "Not Started": { label: "Not Started", cls: "bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)]" },
};

const BUTTON_CONFIG = {
  Completed: { label: "Restart", icon: RotateCcw, variant: "secondary" },
  "In Progress": { label: "Resume", icon: Play, variant: "primary" },
  "On Hold": { label: "On Hold", icon: PauseCircle, variant: "disabled" },
  "Not Started": { label: "Start", icon: Play, variant: "primary" },
};

function ProgressRing({ percent = 0, size = 72, stroke = 5 }) {
  const p = Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0));
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (p / 100) * circ;
  const color = p >= 100 ? "#10B981" : p > 0 ? "var(--accent)" : "var(--border)";

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-[var(--text)]">{p}%</span>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-2xl bg-[var(--surface)]" />
        <div className="flex-1">
          <div className="h-4 bg-[var(--surface)] rounded w-3/4 mb-2" />
          <div className="h-3 bg-[var(--surface)] rounded w-1/2" />
        </div>
        <div className="w-16 h-8 bg-[var(--surface)] rounded-xl" />
      </div>
    </div>
  );
}

export default function MyCourses() {
  const { token, apiBase } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [discontinuing, setDiscontinuing] = useState({});
  const navigate = useNavigate();

  const discontinueCourse = async (courseTitle) => {
    if (!token) return;
    const ok = window.confirm(`Discontinue "${courseTitle}"? This will remove the course and clear your progress.`);
    if (!ok) return;
    setDiscontinuing((prev) => ({ ...prev, [courseTitle]: true }));
    try {
      const res = await fetch(`${apiBase}/course/state/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ courseTitle }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data?.error || "Failed to discontinue course"); return; }
      setItems((prev) => prev.filter((x) => x.courseTitle !== courseTitle));
    } catch {
      alert("Network error while discontinuing course");
    } finally {
      setDiscontinuing((prev) => { const n = { ...prev }; delete n[courseTitle]; return n; });
    }
  };

  useEffect(() => {
    const run = async () => {
      if (!token) { setLoading(false); setItems([]); return; }
      setLoading(true);
      try {
        const res = await fetch(`${apiBase}/courses/list`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (res.ok) setItems(data.items || []);
      } catch {}
      setLoading(false);
    };
    run();
  }, [token, apiBase]);

  const goCourse = (c, mode) => {
    navigate(`/course/${encodeURIComponent(c.courseTitle)}/videos`, {
      state: { title: c.displayTitle || c.courseTitle, courseKey: c.courseTitle, mode },
    });
  };

  const getStatus = (c) => {
    if (c.held) return "On Hold";
    const qpct = c.totalVideos ? Math.round((Number(c.passedQuizzes || 0) / Number(c.totalVideos)) * 100) : 0;
    if (qpct >= 100) return "Completed";
    if (qpct > 0) return "In Progress";
    return "Not Started";
  };

  const empty = !loading && items.length === 0;
  const completedCount = items.filter(c => getStatus(c) === "Completed").length;
  const inProgressCount = items.filter(c => getStatus(c) === "In Progress").length;

  return (
    <div className="min-h-[calc(100vh-65px)] bg-[var(--bg)]">
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate("/")}
            className="w-10 h-10 rounded-xl border border-[var(--border)] bg-[var(--card)] grid place-items-center text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-all shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text)]">My Courses</h1>
            <p className="text-sm text-[var(--muted)]">Resume where you left off — progress is saved automatically.</p>
          </div>
        </div>

        {/* Stats bar */}
        {!loading && items.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { label: "Enrolled", value: items.length, icon: BookOpen, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
              { label: "In Progress", value: inProgressCount, icon: Play, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
              { label: "Completed", value: completedCount, icon: RotateCcw, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
            ].map((s, i) => (
              <div key={i} className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${s.bg} grid place-items-center shrink-0`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div>
                  <div className="text-xl font-bold text-[var(--text)]">{s.value}</div>
                  <div className="text-xs text-[var(--muted)]">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Empty state */}
        {empty && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-12 text-center"
          >
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 grid place-items-center"
              style={{ background: "var(--accent-light)" }}>
              <BookOpen className="w-7 h-7" style={{ color: "var(--accent)" }} />
            </div>
            <h3 className="text-lg font-semibold text-[var(--text)] mb-2">No courses yet</h3>
            <p className="text-sm text-[var(--muted)] mb-6 max-w-xs mx-auto">
              Start a course from the home page and it will appear here with your progress.
            </p>
            <button
              onClick={() => navigate("/#courses")}
              className="primary-btn gap-2 group"
            >
              Browse Courses
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        )}

        {/* Course list */}
        {!loading && !empty && (
          <div className="space-y-4">
            {items.map((c, idx) => {
              const totalQuizzes = Number(c.totalVideos || 0);
              const passedQuizzes = Number(c.passedQuizzes || 0);
              const qpct = totalQuizzes ? Math.round((passedQuizzes / totalQuizzes) * 100) : 0;
              const status = getStatus(c);
              const statusCfg = STATUS_CONFIG[status];
              const btnCfg = BUTTON_CONFIG[status];
              const mode = status === "Completed" ? "restart" : status === "In Progress" ? "resume" : "start";
              const isDiscontinuing = !!discontinuing[c.courseTitle];

              return (
                <motion.div
                  key={c.courseTitle}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: idx * 0.06 }}
                  className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-5 flex flex-col sm:flex-row sm:items-center gap-5 hover:border-[var(--accent-border)] hover:shadow-[0_4px_20px_rgba(79,70,229,0.07)] transition-all duration-300"
                >
                  {/* Icon */}
                  <div className="w-14 h-14 rounded-2xl grid place-items-center shrink-0"
                    style={{ background: "var(--accent-light)" }}>
                    <BookOpen className="w-6 h-6" style={{ color: "var(--accent)" }} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-[var(--text)] truncate">
                        {c.displayTitle || c.courseTitle}
                      </h3>
                      <span className={`badge text-xs ${statusCfg.cls}`}>{statusCfg.label}</span>
                    </div>
                    <p className="text-sm text-[var(--muted)]">
                      {passedQuizzes} / {totalQuizzes} quizzes passed
                    </p>
                    {/* Progress bar */}
                    <div className="mt-2 h-1.5 rounded-full bg-[var(--border)] overflow-hidden max-w-xs">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${qpct}%`,
                          background: qpct >= 100 ? "#10B981" : "var(--grad)",
                        }}
                      />
                    </div>
                    {c.held && (
                      <p className="text-xs text-amber-600 mt-1.5">
                        This course is on hold by admin. Access is temporarily restricted.
                      </p>
                    )}
                  </div>

                  {/* Progress ring */}
                  <ProgressRing percent={qpct} />

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => discontinueCourse(c.courseTitle)}
                      disabled={isDiscontinuing}
                      className="w-9 h-9 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 dark:border-red-900 dark:hover:bg-red-900/20 grid place-items-center transition-all disabled:opacity-50"
                      title="Discontinue course"
                    >
                      {isDiscontinuing
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4" />
                      }
                    </button>

                    <button
                      onClick={() => goCourse(c, mode)}
                      disabled={c.held}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        c.held
                          ? "bg-[var(--surface)] text-[var(--muted)] cursor-not-allowed"
                          : status === "Completed"
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md"
                          : "text-white hover:shadow-md hover:brightness-110"
                      }`}
                      style={!c.held && status !== "Completed" ? { background: "var(--grad)" } : {}}
                    >
                      <btnCfg.icon className="w-3.5 h-3.5" />
                      {btnCfg.label}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
