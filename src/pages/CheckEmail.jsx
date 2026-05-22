import React from "react";
import { useLocation, Link } from "react-router-dom";

export default function CheckEmail() {
  const location = useLocation();
  const email = location.state?.email;

  return (
    <div className="min-h-[calc(100vh-65px)] flex items-center justify-center px-4 py-12 bg-[var(--bg)] text-[var(--text)]">
      <div className="w-full max-w-md bg-[var(--card)] border border-[var(--border)] shadow-card rounded-2xl p-8 text-center">
        <div className="w-16 h-16 rounded-2xl mb-5 grid place-items-center mx-auto" style={{ background: "var(--accent-light)" }}>
          <svg className="w-8 h-8" style={{ color: "var(--accent)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[var(--text)] mb-2">Check your inbox</h1>
        <p className="text-sm text-[var(--muted)] mb-6">
          We sent a verification email{email ? ` to <strong>${email}</strong>` : ""}. Open it and click the button to verify your account.
        </p>

        <div className="bg-[var(--accent-light)] border border-[var(--accent-border)] rounded-2xl p-4 text-sm text-left mb-6" style={{ color: "var(--accent)" }}>
          <div className="font-semibold mb-2">What to do next</div>
          <ul className="space-y-1.5 text-[var(--muted)]">
            <li className="flex gap-2"><span>1.</span><span>Open your email inbox (also check Spam / Promotions).</span></li>
            <li className="flex gap-2"><span>2.</span><span>Click <b>Open verification page</b>, then click <b>Verify my email</b>.</span></li>
            <li className="flex gap-2"><span>3.</span><span>After verification, come back and log in.</span></li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/login" className="primary-btn px-6 py-2.5">
            Go to Login
          </Link>
          <Link to="/contact" className="outline-btn px-6 py-2.5">
            Need help?
          </Link>
        </div>
      </div>
    </div>
  );
}
