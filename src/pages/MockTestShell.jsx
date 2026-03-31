import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LayoutGrid, Menu, Sun, Moon } from "lucide-react";
import { SessionRunner } from "./MockTest.jsx";
import { useTheme } from "../theme/ThemeProvider.jsx";
import { useAuth } from "../auth/AuthProvider.jsx"; // if you have it (used for name/photo)
import { getPreferredProfilePhoto } from "../utils/profilePhoto.js";

// ✅ Header matches main Navbar design
export default function MockTestShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const auth = typeof useAuth === "function" ? useAuth() : null;

  const [navOpen, setNavOpen] = useState(true);
  const [sectionsOpen, setSectionsOpen] = useState(true);

  const userName = (auth?.profile?.name || auth?.user?.displayName || auth?.user?.email || "User").toString().trim();
  const userPhoto = getPreferredProfilePhoto(auth?.profile, auth?.user) || null;

  const onExit = () => {
    const p = location.pathname || "";
    if (p.includes("/mock-test/") || p.includes("/practice-test/")) navigate("/my-tests");
    else navigate("/");
  };

  // When navigating here from History, browsers may preserve scroll position.
  // That breaks the LeetCode-like fixed viewport measurement (rect.top can become negative).
  // Always reset scroll to top on mount.
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    } catch {
      window.scrollTo(0, 0);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
      {/* ================= HEADER (Navbar-like) ================= */}
      <div className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-[1400px] mx-auto px-4 h-16 flex items-center justify-between">
          {/* Left */}
          <div className="flex items-center gap-3">
            {/* Menu button like screenshot */}
            <button
              onClick={() => setSectionsOpen((v) => !v)}
              className="h-10 w-10 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--hover)] transition flex items-center justify-center"
              title="Sections"
            >
              <Menu size={18} />
            </button>

            <div className="text-xl font-semibold tracking-tight">Zenith</div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            {/* optional nav grid button - keep if you want (can remove) */}
            <button
              onClick={() => setNavOpen((v) => !v)}
              className="h-10 w-10 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--hover)] transition flex items-center justify-center"
              title="Navigation"
            >
              <LayoutGrid size={18} />
            </button>

            {/* Theme toggle EXACT style */}
            <button
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to light" : "Switch to dark"}
              className="h-10 w-10 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--hover)] transition flex items-center justify-center"
            >
              {theme === "dark" ? (
                <Sun size={18} className="text-yellow-400" />
              ) : (
                <Moon size={18} className="text-yellow-500" />
              )}
            </button>

            {/* User pill EXACT like screenshot */}
            <div className="h-10 px-4 rounded-full border border-[var(--border)] bg-[var(--card)] flex items-center gap-3">
              <div className="h-7 w-7 rounded-full overflow-hidden border border-[var(--border)] bg-[var(--bg)] flex items-center justify-center">
                {userPhoto ? (
                  <img
                    src={userPhoto}
                    alt="User"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-xs font-semibold text-[var(--muted)]">
                    {String(userName || "U")
                      .trim()
                      .slice(0, 1)
                      .toUpperCase()}
                  </div>
                )}
              </div>
              <div className="text-sm font-semibold tracking-wide whitespace-nowrap">
                {userName}
              </div>
            </div>

            {/* Exit button styled like Logout in screenshot */}
            <button
              onClick={onExit}
              className="h-10 px-5 rounded-full bg-green-600 hover:bg-green-700 text-white font-semibold transition"
            >
              Exit
            </button>
          </div>
        </div>
      </div>

      {/* ================= CONTENT ================= */}
      <div className="flex-1 overflow-hidden">
        <SessionRunner
          isPractice={(location.pathname || "").includes("/practice-test/")}
          sectionsOpen={sectionsOpen}
          navOpen={navOpen}
          onCloseSections={() => setSectionsOpen(false)}
          onCloseNav={() => setNavOpen(false)}
        />
      </div>

      {/* ================= FOOTER ================= */}
      <div className="border-t border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="text-xs text-[var(--muted)]">Zenith Testing Panel</div>
          <div className="text-xs text-[var(--muted)]">
            Practice • Improve • Repeat
          </div>
        </div>
      </div>
    </div>
  );
}