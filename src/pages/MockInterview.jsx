import React, { useEffect, useMemo, useRef, useState } from "react";
import { Routes, Route, useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider.jsx";

// Same backend fallback logic as AuthProvider (kept local to avoid coupling)
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

function fmtDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso || "";
  }
}

function Pill({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm border transition ${
        active
          ? "border-[var(--accent)] text-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]"
          : "border-[var(--border)] text-[var(--text)] hover:bg-[var(--bg)]"
      }`}
    >
      {children}
    </button>
  );
}

function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/40">
      <div className="w-full max-w-3xl rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h3 className="text-base font-semibold text-[var(--text)]">{title}</h3>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-xl border border-[var(--border)] hover:bg-[var(--bg)] text-sm"
          >
            Close
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function ReportView({ report }) {
  if (!report) return null;
  const cat = report.category_scores || {};
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="px-4 py-2 rounded-2xl bg-[var(--bg)] border border-[var(--border)]">
          <div className="text-xs text-[var(--muted)]">Overall score</div>
          <div className="text-2xl font-bold text-[var(--text)]">{report.overall_score ?? "-"}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          {["communication", "technical", "problem_solving", "project_depth", "role_fit"].map((k) => (
            <div key={k} className="px-3 py-2 rounded-2xl bg-[var(--bg)] border border-[var(--border)]">
              <div className="text-[11px] text-[var(--muted)] capitalize">{k.replace("_", " ")}</div>
              <div className="text-sm font-semibold text-[var(--text)]">{cat?.[k] ?? "-"}</div>
            </div>
          ))}
        </div>
      </div>

      {report.summary && (
        <div className="rounded-2xl bg-[var(--bg)] border border-[var(--border)] p-4">
          <div className="text-xs text-[var(--muted)]">Summary</div>
          <div className="mt-1 text-sm text-[var(--text)] whitespace-pre-wrap">{report.summary}</div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-[var(--bg)] border border-[var(--border)] p-4">
          <div className="text-sm font-semibold text-[var(--text)]">Strengths</div>
          <ul className="mt-2 list-disc pl-5 text-sm text-[var(--text)] space-y-1">
            {(report.strengths || []).map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl bg-[var(--bg)] border border-[var(--border)] p-4">
          <div className="text-sm font-semibold text-[var(--text)]">Gaps</div>
          <ul className="mt-2 list-disc pl-5 text-sm text-[var(--text)] space-y-1">
            {(report.gaps || []).map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl bg-[var(--bg)] border border-[var(--border)] p-4">
        <div className="text-sm font-semibold text-[var(--text)]">Improvements</div>
        <ul className="mt-2 list-disc pl-5 text-sm text-[var(--text)] space-y-1">
          {(report.improvements || []).map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl bg-[var(--bg)] border border-[var(--border)] p-4">
        <div className="text-sm font-semibold text-[var(--text)]">Next steps</div>
        <ul className="mt-2 list-disc pl-5 text-sm text-[var(--text)] space-y-1">
          {(report.next_steps || []).map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [sessions, setSessions] = useState([]);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [activeReport, setActiveReport] = useState(null);
  const [activeReportTitle, setActiveReportTitle] = useState("");

  async function getAuthHeaders(extra = {}) {
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}`, ...extra };
  }

  async function refresh() {
    if (!user) return;
    try {
      setBusy(true);
      setStatus("");
      const res = await fetchWithFallback("/interview/sessions", {
        method: "GET",
        headers: await getAuthHeaders(),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || res.statusText);
      setSessions(j.sessions || []);
    } catch (e) {
      setStatus(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  async function deleteSession(sessionId) {
    if (!sessionId) return;
    if (!confirm("Delete this interview session? This cannot be undone.")) return;
    try {
      setBusy(true);
      setStatus("");
      const res = await fetchWithFallback(`/interview/sessions/${sessionId}`, {
        method: "DELETE",
        headers: await getAuthHeaders(),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || res.statusText);
      setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
    } catch (e) {
      setStatus(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  async function openReport(s) {
    try {
      setReportOpen(true);
      setActiveReport(null);
      setActiveReportTitle(s?.role_target || s?.jd_title || "Interview Report");
      setReportLoading(true);
      const res = await fetchWithFallback(`/interview/sessions/${s.session_id}/report`, {
        method: "GET",
        headers: await getAuthHeaders(),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || res.statusText);
      setActiveReport(j.report || null);
      // update the session list with report status
      setSessions((prev) =>
        prev.map((x) => (x.session_id === s.session_id ? { ...x, has_report: true, overall_score: j?.report?.overall_score ?? x.overall_score } : x))
      );
    } catch (e) {
      setActiveReport({ overall_score: "-", summary: String(e.message || e), strengths: [], gaps: [], improvements: [], next_steps: [], category_scores: {} });
    } finally {
      setReportLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-80px)] px-4 py-8 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text)]">Dashboard</h1>
            <p className="text-sm text-[var(--muted)] mt-1">Review your previous interviews and feedback.</p>
          </div>
          <div className="flex gap-2">
            <button
              disabled={busy}
              onClick={refresh}
              className="px-4 py-2 rounded-2xl border border-[var(--border)] hover:bg-[var(--bg)] text-sm"
            >
              Refresh
            </button>
            <button
              disabled={busy}
              onClick={() => navigate("/mock-interview/new")}
              className="px-5 py-2 rounded-2xl bg-[var(--accent)] text-white font-medium text-sm hover:opacity-90"
            >
              Launch Interview
            </button>
          </div>
        </div>

        {status && (
          <div className="mt-4 rounded-2xl border border-red-300/50 bg-red-500/10 p-3 text-sm text-[var(--text)]">
            {status}
          </div>
        )}

        <div className="mt-6">
          {!sessions.length ? (
            <div className="text-center py-20 text-sm text-[var(--muted)]">
              You do not have any saved interviews yet.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {sessions.map((s) => (
                <div key={s.session_id} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold text-[var(--text)]">{s.role_target || s.jd_title || "Mock Interview"}</div>
                      <div className="mt-1 text-xs text-[var(--muted)]">
                        {fmtDate(s.created_at)} • {s.message_count || 0} messages
                      </div>
                      {s.has_report && (
                        <div className="mt-2 inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-[var(--bg)] border border-[var(--border)]">
                          <span className="text-[var(--muted)]">Report</span>
                          <span className="font-semibold text-[var(--text)]">{s.overall_score ?? "-"}/100</span>
                        </div>
                      )}
                    </div>
                    <div className="text-xs px-3 py-1 rounded-full bg-[var(--bg)] border border-[var(--border)]">
                      {s.jd_source ? (s.jd_source === "custom" ? "Custom JD" : "Predefined JD") : "JD"}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      disabled={busy}
                      onClick={() => navigate(`/mock-interview/chat/${s.session_id}`)}
                      className="px-4 py-2 rounded-2xl bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90"
                    >
                      Continue
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => openReport(s)}
                      className="px-4 py-2 rounded-2xl border border-[var(--border)] hover:bg-[var(--bg)] text-sm"
                    >
                      View Report
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => deleteSession(s.session_id)}
                      className="ml-auto px-4 py-2 rounded-2xl border border-red-300/60 hover:bg-red-500/10 text-sm text-red-400"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Modal
          open={reportOpen}
          title={activeReportTitle || "Interview Report"}
          onClose={() => {
            setReportOpen(false);
            setActiveReport(null);
          }}
        >
          {reportLoading ? (
            <div className="text-sm text-[var(--muted)]">Generating report…</div>
          ) : (
            <ReportView report={activeReport} />
          )}
        </Modal>
      </div>
    </div>
  );
}

function Setup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [selectedKey, setSelectedKey] = useState("custom");
  const [customText, setCustomText] = useState("");
  const [jdFile, setJdFile] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);

  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  async function getAuthHeaders(extra = {}) {
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}`, ...extra };
  }

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchWithFallback("/interview/jd/templates", { method: "GET" });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j?.error || res.statusText);
        setRoles(j.roles || []);
      } catch {
        // fallback client list (same as server)
        setRoles([
          { key: "custom", title: "Custom Job Description" },
          { key: "business_analyst", title: "Business Analyst" },
          { key: "product_manager", title: "Product Manager" },
          { key: "software_engineer", title: "Software Engineer" },
          { key: "marketing_specialist", title: "Marketing Specialist" },
          { key: "data_analyst", title: "Data Analyst" },
          { key: "customer_service_rep", title: "Customer Service Representative" },
          { key: "sales_rep", title: "Sales Representative" },
          { key: "hr_specialist", title: "Human Resources Specialist" },
          { key: "ux_ui_designer", title: "UX/UI Designer" },
          { key: "qa_engineer", title: "QA Engineer" },
        ]);
      }
    })();
  }, []);

  const isCustom = selectedKey === "custom";

  async function submit() {
    if (!resumeFile) {
      setStatus("Please upload your resume (PDF).");
      return;
    }
    if (isCustom && !customText.trim() && !jdFile) {
      setStatus("For Custom JD, paste JD text or upload a JD PDF.");
      return;
    }

    try {
      setBusy(true);
      setStatus("");
      const form = new FormData();
      form.append("resume_file", resumeFile);

      if (isCustom) {
        form.append("jd_mode", "custom");
        if (customText.trim()) form.append("jd_text", customText.trim());
        if (jdFile) form.append("jd_file", jdFile);
      } else {
        form.append("jd_mode", "predefined");
        form.append("role_key", selectedKey);
        const title = roles.find((r) => r.key === selectedKey)?.title || "";
        if (title) form.append("role_target", title);
      }

      const res = await fetchWithFallback("/interview/session/create", {
        method: "POST",
        headers: await getAuthHeaders(), // do NOT set Content-Type
        body: form,
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || res.statusText);

      navigate(`/mock-interview/chat/${j.session.session_id}`);
    } catch (e) {
      setStatus(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-80px)] px-4 py-8 md:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text)]">Select a job description</h1>
            <p className="text-sm text-[var(--muted)] mt-1">
              Choose a predefined role or paste your own job description.
            </p>
          </div>
          <Link
            to="/mock-interview"
            className="px-4 py-2 rounded-2xl border border-[var(--border)] hover:bg-[var(--bg)] text-sm"
          >
            Back to Dashboard
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 justify-center">
          {roles.map((r) => (
            <Pill key={r.key} active={selectedKey === r.key} onClick={() => setSelectedKey(r.key)}>
              {r.title}
            </Pill>
          ))}
        </div>

        <div className="mt-6">
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            disabled={!isCustom}
            placeholder={isCustom ? "Paste your job description here…" : "Select a job role above or switch to Custom JD."}
            className="w-full min-h-[240px] rounded-2xl bg-[var(--card)] border border-[var(--border)] p-4 text-sm text-[var(--text)] placeholder:text-[var(--muted)] outline-none disabled:opacity-60"
            maxLength={5000}
          />
          <div className="mt-2 text-right text-xs text-[var(--muted)]">{5000 - (customText?.length || 0)} chars left</div>
        </div>

        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
            <div className="text-sm font-semibold text-[var(--text)]">Upload your resume (PDF)</div>
            <div className="mt-2 text-xs text-[var(--muted)]">Required to start the interview.</div>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
              className="mt-3 w-full text-sm"
            />
            {resumeFile?.name && <div className="mt-2 text-xs text-[var(--muted)]">Selected: {resumeFile.name}</div>}
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold text-[var(--text)]">Upload JD (optional)</div>
              <div className="text-xs px-2 py-1 rounded-full bg-[var(--bg)] border border-[var(--border)]">
                {isCustom ? "Custom JD" : "Pro"}
              </div>
            </div>
            <div className="mt-2 text-xs text-[var(--muted)]">
              {isCustom ? "If you have a JD PDF, upload it instead of pasting text." : "For predefined roles, JD is auto-generated."}
            </div>
            <input
              type="file"
              accept="application/pdf"
              disabled={!isCustom}
              onChange={(e) => setJdFile(e.target.files?.[0] || null)}
              className="mt-3 w-full text-sm disabled:opacity-60"
            />
            {jdFile?.name && <div className="mt-2 text-xs text-[var(--muted)]">Selected: {jdFile.name}</div>}
          </div>
        </div>

        {status && (
          <div className="mt-4 rounded-2xl border border-red-300/50 bg-red-500/10 p-3 text-sm text-[var(--text)]">
            {status}
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <button
            disabled={busy}
            onClick={submit}
            className="px-7 py-3 rounded-2xl bg-[var(--accent)] text-white font-semibold text-sm shadow-sm hover:opacity-90"
          >
            {busy ? "Starting…" : "Generate Questions →"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ChatBubble({ role, children }) {
  const isUser = role === "candidate";
  return (
    <div className={`w-full flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
          isUser
            ? "bg-[var(--accent)] text-white"
            : "bg-[var(--card)] text-[var(--text)] border border-[var(--border)]"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function ChatPage() {
  const { user } = useAuth();
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [chat, setChat] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  const [reportOpen, setReportOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [report, setReport] = useState(null);

  const scrollerRef = useRef(null);

  async function getAuthHeaders(extra = {}) {
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}`, ...extra };
  }

  useEffect(() => {
    (async () => {
      if (!user || !sessionId) return;
      try {
        setBusy(true);
        setStatus("");
        const res = await fetchWithFallback(`/interview/sessions/${sessionId}/history`, {
          method: "GET",
          headers: await getAuthHeaders(),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j?.error || res.statusText);
        setSession(j.session || null);
        setChat(j.chat_history || []);
      } catch (e) {
        setStatus(String(e.message || e));
      } finally {
        setBusy(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, sessionId]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chat?.length]);

  async function send() {
    const msg = input.trim();
    if (!msg) return;

    const now = new Date().toISOString();
    setChat((prev) => [...prev, { role: "candidate", content: msg, ts: now }]);
    setInput("");

    try {
      setBusy(true);
      setStatus("");
      const res = await fetchWithFallback("/interview/chat", {
        method: "POST",
        headers: await getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ session_id: sessionId, message: msg }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || res.statusText);
      setChat((prev) => [...prev, { role: "hr", content: j.response, ts: new Date().toISOString() }]);
    } catch (e) {
      setStatus(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  async function openReport() {
    try {
      setReportOpen(true);
      setReport(null);
      setReportLoading(true);
      const res = await fetchWithFallback(`/interview/sessions/${sessionId}/report`, {
        method: "GET",
        headers: await getAuthHeaders(),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || res.statusText);
      setReport(j.report || null);
    } catch (e) {
      setReport({ overall_score: "-", summary: String(e.message || e), strengths: [], gaps: [], improvements: [], next_steps: [], category_scores: {} });
    } finally {
      setReportLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-80px)] px-4 py-6 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-xl font-semibold text-[var(--text)]">{session?.role_target || "Mock Interview"}</div>
            <div className="text-xs text-[var(--muted)] mt-1">{session?.jd_source === "custom" ? "Custom JD" : "Predefined JD"}</div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/mock-interview")}
              className="px-4 py-2 rounded-2xl border border-[var(--border)] hover:bg-[var(--bg)] text-sm"
            >
              Back
            </button>
            <button
              onClick={openReport}
              disabled={busy}
              className="px-4 py-2 rounded-2xl border border-[var(--border)] hover:bg-[var(--bg)] text-sm"
            >
              Generate Report
            </button>
          </div>
        </div>

        {status && (
          <div className="mt-4 rounded-2xl border border-red-300/50 bg-red-500/10 p-3 text-sm text-[var(--text)]">
            {status}
          </div>
        )}

        <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
          <div ref={scrollerRef} className="h-[55vh] overflow-y-auto pr-1 space-y-3">
            {chat.map((m, i) => (
              <ChatBubble key={i} role={m.role}>
                {m.content}
              </ChatBubble>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Type your answer…"
              className="flex-1 px-4 py-3 rounded-2xl bg-[var(--card)] border border-[var(--border)] text-sm outline-none"
            />
            <button
              disabled={busy}
              onClick={send}
              className="px-5 py-3 rounded-2xl bg-[var(--accent)] text-white font-medium text-sm hover:opacity-90"
            >
              Send
            </button>
          </div>
        </div>

        <Modal open={reportOpen} title="Interview Report" onClose={() => setReportOpen(false)}>
          {reportLoading ? <div className="text-sm text-[var(--muted)]">Generating report…</div> : <ReportView report={report} />}
        </Modal>
      </div>
    </div>
  );
}

export default function MockInterview() {
  return (
    <Routes>
      <Route index element={<Dashboard />} />
      <Route path="new" element={<Setup />} />
      <Route path="chat/:sessionId" element={<ChatPage />} />
    </Routes>
  );
}
