import React from "react";
import { useLocation, Link } from "react-router-dom";

export default function CheckEmail() {
  const location = useLocation();
  const email = location.state?.email;

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center px-4 py-10 bg-[var(--bg)] text-[var(--text)]">
      <div className="w-full max-w-lg bg-[var(--card)] border border-[var(--border)] shadow-sm rounded-2xl p-6">
        <h1 className="text-2xl font-bold">Check your inbox</h1>
        <p className="text-sm text-[var(--muted)] mt-2">
          We sent a verification email{email ? ` to ${email}` : ""}. Open it and click the button to verify your account.
        </p>

        <div className="mt-5 bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-900">
          <div className="font-semibold">What to do next</div>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Open your email inbox (also check Spam / Promotions).</li>
            <li>Click <b>Open verification page</b>, then click <b>Verify my email</b>.</li>
            <li>After verification, come back and log in.</li>
          </ul>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link to="/login" className="inline-flex justify-center items-center rounded-xl px-4 py-2.5 bg-blue-600 text-white font-semibold hover:opacity-90">
            Go to Login
          </Link>
          <Link to="/contact" className="inline-flex justify-center items-center rounded-xl px-4 py-2.5 border border-[var(--border)] bg-[var(--card)] font-semibold hover:opacity-90">
            Need help?
          </Link>
        </div>
      </div>
    </div>
  );
}
