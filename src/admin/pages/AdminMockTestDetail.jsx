import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider.jsx";

function fmtDate(v) {
  if (!v) return "";
  try {
    const d = new Date(v);
    if (!Number.isFinite(d.getTime())) return String(v);
    return d.toLocaleString();
  } catch {
    return String(v);
  }
}

function fmtDateIST(v) {
  if (!v) return "";
  try {
    const d = new Date(v);
    if (!Number.isFinite(d.getTime())) return String(v);
    return d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }) + " IST";
  } catch {
    return String(v);
  }
}

function safeText(v, fallback = "—") {
  if (v == null || v === "") return fallback;
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return v.map((x) => safeText(x, "")).filter(Boolean).join(", ") || fallback;
  if (typeof v === "object") {
    if (typeof v.name === "string" && v.name.trim()) return v.name;
    if (typeof v.title === "string" && v.title.trim()) return v.title;
    if (typeof v.label === "string" && v.label.trim()) return v.label;
    try {
      return JSON.stringify(v, null, 2);
    } catch {
      return fallback;
    }
  }
  return String(v);
}

function toText(v) {
  if (v == null) return "";
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

function AnalysisView({ analysis }) {
  if (!analysis) return <div className="text-sm text-[var(--muted)]">No analysis stored.</div>;

  // If backend stored plain text, render it.
  if (typeof analysis === "string") {
    return <div className="text-sm whitespace-pre-wrap">{analysis}</div>;
  }

  // Common fields from Gemini response
  const summary = analysis.summary || analysis.overall_feedback || analysis.overallFeedback || analysis.feedback || "";
  const strong = analysis.strong_sections || analysis.strongSections || analysis.strengths || [];
  const improve = analysis.improve_knowledge || analysis.improveKnowledge || analysis.improvements || analysis.action_plan || analysis.actionPlan || [];

  const strongArr = Array.isArray(strong) ? strong : (strong ? [strong] : []);
  const improveArr = Array.isArray(improve) ? improve : (improve ? [improve] : []);

  return (
    <div className="space-y-4">
      {summary ? (
        <div className="bg-[var(--bg)] border border-[var(--border)] rounded-xl p-4">
          <div className="text-xs font-semibold text-[var(--muted)] mb-2">Gemini feedback</div>
          <div className="text-sm whitespace-pre-wrap text-[var(--text)]">{toText(summary)}</div>
        </div>
      ) : null}

      {strongArr.length ? (
        <div className="bg-[var(--bg)] border border-[var(--border)] rounded-xl p-4">
          <div className="text-xs font-semibold text-[var(--muted)] mb-2">Strong sections</div>
          <div className="flex flex-wrap gap-2">
            {strongArr.map((s, i) => (
              <span key={i} className="px-2.5 py-1 rounded-full border border-green-200 bg-green-50 text-green-700 text-xs font-semibold">
                {String(s)}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {improveArr.length ? (
        <div className="bg-[var(--bg)] border border-[var(--border)] rounded-xl p-4">
          <div className="text-xs font-semibold text-[var(--muted)] mb-2">Improvements</div>
          <div className="space-y-3">
            {improveArr.map((it, i) => {
              if (typeof it === "string") return <div key={i} className="text-sm whitespace-pre-wrap">{it}</div>;
              const ap = it.action_plan || it.actionPlan || it.plan || "";
              const topics = it.topics || [];
              const section = it.section || it.domain || "";
              const resources = it.resources_suggestion || it.resourcesSuggestion || it.resources || "";
              return (
                <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold text-sm text-[var(--text)]">{section ? String(section).toUpperCase() : `Item ${i + 1}`}</div>
                  </div>
                  {ap ? <div className="mt-2 text-sm whitespace-pre-wrap">{ap}</div> : null}
                  {Array.isArray(topics) && topics.length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {topics.map((t, k) => (
                        <span key={k} className="px-2.5 py-1 rounded-full border border-[var(--border)] bg-[var(--bg)] text-xs font-semibold text-[var(--muted)]">
                          {String(t)}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {resources ? <div className="mt-2 text-xs text-[var(--muted)] whitespace-pre-wrap">Resources: {toText(resources)}</div> : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Fallback: show remaining analysis without raw JSON noise */}
      {!summary && !strongArr.length && !improveArr.length ? (
        <div className="text-sm whitespace-pre-wrap text-[var(--text)]">{toText(analysis)}</div>
      ) : null}
    </div>
  );
}

function CodingDetailsView({ coding }) {
  if (!coding) return <div className="text-sm text-[var(--muted)]">No coding details stored.</div>;

  const entries = Object.entries(coding || {});
  if (!entries.length) return <div className="text-sm text-[var(--muted)]">No coding details stored.</div>;

  return (
    <div className="space-y-4">
      {entries.map(([slug, d]) => {
        const results = Array.isArray(d?.results) ? d.results : [];
        const passed = results.filter((r) => r?.passed).length;
        const failed = results.length - passed;

        return (
          <div key={slug} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="font-semibold text-[var(--text)]">{slug.replaceAll("-", " ")}</div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full border border-[var(--border)] bg-[var(--bg)] text-xs font-semibold text-[var(--muted)]">
                  Marks: {d?.marks_awarded ?? 0} / {d?.full_marks ?? 0}
                </span>
                <span className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${d?.passed ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}>
                  {d?.passed ? "Accepted" : "Not accepted"}
                </span>
              </div>
            </div>

            <div className="mt-3 text-sm text-[var(--muted)]">
              Testcases: {results.length} • Passed: {passed} • Failed: {failed}
            </div>

            {results.length ? (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-[rgba(16,185,129,0.08)] text-[var(--muted)]">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium">#</th>
                      <th className="text-left px-4 py-2 font-medium">Type</th>
                      <th className="text-left px-4 py-2 font-medium">Expected</th>
                      <th className="text-left px-4 py-2 font-medium">Output</th>
                      <th className="text-left px-4 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {results.map((r, i) => (
                      <tr key={i} className="hover:bg-[var(--bg)]">
                        <td className="px-4 py-2 font-semibold">{i + 1}</td>
                        <td className="px-4 py-2">{r?.isSample ? "Sample" : "Hidden"}</td>
                        <td className="px-4 py-2 whitespace-pre-wrap">{toText(r?.expected)}</td>
                        <td className="px-4 py-2 whitespace-pre-wrap">{toText(r?.stdout || r?.output || r?.actual)}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${r?.passed ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}>
                            {r?.passed ? "Passed" : "Failed"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="ui-card p-5">
      <div className="text-sm text-[var(--muted)]">{title}</div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

export default function AdminMockTestDetail() {
  const { uid, sessionId } = useParams();
  const { token, apiBase } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [session, setSession] = useState(null);

  const hasCoding = useMemo(() => {
    const mode = String(session?.mode || "").toLowerCase();
    // Only show coding section when the test actually contains coding.
    // Some patterns include `C0` (no coding) so we must not treat that as coding.
    const pattern = String(session?.pattern || "").toUpperCase();
    const codingTotal = Number(session?.scores?.coding_total ?? session?.coding_total ?? 0) || 0;
    const codingScore = Number(session?.scores?.coding ?? session?.coding ?? 0) || 0;

    // detect C-count from pattern if present: e.g. "G5,T5,C1" => 1
    let cCount = 0;
    try {
      const m = pattern.match(/C\s*\D*([0-9]+)/i);
      if (m && m[1] != null) cCount = Number(m[1]) || 0;
    } catch {}

    const hasDetails = !!(session?.coding_details && Object.keys(session.coding_details || {}).length);

    return (
      mode === "coding" ||
      mode === "all" ||
      codingTotal > 0 ||
      codingScore > 0 ||
      cCount > 0 ||
      hasDetails
    );
  }, [session]);

  const scorePercent = useMemo(() => {
    if (!session) return null;
    const ts = session.total_score;
    const tm = session.total_marks;
    if (ts == null || !tm) return null;
    const p = (Number(ts) / Number(tm)) * 100;
    return Number.isFinite(p) ? Math.round(p) : null;
  }, [session]);

  useEffect(() => {
    (async () => {
      if (!token || !uid || !sessionId) return;
      setLoading(true);
      setError("");
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const res = await fetch(
          `${apiBase}/admin/user/${encodeURIComponent(uid)}/mocktests/${encodeURIComponent(sessionId)}`,
          { headers }
        );
        const j = await res.json().catch(() => ({}));
        if (!res.ok || !j.ok) throw new Error(j.error || `HTTP ${res.status}`);
        setSession(j.session || null);
      } catch (e) {
        setError(String(e.message || e));
        setSession(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [token, apiBase, uid, sessionId]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-end justify-between gap-3 mb-6">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm font-semibold"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-[var(--text)] mt-2">Mock Test Detail</h1>
          <div className="text-sm text-[var(--muted)] mt-1">Session: {sessionId}</div>
        </div>

        <button
          onClick={() => navigate(`/admin/user/${encodeURIComponent(uid)}?tab=mocktests`)}
          className="px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm font-semibold"
        >
          Open user
        </button>
      </div>

      {error ? <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 mb-6">{error}</div> : null}
      {loading ? <div className="text-[var(--muted)]">Loading…</div> : null}

      {!loading && session ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card title="Mode">
              <div className="text-lg font-bold text-[var(--text)]">{safeText(session.mode)}</div>
            </Card>
            <Card title="Score">
              <div className="text-lg font-bold text-[var(--text)]">
                {session.total_score ?? "—"} / {session.total_marks ?? "—"}
              </div>
              <div className="text-xs text-[var(--muted)] mt-1">{scorePercent == null ? "" : `${scorePercent}%`}</div>
            </Card>
            <Card title="Submitted">
              <div className="text-sm text-[var(--text)]">{fmtDate(session.submittedAt) || "—"}</div>
              <div className="text-xs text-[var(--muted)] mt-1">Created: {fmtDate(session.createdAt) || "—"}</div>
            </Card>
            <Card title="Split scores">
              <div className="text-sm text-[var(--text)]">
                General: {session.scores?.general ?? 0} / {session.scores?.general_total ?? 0}
              </div>
              <div className="text-sm text-[var(--text)] mt-1">
                Tech: {session.scores?.tech ?? 0} / {session.scores?.tech_total ?? 0}
              </div>
              <div className="text-sm text-[var(--text)] mt-1">
                Coding: {session.scores?.coding ?? 0} / {session.scores?.coding_total ?? 0}
              </div>
            </Card>
          </div>

          <div className={hasCoding ? "grid grid-cols-1 lg:grid-cols-2 gap-4" : "grid grid-cols-1 gap-4"}>
            <div className={`ui-card p-5 ${hasCoding ? "" : "w-full"}`}>
              <div className="font-semibold mb-2">Feedback & improvements</div>
              <div className="max-h-[70vh] overflow-y-auto pr-2">
                <AnalysisView analysis={session.analysis} />
              </div>
            </div>

            {hasCoding ? (
            <div className="ui-card p-5">
              <div className="font-semibold mb-2">Coding details</div>
              <div className="max-h-[70vh] overflow-y-auto pr-2">
                <CodingDetailsView coding={session.coding_details} />
              </div>
            </div>
            ) : null}
          </div>

          {session?.proctoring?.enabled ? (
            <div className="ui-card p-5 mt-6">
              <div className="font-semibold mb-4">Proctoring</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <Card title="Violations">
                  <div className="text-2xl font-bold text-[var(--text)]">{Number(session?.proctoring?.violations || 0)}</div>
                </Card>
                <Card title="Allowed limit">
                  <div className="text-2xl font-bold text-[var(--text)]">{Number(session?.proctoring?.violation_limit || 3)}</div>
                </Card>
                <Card title="Status">
                  <div className="text-sm font-semibold text-[var(--text)]">
                    {session?.proctoring?.auto_submitted ? "Auto-submitted due to violation" : "No auto-submit"}
                  </div>
                </Card>
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
                <div className="text-xs font-semibold text-[var(--muted)] mb-3">Warnings</div>
                {(session?.proctoring?.warnings || []).length ? (
                  <div className="space-y-2 text-sm text-[var(--text)]">
                    {(session?.proctoring?.warnings || []).map((w, i) => (
                      <div key={i}>
                        {(w?.message || `Warning ${i + 1}`)} • {fmtDateIST(w?.at || w?.at_ist)}
                      </div>
                    ))}
                  </div>
                ) : <div className="text-sm text-[var(--muted)]">No warnings.</div>}
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 mt-4">
                <div className="text-xs font-semibold text-[var(--muted)] mb-3">Event log</div>
                {(session?.proctoring?.events || []).length ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-[rgba(16,185,129,0.08)] text-[var(--muted)]">
                        <tr>
                          <th className="text-left px-4 py-2 font-medium">#</th>
                          <th className="text-left px-4 py-2 font-medium">Type</th>
                          <th className="text-left px-4 py-2 font-medium">Time (IST)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {(session?.proctoring?.events || []).map((ev, i) => (
                          <tr key={i}>
                            <td className="px-4 py-2">{i + 1}</td>
                            <td className="px-4 py-2">{ev?.type || "screen-switch"}</td>
                            <td className="px-4 py-2">{fmtDateIST(ev?.at || ev?.at_ist)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <div className="text-sm text-[var(--muted)]">No proctoring events.</div>}
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
