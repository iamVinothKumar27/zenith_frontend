import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, X, ShieldAlert } from "lucide-react";

/**
 * Toast notification panel for proctoring violations.
 * Rendered at the top-right of the screen, above everything.
 */
export default function ViolationToast({ toasts = [], onDismiss }) {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-xs w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 60, scale: 0.92 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl px-4 py-3.5 shadow-2xl border ${
              toast.severity === "error"
                ? "bg-red-700 border-red-600 text-white"
                : "bg-amber-500 border-amber-400 text-white"
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {toast.severity === "error"
                ? <ShieldAlert className="w-5 h-5" />
                : <AlertTriangle className="w-5 h-5" />}
            </div>
            <p className="flex-1 text-sm font-semibold leading-snug">{toast.message}</p>
            <button
              onClick={() => onDismiss?.(toast.id)}
              className="shrink-0 opacity-70 hover:opacity-100 transition-opacity mt-0.5"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
