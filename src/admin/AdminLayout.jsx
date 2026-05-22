import React, { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, BookOpen, TrendingUp,
  Award, BarChart2, Target, LogOut, Sun, Moon,
  Shield, Menu, X,
} from "lucide-react";

import { auth } from "../firebase.js";
import { useAuth } from "../auth/AuthProvider.jsx";
import { useTheme } from "../theme/ThemeProvider.jsx";
import { getProfilePhotoCandidates } from "../utils/profilePhoto.js";

const ADMIN_MENU = [
  { title: "Overview", path: "/admin", icon: LayoutDashboard },
  { title: "Users", path: "/admin/users", icon: Users },
  { title: "Courses Studying", path: "/admin/courses-studying", icon: BookOpen },
  { title: "Course Progress", path: "/admin/course-progress", icon: TrendingUp },
  { title: "Quiz Performance", path: "/admin/quiz-performance", icon: Award },
  { title: "Mock Test Analytics", path: "/admin/mocktest-analytics", icon: BarChart2 },
  { title: "Practice Test Analytics", path: "/admin/practicetest-analytics", icon: Target },
];

function initials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  const a = parts[0]?.[0] || "U";
  const b = parts.length > 1 ? (parts[parts.length - 1]?.[0] || "") : "";
  return (a + b).toUpperCase();
}

function Avatar({ src, name, size = "w-9 h-9", textSize = "text-xs", onError }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => { setBroken(false); }, [src]);
  if (src && !broken) {
    return (
      <img
        src={src}
        alt={name || "Profile"}
        className={`${size} rounded-full object-cover shrink-0`}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        onError={() => { setBroken(true); onError?.(); }}
      />
    );
  }
  return (
    <div
      className={`${size} rounded-full text-white font-bold grid place-items-center shrink-0 select-none ${textSize}`}
      style={{ background: "var(--grad)" }}
    >
      {initials(name)}
    </div>
  );
}

function SidebarLink({ to, icon: Icon, children, onClick }) {
  const isOverview = to === "/admin";
  return (
    <NavLink
      to={to}
      end={isOverview}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
          isActive
            ? "bg-[var(--accent)] text-white shadow-sm"
            : "text-[var(--text)] hover:bg-[var(--bg)]"
        }`
      }
    >
      {Icon ? <Icon size={16} className="shrink-0" /> : null}
      {children}
    </NavLink>
  );
}

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const [avatarIdx, setAvatarIdx] = useState(0);

  const { user, profile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const displayName = useMemo(() => {
    return (
      profile?.name ||
      user?.displayName ||
      (user?.email ? user.email.split("@")[0] : "")
    );
  }, [profile?.name, user?.displayName, user?.email]);

  const email = profile?.email || user?.email || "";
  const avatarCandidates = useMemo(() => getProfilePhotoCandidates(profile, user), [profile, user]);
  const avatarUrl = avatarCandidates[avatarIdx] || "";

  useEffect(() => {
    setAvatarIdx(0);
  }, [avatarCandidates.join("|")]);

  const doLogout = async () => {
    try {
      await signOut(auth);
    } finally {
      navigate("/");
    }
  };

  const brandBlock = (
    <div className="px-4 py-5 border-b border-[var(--border)]">
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "var(--grad)" }}
        >
          <Shield size={17} className="text-white" />
        </div>
        <div>
          <div className="font-bold text-[var(--text)] leading-tight">Zenith Admin</div>
          <div className="text-xs text-[var(--muted)]">Dashboard</div>
        </div>
      </div>
    </div>
  );

  const navBlock = (onLinkClick) => (
    <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
      {ADMIN_MENU.map((m) => (
        <SidebarLink key={m.path} to={m.path} icon={m.icon} onClick={onLinkClick}>
          {m.title}
        </SidebarLink>
      ))}
    </nav>
  );

  const userBlock = (
    <div className="p-3 border-t border-[var(--border)]">
      <div className="rounded-xl bg-[var(--bg)] p-3 flex items-center gap-3">
        <Avatar
          src={avatarUrl}
          name={displayName}
          size="w-9 h-9"
          onError={() => setAvatarIdx((i) => Math.min(i + 1, avatarCandidates.length - 1))}
        />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-[var(--text)] truncate">{displayName || "User"}</div>
          <div className="text-xs text-[var(--muted)] truncate">{email}</div>
        </div>
        <button
          onClick={doLogout}
          className="w-8 h-8 rounded-xl border border-[var(--border)] hover:bg-[var(--card)] grid place-items-center shrink-0"
          title="Logout"
        >
          <LogOut size={14} className="text-[var(--muted)]" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[var(--bg)] text-[var(--text)]">
      {/* Permanent sidebar — desktop only */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col fixed inset-y-0 left-0 z-20 bg-[var(--card)] border-r border-[var(--border)]">
        {brandBlock}
        {navBlock(undefined)}
        {userBlock}
      </aside>

      {/* Mobile drawer overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />

            <motion.aside
              className="fixed top-0 left-0 h-full w-64 z-50 bg-[var(--card)] border-r border-[var(--border)] shadow-2xl flex flex-col lg:hidden"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 260, damping: 25 }}
              role="dialog"
              aria-label="Admin menu"
            >
              <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--border)]">
                <div className="font-bold text-[var(--text)]">Menu</div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-xl border border-[var(--border)] hover:bg-[var(--bg)] grid place-items-center"
                  aria-label="Close menu"
                >
                  <X size={16} />
                </button>
              </div>
              {navBlock(() => setOpen(false))}
              {userBlock}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Page content */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-10 bg-[var(--nav)] border-b border-[var(--border)]">
          <div className="px-4 lg:px-6 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Hamburger — mobile only */}
              <button
                onClick={() => setOpen(true)}
                className="lg:hidden w-9 h-9 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:opacity-90 grid place-items-center"
                aria-label="Open menu"
              >
                <Menu size={18} />
              </button>

              {/* Mobile brand */}
              <div className="lg:hidden font-bold text-[var(--text)]">Zenith Admin</div>

              {/* Desktop: email breadcrumb */}
              <div className="hidden lg:block text-sm text-[var(--muted)] truncate max-w-xs">{email}</div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="w-9 h-9 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:opacity-90 grid place-items-center"
                title={theme === "dark" ? "Switch to Light" : "Switch to Dark"}
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              </button>

              <button
                onClick={() => navigate("/profile")}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:opacity-90"
                title="Profile"
              >
                <Avatar
                  src={avatarUrl}
                  name={displayName}
                  size="w-7 h-7"
                  textSize="text-[10px]"
                  onError={() => setAvatarIdx((i) => Math.min(i + 1, avatarCandidates.length - 1))}
                />
                <span className="hidden sm:block text-sm font-semibold max-w-[140px] truncate text-[var(--text)]">
                  {displayName || "User"}
                </span>
              </button>

              <button
                onClick={doLogout}
                className="px-3 py-1.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-2)] text-white text-sm font-semibold"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1">
          <Outlet />
        </main>

        <footer className="border-t border-[var(--border)] bg-[var(--card)]">
          <div className="px-4 lg:px-6 py-4 text-sm text-[var(--muted)] flex items-center justify-between">
            <div>© {new Date().getFullYear()} Zenith Admin</div>
            <div className="hidden sm:block">Manage users, courses &amp; analytics</div>
          </div>
        </footer>
      </div>
    </div>
  );
}
