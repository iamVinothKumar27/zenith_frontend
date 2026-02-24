import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider.jsx";
import AtsAnalyticsCharts from "../components/AtsAnalyticsCharts.jsx";

const API_BASES = (
  import.meta.env.VITE_API_BASES ||
  import.meta.env.VITE_API_BASE ||
  "http://127.0.0.1:5000"
)
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

function Card({ children, className = "" }) {
  return (
    <div
      className={[
        "rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = React.useState(false);

  async function onCopy() {
    const t = text || "";
    try {
      await navigator.clipboard.writeText(t);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (e) {
      try {
        const ta = document.createElement("textarea");
        ta.value = t;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      } catch (_) {}
    }
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      className="px-3 py-1 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-xs text-[var(--text)] hover:opacity-90"
      title="Copy"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function Bubble({ side = "left", label, text }) {
  const isRight = side === "right";
  return (
    <div className={`flex ${isRight ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "max-w-[96%]",
          "rounded-2xl border",
          "px-4 py-3",
          isRight
            ? "bg-black border-black text-white"
            : "bg-[var(--bg)] border-[var(--border)] text-[var(--text)]",
        ].join(" ")}
      >
        <div
          className={
            isRight
              ? "text-[11px] font-semibold text-white/70"
              : "text-[11px] font-semibold text-[var(--muted)]"
          }
        >
          {label}
        </div>
        <div
          className={
            isRight
              ? "mt-2 text-sm whitespace-pre-wrap text-white"
              : "mt-2 text-sm whitespace-pre-wrap text-[var(--text)]"
          }
        >
          {(text || "").trim() || "—"}
        </div>
      </div>
    </div>
  );
}

export default function AtsHistory() {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [sessions, setSessions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);

  // ✅ Only used to control the right preview panel
  const [showPreview, setShowPreview] = useState(false);
  const [showImprovements, setShowImprovements] = useState(false);

  async function getAuthHeaders(extra = {}) {
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}`, ...extra };
  }

  async function loadSessions() {
    try {
      setBusy(true);
      setStatus("");
      const res = await fetchWithFallback("/ats/sessions", {
        method: "GET",
        headers: await getAuthHeaders(),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || res.statusText);
      setSessions(j?.sessions || []);
    } catch (e) {
      setStatus(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  async function loadDetail(session_id) {
    if (!session_id) return;
    try {
      setBusy(true);
      setStatus("");
      const res = await fetchWithFallback(`/ats/sessions/${session_id}`, {
        method: "GET",
        headers: await getAuthHeaders(),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || res.statusText);
      setDetail(j);
    } catch (e) {
      setStatus(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  async function deleteSession(session_id) {
    if (!session_id) return;
    try {
      setBusy(true);
      setStatus("");
      const res = await fetchWithFallback(`/ats/sessions/${session_id}`, {
        method: "DELETE",
        headers: await getAuthHeaders(),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || res.statusText);

      if (selected === session_id) {
        setSelected(null);
        setDetail(null);
        setShowPreview(false);
      }
      await loadSessions();
    } catch (e) {
      setStatus(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = useMemo(() => sessions || [], [sessions]);

  // Right panel data (from loaded detail)
  const s = detail?.session;
  const ats = detail?.ats || {};
  const analytics = detail?.analytics || {};
  const tips = detail?.tips || {};
  const tailoredDiff = tips?.tailored_diff || [];

  const tailoredCopyAll = useMemo(() => {
    if (!tailoredDiff?.length) return "";
    return tailoredDiff
      .map((b) => `### ${b.section}\n${(b.new_content || "").trim()}\n`)
      .join("\n");
  }, [tailoredDiff]);

  const title =
    s?.title ||
    `${s?.company || ""}${s?.role ? " - " + s.role : ""}`.trim() ||
    "ATS Session";

  return (
    <div className="min-h-[calc(100vh-80px)] px-4 py-8 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text)]">ATS History</h1>
            <p className="text-sm text-[var(--muted)] mt-1">
              Saved as <b>company-role-resume</b>. View and delete anytime.
            </p>
          </div>
          <Link
            to="/resume-rank"
            className="px-4 py-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] text-sm text-[var(--text)] hover:opacity-90"
          >
            Back to ATS
          </Link>
        </div>

        {status && (
          <div className="mt-4 rounded-2xl border border-red-300/50 bg-red-500/10 p-3 text-sm text-[var(--text)]">
            {status}
          </div>
        )}

        <div className="mt-6 grid lg:grid-cols-3 gap-4">
          {/* LEFT: Sessions (only Preview/Close/Delete buttons) */}
          <Card>
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-[var(--text)]">Sessions</div>
              <button
                disabled={busy}
                onClick={loadSessions}
                className="text-xs px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] hover:opacity-90"
              >
                Refresh
              </button>
            </div>

            <div className="mt-3 space-y-2 max-h-[560px] overflow-auto pr-1">
              {rows.length === 0 && (
                <div className="text-sm text-[var(--muted)]">No sessions yet.</div>
              )}

              {rows.map((x) => {
                const t =
                  x?.title ||
                  `${x?.company || ""}${x?.role ? " - " + x.role : ""}`.trim() ||
                  "ATS Session";

                const active = selected === x.session_id;

                return (
                  <div
                    key={x.session_id}
                    className={`w-full px-3 py-3 rounded-2xl border ${
                      active ? "border-[var(--accent)]" : "border-[var(--border)]"
                    } bg-[var(--bg)]`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-[var(--text)] truncate">{t}</div>
                        <div className="mt-1 text-xs text-[var(--muted)] truncate">
                          {x.resume_filename || "resume"} • Score {x?.ats?.score ?? "-"}
                        </div>
                      </div>

                      {/* ONLY these 3 buttons */}
                      <div className="flex gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={async () => {
                            setSelected(x.session_id);
                            setShowPreview(true);
                            setShowImprovements(false);
                            await loadDetail(x.session_id);
                          }}
                          className={`px-3 py-1 rounded-xl text-xs border ${
                            active && showPreview
                              ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                              : "border-[var(--border)] bg-[var(--bg)] text-[var(--text)]"
                          }`}
                        >
                          Preview
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (active) setShowPreview(false);
                          }}
                          className={`px-3 py-1 rounded-xl text-xs border ${
                            active && !showPreview
                              ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                              : "border-[var(--border)] bg-[var(--bg)] text-[var(--text)]"
                          }`}
                        >
                          Close
                        </button>

                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => deleteSession(x.session_id)}
                          className="px-3 py-1 rounded-xl text-xs border border-red-300/60 bg-red-500/10 text-[var(--text)] hover:opacity-90"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* RIGHT: Preview content panel only */}
          <div className="lg:col-span-2 space-y-4">
            {!selected && (
              <Card>
                <div className="text-sm text-[var(--muted)]">Select a session and click Preview.</div>
              </Card>
            )}

            {selected && !showPreview && (
              <Card>
                <div className="text-sm text-[var(--muted)]">
                  Preview closed. Click <b>Preview</b> on a session to view details.
                </div>
              </Card>
            )}

            {selected && showPreview && (
              <>
                <Card>
                  <div className="text-lg font-bold text-[var(--text)] truncate">{title}</div>
                  <div className="mt-1 text-xs text-[var(--muted)]">
                    {s?.created_at ? new Date(s.created_at).toLocaleString() : ""}
                  </div>
                  <div className="mt-1 text-xs text-[var(--muted)] truncate">
                    Resume: {s?.resume_filename || "-"}
                  </div>

                  <div className="mt-3 text-xs text-[var(--muted)]">
                    Score: <b className="text-[var(--text)]">{ats?.score ?? "-"}</b> • Coverage:{" "}
                    <b className="text-[var(--text)]">{ats?.coverage ?? "-"}%</b> • Matched:{" "}
                    <b className="text-[var(--text)]">{(ats?.matched_skills || []).length}</b> • Missing:{" "}
                    <b className="text-[var(--text)]">{(ats?.missing_skills || []).length}</b>
                  </div>
                </Card>

                <div className="grid md:grid-cols-2 gap-4 md:h-[calc(100vh-280px)] md:overflow-hidden">
                  {/* LEFT: Analytics */}
                  <Card className="md:h-full md:overflow-y-auto md:pr-2 [scrollbar-gutter:stable]">
                    <div className="text-sm font-semibold text-[var(--text)]">ATS analytics</div>
                    <div className="mt-3">
                      <AtsAnalyticsCharts analytics={analytics || {}} />
                    </div>

                    <div className="mt-5">
                      <button
                        type="button"
                        onClick={() => setShowImprovements((v) => !v)}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border border-[var(--border)] bg-[var(--bg)] text-sm text-[var(--text)] hover:opacity-90"
                      >
                        <span className="font-semibold">Improvements</span>
                        <span className="text-xs text-[var(--muted)]">
                          {showImprovements ? "Hide" : "Show"}
                        </span>
                      </button>

                      {showImprovements && (
                        <div className="mt-3 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
                          {(!tips?.improvements || tips.improvements.length === 0) ? (
                            <div className="text-sm text-[var(--muted)]">No improvements stored for this session.</div>
                          ) : (
                            <ul className="list-disc pl-5 text-sm text-[var(--text)] space-y-1">
                              {tips.improvements.map((x, i) => (
                                <li key={i}>{x}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* RIGHT: Tailored content */}
                  <Card className="md:h-full md:overflow-y-auto md:pr-2 [scrollbar-gutter:stable]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-[var(--text)]">Tailored resume content</div>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          Old → New rewrites. Copy NEW and replace that section in your resume.
                        </p>
                      </div>
                      {tailoredDiff?.length ? <CopyButton text={tailoredCopyAll} /> : null}
                    </div>

                    {!tailoredDiff?.length ? (
                      <div className="mt-3 text-sm text-[var(--muted)]">No tailored content found for this session.</div>
                    ) : (
                      <div className="mt-4 space-y-4">
                        {tailoredDiff.map((b, idx) => (
                          <div key={idx} className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold text-[var(--text)]">{b.section}</div>
                                {!!b?.replace_instruction && (
                                  <div className="mt-1 text-xs text-[var(--muted)]">{b.replace_instruction}</div>
                                )}
                              </div>
                              <CopyButton text={(b.new_content || "").trim()} />
                            </div>

                            <div className="mt-4 space-y-3">
                              <Bubble side="left" label="OLD" text={b.old_content} />
                              <Bubble side="right" label="NEW" text={b.new_content} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
