import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Camera, Mic, Maximize2, Globe, CheckCircle2, XCircle,
  Loader2, AlertTriangle, ShieldCheck, Play, RefreshCw,
} from "lucide-react";
import { checkPermissions } from "./useProctoring.js";

const STATUS_ICON = {
  pending:  <Loader2 className="w-5 h-5 text-[var(--muted)] animate-spin" />,
  checking: <Loader2 className="w-5 h-5 text-[var(--accent)] animate-spin" />,
  ok:       <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
  denied:   <XCircle className="w-5 h-5 text-red-500" />,
  fail:     <XCircle className="w-5 h-5 text-red-500" />,
};
const STATUS_LABEL = {
  pending:  "Pending",
  checking: "Checking…",
  ok:       "Ready",
  denied:   "Permission Denied",
  fail:     "Unavailable",
};
const STATUS_BG = {
  ok:      "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800",
  denied:  "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800",
  fail:    "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800",
  pending: "bg-[var(--surface)] border-[var(--border)]",
  checking:"bg-[var(--surface)] border-[var(--accent-border)]",
};

const CHECKS = [
  {
    key: "camera",
    label: "Camera Access",
    desc: "Required for exam monitoring",
    icon: Camera,
    required: true,
    tip: "Click 'Allow' when the browser asks for camera permission.",
  },
  {
    key: "mic",
    label: "Microphone Access",
    desc: "Used for audio monitoring",
    icon: Mic,
    required: false,
    tip: "Click 'Allow' when the browser asks for microphone permission.",
  },
  {
    key: "fullscreen",
    label: "Fullscreen Support",
    desc: "Test runs in fullscreen mode",
    icon: Maximize2,
    required: true,
    tip: "Your browser supports fullscreen mode.",
  },
  {
    key: "browser",
    label: "Browser Compatibility",
    desc: "Modern browser APIs required",
    icon: Globe,
    required: true,
    tip: "Chrome, Edge, or Firefox (latest) recommended.",
  },
];

export default function ProctoringCheck() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [checks, setChecks] = useState({
    camera: "pending",
    mic: "pending",
    fullscreen: "pending",
    browser: "pending",
  });
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [startLoading, setStartLoading] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Attach stream to video preview
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const runChecks = useCallback(async () => {
    setRunning(true);
    setDone(false);

    // Reset all to checking
    setChecks({ camera: "checking", mic: "checking", fullscreen: "checking", browser: "checking" });

    // Browser check (instant)
    const browserOk =
      typeof navigator.mediaDevices?.getUserMedia === "function" &&
      typeof document.documentElement.requestFullscreen === "function";
    setChecks(p => ({ ...p, browser: browserOk ? "ok" : "fail" }));

    // Fullscreen check (instant)
    const fsOk = document.fullscreenEnabled;
    setChecks(p => ({ ...p, fullscreen: fsOk ? "ok" : "fail" }));

    // Mic check
    try {
      const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
      ms.getTracks().forEach(t => t.stop());
      setChecks(p => ({ ...p, mic: "ok" }));
    } catch (e) {
      setChecks(p => ({ ...p, mic: e?.name === "NotAllowedError" ? "denied" : "fail" }));
    }

    // Camera check + keep stream for preview
    try {
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      const cs = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = cs;
      setCameraStream(cs);
      setChecks(p => ({ ...p, camera: "ok" }));
    } catch (e) {
      setChecks(p => ({ ...p, camera: e?.name === "NotAllowedError" ? "denied" : "fail" }));
    }

    setRunning(false);
    setDone(true);
  }, []);

  // Auto-run on mount
  useEffect(() => {
    runChecks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requiredPassed = CHECKS.filter(c => c.required).every(c => checks[c.key] === "ok");
  const allDone = done && !running;

  const handleBeginTest = async () => {
    if (!sessionId) return;
    setStartLoading(true);
    // Stop the preview stream — MockTestShell will start a fresh stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      setCameraStream(null);
    }
    navigate(`/mock-test/${sessionId}`, { replace: true });
  };

  const hasFailedRequired = CHECKS
    .filter(c => c.required)
    .some(c => checks[c.key] === "denied" || checks[c.key] === "fail");

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 grid place-items-center"
            style={{ background: "var(--accent-light)" }}>
            <ShieldCheck className="w-8 h-8" style={{ color: "var(--accent)" }} />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text)] mb-1">Proctoring Check</h1>
          <p className="text-sm text-[var(--muted)]">
            We need to verify your setup before starting the mock test.
            All sessions are monitored for integrity.
          </p>
        </div>

        {/* Checks list */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 mb-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-[var(--text)]">System Checks</span>
            <button
              onClick={runChecks}
              disabled={running}
              className="flex items-center gap-1.5 text-xs font-medium text-[var(--accent)] hover:opacity-80 disabled:opacity-50 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${running ? "animate-spin" : ""}`} />
              Re-run checks
            </button>
          </div>

          {CHECKS.map((c, idx) => {
            const st = checks[c.key];
            const Icon = c.icon;
            return (
              <motion.div
                key={c.key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.07 }}
                className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${STATUS_BG[st] || STATUS_BG.pending}`}
              >
                <div className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${
                  st === "ok" ? "bg-emerald-100 dark:bg-emerald-900/30"
                  : st === "denied" || st === "fail" ? "bg-red-100 dark:bg-red-900/30"
                  : "bg-[var(--surface)]"
                }`}>
                  <Icon className={`w-5 h-5 ${
                    st === "ok" ? "text-emerald-600" : st === "denied" || st === "fail" ? "text-red-500" : "text-[var(--muted)]"
                  }`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-[var(--text)]">{c.label}</span>
                    {c.required && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--muted)]">{c.desc}</p>
                  {(st === "denied" || st === "fail") && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                      {st === "denied"
                        ? "Permission denied. Open browser settings → Site permissions → Allow."
                        : c.tip}
                    </p>
                  )}
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {STATUS_ICON[st]}
                  <span className={`text-xs font-semibold hidden sm:block ${
                    st === "ok" ? "text-emerald-600" : st === "denied" || st === "fail" ? "text-red-500" : "text-[var(--muted)]"
                  }`}>
                    {STATUS_LABEL[st]}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Camera preview */}
        {cameraStream && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-5 mb-5 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-semibold text-[var(--text)]">Camera Preview</span>
              <span className="text-xs text-[var(--muted)]">— Make sure your face is clearly visible</span>
            </div>
            <div className="relative w-full rounded-2xl overflow-hidden bg-black" style={{ aspectRatio: "16/9", maxHeight: "220px" }}>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
                style={{ transform: "scaleX(-1)" }}
              />
              <div className="absolute top-3 left-3 bg-red-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                ● LIVE
              </div>
            </div>
            <p className="text-xs text-[var(--muted)] mt-2.5 text-center">
              Your camera is working. Ensure good lighting and look straight at the camera.
            </p>
          </motion.div>
        )}

        {/* Proctoring rules notice */}
        <div className="bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 rounded-2xl p-4 mb-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">
                Important — Test Rules
              </p>
              <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1">
                <li>• Do not switch tabs or windows during the test</li>
                <li>• Do not exit fullscreen mode</li>
                <li>• Keep your camera on at all times</li>
                <li>• Copy, paste, and right-click are disabled</li>
                <li>• After {"{3}"} violations, your test will be auto-submitted with 0 marks</li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA */}
        {hasFailedRequired && allDone && (
          <div className="bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800 rounded-2xl p-4 mb-4 text-sm text-red-700 dark:text-red-300 font-medium text-center">
            ⚠️ One or more required checks failed. Please fix the issues and re-run the checks before proceeding.
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 py-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] text-sm font-semibold text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-all"
          >
            ← Back
          </button>
          <button
            onClick={handleBeginTest}
            disabled={!allDone || !requiredPassed || startLoading || running}
            className="flex-1 py-3 rounded-2xl primary-btn text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {startLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Starting…</>
            ) : running ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Checking…</>
            ) : (
              <><Play className="w-4 h-4" /> Begin Test</>
            )}
          </button>
        </div>

        {!allDone && (
          <p className="text-center text-xs text-[var(--muted)] mt-4">
            Running permission checks…
          </p>
        )}
      </motion.div>
    </div>
  );
}
