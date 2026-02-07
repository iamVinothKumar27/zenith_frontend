import React, { useMemo, useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { IoMdMenu } from "react-icons/io";
import { motion, AnimatePresence } from "framer-motion";

import { auth, signOut } from "../../firebase.js";
import { useAuth } from "../../auth/AuthProvider.jsx";
import { useTheme } from "../../theme/ThemeProvider.jsx";

const MENU = [
  { id: 1, title: "Home", path: "/" },
  { id: 2, title: "Services", path: "/services" },
  { id: 3, title: "My Courses", path: "/my-courses", authOnly: true },
  { id: 4, title: "Notes", path: "/notes", authOnly: true },
  { id: 5, title: "Profile", path: "/profile", authOnly: true },
  { id: 6, title: "Contact", path: "/contact" },
];

function initials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  const a = parts[0]?.[0] || "U";
  const b = parts.length > 1 ? (parts[parts.length - 1]?.[0] || "") : "";
  return (a + b).toUpperCase();
}

function DrawerLink({ to, children, onClick }) {
  return (
    <NavLink
      to={to}
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

export default function Navbar() {
  const [open, setOpen] = useState(false);
  // If the remote avatar URL fails to load (404/CORS/etc.), show initials instead of a broken image.
  const [avatarError, setAvatarError] = useState(false);
  const [drawerAvatarError, setDrawerAvatarError] = useState(false);
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const displayName = useMemo(() => {
    return (
      profile?.name ||
      user?.displayName ||
      (user?.email ? user.email.split("@")[0] : "")
    );
  }, [profile?.name, user?.displayName, user?.email]);

  const avatarUrl =
    profile?.photoLocalURL || profile?.photoURL || user?.photoURL || "";

  // When the user/profile changes, clear previous image error flags.
  useEffect(() => {
    setAvatarError(false);
    setDrawerAvatarError(false);
  }, [avatarUrl]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setOpen(false);
      navigate("/");
    } catch (e) {
      console.error(e);
    }
  };

  const visibleMenu = MENU.filter((m) => !m.authOnly || !!user);

  return (
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

          <Link to="/" className="font-bold text-xl tracking-tight">
            Zenith
          </Link>
        </div>

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

          {user ? (
            <>
              <button
                onClick={() => navigate("/profile")}
                className="flex items-center gap-2 px-3 py-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:opacity-90"
                title="Profile"
              >
                {/* Always show avatar on all screen sizes; keep the name hidden on very small screens */}
                {avatarUrl && !avatarError ? (
                  <img
                    src={avatarUrl}
                    alt="profile"
                    className="w-7 h-7 rounded-full object-cover shrink-0"
                    onError={() => setAvatarError(true)}
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
                onClick={handleLogout}
                className="px-3 py-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-2)] text-white text-sm font-semibold"
              >
                Logout
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm font-semibold"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="px-3 py-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-2)] text-white text-sm font-semibold"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Drawer */}
      <AnimatePresence>
        {open && (
          <>
            {/* Overlay */}
            <motion.div
              className="fixed inset-0 bg-black/40 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />

            {/* Panel */}
            <motion.aside
              className="fixed top-0 left-0 h-full w-[300px] max-w-[85vw] z-50 bg-[var(--card)] border-r border-[var(--border)] shadow-2xl"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", stiffness: 260, damping: 25 }}
              role="dialog"
              aria-label="Menu"
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
                  {avatarUrl && !drawerAvatarError ? (
                    <img
                      src={avatarUrl}
                      alt="profile"
                      className="w-12 h-12 rounded-full object-cover shrink-0"
                      onError={() => setDrawerAvatarError(true)}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[var(--accent)] text-white font-bold grid place-items-center shrink-0">
                      {initials(displayName)}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="font-semibold truncate">
                      {displayName || "Guest"}
                    </div>
                    <div className="text-xs text-[var(--muted)] truncate">
                      {user?.email || ""}
                    </div>
                  </div>
                </div>
              </div>

              {/* Links */}
              <nav className="px-4 flex flex-col gap-1">
                {visibleMenu.map((m) => (
                  <DrawerLink key={m.id} to={m.path} onClick={() => setOpen(false)}>
                    {m.title}
                  </DrawerLink>
                ))}
              </nav>

              {/* Bottom Logout */}
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[var(--border)]">
                {user ? (
                  <button
                    onClick={handleLogout}
                    className="w-full py-3 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-2)] text-white font-semibold"
                  >
                    Logout
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <Link
                      to="/login"
                      onClick={() => setOpen(false)}
                      className="flex-1 text-center py-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] font-semibold"
                    >
                      Login
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setOpen(false)}
                      className="flex-1 text-center py-3 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-2)] text-white font-semibold"
                    >
                      Sign up
                    </Link>
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
