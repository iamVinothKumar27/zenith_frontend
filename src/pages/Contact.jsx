import React, { useState } from "react";

// ✅ Multi-backend support (comma-separated)
const API_BASES = (import.meta.env.VITE_API_BASES || import.meta.env.VITE_API_BASE || "http://127.0.0.1:5000")
  .split(",")
  .map((s) => s.trim().replace(/\/$/, ""))
  .filter(Boolean);

async function fetchWithFallback(path, options) {
  let lastErr = null;
  const p = path.startsWith("/") ? path : `/${path}`;
  for (const base of API_BASES) {
    try {
      const res = await fetch(`${base}${p}`, options);
      if (res.status < 500) return res;
      lastErr = new Error(`HTTP ${res.status}`);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("All backends failed");
}


export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    setLoading(true);
    try {
      const res = await fetchWithFallback("/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Failed to send");
      setMsg("Message sent successfully. Our team will respond soon.");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (e2) {
      setErr(e2?.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] bg-[var(--bg)] text-[var(--text)] px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold">Contact Zenith</h1>
          <p className="text-sm text-[var(--muted)] mt-2 max-w-2xl">
            Have a question about courses, verification, or anything else? Send us a message and we’ll get back to you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
            {msg && (
              <div className="mb-4 text-sm text-green-800 bg-green-50 border border-green-200 rounded-xl p-3">
                {msg}
              </div>
            )}
            {err && (
              <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
                {err}
              </div>
            )}

            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Your name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 outline-none"
                    placeholder="Enter Name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    required
                    className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 outline-none"
                    placeholder="Mail"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Subject</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 outline-none"
                  placeholder="Verification / Course issue / Feedback"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={6}
                  className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 outline-none resize-none"
                  placeholder="Tell us what happened and include any details that can help us assist you..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto rounded-xl px-5 py-2.5 bg-blue-600 text-white font-semibold hover:opacity-90 disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send message"}
              </button>
            </form>
          </div>

          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
            <div className="text-sm font-semibold">Support</div>
            <p className="text-sm text-[var(--muted)] mt-2">
              For faster resolution, include:
            </p>
            <ul className="list-disc pl-5 mt-3 text-sm text-[var(--muted)] space-y-1">
              <li>Your course title (if applicable)</li>
              <li>Any screenshots or error text</li>
              <li>Whether the issue happens on hosted site or localhost</li>
            </ul>

            <div className="mt-6 p-4 rounded-2xl bg-blue-50 border border-blue-200 text-sm text-blue-900">
              <div className="font-semibold">Account emails included</div>
              <div className="mt-2 space-y-1">
                <div>✅ Verification</div>
                <div>✅ Password reset</div>
                <div>✅ Course notifications</div>
              </div>
            </div>

            <div className="mt-6 text-xs text-[var(--muted)]">
              By sending a message, you agree we may contact you via email about this request.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
