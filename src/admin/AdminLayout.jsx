import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase.js";
import { useAuth } from "../auth/AuthProvider.jsx";
import { useTheme } from "../theme/ThemeProvider.jsx";

function LinkItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-3 py-2 rounded-xl text-sm font-medium transition ${
          isActive
            ? "bg-[var(--accent)] text-white"
            : "text-[var(--muted)] hover:bg-[var(--card)]"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export default function AdminLayout() {
  const { profile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const doLogout = async () => {
    try {
      await signOut(auth);
    } finally {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
      <header className="sticky top-0 z-20 bg-[var(--card)]/90 backdrop-blur border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[var(--accent)] text-white grid place-items-center font-bold">Z</div>
            <div className="leading-tight">
              <div className="font-semibold text-[var(--text)]">Zenith Admin</div>
              <div className="text-xs text-[var(--muted)]">{profile?.email || ""}</div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            <LinkItem to="/admin">Overview</LinkItem>
            <LinkItem to="/admin/users">Users</LinkItem>
            <LinkItem to="/admin/courses">Courses Studying</LinkItem>
            <LinkItem to="/admin/progress">Course Progress</LinkItem>
            <LinkItem to="/admin/quizzes">Quiz Performance</LinkItem>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:opacity-90 grid place-items-center"
              title={theme === "dark" ? "Switch to Light" : "Switch to Dark"}
              aria-label="Toggle theme"
            >
              <span className="text-lg">{theme === "dark" ? "☀️" : "🌙"}</span>
            </button>
            <button
              onClick={() => navigate("/")}
              className="hidden sm:inline-flex px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:opacity-90 text-sm"
            >
              Back to Site
            </button>
            <button
              onClick={doLogout}
              className="px-3 py-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-2)] text-white text-sm"
            >
              Logout
            </button>
          </div>
        </div>

        {/* mobile nav */}
        <div className="md:hidden border-t border-[var(--border)] bg-[var(--card)]">
          <div className="max-w-6xl mx-auto px-4 py-2 flex flex-wrap gap-2">
            <LinkItem to="/admin">Overview</LinkItem>
            <LinkItem to="/admin/users">Users</LinkItem>
            <LinkItem to="/admin/courses">Courses</LinkItem>
            <LinkItem to="/admin/progress">Progress</LinkItem>
            <LinkItem to="/admin/quizzes">Quizzes</LinkItem>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-6xl mx-auto px-4 py-6 text-sm text-[var(--muted)] flex items-center justify-between">
          <div>© {new Date().getFullYear()} Zenith Admin</div>
          <div className="hidden sm:block">Manage users, courses & analytics</div>
        </div>
      </footer>
    </div>
  );
}
