import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { LayoutGrid, Menu, Sun, Moon, ShieldCheck, ShieldAlert, Maximize2 } from "lucide-react";
import { SessionRunner } from "./MockTest.jsx";
import { useTheme } from "../theme/ThemeProvider.jsx";
import { useAuth } from "../auth/AuthProvider.jsx";
import { getPreferredProfilePhoto } from "../utils/profilePhoto.js";
import { useProctoring } from "../proctoring/useProctoring.js";
import CameraPreview from "../proctoring/CameraPreview.jsx";
import ViolationToast from "../proctoring/ViolationToast.jsx";

export default function MockTestShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionId } = useParams();
  const { theme, toggleTheme } = useTheme();
  const auth = typeof useAuth === "function" ? useAuth() : null;

  const [navOpen, setNavOpen] = useState(true);
  const [sectionsOpen, setSectionsOpen] = useState(true);

  const isPractice = (location.pathname || "").includes("/practice-test/");
  const proctorEnabled = !isPractice;

  const userName = (auth?.profile?.name || auth?.user?.displayName || auth?.user?.email || "User").toString().trim();
  const userPhoto = getPreferredProfilePhoto(auth?.profile, auth?.user) || null;

  // ── Auto-submit handler ───────────────────────────────────────────────────
  const handleAutoSubmit = useCallback((data) => {
    // SessionRunner handles its own submit state via its own violation listener.
    // This callback fires for fullscreen/camera/keyboard violations from this shell.
    // We redirect to results after a short delay to let the toast show.
    setTimeout(() => navigate("/my-tests?tab=mock"), 3500);
  }, [navigate]);

  // ── Proctoring hook (only for mock tests) ────────────────────────────────
  const {
    violations,
    violationLimit,
    toasts,
    dismissToast,
    cameraStream,
    cameraError,
    isFullscreen,
    startCamera,
    enterFullscreen,
    exitFullscreen,
  } = useProctoring({
    sessionId,
    user: auth?.user,
    enabled: proctorEnabled,
    onAutoSubmit: handleAutoSubmit,
  });

  // On mount: request camera + enter fullscreen (for mock tests only)
  useEffect(() => {
    if (!proctorEnabled) return;
    startCamera();
    enterFullscreen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proctorEnabled]);

  // Reset scroll (fixes LeetCode-like viewport measurement issues on history nav)
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    } catch {
      window.scrollTo(0, 0);
    }
  }, []);

  const onExit = () => {
    exitFullscreen();
    const p = location.pathname || "";
    if (p.includes("/mock-test/") || p.includes("/practice-test/")) navigate("/my-tests");
    else navigate("/");
  };

  // Fullscreen re-enter button handler
  const handleReenterFullscreen = () => enterFullscreen();

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">

      {/* ── Violation toasts (top-right, above everything) ── */}
      <ViolationToast toasts={toasts} onDismiss={dismissToast} />

      {/* ── Floating camera preview (bottom-right, mock only) ── */}
      {proctorEnabled && (
        <CameraPreview stream={cameraStream} error={cameraError} />
      )}

      {/* ── Fullscreen warning banner ── */}
      {proctorEnabled && !isFullscreen && (
        <div className="sticky top-0 z-50 bg-amber-500 text-white px-4 py-2 flex items-center justify-between text-sm font-semibold">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            ⚠️ You are not in fullscreen mode — please return to fullscreen to avoid a violation.
          </div>
          <button
            onClick={handleReenterFullscreen}
            className="ml-4 flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 transition-all text-xs font-bold"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            Enter Fullscreen
          </button>
        </div>
      )}

      {/* ── Header ── */}
      <div className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-[1400px] mx-auto px-4 h-16 flex items-center justify-between">
          {/* Left */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSectionsOpen((v) => !v)}
              className="h-10 w-10 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--hover)] transition flex items-center justify-center"
              title="Sections"
            >
              <Menu size={18} />
            </button>
            <div className="text-xl font-semibold tracking-tight">Zenith</div>

            {/* Proctoring status badge (mock only) */}
            {proctorEnabled && (
              <div
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-semibold ${
                  violations > 0
                    ? "bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-900/20 dark:border-amber-700 dark:text-amber-400"
                    : "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-700 dark:text-emerald-400"
                }`}
              >
                {violations > 0
                  ? <ShieldAlert className="w-3.5 h-3.5" />
                  : <ShieldCheck className="w-3.5 h-3.5" />}
                Violations: {violations} / {violationLimit}
              </div>
            )}
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setNavOpen((v) => !v)}
              className="h-10 w-10 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--hover)] transition flex items-center justify-center"
              title="Navigation"
            >
              <LayoutGrid size={18} />
            </button>

            <button
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to light" : "Switch to dark"}
              className="h-10 w-10 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--hover)] transition flex items-center justify-center"
            >
              {theme === "dark"
                ? <Sun size={18} className="text-yellow-400" />
                : <Moon size={18} className="text-yellow-500" />}
            </button>

            <div className="h-10 px-4 rounded-full border border-[var(--border)] bg-[var(--card)] flex items-center gap-3">
              <div className="h-7 w-7 rounded-full overflow-hidden border border-[var(--border)] bg-[var(--bg)] flex items-center justify-center">
                {userPhoto ? (
                  <img src={userPhoto} alt="User" className="h-full w-full object-cover" />
                ) : (
                  <div className="text-xs font-semibold text-[var(--muted)]">
                    {String(userName || "U").trim().slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="text-sm font-semibold tracking-wide whitespace-nowrap hidden sm:block">
                {userName}
              </div>
            </div>

            <button
              onClick={onExit}
              className="h-10 px-5 rounded-full bg-green-600 hover:bg-green-700 text-white font-semibold transition"
            >
              Exit
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-hidden">
        <SessionRunner
          isPractice={isPractice}
          sectionsOpen={sectionsOpen}
          navOpen={navOpen}
          onCloseSections={() => setSectionsOpen(false)}
          onCloseNav={() => setNavOpen(false)}
        />
      </div>

      {/* ── Footer ── */}
      <div className="border-t border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="text-xs text-[var(--muted)]">Zenith Testing Panel</div>
          {proctorEnabled && (
            <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
              <div className={`w-1.5 h-1.5 rounded-full ${cameraStream ? "bg-emerald-500" : "bg-red-500"}`} />
              {cameraStream ? "Camera active" : "Camera off"}
              <span className="mx-1">•</span>
              <div className={`w-1.5 h-1.5 rounded-full ${isFullscreen ? "bg-emerald-500" : "bg-amber-500"}`} />
              {isFullscreen ? "Fullscreen" : "Windowed"}
            </div>
          )}
          {!proctorEnabled && (
            <div className="text-xs text-[var(--muted)]">Practice • Improve • Repeat</div>
          )}
        </div>
      </div>
    </div>
  );
}
