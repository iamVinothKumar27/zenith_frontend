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
  if (typeof analysis === "string") return <div className="text-sm whitespace-pre-wrap">{analysis}</div>;

  const summary =
    analysis.summary ||
    analysis.overall_feedback ||
    analysis.overallFeedback ||
    analysis.feedback ||
    "";

  const strong =
    analysis.strong_sections ||
    analysis.strongSections ||
    analysis.strengths ||
    [];

  const improve =
    analysis.improve_knowledge ||
    analysis.improveKnowledge ||
    analysis.improvements ||
    analysis.action_plan ||
    analysis.actionPlan ||
    [];

  const strongArr = Array.isArray(strong) ? strong : strong ? [strong] : [];
  const improveArr = Array.isArray(improve) ? improve : improve ? [improve] : [];

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
              <span
                key={i}
                className="px-2.5 py-1 rounded-full border border-green-200 bg-green-50 text-green-700 text-xs font-semibold"
              >
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
              if (typeof it === "string") {
                return (
                  <div key={i} className="text-sm whitespace-pre-wrap">
                    {it}
                  </div>
                );
              }

              const ap = it.action_plan || it.actionPlan || it.plan || "";
              const topics = it.topics || [];
              const section = it.section || it.domain || "";
              const resources =
                it.resources_suggestion ||
                it.resourcesSuggestion ||
                it.resources ||
                "";

              return (
                <div
                  key={i}
                  className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
                >
                  <div className="font-semibold text-sm text-[var(--text)]">
                    {section ? String(section).toUpperCase() : `Item ${i + 1}`}
                  </div>

                  {ap ? <div className="mt-2 text-sm whitespace-pre-wrap">{ap}</div> : null}

                  {Array.isArray(topics) && topics.length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {topics.map((t, k) => (
                        <span
                          key={k}
                          className="px-2.5 py-1 rounded-full border border-[var(--border)] bg-[var(--bg)] text-xs font-semibold text-[var(--muted)]"
                        >
                          {String(t)}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {resources ? (
                    <div className="mt-2 text-xs text-[var(--muted)] whitespace-pre-wrap">
                      Resources: {toText(resources)}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {!summary && !strongArr.length && !improveArr.length ? (
        <div className="text-sm whitespace-pre-wrap">{toText(analysis)}</div>
      ) : null}
    </div>
  );
}

function CodingDetailsView({ coding }) {
  if (!coding) return <div className="text-sm text-[var(--muted)]">No coding details stored.</div>;

  const entries = Object.entries(coding || {});
  if (!entries.length) {
    return <div className="text-sm text-[var(--muted)]">No coding details stored.</div>;
  }

  return (
    <div className="space-y-4">
      {entries.map(([slug, d]) => {
        const results = Array.isArray(d?.results) ? d.results : [];
        const passed = results.filter((r) => r?.passed).length;
        const failed = results.length - passed;

        return (
          <div
            key={slug}
            className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="font-semibold text-[var(--text)]">
                {slug.replaceAll("-", " ")}
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full border border-[var(--border)] bg-[var(--bg)] text-xs font-semibold text-[var(--muted)]">
                  Marks: {d?.marks_awarded ?? 0} / {d?.full_marks ?? 0}
                </span>

                <span
                  className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${
                    d?.passed
                      ? "border-green-200 bg-green-50 text-green-700"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
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
                        <td className="px-4 py-2 whitespace-pre-wrap">
                          {toText(r?.expected)}
                        </td>
                        <td className="px-4 py-2 whitespace-pre-wrap">
                          {toText(r?.stdout || r?.output || r?.actual)}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${
                              r?.passed
                                ? "border-green-200 bg-green-50 text-green-700"
                                : "border-red-200 bg-red-50 text-red-700"
                            }`}
                          >
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

export default function AdminPracticeTestDetail() {
  const { uid, sessionId } = useParams();
  const { token, apiBase } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [session, setSession] = useState(null);

  const scorePercent = useMemo(() => {
    if (!session) return null;
    const ts = session.total_score;
    const tm = session.total_marks;
    if (ts == null || !tm) return null;
    return Math.round((Number(ts) / Number(tm)) * 10000) / 100;
  }, [session]);

  const hasCodingDetails = useMemo(() => {
    const coding = session?.coding_details;
    return !!(coding && typeof coding === "object" && Object.keys(coding).length);
  }, [session]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${apiBase}/admin/user/${uid}/practicetests/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const j = await res.json();
        if (!res.ok || !j?.ok) throw new Error(j?.error || "Failed");
        setSession(j.session);
      } catch (e) {
        setError(e.message || "Failed");
      } finally {
        setLoading(false);
      }
    })();
  }, [apiBase, token, uid, sessionId]);

  if (loading) return <div className="max-w-6xl mx-auto px-4 py-8">Loading…</div>;
  if (error) return <div className="max-w-6xl mx-auto px-4 py-8 text-red-600">{error}</div>;
  if (!session) return <div className="max-w-6xl mx-auto px-4 py-8">Not found.</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-sm opacity-70">Practice Test • {safeText(session.mode, "practice")}</div>
          <h1 className="text-2xl font-bold">{session.title || "Practice Test"}</h1>
          <div className="text-xs opacity-70 mt-1">
            Created: {fmtDate(session.createdAt)} • Submitted: {fmtDate(session.submittedAt)}
          </div>
        </div>

        <button className="px-4 py-2 rounded-full border" onClick={() => navigate(-1)}>
          Back
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card title="Score">
          <div className="text-2xl font-bold">
            {session.total_score ?? 0} / {session.total_marks ?? 0}
          </div>
          <div className="text-sm opacity-70">
            {scorePercent == null ? "—" : `${scorePercent}%`}
          </div>
        </Card>

        <Card title="Status">
          <div className="text-lg font-semibold">
            {safeText(session.status, "").toUpperCase() || "—"}
          </div>
        </Card>

        <Card title="Topic">
          <div className="text-lg font-semibold">{safeText(session.topic)}</div>
        </Card>

        <Card title="Mode">
          <div className="text-lg font-semibold">{session.mode || "practice"}</div>
        </Card>
      </div>

      <div className={`mt-6 grid grid-cols-1 gap-4 ${hasCodingDetails ? "lg:grid-cols-2" : ""}`}>
        <div className="ui-card p-5">
          <div className="text-sm font-semibold mb-3">Analysis</div>
          <AnalysisView analysis={session.analysis} />
        </div>

        {hasCodingDetails ? (
          <div className="ui-card p-5">
            <div className="text-sm font-semibold mb-3">Coding details</div>
            <CodingDetailsView coding={session.coding_details} />
          </div>
        ) : null}
      </div>
    </div>
  );
}