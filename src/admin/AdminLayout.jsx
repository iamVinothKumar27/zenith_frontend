import React, { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import { IoMdMenu } from "react-icons/io";

import { auth } from "../firebase.js";
import { useAuth } from "../auth/AuthProvider.jsx";
import { useTheme } from "../theme/ThemeProvider.jsx";
import { getProfilePhotoCandidates } from "../utils/profilePhoto.js";

const ADMIN_MENU = [
  { title: "Overview", path: "/admin" },
  { title: "Users", path: "/admin/users" },
  { title: "Courses Studying", path: "/admin/courses-studying" },
  { title: "Course Progress", path: "/admin/course-progress" },
  { title: "Quiz Performance", path: "/admin/quiz-performance" },
  { title: "Mock Test Analytics", path: "/admin/mocktest-analytics" },
  { title: "Practice Test Analytics", path: "/admin/practicetest-analytics" },
];

function initials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  const a = parts[0]?.[0] || "U";
  const b = parts.length > 1 ? (parts[parts.length - 1]?.[0] || "") : "";
  return (a + b).toUpperCase();
}

function DrawerLink({ to, children, onClick }) {
  // ✅ Ensure "/admin" (overview) is not highlighted for all subroutes
  const isOverview = to === "/admin";
  return (
    <NavLink
      to={to}
      end={isOverview}
      onClick={onClick}
      className={({ isActive }) =>
        `block px-3 py-2 rounded-xl text-sm font-medium transition ${
          isActive
            ? "bg-[var(--accent)] text-white"
            : "text-[var(--text)] hover:bg-[var(--bg)]"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

function TopLink({ to, children }) {
  const isOverview = to === "/admin";
  return (
    <NavLink
      to={to}
      end={isOverview}
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
  const [open, setOpen] = useState(false);
  const [avatarIdx, setAvatarIdx] = useState(0);
  const [drawerAvatarIdx, setDrawerAvatarIdx] = useState(0);

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

  const avatarCandidates = useMemo(() => getProfilePhotoCandidates(profile, user), [profile, user]);

  const avatarUrl = avatarCandidates[avatarIdx] || "";
  const drawerAvatarUrl = avatarCandidates[drawerAvatarIdx] || "";

  useEffect(() => {
    setAvatarIdx(0);
    setDrawerAvatarIdx(0);
  }, [avatarCandidates.join("|")]);

  const doLogout = async () => {
    try {
      await signOut(auth);
    } finally {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
      <header className="sticky top-0 z-30 bg-[var(--nav)] text-[var(--text)] border-b border-[var(--divider)]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Left: Hamburger + Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen(true)}
              className="w-10 h-10 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:opacity-90 grid place-items-center"
              aria-label="Open menu"
              title="Menu"
            >
              <IoMdMenu className="text-2xl" />
            </button>

            <div className="leading-tight">
              <div className="font-bold text-xl tracking-tight">Zenith Admin</div>
              <div className="text-xs text-[var(--muted)] truncate max-w-[220px]">{profile?.email || user?.email || ""}</div>
            </div>
          </div>

          {/* Center navigation removed (Requirement): use hamburger side panel for navigation */}
          <div className="hidden lg:block" />

          {/* Right: Theme + Profile pill + Logout */}
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
              onClick={() => navigate("/profile")}
              className="flex items-center gap-2 px-3 py-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:opacity-90"
              title="Profile"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="profile"
                  className="w-7 h-7 rounded-full object-cover shrink-0"
                  onError={() =>
                    setAvatarIdx((i) =>
                      avatarCandidates.length
                        ? Math.min(i + 1, avatarCandidates.length - 1)
                        : 0
                    )
                  }
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[var(--accent)] text-white text-xs font-bold grid place-items-center shrink-0">
                  {initials(displayName)}
                </div>
              )}
              <div className="hidden sm:block text-sm font-semibold max-w-[160px] truncate">
                {displayName || "User"}
              </div>
            </button>

            <button
              onClick={doLogout}
              className="px-3 py-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-2)] text-white text-sm font-semibold"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Drawer */}
        <AnimatePresence>
          {open && (
            <>
              <motion.div
                className="fixed inset-0 bg-black/40 z-40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setOpen(false)}
              />

              <motion.aside
                className="fixed top-0 left-0 h-full w-[300px] max-w-[85vw] z-50 bg-[var(--card)] border-r border-[var(--border)] shadow-2xl"
                initial={{ x: -320 }}
                animate={{ x: 0 }}
                exit={{ x: -320 }}
                transition={{ type: "spring", stiffness: 260, damping: 25 }}
                role="dialog"
                aria-label="Admin menu"
              >
                <div className="p-4 flex items-center justify-between">
                  <div className="font-semibold">Menu</div>
                  <button
                    onClick={() => setOpen(false)}
                    className="w-9 h-9 rounded-xl border border-[var(--border)] bg-[var(--bg)] hover:opacity-90 grid place-items-center"
                    aria-label="Close menu"
                  >
                    ✕
                  </button>
                </div>

                {/* User card */}
                <div className="px-4 pb-3">
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-3 flex items-center gap-3">
                    {drawerAvatarUrl ? (
                      <img
                        src={drawerAvatarUrl}
                        alt="profile"
                        className="w-12 h-12 rounded-full object-cover shrink-0"
                        onError={() =>
                          setDrawerAvatarIdx((i) =>
                            avatarCandidates.length
                              ? Math.min(i + 1, avatarCandidates.length - 1)
                              : 0
                          )
                        }
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[var(--accent)] text-white text-sm font-bold grid place-items-center shrink-0">
                        {initials(displayName)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{displayName || "User"}</div>
                      <div className="text-xs text-[var(--muted)] truncate">{profile?.email || user?.email || ""}</div>
                      {/* Requirement: remove Profile / Back to Site buttons inside drawer profile card */}
                    </div>
                  </div>
                </div>

                <div className="px-4 pb-4">
                  <div className="text-xs text-[var(--muted)] px-1 mb-2">Admin</div>
                  <div className="space-y-1">
                    {ADMIN_MENU.map((m) => (
                      <DrawerLink
                        key={m.path}
                        to={m.path}
                        onClick={() => setOpen(false)}
                      >
                        {m.title}
                      </DrawerLink>
                    ))}
                  </div>

                  <div className="mt-4">
                    <button
                      onClick={doLogout}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-2)] text-white text-sm font-semibold"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
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
