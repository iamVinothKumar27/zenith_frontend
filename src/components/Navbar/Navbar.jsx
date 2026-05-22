import React, { useMemo, useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, X, ChevronDown, BookOpen, LogOut, User,
  FileText, TestTube, Cpu, LayoutDashboard, Home, Wrench,
} from "lucide-react";

import { auth, signOut } from "../../firebase.js";
import { useAuth } from "../../auth/AuthProvider.jsx";
import { useTheme } from "../../theme/ThemeProvider.jsx";
import { getProfilePhotoCandidates } from "../../utils/profilePhoto.js";

const NAV_LINKS = [
  { title: "Home", path: "/", icon: Home },
  { title: "Services", path: "/services", icon: Wrench },
];
const USER_LINKS = [
  { title: "My Courses", path: "/my-courses", icon: BookOpen },
  { title: "Notes", path: "/notes", icon: FileText },
  { title: "My Tests", path: "/my-tests", icon: TestTube },
  { title: "ATS Intelligence", path: "/resume-rank", icon: Cpu },
  { title: "Contact", path: "/contact", icon: LayoutDashboard },
];

function initials(name = "") {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/* Avatar component with Google-safe referrerPolicy */
function Avatar({ src, name, size = "w-8 h-8", textSize = "text-xs", onError }) {
  const [broken, setBroken] = useState(false);

  useEffect(() => { setBroken(false); }, [src]);

  if (src && !broken) {
    return (
      <img
        src={src}
        alt={name || "Profile"}
        className={`${size} rounded-full object-cover shrink-0 ring-2 ring-[var(--accent-border)]`}
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
      aria-label={`Avatar for ${name}`}
    >
      {initials(name)}
    </div>
  );
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [avatarIdx, setAvatarIdx] = useState(0);
  const dropdownRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();
  const { theme, toggleTheme } = useTheme();

  /* Full display name — show entire string, not truncated */
  const displayName = useMemo(() => {
    const n = profile?.name || user?.displayName || (user?.email ? user.email.split("@")[0] : "");
    return String(n || "").trim();
  }, [profile?.name, user?.displayName, user?.email]);

  const avatarCandidates = useMemo(
    () => getProfilePhotoCandidates(profile, user),
    [profile, user]
  );
  const avatarUrl = avatarCandidates[avatarIdx] || "";

  useEffect(() => { setAvatarIdx(0); }, [avatarCandidates.join("|")]);

  /* Scroll shadow */
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 6);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  /* Close dropdown on outside click */
  useEffect(() => {
    const fn = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  /* Close everything on route change */
  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try { await signOut(auth); } catch {}
    navigate("/");
  };

  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-all duration-300 bg-[var(--nav)] border-b border-[var(--border)] ${
          scrolled ? "shadow-[0_2px_16px_rgba(0,0,0,0.08)]" : ""
        }`}
        style={{ backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* ── Logo ── */}
          <div className="flex items-center gap-6 shrink-0">
            <Link to="/" className="flex items-center gap-2.5 group" aria-label="Zenith home">
              <div
                className="w-8 h-8 rounded-xl grid place-items-center text-white text-sm font-extrabold shrink-0 shadow-sm group-hover:scale-105 transition-transform"
                style={{ background: "var(--grad)" }}
              >
                Z
              </div>
              <span className="text-[17px] font-extrabold tracking-tight text-[var(--text)] group-hover:text-[var(--accent)] transition-colors hidden sm:block">
                Zenith
              </span>
            </Link>

            {/* Desktop nav links */}
            <nav className="hidden lg:flex items-center gap-0.5">
              {NAV_LINKS.map((l) => (
                <NavLink
                  key={l.path}
                  to={l.path}
                  end={l.path === "/"}
                  className={({ isActive }) =>
                    `px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "text-[var(--accent)] bg-[var(--accent-light)]"
                        : "text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]"
                    }`
                  }
                >
                  {l.title}
                </NavLink>
              ))}
              {user &&
                USER_LINKS.slice(0, 4).map((l) => (
                  <NavLink
                    key={l.path}
                    to={l.path}
                    className={({ isActive }) =>
                      `px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? "text-[var(--accent)] bg-[var(--accent-light)]"
                          : "text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]"
                      }`
                    }
                  >
                    {l.title}
                  </NavLink>
                ))}
            </nav>
          </div>

          {/* ── Right controls ── */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--surface)] grid place-items-center text-[var(--muted)] hover:text-[var(--text)] transition-all"
              title={theme === "dark" ? "Switch to Light" : "Switch to Dark"}
            >
              <span className="text-base leading-none">{theme === "dark" ? "☀️" : "🌙"}</span>
            </button>

            {user ? (
              /* ── Profile dropdown ── */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--surface)] transition-all"
                  aria-label="Account menu"
                  aria-expanded={dropdownOpen}
                >
                  <Avatar
                    src={avatarUrl}
                    name={displayName}
                    size="w-7 h-7"
                    textSize="text-[10px]"
                    onError={() =>
                      setAvatarIdx((i) =>
                        avatarCandidates.length > 1
                          ? Math.min(i + 1, avatarCandidates.length - 1)
                          : 0
                      )
                    }
                  />
                  {/* Full name — no truncate, flex shrinks if needed */}
                  <span className="hidden sm:block text-sm font-semibold text-[var(--text)] max-w-[200px] truncate" title={displayName}>
                    {displayName || "Account"}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-[var(--muted)] transition-transform duration-200 ${
                      dropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.97 }}
                      transition={{ duration: 0.13 }}
                      className="absolute right-0 top-full mt-2 w-60 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-xl overflow-hidden z-50"
                      style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.13)" }}
                    >
                      {/* User info */}
                      <div className="flex items-center gap-3 p-3 border-b border-[var(--border)]">
                        <Avatar
                          src={avatarUrl}
                          name={displayName}
                          size="w-10 h-10"
                          textSize="text-sm"
                          onError={() =>
                            setAvatarIdx((i) =>
                              avatarCandidates.length > 1
                                ? Math.min(i + 1, avatarCandidates.length - 1)
                                : 0
                            )
                          }
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[var(--text)] truncate">{displayName || "User"}</div>
                          <div className="text-xs text-[var(--muted)] truncate">{user.email}</div>
                        </div>
                      </div>

                      {/* Menu items */}
                      <div className="p-1.5 flex flex-col">
                        {[
                          { label: "Profile", path: "/profile", icon: User },
                          { label: "My Courses", path: "/my-courses", icon: BookOpen },
                          { label: "Notes", path: "/notes", icon: FileText },
                          { label: "My Tests", path: "/my-tests", icon: TestTube },
                        ].map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-all duration-150"
                          >
                            <item.icon className="w-4 h-4 shrink-0" />
                            {item.label}
                          </Link>
                        ))}
                        <div className="h-px bg-[var(--border)] my-1" />
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-150"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              /* ── Auth buttons ── */
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface)] transition-all"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-sm hover:shadow-md hover:-translate-y-px transition-all"
                  style={{ background: "var(--grad)" }}
                >
                  Get started
                </Link>
              </div>
            )}

            {/* Hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden w-9 h-9 rounded-xl border border-[var(--border)] bg-[var(--card)] grid place-items-center text-[var(--muted)] hover:text-[var(--text)] transition-all"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 h-full w-80 max-w-[90vw] z-50 border-r border-[var(--border)] flex flex-col"
              style={{ background: "var(--card)" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                <Link to="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                  <div
                    className="w-8 h-8 rounded-xl grid place-items-center text-white text-sm font-bold"
                    style={{ background: "var(--grad)" }}
                  >
                    Z
                  </div>
                  <span className="text-lg font-bold text-[var(--text)]">Zenith</span>
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="w-9 h-9 rounded-xl border border-[var(--border)] bg-[var(--surface)] grid place-items-center text-[var(--muted)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User card */}
              {user && (
                <div className="m-3 p-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] flex items-center gap-3">
                  <Avatar
                    src={avatarUrl}
                    name={displayName}
                    size="w-11 h-11"
                    textSize="text-sm"
                    onError={() =>
                      setAvatarIdx((i) =>
                        avatarCandidates.length > 1
                          ? Math.min(i + 1, avatarCandidates.length - 1)
                          : 0
                      )
                    }
                  />
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-[var(--text)] leading-tight">{displayName || "User"}</div>
                    <div className="text-xs text-[var(--muted)] truncate mt-0.5">{user.email}</div>
                  </div>
                </div>
              )}

              {/* Nav links */}
              <nav className="px-3 py-2 flex-1 overflow-y-auto flex flex-col gap-0.5">
                {[...NAV_LINKS, ...(user ? USER_LINKS : [])].map((l) => (
                  <NavLink
                    key={l.path}
                    to={l.path}
                    end={l.path === "/"}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                        isActive
                          ? "text-[var(--accent)] bg-[var(--accent-light)]"
                          : "text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]"
                      }`
                    }
                  >
                    {l.icon && <l.icon className="w-4 h-4 shrink-0" />}
                    {l.title}
                  </NavLink>
                ))}
              </nav>

              {/* Bottom auth */}
              <div className="p-4 border-t border-[var(--border)]">
                {user ? (
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-red-500 border border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/20 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="flex-1 text-center py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm font-semibold text-[var(--text)]"
                    >
                      Log in
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setMobileOpen(false)}
                      className="flex-1 text-center py-2.5 rounded-xl text-sm font-semibold text-white"
                      style={{ background: "var(--grad)" }}
                    >
                      Get started
                    </Link>
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
