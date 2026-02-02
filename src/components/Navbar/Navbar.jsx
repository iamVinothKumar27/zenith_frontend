import React, { useState } from "react";
import { IoMdMenu } from "react-icons/io";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { auth, signOut } from "../../firebase.js";
import { useAuth } from "../../auth/AuthProvider.jsx";
import { useTheme } from "../../theme/ThemeProvider.jsx";


const NavbarMenu = [
  { id: 1, title: "Home", path: "/" },
  { id: 2, title: "Services", path: "/services" },
  { id: 3, title: "My Courses", path: "/my-courses", authOnly: true },
  { id: 4, title: "Notes", path: "/notes", authOnly: true },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const displayName =
    profile?.name ||
    user?.displayName ||
    (user?.email ? user.email.split("@")[0] : "");

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <nav className="bg-[var(--nav)] text-[var(--text)] border-b border-[var(--divider)]">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className="container py-6 flex justify-between items-center"
      >
        <div className="flex items-center gap-3">
          <h1 className="font-bold text-2xl text-[var(--text)]">Zenith</h1>
        </div>

        <div className="hidden md:flex items-center gap-4">
          {NavbarMenu.filter((m) => !m.authOnly || !!user).map((m) =>
            m.path.startsWith("/#") ? (
              <a key={m.id} href={m.path} className="text-[var(--muted)] hover:text-[var(--text)] font-medium">
                {m.title}
              </a>
            ) : (
              <Link key={m.id} to={m.path} className="text-[var(--muted)] hover:text-[var(--text)] font-medium">
                {m.title}
              </Link>
            )
          )}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:opacity-90 grid place-items-center"
            title={theme === "dark" ? "Switch to Light" : "Switch to Dark"}
            aria-label="Toggle theme"
          >
            <span className="text-lg">{theme === "dark" ? "☀️" : "🌙"}</span>
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-[var(--muted)]">Hi, <b className="text-[var(--text)]">{displayName}</b></span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white font-semibold hover:bg-[var(--accent-2)]"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="px-4 py-2 rounded-xl border border-[var(--border)] font-semibold bg-[var(--card)]">
                Login
              </Link>
              <Link to="/signup" className="px-4 py-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-2)] text-white font-semibold">
                Sign up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-xl border border-[var(--border)] bg-[var(--card)] grid place-items-center"
            title={theme === "dark" ? "Switch to Light" : "Switch to Dark"}
          >
            <span className="text-lg">{theme === "dark" ? "☀️" : "🌙"}</span>
          </button>
          <button onClick={() => setOpen((s) => !s)} className="text-3xl">
            <IoMdMenu />
          </button>
        </div>
      </motion.div>

      {open && (
        <div className="md:hidden bg-[var(--card)] border border-[var(--border)] shadow-lg rounded-2xl mx-4 p-4">
          <div className="flex flex-col gap-3">
            {NavbarMenu.map((m) => (
              <a key={m.id} href={m.path} className="text-[var(--muted)] hover:text-[var(--text)] font-medium" onClick={() => setOpen(false)}>
                {m.title}
              </a>
            ))}

            {user ? (
              <>
                <div className="text-sm text-[var(--muted)]">Hi, <b className="text-[var(--text)]">{displayName}</b></div>
                <button onClick={handleLogout} className="px-4 py-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-2)] text-white font-semibold">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl border border-[var(--border)] font-semibold bg-[var(--card)]">
                  Login
                </Link>
                <Link to="/signup" onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-2)] text-white font-semibold">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
