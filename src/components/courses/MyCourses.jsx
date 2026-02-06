import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider.jsx";

const Badge = ({ status }) => {
  const cls =
    status === "Completed"
      ? "bg-green-100 text-green-700 border-green-200"
      : status === "In Progress"
      ? "bg-[var(--surface)] text-blue-700 border-blue-200"
      : status === "On Hold"
      ? "bg-amber-100 text-amber-700 border-amber-200"
      : "bg-[var(--surface)] text-[var(--muted)] border-[var(--border)]";

  return (
    <span className={`inline-flex items-center px-2 py-1 text-xs border rounded-full ${cls}`}>
      {status}
    </span>
  );
};

const QuizPie = ({ percent = 0 }) => {
  const p = Number.isFinite(percent) ? Math.max(0, Math.min(100, percent)) : 0;
  const deg = p * 3.6;
  return (
    <div className="relative w-20 h-20">
      <div
        className="w-20 h-20 rounded-full"
        style={{
          background: `conic-gradient(#16a34a ${deg}deg, #e5e7eb 0deg)`,
        }}
        aria-label={`Quiz completion ${p}%`}
        role="img"
      />
      <div className="absolute inset-2 bg-[var(--card)] rounded-full" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-sm font-semibold text-[var(--text)]">{p}%</div>
      </div>
    </div>
  );
};

const Spinner = ({ className = "" }) => (
  <svg
    className={`animate-spin ${className}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
    />
  </svg>
);

export default function MyCourses() {
  const { token, apiBase } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ NEW: per-course loading for Discontinue button
  const [discontinuing, setDiscontinuing] = useState({}); // { [courseTitle]: true }

  const navigate = useNavigate();

  const discontinueCourse = async (courseTitle) => {
    if (!token) return;

    const ok = window.confirm(
      `Discontinue "${courseTitle}"? This will remove the course from your list and clear saved progress.`
    );
    if (!ok) return;

    // ✅ show loading only for this course
    setDiscontinuing((prev) => ({ ...(prev || {}), [courseTitle]: true }));

    try {
      const res = await fetch(`${apiBase}/course/state/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ courseTitle }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.error || "Failed to discontinue course");
        return;
      }

      setItems((prev) => (prev || []).filter((x) => x.courseTitle !== courseTitle));
    } catch (e) {
      alert("Network error while discontinuing course");
    } finally {
      setDiscontinuing((prev) => {
        const next = { ...(prev || {}) };
        delete next[courseTitle];
        return next;
      });
    }
  };

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setLoading(false);
        setItems([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`${apiBase}/courses/list`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setItems(data.items || []);
      } catch (e) {
        // optional: console.error(e);
      }
      setLoading(false);
    };
    run();
  }, [token, apiBase]);

  const empty = !loading && (!items || items.length === 0);

  const goCourse = (c, mode) => {
    navigate(`/course/${encodeURIComponent(c.courseTitle)}/videos`, {
      state: {
        title: c.displayTitle || c.courseTitle,
        courseKey: c.courseTitle,
        mode,
      },
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">My Courses</h1>
          <p className="text-sm text-[var(--muted)]">
            Resume where you left off. Your progress is saved automatically.
          </p>
        </div>
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:opacity-90 text-sm"
        >
          Back to Home
        </button>
      </div>

      <div className="bg-[var(--card)] text-[var(--text)] rounded-2xl border border-[var(--border)] shadow-sm">
        {loading && <div className="p-6 text-[var(--muted)]">Loading your courses…</div>}

        {empty && (
          <div className="p-6">
            <div className="text-[var(--text)] font-medium mb-1">No courses yet</div>
            <div className="text-sm text-[var(--muted)]">
              Start a course from Home, and it will appear here with progress.
            </div>
          </div>
        )}

        {!loading && !empty && (
          <div className="divide-y">
            {items.map((c) => {
              const totalQuizzes = Number(c.totalVideos || 0);
              const passedQuizzes = Number(c.passedQuizzes || 0);
              const qpct = totalQuizzes ? Math.round((passedQuizzes / totalQuizzes) * 100) : 0;

              const held = !!c.held;

              const status = held
                ? "On Hold"
                : qpct >= 100
                ? "Completed"
                : qpct > 0
                ? "In Progress"
                : "Not Started";

              const buttonText =
                status === "On Hold"
                  ? "On Hold"
                  : status === "Completed"
                  ? "Restart"
                  : status === "In Progress"
                  ? "Resume"
                  : "Start";

              // ✅ fix: status check for "In Progress" (not "Doing")
              const mode =
                status === "Completed" ? "restart" : status === "In Progress" ? "resume" : "start";

              const isDiscontinuing = !!discontinuing?.[c.courseTitle];

              return (
                <div
                  key={c.courseTitle}
                  className="p-6 flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="text-lg font-semibold text-[var(--text)]">
                        {c.displayTitle || c.courseTitle}
                      </div>
                      <Badge status={status} />
                    </div>

                    <div className="text-sm text-[var(--muted)] mt-1">
                      {passedQuizzes}/{totalQuizzes} quizzes passed • {qpct}%
                    </div>

                    {held && (
                      <div className="text-xs text-amber-700 mt-2">
                        This course is on hold by admin. You can’t access it right now.
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 justify-between sm:justify-end">
                    <QuizPie percent={qpct} />

                    <button
                      onClick={() => discontinueCourse(c.courseTitle)}
                      disabled={isDiscontinuing}
                      className={`px-4 py-2 rounded-xl text-sm border ${
                        isDiscontinuing
                          ? "border-red-500/30 text-red-600/70 cursor-not-allowed"
                          : "border-red-500/40 text-red-600 hover:bg-red-500/10"
                      } inline-flex items-center gap-2`}
                      title="Remove this course and clear your progress"
                    >
                      {isDiscontinuing && <Spinner className="w-4 h-4" />}
                      {isDiscontinuing ? "Discontinuing..." : "Discontinue"}
                    </button>

                    <button
                      onClick={() => goCourse(c, mode)}
                      disabled={held}
                      className={`px-4 py-2 rounded-xl text-sm ${
                        held
                          ? "bg-[var(--border)] text-[var(--muted)] cursor-not-allowed"
                          : status === "Completed"
                          ? "bg-green-600 text-white hover:bg-green-700"
                          : "bg-[var(--accent)] text-white hover:brightness-95"
                      }`}
                    >
                      {buttonText}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
