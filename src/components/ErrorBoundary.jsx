import React from "react";

/**
 * Simple error boundary so a runtime error doesn't render a blank screen.
 * Helpful when a route fails and otherwise looks like an empty page.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log to console so you can see the stack in DevTools
    // (and keep the UI usable for the user)
    console.error("UI crashed:", error, info);
  }

  render() {
    if (this.state.hasError) {
      const msg = this.state.error?.message || "Something went wrong.";
      return (
        <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex items-center justify-center p-6">
          <div className="max-w-xl w-full rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="text-lg font-semibold">This page crashed</h2>
            <p className="mt-2 text-sm text-[var(--muted)] break-words">{msg}</p>
            <div className="mt-4 flex gap-3">
              <button
                className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white hover:opacity-90"
                onClick={() => window.location.reload()}
              >
                Reload
              </button>
              <a
                className="px-4 py-2 rounded-xl border border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/10"
                href="/my-courses"
              >
                Back to My Courses
              </a>
            </div>
            <p className="mt-4 text-xs text-[var(--muted)]">
              Tip: open DevTools → Console to see the exact error.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
