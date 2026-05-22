import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, MapPin, MessageSquare, Send, CheckCircle2, AlertCircle, Phone, Clock } from "lucide-react";

const API_BASES = (import.meta.env.VITE_API_BASES || import.meta.env.VITE_API_BASE || "http://127.0.0.1:5000")
  .split(",").map((s) => s.trim().replace(/\/$/, "")).filter(Boolean);

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

const INFO_CARDS = [
  {
    icon: Mail,
    title: "Email Support",
    desc: "support@zenithlearning.site",
    sub: "We reply within 24 hours",
    color: "text-indigo-500",
    bg: "bg-indigo-50 dark:bg-indigo-900/20",
  },
  {
    icon: MapPin,
    title: "Location",
    desc: "Global · Remote First",
    sub: "Available worldwide",
    color: "text-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
  },
  {
    icon: Clock,
    title: "Response Time",
    desc: "Within 24 Hours",
    sub: "Mon–Sat, 9am–6pm IST",
    color: "text-violet-500",
    bg: "bg-violet-50 dark:bg-violet-900/20",
  },
];

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [err, setErr] = useState("");

  const location = useLocation();
  const prefillEmail = useMemo(() => {
    const sp = new URLSearchParams(location.search);
    return (sp.get("email") || "").trim();
  }, [location.search]);

  useEffect(() => { if (prefillEmail) setEmail(prefillEmail); }, [prefillEmail]);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setSuccess(false);
    setLoading(true);
    try {
      const res = await fetchWithFallback("/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Failed to send");
      setSuccess(true);
      setName(""); setEmail(""); setSubject(""); setMessage("");
    } catch (e2) {
      setErr(e2?.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="max-w-6xl mx-auto px-4 py-16">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-14"
        >
          <div className="section-eyebrow justify-center mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
            Get In Touch
          </div>
          <h1 className="text-4xl font-bold text-[var(--text)] mb-4">
            Contact <span className="gradient-text">Zenith</span>
          </h1>
          <p className="text-[var(--muted)] max-w-xl mx-auto">
            Have a question about courses, verification, or anything else? We&apos;re here to help.
          </p>
        </motion.div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          {INFO_CARDS.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 flex items-start gap-4 hover:border-[var(--accent-border)] hover:-translate-y-0.5 hover:shadow-md transition-all duration-300"
            >
              <div className={`w-11 h-11 rounded-xl ${card.bg} grid place-items-center shrink-0`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div>
                <div className="font-semibold text-sm text-[var(--text)]">{card.title}</div>
                <div className="text-sm text-[var(--text)] mt-0.5 font-medium">{card.desc}</div>
                <div className="text-xs text-[var(--muted)] mt-0.5">{card.sub}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-3 bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl grid place-items-center shrink-0"
                style={{ background: "var(--accent-light)" }}>
                <MessageSquare className="w-5 h-5" style={{ color: "var(--accent)" }} />
              </div>
              <div>
                <h2 className="font-bold text-[var(--text)]">Send a Message</h2>
                <p className="text-xs text-[var(--muted)]">Fill out the form and we&apos;ll get back to you</p>
              </div>
            </div>

            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-5 flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700"
              >
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-sm">Message sent!</div>
                  <div className="text-sm mt-0.5 opacity-80">Our team will respond within 24 hours.</div>
                </div>
              </motion.div>
            )}

            {err && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-5 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-sm">{err}</div>
              </motion.div>
            )}

            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="ui-label mb-1.5 block">Your Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="ui-input"
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label className="ui-label mb-1.5 block">Email Address</label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    required
                    className="ui-input"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="ui-label mb-1.5 block">Subject</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="ui-input"
                  placeholder="Verification / Course issue / Feedback"
                />
              </div>

              <div>
                <label className="ui-label mb-1.5 block">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={6}
                  className="ui-input resize-none"
                  placeholder="Tell us what happened and include any details that can help us assist you..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full primary-btn py-3 text-base gap-2 group disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Sending…
                  </span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </motion.div>

          {/* Sidebar info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-2 flex flex-col gap-4"
          >
            {/* Support tips */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold text-[var(--text)] mb-4">For Faster Resolution</h3>
              <p className="text-sm text-[var(--muted)] mb-4">Include the following details in your message:</p>
              <ul className="space-y-3">
                {[
                  "Your course title (if applicable)",
                  "Any screenshots or error text",
                  "Whether the issue happens on hosted site or localhost",
                  "Steps to reproduce the problem",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-[var(--muted)]">
                    <CheckCircle2 className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Account emails */}
            <div className="rounded-3xl p-6 text-white relative overflow-hidden" style={{ background: "var(--grad)" }}>
              <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: "radial-gradient(circle at 70% 30%, white 0%, transparent 60%)" }} />
              <div className="relative">
                <Mail className="w-6 h-6 mb-3 opacity-90" />
                <h3 className="font-bold mb-1">Automated Emails</h3>
                <p className="text-sm text-white/80 mb-4">These are sent automatically from our system:</p>
                <ul className="space-y-2">
                  {["Account verification", "Password reset link", "Course access notifications"].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-white/90">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-5 text-center shadow-sm">
              <p className="text-xs text-[var(--muted)]">
                By sending a message, you agree we may contact you via email about this request.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
