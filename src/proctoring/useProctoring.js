import { useCallback, useEffect, useRef, useState } from "react";

const API_BASES = (import.meta.env.VITE_API_BASES || import.meta.env.VITE_API_BASE || "http://127.0.0.1:5000")
  .split(",").map(s => s.trim().replace(/\/$/, "")).filter(Boolean);

async function fetchWithFallback(path, options) {
  let lastErr = null;
  const p = path.startsWith("/") ? path : `/${path}`;
  for (const base of API_BASES) {
    try {
      const res = await fetch(`${base}${p}`, options);
      if (res.status < 500) return res;
      lastErr = new Error(`HTTP ${res.status}`);
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error("All backends failed");
}

const COOLDOWN_MS = 2500;
let toastSeq = 0;

/**
 * useProctoring — handles fullscreen, keyboard shortcuts, copy/paste,
 * right-click, and camera monitoring for mock tests.
 *
 * NOTE: Tab-switch / window-blur detection is intentionally NOT handled here;
 * it is already handled by MockTest.jsx's SessionRunner to avoid double-counting.
 *
 * @param {object} opts
 * @param {string}   opts.sessionId   - mock test session ID
 * @param {object}   opts.user        - Firebase user object (for getIdToken)
 * @param {boolean}  opts.enabled     - false for practice tests (no proctoring)
 * @param {function} opts.onAutoSubmit - called when backend triggers auto-submit
 */
export function useProctoring({ sessionId, user, enabled = true, onAutoSubmit }) {
  const [violations, setViolations] = useState(0);
  const [violationLimit, setViolationLimit] = useState(3);
  const [toasts, setToasts] = useState([]);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraError, setCameraError] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);

  const cooldownRef = useRef(0);
  const streamRef = useRef(null);
  const enabledRef = useRef(enabled);
  const sessionRef = useRef(sessionId);

  useEffect(() => { enabledRef.current = enabled; }, [enabled]);
  useEffect(() => { sessionRef.current = sessionId; }, [sessionId]);

  // ── Toast helpers ─────────────────────────────────────────────────────────
  const pushToast = useCallback((message, severity = "warning") => {
    const id = ++toastSeq;
    setToasts(prev => [...prev, { id, message, severity }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── Backend violation reporter ────────────────────────────────────────────
  const reportViolation = useCallback(async (type, toastMsg) => {
    if (!enabledRef.current || !sessionRef.current) return;

    // Client-side cooldown to prevent rapid-fire duplicate reports
    const now = Date.now();
    if (now - cooldownRef.current < COOLDOWN_MS) return;
    cooldownRef.current = now;

    // Show toast immediately (don't wait for API)
    if (toastMsg) pushToast(toastMsg, "warning");

    try {
      const token = user ? await user.getIdToken() : "";
      const res = await fetchWithFallback(`/mocktest/sessions/${sessionRef.current}/proctoring/violation`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return;
      if (data?.proctoring) {
        setViolations(data.proctoring.violations ?? 0);
        setViolationLimit(data.proctoring.violation_limit ?? 3);
      }
      if (data?.auto_submitted) {
        pushToast("⛔ Test auto-submitted due to repeated violations.", "error");
        onAutoSubmit?.(data);
      }
    } catch {
      // Network error — toast already shown, no double-report
    }
  }, [user, pushToast, onAutoSubmit]);

  // ── Camera ────────────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      setCameraStream(stream);
      setCameraError("");
      return stream;
    } catch (e) {
      const msg = e?.name === "NotAllowedError"
        ? "Camera permission denied. Please allow camera access."
        : e?.name === "NotFoundError"
        ? "No camera device found."
        : e?.message || "Camera unavailable.";
      setCameraError(msg);
      return null;
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraStream(null);
  }, []);

  // Monitor camera track-ended events
  useEffect(() => {
    if (!enabled || !cameraStream) return;
    const tracks = cameraStream.getVideoTracks();
    const onEnded = () => {
      setCameraStream(null);
      reportViolation("camera-off", "⚠️ Camera disconnected! Please keep your camera on during the test.");
    };
    tracks.forEach(t => t.addEventListener("ended", onEnded));
    return () => tracks.forEach(t => t.removeEventListener("ended", onEnded));
  }, [enabled, cameraStream, reportViolation]);

  // ── Fullscreen ────────────────────────────────────────────────────────────
  const enterFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      setIsFullscreen(true);
    } catch {}
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch {}
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const onChange = () => {
      const inFs = !!document.fullscreenElement;
      setIsFullscreen(inFs);
      if (!inFs) {
        reportViolation(
          "fullscreen-exit",
          "⚠️ Fullscreen exited! Please go back to fullscreen to continue the test."
        );
      }
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [enabled, reportViolation]);

  // ── Keyboard shortcut blocking ────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    const COPY_PASTE_KEYS = new Set(["c", "v", "x"]);
    const BLOCKED_CTRL = new Set(["s", "p", "a", "u", "r"]);

    const onKeyDown = (e) => {
      const key = e.key.toLowerCase();

      // F12
      if (key === "f12") {
        e.preventDefault();
        e.stopPropagation();
        reportViolation("keyboard-shortcut", "⚠️ DevTools (F12) is blocked during the test.");
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        // Ctrl+Shift+I / Ctrl+Shift+J (DevTools)
        if (e.shiftKey && (key === "i" || key === "j")) {
          e.preventDefault();
          e.stopPropagation();
          reportViolation("keyboard-shortcut", "⚠️ DevTools shortcut is blocked during the test.");
          return;
        }

        if (COPY_PASTE_KEYS.has(key)) {
          e.preventDefault();
          e.stopPropagation();
          const label = key === "c" ? "Copy" : key === "x" ? "Cut" : "Paste";
          reportViolation("copy-paste", `⚠️ ${label} (Ctrl+${key.toUpperCase()}) is not allowed during the test.`);
          return;
        }

        if (BLOCKED_CTRL.has(key)) {
          e.preventDefault();
          e.stopPropagation();
          reportViolation("keyboard-shortcut", `⚠️ Ctrl+${key.toUpperCase()} is blocked during the test.`);
          return;
        }
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [enabled, reportViolation]);

  // ── Copy / Paste / Right-click prevention ─────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    const stop = (e) => e.preventDefault();

    const onCopy = (e) => { stop(e); reportViolation("copy-paste", "⚠️ Copying is not allowed during the test."); };
    const onCut  = (e) => { stop(e); reportViolation("copy-paste", "⚠️ Cutting is not allowed during the test."); };
    const onPaste = (e) => { stop(e); reportViolation("copy-paste", "⚠️ Pasting is not allowed during the test."); };
    const onContextMenu = (e) => {
      stop(e);
      reportViolation("right-click", "⚠️ Right-click is disabled during the test.");
    };

    document.addEventListener("copy",        onCopy,        true);
    document.addEventListener("cut",         onCut,         true);
    document.addEventListener("paste",       onPaste,       true);
    document.addEventListener("contextmenu", onContextMenu, true);
    return () => {
      document.removeEventListener("copy",        onCopy,        true);
      document.removeEventListener("cut",         onCut,         true);
      document.removeEventListener("paste",       onPaste,       true);
      document.removeEventListener("contextmenu", onContextMenu, true);
    };
  }, [enabled, reportViolation]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopCamera();
      // Don't force-exit fullscreen on unmount — user submitted and is being redirected
    };
  }, [stopCamera]);

  return {
    violations,
    violationLimit,
    toasts,
    dismissToast,
    cameraStream,
    cameraError,
    isFullscreen,
    startCamera,
    stopCamera,
    enterFullscreen,
    exitFullscreen,
    reportViolation,
  };
}

/**
 * Standalone permission checker (used by ProctoringCheck page).
 * Returns { camera, mic, fullscreen, browser }
 */
export async function checkPermissions() {
  const result = { camera: "pending", mic: "pending", fullscreen: "pending", browser: "pending" };

  // Browser check
  result.browser = (typeof navigator.mediaDevices?.getUserMedia === "function" && typeof document.documentElement.requestFullscreen === "function")
    ? "ok"
    : "fail";

  // Fullscreen
  result.fullscreen = document.fullscreenEnabled ? "ok" : "fail";

  // Camera
  try {
    const s = await navigator.mediaDevices.getUserMedia({ video: true });
    s.getTracks().forEach(t => t.stop());
    result.camera = "ok";
  } catch (e) {
    result.camera = e?.name === "NotAllowedError" ? "denied" : "fail";
  }

  // Mic
  try {
    const s = await navigator.mediaDevices.getUserMedia({ audio: true });
    s.getTracks().forEach(t => t.stop());
    result.mic = "ok";
  } catch (e) {
    result.mic = e?.name === "NotAllowedError" ? "denied" : "fail";
  }

  return result;
}
