import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider.jsx";
import AtsAnalyticsCharts from "../components/AtsAnalyticsCharts.jsx";
import { extractPdfText } from "../utils/extractPdfText.js";

// Same backend fallback logic as AuthProvider (kept local to avoid coupling)
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

function StatCard({ label, value }) {
  return (
    <div className="px-4 py-3 rounded-2xl bg-[var(--bg)] border border-[var(--border)]">
      <div className="text-xs text-[var(--muted)]">{label}</div>
      <div className="text-2xl font-bold text-[var(--text)]">{value}</div>
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
      className="text-xs px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--text)] hover:opacity-90"
      title="Copy to clipboard"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function Chip({ children }) {
  return (
    <span className="text-xs px-3 py-1 rounded-full bg-[var(--bg)] border border-[var(--border)]">
      {children}
    </span>
  );
}

function Bubble({ side = "left", label, text }) {
  const isRight = side === "right";
  return (
    <div className={`flex ${isRight ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "max-w-[92%] md:max-w-[90%]",
          "rounded-2xl border",
          "px-4 py-3",
          isRight ? "bg-black border-black text-white" : "bg-[var(--bg)]",
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

export default function ResumeRank() {
  const { user } = useAuth();

  const [resumeFile, setResumeFile] = useState(null);

  // JD: allow either file or text (kept in one input block in UI)
  const [jdFile, setJdFile] = useState(null);
  const [jdText, setJdText] = useState("");

  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");

  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState(null);

  async function getAuthHeaders(extra = {}) {
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}`, ...extra };
  }

  async function analyze() {
    if (!resumeFile) {
      setStatus("Please upload your resume PDF or DOCX.");
      return;
    }
    if (!jdFile && !jdText.trim()) {
      setStatus("Please upload a JD file or paste JD text.");
      return;
    }

    const isPdf = (f) =>
      !!f && ((f.type || "").toLowerCase().includes("pdf") || (f.name || "").toLowerCase().endsWith(".pdf"));

    try {
      setBusy(true);
      setStatus("");
      setResult(null);

      // Render-safe path: if resume is PDF, extract text in browser and send JSON (no PDF parsing on backend).
      if (isPdf(resumeFile)) {
        const resumeText = (await extractPdfText(resumeFile)).trim();

        let jdTextFinal = jdText.trim();
        if (!jdTextFinal && jdFile) {
          if (!isPdf(jdFile)) {
            throw new Error("JD file must be a PDF or paste JD text.");
          }
          jdTextFinal = (await extractPdfText(jdFile)).trim();
        }

        const res = await fetchWithFallback("/ats/analyze", {
          method: "POST",
          headers: await getAuthHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({
            resume_text: resumeText,
            jd_text: jdTextFinal,
            company: company.trim(),
            role: role.trim(),
          }),
        });

        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j?.error || res.statusText);
        setResult(j);
        return;
      }

      // Legacy path (DOCX resume): keep multipart upload to preserve template downloads.
      const form = new FormData();
      form.append("resume_file", resumeFile);
      if (jdFile) form.append("jd_file", jdFile);
      if (jdText.trim()) form.append("jd_text", jdText.trim());
      if (company.trim()) form.append("company", company.trim());
      if (role.trim()) form.append("role", role.trim());

      const res = await fetchWithFallback("/ats/analyze", {
        method: "POST",
        headers: await getAuthHeaders(), // do NOT set Content-Type
        body: form,
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || res.statusText);
      setResult(j);
    } catch (e) {
      setStatus(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  const ats = result?.ats;
  const tips = result?.tips;
  const analytics = result?.analytics;

  const missingReqs = result?.missing_requirements || tips?.missing_requirements || [];
  const tailoredDiff = tips?.tailored_diff || [];

  const improvements = tips?.improvements || [];
  const matchedSkills = ats?.matched_skills || [];
  const missingSkills = ats?.missing_skills || [];
  const missingSkillsPriority = tips?.missing_skills_priority || [];

  const tailoredCopyAll = useMemo(() => {
    if (!tailoredDiff?.length) return "";
    return tailoredDiff
      .map((b) => `### ${b.section}\n${(b.new_content || "").trim()}\n`)
      .join("\n");
  }, [tailoredDiff]);

  return (
    <div className="min-h-[calc(100vh-80px)] px-4 py-8 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text)]">Zenith ATS Intelligence</h1>
            <p className="text-sm text-[var(--muted)] mt-1">
              Upload your resume + JD and get ATS analytics, missing requirements, and Gemini improvements.
            </p>
          </div>

          <Link
            to="/ats-history"
            className="px-4 py-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] text-sm text-[var(--text)] hover:opacity-90"
          >
            View ATS History
          </Link>
        </div>

        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
            <div className="text-sm font-semibold text-[var(--text)]">Company</div>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g., Micron"
              className="mt-3 w-full rounded-2xl bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--muted)] outline-none"
            />
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
            <div className="text-sm font-semibold text-[var(--text)]">Role</div>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g., Senior Data Scientist"
              className="mt-3 w-full rounded-2xl bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--muted)] outline-none"
            />
          </div>
        </div>

        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
            <div className="text-sm font-semibold text-[var(--text)]">Resume (PDF or DOCX)</div>
            <input
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
              className="mt-3 w-full text-sm"
            />
            {resumeFile?.name && (
              <div className="mt-2 text-xs text-[var(--muted)]">Selected: {resumeFile.name}</div>
            )}
          </div>

          {/* JD file + JD text are ONE section (per request) */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
            <div className="text-sm font-semibold text-[var(--text)]">Job Description (file or text)</div>

            <input
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => setJdFile(e.target.files?.[0] || null)}
              className="mt-3 w-full text-sm"
            />
            {jdFile?.name && <div className="mt-2 text-xs text-[var(--muted)]">Selected: {jdFile.name}</div>}

            <div className="mt-4 text-xs font-semibold text-[var(--muted)]">or paste JD text</div>
            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste the job description here..."
              className="mt-2 w-full min-h-[140px] rounded-2xl bg-[var(--bg)] border border-[var(--border)] p-4 text-sm text-[var(--text)] placeholder:text-[var(--muted)] outline-none"
            />
          </div>
        </div>

        {status && (
          <div className="mt-4 rounded-2xl border border-red-300/50 bg-red-500/10 p-3 text-sm text-[var(--text)]">
            {status}
          </div>
        )}

        <div className="mt-5">
          <button
            disabled={busy}
            onClick={analyze}
            className="px-6 py-3 rounded-2xl bg-[var(--accent)] text-white font-semibold text-sm hover:opacity-90"
          >
            {busy ? "Analyzing..." : "Analyze ATS Intelligence"}
          </button>
        </div>

        {result && (
          <div className="mt-8 space-y-4">
            <div className="flex flex-wrap gap-3">
              <StatCard label="ATS Score" value={ats?.score ?? "-"} />
              <StatCard label="Keyword coverage" value={`${ats?.coverage ?? "-"}%`} />
              <StatCard label="Matched skills" value={matchedSkills.length} />
              <StatCard label="Missing skills" value={missingSkills.length} />
            </div>

            {/* ✅ Main: Analytics (left) + Tailored Content (right)
                Make BOTH columns scrollable (desktop), instead of growing page height */}
            <div className="grid md:grid-cols-2 gap-4 md:h-[calc(100vh-260px)] md:overflow-hidden">
              {/* LEFT: analytics + missing skills/reqs + improvements */}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 md:h-full md:overflow-y-auto md:pr-2 [scrollbar-gutter:stable]">
                <div className="text-sm font-semibold text-[var(--text)]">ATS analytics</div>
                <div className="mt-3">
                  <AtsAnalyticsCharts analytics={analytics || {}} />
                </div>

                <div className="mt-5">
                  <div className="text-sm font-semibold text-[var(--text)]">Missing skills</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(missingSkills || []).slice(0, 40).map((k) => (
                      <Chip key={k}>{k}</Chip>
                    ))}
                    {(!missingSkills || missingSkills.length === 0) && (
                      <div className="text-sm text-[var(--muted)]">No missing skills detected.</div>
                    )}
                  </div>
                </div>

                <div className="mt-5">
                  <div className="text-sm font-semibold text-[var(--text)]">Missing requirements</div>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Education / Experience / Achievements requirements that appear in the JD but are weak or absent in the resume.
                  </p>

                  {missingReqs.length === 0 ? (
                    <div className="mt-3 text-sm text-[var(--muted)]">No missing requirements detected.</div>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {missingReqs.map((r, i) => (
                        <div key={i} className="p-3 rounded-2xl bg-[var(--bg)] border border-[var(--border)]">
                          <div className="text-sm font-semibold text-[var(--text)]">{r?.type || "requirement"}</div>
                          <div className="mt-1 text-sm text-[var(--text)]">{r?.requirement}</div>
                          {!!r?.details && (
                            <div className="mt-2 text-xs text-[var(--muted)] whitespace-pre-wrap">
                              {typeof r.details === "string" ? r.details : JSON.stringify(r.details, null, 2)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-5">
                  <div className="text-sm font-semibold text-[var(--text)]">Improvements (Gemini)</div>
                  {improvements.length === 0 ? (
                    <div className="mt-2 text-sm text-[var(--muted)]">No improvements returned for this session.</div>
                  ) : (
                    <ul className="mt-3 list-disc pl-5 text-sm text-[var(--text)] space-y-1">
                      {improvements.map((x, i) => (
                        <li key={i}>{x}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-5">
                  <div className="text-sm font-semibold text-[var(--text)]">Matched skills (top)</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(matchedSkills || []).slice(0, 24).map((k) => (
                      <Chip key={k}>{k}</Chip>
                    ))}
                    {(!matchedSkills || matchedSkills.length === 0) && (
                      <div className="text-sm text-[var(--muted)]">No matched skills detected.</div>
                    )}
                  </div>
                </div>

                {!!missingSkillsPriority?.length && (
                  <div className="mt-5">
                    <div className="text-sm font-semibold text-[var(--text)]">Missing skills priority</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {missingSkillsPriority.map((k) => (
                        <Chip key={k}>{k}</Chip>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT: Tailored diff (old -> new) */}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 md:h-full md:overflow-y-auto md:pr-2 [scrollbar-gutter:stable]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[var(--text)]">Tailored resume content</div>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      Old → New rewrites (ATS-friendly). Copy the NEW content and replace that section in your resume.
                    </p>
                  </div>

                  {tailoredDiff?.length ? <CopyButton text={tailoredCopyAll} /> : null}
                </div>

                {!tailoredDiff?.length ? (
                  <div className="mt-3 text-sm text-[var(--muted)]">Run analysis to generate tailored content.</div>
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
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
