import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider.jsx";
import { motion } from "framer-motion";
import {
  Brain,
  Puzzle,
  Code2,
  Flame,
  Play,
  Send,
  Sun,
  Moon,
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

const MCQ_PER_Q_SEC = 90;

function pad2(n) {
  const x = Math.max(0, Math.floor(Number(n || 0)));
  return String(x).padStart(2, "0");
}

function fmtClock(totalSec) {
  const s = Math.max(0, Math.floor(Number(totalSec || 0)));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return h > 0 ? `${h}:${pad2(m)}:${pad2(ss)}` : `${m}:${pad2(ss)}`;
}

function codingTimeSec(difficulty) {
  const d = (difficulty || "").toLowerCase();
  if (d === "easy") return 10 * 60;
  if (d === "medium") return 15 * 60;
  if (d === "hard" || d === "difficult") return 25 * 60;
  return 15 * 60;
}

function defaultStarter(lang) {
  const l = (lang || "python").toLowerCase();
  if (l === "java") {
    return `import java.io.*;\nimport java.util.*;\n\npublic class Main {\n  static void solve(FastScanner fs, StringBuilder out) throws Exception {\n    // TODO: implement\n  }\n\n  public static void main(String[] args) throws Exception {\n    FastScanner fs = new FastScanner(System.in);\n    StringBuilder out = new StringBuilder();\n    solve(fs, out);\n    System.out.print(out.toString());\n  }\n\n  static class FastScanner {\n    private final InputStream in;\n    private final byte[] buffer = new byte[1 << 16];\n    private int ptr = 0, len = 0;\n    FastScanner(InputStream is){ in=is; }\n    private int read() throws IOException {\n      if (ptr >= len) {\n        len = in.read(buffer);\n        ptr = 0;\n        if (len <= 0) return -1;\n      }\n      return buffer[ptr++];\n    }\n    String next() throws IOException {\n      StringBuilder sb = new StringBuilder();\n      int c;\n      while ((c = read()) != -1 && c <= ' ') {}\n      if (c == -1) return null;\n      do { sb.append((char)c); } while ((c = read()) != -1 && c > ' ');\n      return sb.toString();\n    }\n    Integer nextInt() throws IOException {\n      String s = next();\n      return s == null ? null : Integer.parseInt(s);\n    }\n  }\n}\n`;
  }
  if (l === "cpp" || l === "c++") {
    return `#include <bits/stdc++.h>\nusing namespace std;\n\nint main(){\n  ios::sync_with_stdio(false);\n  cin.tie(nullptr);\n\n  // TODO: parse input and implement\n\n  return 0;\n}\n`;
  }
  return `import sys\n\ndef solve():\n    data = sys.stdin.read().strip().split()\n    # TODO: parse input and implement\n    return\n\nif __name__ == "__main__":\n    solve()\n`;
}

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

function Spinner({ size = 16 }) {
  return <Loader2 size={size} className="animate-spin" />;
}

// =============================
// ✅ Mock Test HOME
// =============================
export function CreateMockTest() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [expanded, setExpanded] = useState(false);
  const [selectedKey, setSelectedKey] = useState("general");
  const [count, setCount] = useState(15);
  const [difficulty, setDifficulty] = useState("mixed");
  const [title, setTitle] = useState("Mock Test");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [patternGeneral, setPatternGeneral] = useState(10);
  const [patternTech, setPatternTech] = useState(10);
  const [patternCoding, setPatternCoding] = useState(2);

  const tokenGetter = async () => (user ? await user.getIdToken() : "");

  const cards = [
    { key: "general", label: "General Aptitude", desc: "Quant • Logical • Verbal (company screening)", defaultCount: 15, icon: Brain },
    { key: "tech", label: "Tech Aptitude", desc: "DSA basics • OOP • OS • CN • DBMS", defaultCount: 15, icon: Puzzle },
    { key: "coding", label: "Coding", desc: "DSA problems with hidden testcases", defaultCount: 2, icon: Code2 },
    { key: "all", label: "All-in-One", desc: "General + Tech + Coding (full screening)", defaultCount: 30, icon: Flame },
  ];

  const active = cards.find((c) => c.key === selectedKey) || cards[0];

  useEffect(() => {
    const c = cards.find((x) => x.key === selectedKey) || cards[0];
    if (!c) return;
    setCount(c.defaultCount);
    if (c.key === "all") {
      setPatternGeneral(10);
      setPatternTech(10);
      setPatternCoding(2);
    }
    setTitle(`${c.label} Mock Test`);
  }, [selectedKey]);

  async function create() {
    if (!active) return;
    setErr("");
    setLoading(true);
    try {
      const token = await tokenGetter();

      const n = Math.max(1, parseInt(count || 0, 10) || 1);
      const allPattern = {
        general: Math.max(0, parseInt(patternGeneral || 0, 10) || 0),
        tech: Math.max(0, parseInt(patternTech || 0, 10) || 0),
        coding: Math.max(0, parseInt(patternCoding || 0, 10) || 0),
      };

      const pattern =
        active.key === "general"
          ? { general: n, tech: 0, coding: 0 }
          : active.key === "tech"
          ? { general: 0, tech: n, coding: 0 }
          : active.key === "coding"
          ? { general: 0, tech: 0, coding: n }
          : allPattern;

      const res = await fetchWithFallback("/mocktest/session/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, mode: active.key, difficulty, pattern }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 503 && data?.code === "GEMINI_GENERATION_FAILED") {
          throw new Error((data?.error || "Gemini generation failed") + " — click Start Test again to regenerate.");
        }
        throw new Error(data?.error || "Failed to create mock test");
      }
      const sid = data?.session?.session_id;
      navigate(`/mock-test/${sid}`);
    } catch (e) {
      setErr(e.message || "Failed");
    } finally {
      setLoading(false);
    }
  }

  const isAll = active?.key === "all";

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Mock Test</h1>
          <p className="text-sm text-[var(--muted)]">Pick a test type, set pattern + difficulty, and start.</p>
        </div>
        <Link to="/my-tests" className="px-4 py-2 rounded-xl border border-[var(--border)] hover:bg-[var(--bg)] text-sm">
          View History
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((c, i) => {
          const Icon = c.icon;
          const isActive = c.key === selectedKey;
          return (
            <motion.button
              type="button"
              key={c.key}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.04 }}
              viewport={{ once: true }}
              onClick={() => {
                setSelectedKey(c.key);
                setExpanded(true);
                setErr("");
              }}
              className={
                "rounded-3xl border bg-[var(--card)] p-7 shadow-sm text-center transition hover:border-green-300 " +
                (isActive ? "border-green-500 ring-2 ring-green-500/20" : "border-[var(--border)]")
              }
            >
              <div className="mx-auto w-14 h-14 rounded-3xl border border-[var(--border)] bg-[var(--bg)] flex items-center justify-center">
                <Icon size={28} className="text-[var(--text)]" />
              </div>
              <div className="mt-5 text-xl font-bold text-[var(--text)]">{c.label}</div>
              <div className="mt-2 text-sm text-[var(--muted)] leading-relaxed">{c.desc}</div>
              <div className="mt-6 inline-flex items-center justify-center px-10 py-3 rounded-2xl bg-green-600 text-white text-sm font-semibold">
                Start
              </div>
            </motion.button>
          );
        })}
      </div>

      {expanded ? (
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-lg font-bold text-[var(--text)]">{active?.label}</div>
              <div className="text-xs text-[var(--muted)]">{active?.desc}</div>
            </div>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="px-4 py-2 rounded-2xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm"
            >
              Close
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-semibold text-[var(--text)]">Test Title</div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-2 w-full px-4 py-3 rounded-2xl border border-[var(--border)] bg-[var(--bg)] outline-none"
              />
            </div>

            <div>
              <div className="text-sm font-semibold text-[var(--text)]">Difficulty</div>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="mt-2 w-full px-4 py-3 rounded-2xl border border-[var(--border)] bg-[var(--bg)] outline-none"
              >
                <option value="mixed">Mixed</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            {!isAll ? (
              <div className="max-w-sm">
                <div className="text-sm font-semibold text-[var(--text)]">Number of Questions</div>
                <input
                  type="number"
                  min={1}
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                  className="mt-2 w-full px-4 py-3 rounded-2xl border border-[var(--border)] bg-[var(--bg)] outline-none"
                />
              </div>
            ) : (
              <div>
                <div className="text-sm font-semibold text-[var(--text)]">Pattern</div>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <div className="text-[11px] text-[var(--muted)]">General</div>
                    <input
                      type="number"
                      min={0}
                      value={patternGeneral}
                      onChange={(e) => setPatternGeneral(e.target.value)}
                      className="mt-1 w-full px-4 py-3 rounded-2xl border border-[var(--border)] bg-[var(--bg)] outline-none"
                    />
                  </div>
                  <div>
                    <div className="text-[11px] text-[var(--muted)]">Tech</div>
                    <input
                      type="number"
                      min={0}
                      value={patternTech}
                      onChange={(e) => setPatternTech(e.target.value)}
                      className="mt-1 w-full px-4 py-3 rounded-2xl border border-[var(--border)] bg-[var(--bg)] outline-none"
                    />
                  </div>
                  <div>
                    <div className="text-[11px] text-[var(--muted)]">Coding</div>
                    <input
                      type="number"
                      min={0}
                      value={patternCoding}
                      onChange={(e) => setPatternCoding(e.target.value)}
                      className="mt-1 w-full px-4 py-3 rounded-2xl border border-[var(--border)] bg-[var(--bg)] outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {err ? <div className="mt-4 text-red-500 text-sm">{err}</div> : null}

          <button
            type="button"
            onClick={create}
            disabled={loading}
            className="mt-5 w-full bg-green-600 text-white px-6 py-4 rounded-2xl hover:bg-green-700 disabled:opacity-60 font-semibold inline-flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Spinner /> Generating...
              </>
            ) : (
              "Generate & Start"
            )}
          </button>
          <div className="mt-2 text-[11px] text-[var(--muted)]">Note: Coding problems include hidden testcases for scoring.</div>
        </div>
      ) : null}
    </div>
  );
}

// =============================
// ✅ Session Runner
// =============================
export function SessionRunner({ sectionsOpen = false, navOpen = true, onCloseSections, onCloseNav }) {
  const { sessionId } = useParams();
  const { user } = useAuth();

  // --- LeetCode-like fixed viewport layout ---
  // The parent page sometimes doesn't constrain height, which causes the coding panel to grow
  // and the page to scroll when the result panel is resized. We cap this component to the
  // available viewport height and enable independent scrolling inside each panel.
  const rootRef = useRef(null);
  const [panelH, setPanelH] = useState(null);

  useLayoutEffect(() => {
    const measure = () => {
      const el = rootRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const viewportH = window.innerHeight || 0;
      const margin = 12; // avoid forcing body scrollbars

      // If the browser preserved scroll position (eg. navigating from History), rect.top
      // can become negative. Clamp it so we never compute a height larger than the viewport.
      const top = Math.max(0, rect.top);
      const available = Math.max(360, Math.min(viewportH - margin, viewportH - top - margin));
      setPanelH(available);
    };

    const raf = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure);
    };
  }, []);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [session, setSession] = useState(null);
  const [answers, setAnswers] = useState({ general: {}, tech: {}, coding: {} });
  const [activeSection, setActiveSection] = useState("general");
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeSub, setActiveSub] = useState("all");

  const TIMER_KEY = useMemo(() => `zenith_mocktest_timers_v1_${sessionId}`, [sessionId]);
  const [totalRemaining, setTotalRemaining] = useState(null);
  const [perRemaining, setPerRemaining] = useState({});
  const [activeRemaining, setActiveRemaining] = useState(null);

  const locked = (session?.status || "") === "submitted";
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const tokenGetter = async () => (user ? await user.getIdToken() : "");

  const sections = useMemo(() => {
    if (!session) return [];
    const s = [];
    if ((session.general_questions || []).length) s.push("general");
    if ((session.tech_questions || []).length) s.push("tech");
    if ((session.coding_problems || []).length) s.push("coding");
    return s;
  }, [session]);

  const subMenu = useMemo(() => {
    if (!session) return null;

    const build = (qs, wantedOrder, title) => {
      const buckets = new Map();
      (qs || []).forEach((q, idx) => {
        const key = String(q?.subsection || q?.topic || "").trim();
        if (!key) return;
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key).push(idx);
      });
      const keys = Array.from(buckets.keys());
      if (!keys.length) return null;

      const orderedKeys = [];
      (wantedOrder || []).forEach((k) => {
        if (buckets.has(k)) orderedKeys.push(k);
      });
      keys
        .filter((k) => !(wantedOrder || []).includes(k))
        .sort((a, b) => a.localeCompare(b))
        .forEach((k) => orderedKeys.push(k));

      const items = orderedKeys.map((k) => ({
        key: k,
        label: k,
        count: buckets.get(k).length,
        indexes: buckets.get(k),
      }));

      return { title, items };
    };

    if (activeSection === "general") return build(session.general_questions, ["Quant", "Logical", "Verbal"], "General topics");
    if (activeSection === "tech") return build(session.tech_questions, ["DSA", "OOP", "OS", "CN", "DBMS"], "Tech topics");
    return null;
  }, [session, activeSection]);

  useEffect(() => {
    if (!sections.length) return;
    if (!sections.includes(activeSection)) setActiveSection(sections[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections.join("|")]);

  useEffect(() => {
    (async () => {
      setErr("");
      setLoading(true);
      try {
        const token = await tokenGetter();
        const res = await fetchWithFallback(`/mocktest/sessions/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load session");

        setSession(data.session);
        setAnswers(data.answers || { general: {}, tech: {}, coding: {} });

        if ((data.session?.status || "") === "submitted") {
          setResult({
            total_score:
              data.session?.total_score ??
              (data.session?.scores
                ? (data.session.scores.general || 0) + (data.session.scores.tech || 0) + (data.session.scores.coding || 0)
                : 0),
            total_marks: data.session?.total_marks ?? 0,
            scores: data.session?.scores || {},
            analysis: data.session?.analysis || null,
            coding_details: data.session?.coding_details || {},
          });
        }

        const defaultSection = data.session?.general_questions?.length
          ? "general"
          : data.session?.tech_questions?.length
          ? "tech"
          : "coding";
        setActiveSection(defaultSection);
        setActiveIndex(0);
        setActiveSub("all");

        try {
          const raw = localStorage.getItem(TIMER_KEY);
          const parsed = raw ? JSON.parse(raw) : null;
          if (parsed && parsed.perRemaining && typeof parsed.totalRemaining === "number") {
            setPerRemaining(parsed.perRemaining || {});
            setTotalRemaining(parsed.totalRemaining);
          } else {
            const per = {};
            (data.session?.general_questions || []).forEach((q) => (per[q.id] = MCQ_PER_Q_SEC));
            (data.session?.tech_questions || []).forEach((q) => (per[q.id] = MCQ_PER_Q_SEC));
            // For coding, use the difficulty chosen in the create form (session difficulty)
            // so the UI and timer match what the user selected.
            (data.session?.coding_problems || []).forEach((p) => (per[p.id] = codingTimeSec(data.session?.difficulty || p.difficulty)));
            const tot = Object.values(per).reduce((a, b) => a + (Number(b) || 0), 0);
            setPerRemaining(per);
            setTotalRemaining(tot);
            localStorage.setItem(TIMER_KEY, JSON.stringify({ perRemaining: per, totalRemaining: tot }));
          }
        } catch {}
      } catch (e) {
        setErr(e.message || "Failed");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const qList = useMemo(() => {
    if (!session) return [];
    const base =
      activeSection === "general"
        ? session.general_questions || []
        : activeSection === "tech"
        ? session.tech_questions || []
        : activeSection === "coding"
        ? session.coding_problems || []
        : [];
    if (activeSection === "coding") return base;
    if (!Array.isArray(base)) return [];
    if (!activeSub || activeSub === "all") return base;
    return base.filter((q) => (q?.subsection || "").toLowerCase() === String(activeSub).toLowerCase());
  }, [session, activeSection, activeSub]);

  const activeItem = qList[activeIndex];

  useEffect(() => {
    if (activeIndex > (qList?.length || 0) - 1) setActiveIndex(0);
  }, [qList?.length]);

  useEffect(() => {
    if (!activeItem) return;
    const key = activeItem.id;
    const v = perRemaining?.[key];
    setActiveRemaining(typeof v === "number" ? v : null);
  }, [activeItem?.id, perRemaining]);

  useEffect(() => {
    if (locked) return;
    if (totalRemaining == null) return;
    const t = setInterval(() => {
      setPerRemaining((prev) => {
        if (!activeItem) return prev;
        const key = activeItem.id;
        const cur = Number(prev?.[key] ?? 0);
        const next = Math.max(0, cur - 1);
        return { ...(prev || {}), [key]: next };
      });
      setTotalRemaining((tr) => Math.max(0, Number(tr || 0) - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [locked, activeItem?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (totalRemaining == null) return;
    try {
      localStorage.setItem(TIMER_KEY, JSON.stringify({ perRemaining, totalRemaining }));
    } catch {}
  }, [TIMER_KEY, perRemaining, totalRemaining]);

  function setMcqAnswer(section, qid, idx) {
    if (locked) return;
    setAnswers((a) => ({
      ...a,
      [section]: { ...(a[section] || {}), [qid]: idx },
    }));
  }

  function setCodingSubmission(pid, patch) {
    if (locked) return;
    setAnswers((a) => ({
      ...a,
      coding: { ...(a.coding || {}), [pid]: { ...(a.coding?.[pid] || {}), ...patch } },
    }));
  }

  async function submitTest() {
    if (locked) return;
    setSubmitting(true);
    setErr("");
    try {
      const token = await tokenGetter();
      const res = await fetchWithFallback(`/mocktest/sessions/${sessionId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Submit failed");
      setResult(data);
      setSession((prev) =>
        prev
          ? {
              ...prev,
              status: "submitted",
              scores: data.scores,
              total_score: data.total_score,
              total_marks: data.total_marks,
              analysis: data.analysis,
              coding_details: data.coding_details,
            }
          : prev
      );
    } catch (e) {
      setErr(e.message || "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="px-4 py-10 text-[var(--text)]">Loading test...</div>;

  if (err) {
    return (
      <div className="px-4 py-10 space-y-3">
        <div className="text-red-400">{err}</div>
        <Link to="/mock-test" className="underline text-[var(--accent)]">
          Back
        </Link>
      </div>
    );
  }

  if (!session) return null;

  const gotoNextOrSubmit = () => {
    if (activeIndex < (qList.length || 0) - 1) {
      setActiveIndex((i) => Math.min((qList.length || 1) - 1, i + 1));
    }
  };

  // ✅ layout expands fully when nav is closed (and adds more gap)
  const gridClass =
    sectionsOpen && navOpen
      ? "lg:grid-cols-[260px_1fr_260px]"
      : sectionsOpen && !navOpen
      ? "lg:grid-cols-[260px_1fr]"
      : !sectionsOpen && navOpen
      ? "lg:grid-cols-[1fr_260px]"
      : "lg:grid-cols-[1fr]";

  return (
    <div
      ref={rootRef}
      style={panelH ? { height: `${panelH}px`, maxHeight: `${panelH}px` } : undefined}
      className="min-h-0 overflow-hidden bg-[var(--bg)]"
    >
      {navOpen ? <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => onCloseNav && onCloseNav()} /> : null}

      {/* ✅ increased gap between panes */}
      <div className={`h-full min-h-0 grid gap-4 p-4 ${gridClass}`}>
        {sectionsOpen ? (
          <div className="hidden lg:flex rounded-2xl bg-[var(--card)] border border-[var(--border)] overflow-hidden flex-col min-h-0">
            <div className="px-4 py-3 border-b border-[var(--border)] text-sm font-semibold text-[var(--text)]">Sections</div>
            <div className="p-3 overflow-auto space-y-3">
              <div className="grid grid-cols-1 gap-2">
                {sections.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setActiveSection(s);
                      setActiveIndex(0);
                      setActiveSub("all");
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl border transition ${
                      activeSection === s
                        ? "border-[var(--border)] bg-[var(--bg)] shadow-sm text-[var(--text)]"
                        : "border-[var(--border)] text-[var(--text)] hover:bg-[var(--bg)] hover:shadow-sm"
                    }`}
                  >
                    <div className="text-sm font-semibold capitalize">{s === "general" ? "General Aptitude" : s === "tech" ? "Tech Aptitude" : "Coding"}</div>
                    <div className="text-xs text-[var(--muted)]">
                      {s === "coding"
                        ? `${(session.coding_problems || []).length} problems`
                        : `${(s === "general" ? session.general_questions : session.tech_questions || []).length} questions`}
                    </div>
                  </button>
                ))}
              </div>

              {activeSection !== "coding" ? (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-3">
                  <div className="text-xs font-semibold text-[var(--text)]">Sub-topics</div>
                  <div className="mt-2 space-y-1">
                    {(Array.isArray(subMenu?.items) ? subMenu.items : []).length ? (
                      (Array.isArray(subMenu?.items) ? subMenu.items : []).map((it) => (
                        <button
                          key={it.key}
                          onClick={() => {
                            setActiveSub(it.key);
                            if (it.indexes && it.indexes.length) setActiveIndex(it.indexes[0]);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl border transition ${
                            activeSub === it.key
                              ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-[var(--text)]"
                              : "border-[var(--border)] bg-[var(--card)] hover:bg-[var(--bg)]"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{it.label}</span>
                            <span className="text-[11px] text-[var(--muted)]">{it.count}</span>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="text-sm text-[var(--muted)]">No topics</div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Center */}
        <div className="rounded-2xl bg-[var(--card)] border border-[var(--border)] overflow-hidden flex flex-col min-h-0">
          {/* ✅ more padding around heading */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
            <div className="text-sm font-semibold text-[var(--text)]">
              {activeSection === "coding" ? `Problem ${activeIndex + 1} / ${qList.length}` : `Question ${activeIndex + 1} / ${qList.length}`}
            </div>
            <div className="text-xs text-[var(--muted)] mt-1">
              {activeSection === "general"
                ? "General Aptitude"
                : activeSection === "tech"
                ? "Technical Aptitude"
                : "Coding"}
              {activeSection !== "coding"
                ? ` • ${(session?.difficulty || "mixed").toString().toUpperCase()}`
                : ` • ${(activeItem?.topic || "DSA")} • ${((session?.difficulty || activeItem?.difficulty || "Medium") + "").toString()}`}
            </div>
            <div className="hidden md:flex items-center gap-2">
              <div className="px-2 py-1 rounded-xl border border-[var(--border)] text-xs text-[var(--muted)]">
                Total: <span className="text-[var(--text)] font-semibold">{fmtClock(totalRemaining ?? 0)}</span>
              </div>
              <div className="px-2 py-1 rounded-xl border border-[var(--border)] text-xs text-[var(--muted)]">
                {activeSection === "coding" ? "Problem" : "Q"}:{" "}
                <span className="text-[var(--text)] font-semibold">{fmtClock(activeRemaining ?? 0)}</span>
              </div>
            </div>
          </div>

          {/* ✅ add padding when coding so it doesn’t stick to edges */}
          <div className={"flex-1 min-h-0 overflow-auto " + (activeSection === "coding" ? "p-4" : "p-6 flex items-center justify-center")}>
            {!activeItem ? (
              <div className="text-sm text-[var(--muted)]">No items in this section.</div>
            ) : activeSection !== "coding" ? (
              <div className="w-full max-w-5xl space-y-6 py-6">
                  <div className="text-xs text-[var(--muted)]">{activeItem.topic || ""}</div>
                  <div className="text-2xl md:text-3xl font-semibold text-[var(--text)] whitespace-pre-wrap leading-snug">{activeItem.question}</div>

                  <div className="grid md:grid-cols-2 gap-3">
                    {(activeItem.options || []).map((opt, idx) => {
                      const sel = answers?.[activeSection]?.[activeItem.id];
                      const chosen = Number(sel) === idx;
                      const expired = (perRemaining?.[activeItem.id] ?? MCQ_PER_Q_SEC) <= 0;
                      return (
                        <button
                          key={idx}
                          disabled={locked || expired}
                          onClick={() => setMcqAnswer(activeSection, activeItem.id, idx)}
                          className={`text-left px-7 py-5 rounded-2xl border transition disabled:opacity-60 ${
                            chosen ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]" : "border-[var(--border)] hover:bg-[var(--bg)]"
                          }`}
                        >
                          <div className="text-lg md:text-xl text-[var(--text)]">{opt}</div>
                        </button>
                      );
                    })}
                  </div>

                  {!locked && (perRemaining?.[activeItem.id] ?? MCQ_PER_Q_SEC) <= 0 ? (
                    <div className="text-xs text-red-400">Time up for this question.</div>
                  ) : null}
                </div>
            ) : (
              <CodingPanel
                sessionId={sessionId}
                tokenGetter={tokenGetter}
                problem={activeItem}
                submission={answers?.coding?.[activeItem.id] || {}}
                onChange={(patch) => setCodingSubmission(activeItem.id, patch)}
                locked={locked}
                timeLeftSec={activeRemaining}
                onSolved={gotoNextOrSubmit}
                onLockedAdvance={gotoNextOrSubmit}
                sessionDifficulty={session?.difficulty}
              />
            )}
          </div>

          <div className="px-6 py-4 border-t border-[var(--border)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  disabled={activeIndex <= 0}
                  onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
                  className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  disabled={activeIndex >= qList.length - 1}
                  onClick={() => setActiveIndex((i) => Math.min(qList.length - 1, i + 1))}
                  className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>

              {!locked ? (
                <button
                  onClick={submitTest}
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold disabled:opacity-60 inline-flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Spinner /> Submitting...
                    </>
                  ) : (
                    "Submit Test"
                  )}
                </button>
              ) : (
                <div className="px-4 py-2 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-sm text-[var(--text)]">
                  Submitted • Score: <span className="font-semibold">{session.total_score ?? 0}</span> / {session.total_marks ?? 0}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Nav */}
        {navOpen ? (
          <div className="rounded-2xl bg-[var(--card)] border border-[var(--border)] overflow-hidden flex-col min-h-0 flex">
            <div className="px-4 py-3 border-b border-[var(--border)] text-sm font-semibold text-[var(--text)]">Navigation</div>
            <div className="p-3 overflow-auto space-y-3">
              <div className="grid grid-cols-4 gap-2">
                {(qList || []).map((it, idx) => {
                  const id = it.id;
                  const answered =
                    activeSection === "coding"
                      ? !!(answers?.coding?.[id]?.lastSubmit?.passed_all || false) || !!(answers?.coding?.[id]?.lastSubmit?.passed || false)
                      : answers?.[activeSection]?.[id] !== undefined && answers?.[activeSection]?.[id] !== null;
                  const isActive = idx === activeIndex;
                  return (
                    <button
                      key={id}
                      onClick={() => setActiveIndex(idx)}
                      className={`h-10 rounded-xl border text-sm font-semibold transition ${
                        isActive
                          ? "border-[var(--accent)] text-[var(--accent)]"
                          : answered
                          ? "border-emerald-500 text-emerald-600"
                          : "border-[var(--border)] text-[var(--muted)] hover:bg-[var(--bg)]"
                      }`}
                      title={answered ? "Answered" : "Unanswered"}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 flex items-center gap-3 text-[11px] text-[var(--muted)]">
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Answered
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-gray-400" /> Unanswered
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// =============================
// ✅ CodingPanel helpers
// =============================

function normalizeCases(data) {
  if (!data) return [];
  const raw =
    data.testcases ||
    data.tests ||
    data.results ||
    data.cases ||
    data.test_results ||
    (Array.isArray(data) ? data : null) ||
    [];
  if (!Array.isArray(raw)) return [];
  return raw.map((t, idx) => {
    const passed =
      t?.passed === true ||
      t?.ok === true ||
      t?.success === true ||
      t?.status === "passed" ||
      t?.verdict === "AC";
    return {
      id: t?.id ?? idx + 1,
      hidden: !!t?.hidden,
      passed,
      stdin: t?.stdin ?? t?.input ?? "",
      expected: t?.expected ?? t?.output ?? "",
      stdout: t?.stdout ?? t?.actual ?? "",
      stderr: t?.stderr ?? t?.error ?? "",
      time_ms: t?.time_ms ?? t?.time ?? null,
      memory_kb: t?.memory_kb ?? t?.memory ?? null,
    };
  });
}

function summarizeCases(cases) {
  const total = cases.length;
  const passed = cases.filter((c) => c.passed).length;
  const hidden = cases.filter((c) => c.hidden).length;
  const hiddenPassed = cases.filter((c) => c.hidden && c.passed).length;
  const hiddenFailed = cases.filter((c) => c.hidden && !c.passed).length;
  const samplePassed = cases.filter((c) => !c.hidden && c.passed).length;
  const sampleTotal = cases.filter((c) => !c.hidden).length;
  return { total, passed, hidden, hiddenPassed, hiddenFailed, samplePassed, sampleTotal };
}

// ✅ IMPORTANT: fallback summary when backend doesn't return per-testcase arrays
function summarizeFromPayload(payload) {
  if (!payload) return null;

  // common server-side counters (use any that exist)
  const total =
    payload.total_tests ??
    payload.total ??
    payload.tests_total ??
    payload.total_cases ??
    payload.num_tests ??
    null;

  const passed =
    payload.passed_tests ??
    payload.passed ??
    payload.tests_passed ??
    payload.passed_count ??
    null;

  const hidden =
    payload.hidden_total ??
    payload.hidden_tests ??
    payload.hidden_count ??
    null;

  const hiddenPassed =
    payload.hidden_passed ??
    payload.hidden_passed_count ??
    null;

  const hiddenFailed =
    payload.hidden_failed ??
    payload.hidden_failed_count ??
    payload.hidden_failures ??
    null;

  const sampleTotal =
    payload.sample_total ??
    payload.samples_total ??
    payload.public_total ??
    null;

  const samplePassed =
    payload.sample_passed ??
    payload.samples_passed ??
    payload.public_passed ??
    null;

  const passedAll = payload.passed_all === true || payload.accepted === true || payload.verdict === "AC";

  // If backend only gives passed_all without numbers, don't show 0/0.
  if (passedAll && total == null && passed == null && hidden == null) {
    return {
      total: null,
      passed: null,
      hidden: null,
      hiddenPassed: null,
      hiddenFailed: null,
      samplePassed: null,
      sampleTotal: null,
      passedAll: true,
    };
  }

  const safe = (v) => (typeof v === "number" && isFinite(v) ? v : null);

  return {
    total: safe(total),
    passed: safe(passed),
    hidden: safe(hidden),
    hiddenPassed: safe(hiddenPassed),
    hiddenFailed: safe(hiddenFailed),
    samplePassed: safe(samplePassed),
    sampleTotal: safe(sampleTotal),
    passedAll,
  };
}

// =============================
// ✅ Coding Panel
// =============================
function CodingPanel({ sessionId, tokenGetter, problem, submission, onChange, locked, timeLeftSec, onSolved, sessionDifficulty }) {
  const lang = submission.language || "python";
  const code = submission.code || "";
  const pid = problem?.id || "";
  const codeKey = `zenith_code_draft_${sessionId}_${pid}_${lang}`;

  useEffect(() => {
    if (!pid) return;
    try {
      const saved = localStorage.getItem(codeKey);
      if (saved && !code) {
        onChange({ code: saved });
        return;
      }
    } catch {}
    if (!code) {
      const starter =
        (problem?.starterCode &&
          (problem.starterCode[lang] || problem.starterCode.python || problem.starterCode.java || problem.starterCode.cpp)) ||
        defaultStarter(lang);
      onChange({ code: starter || defaultStarter(lang) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid, lang]);

  // Keep per-language drafts so switching languages shows correct starter/template,
  // similar to LeetCode.
  function getDraftKey(forLang) {
    const l = (forLang || "python").toLowerCase();
    return `zenith_code_draft_${sessionId}_${pid}_${l}`;
  }

  function loadTemplate(forLang) {
    const l = (forLang || "python").toLowerCase();
    const starter =
      (problem?.starterCode &&
        (problem.starterCode[l] ||
          problem.starterCode.python ||
          problem.starterCode.java ||
          problem.starterCode.c ||
          problem.starterCode.cpp)) ||
      defaultStarter(l);
    return starter || defaultStarter(l);
  }

  function handleLanguageChange(nextLang) {
    const curLang = (lang || "python").toLowerCase();
    const nl = (nextLang || "python").toLowerCase();
    if (nl === curLang) return;
    // persist current draft
    try {
      if (pid) localStorage.setItem(getDraftKey(curLang), code || "");
    } catch {}
    // load new draft or starter
    let nextCode = "";
    try {
      nextCode = pid ? (localStorage.getItem(getDraftKey(nl)) || "") : "";
    } catch {
      nextCode = "";
    }
    if (!nextCode) nextCode = loadTemplate(nl);
    onChange({ language: nl, code: nextCode });
  }

  const [editorTheme, setEditorTheme] = useState(() => {
    try {
      return localStorage.getItem("zenith_code_editor_theme") || "dark";
    } catch {
      return "dark";
    }
  });

  const [leftPct, setLeftPct] = useState(38);
  const [topPct, setTopPct] = useState(62);
  const [resultsCollapsed, setResultsCollapsed] = useState(false);
  const dragStateRef = useRef({ type: null, startX: 0, startY: 0, startLeft: 38, startTop: 62 });
  const rightColRef = useRef(null);

  const [runningSamples, setRunningSamples] = useState(false);
  const [submittingAll, setSubmittingAll] = useState(false);
  const [runResult, setRunResult] = useState(submission.lastRun || null);
  const [submitResult, setSubmitResult] = useState(submission.lastSubmit || null);
  const [showHidden, setShowHidden] = useState(false);
  const [openCaseId, setOpenCaseId] = useState(null);

  const analysisSrc = submitResult || runResult;

  const samplesRaw = Array.isArray(problem?.samples) ? problem.samples.slice(0, 4) : [];
  const samples = samplesRaw
    .map((tc) => ({ input: tc?.input ?? tc?.stdin ?? "", output: tc?.output ?? tc?.expected ?? "" }))
    .filter((tc) => String(tc.input || "").trim().length > 0);

  const timeLocked = timeLeftSec != null && timeLeftSec <= 0;
  const status = String(submission?.status || submission?.verdict || "").toLowerCase();
  const finalized = !!submission?.finalized || status === "accepted" || status === "ac";
  const allLocked = !!locked || timeLocked || finalized;

  useEffect(() => {
    function onMove(e) {
      const st = dragStateRef.current;
      if (!st.type) return;

      if (st.type === "x") {
        const dx = e.clientX - st.startX;
        const w = window.innerWidth || 1;
        let next = st.startLeft + (dx / w) * 100;
        next = Math.max(22, Math.min(62, next));
        setLeftPct(next);
      }

      if (st.type === "y") {
        const dy = e.clientY - st.startY;
        // Use the actual right column height (not window height) so resizing matches LeetCode.
        const col = rightColRef.current;
        const h = col ? col.getBoundingClientRect().height : window.innerHeight || 1;
        let next = st.startTop + (dy / (h || 1)) * 100;
        // Allow collapsing the bottom result panel by dragging down (LeetCode-like).
        if (next >= 92) {
          setResultsCollapsed(true);
          setTopPct(100);
        } else {
          setResultsCollapsed(false);
          next = Math.max(35, Math.min(90, next));
          setTopPct(next);
        }
      }
    }
    function onUp() {
      dragStateRef.current.type = null;
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  function startDragX(e) {
    e.preventDefault();
    dragStateRef.current = { type: "x", startX: e.clientX, startY: 0, startLeft: leftPct, startTop: topPct };
  }
  function startDragY(e) {
    e.preventDefault();
    dragStateRef.current = { type: "y", startX: 0, startY: e.clientY, startLeft: leftPct, startTop: topPct };
  }

  async function runSamples() {
    if (!samples.length || allLocked) return;
    setRunningSamples(true);
    setRunResult(null);
    try {
      const res = await fetchWithFallback("/mocktest/code/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: lang,
          source_code: code,
          tests: samples.map((s) => ({ stdin: s.input, expected: s.output })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Run failed");
      setRunResult(data);
      onChange({ lastRun: data });
    } catch (e) {
      const errObj = { error: e.message || "Run failed" };
      setRunResult(errObj);
      onChange({ lastRun: errObj });
    } finally {
      setRunningSamples(false);
    }
  }

  async function submitAll() {
    if (allLocked) return;
    setSubmittingAll(true);
    setSubmitResult(null);
    try {
      const token = await tokenGetter();
      const res = await fetchWithFallback(`/mocktest/sessions/${sessionId}/coding/${problem.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ language: lang, source_code: code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Submit failed");
      setSubmitResult(data);
      setShowHidden(true);
      setOpenCaseId(null);
      onChange({ lastSubmit: data });

      if (data?.passed_all || data?.passed === true || data?.accepted === true || data?.verdict === "AC") {
        if (typeof onSolved === "function") onSolved();
      }
    } catch (e) {
      const errObj = { error: e.message || "Submit failed" };
      setSubmitResult(errObj);
      onChange({ lastSubmit: errObj });
    } finally {
      setSubmittingAll(false);
    }
  }

  useEffect(() => {
    try {
      localStorage.setItem("zenith_code_editor_theme", editorTheme);
    } catch {}
  }, [editorTheme]);

  const [activeTab, setActiveTab] = useState("result");
  useEffect(() => {
    // After submit, users usually want to see analysis + complexity immediately.
    if (submitResult && !submitResult?.error) {
      setActiveTab("meta");
      return;
    }
    if (runResult) setActiveTab("result");
  }, [runResult, submitResult]);

  const runCases = useMemo(() => normalizeCases(runResult), [runResult]);
  const submitCases = useMemo(() => normalizeCases(submitResult), [submitResult]);

  const runSum = useMemo(() => summarizeCases(runCases), [runCases]);
  const subSum = useMemo(() => summarizeCases(submitCases), [submitCases]);

  const submitFallback = useMemo(() => summarizeFromPayload(submitResult), [submitResult]);
  const runFallback = useMemo(() => summarizeFromPayload(runResult), [runResult]);

  const wallMs = analysisSrc?.wall_time_ms ?? runResult?.wall_time_ms ?? null;

  const hasSubmitCases = submitCases.length > 0;
  const hasRunCases = runCases.length > 0;

  const activeCases = submitResult ? submitCases : runResult ? runCases : [];
  const filteredCases = submitResult
    ? activeCases // on Submit, show samples + hidden results
    : activeCases.filter((c) => (showHidden ? true : !c.hidden));

  const sampleCasesToShow = filteredCases.filter((c) => !c.hidden);
  const hiddenCasesToShow = filteredCases.filter((c) => c.hidden);
  const orderedCases = [...sampleCasesToShow, ...hiddenCasesToShow];

  // ✅ use fallback if cases array is empty (fixes 0/0 after submit)
  const activeSummary = (() => {
    if (submitResult) return hasSubmitCases ? subSum : submitFallback;
    if (runResult) return hasRunCases ? runSum : runFallback;
    return null;
  })();

  return (
    <div className={"h-full min-h-0 flex flex-col gap-4 overflow-hidden " + (editorTheme === "dark" ? "panel-dark" : "panel-light")}>
      {/* ✅ extra padding around header + buttons */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-[var(--text)] truncate">
              {problem?.id ? `${problem.id}. ` : ""}
              {problem?.title || "Coding"}
            </div>
            <div className="text-xs text-[var(--muted)]">
              {(problem?.topic || "DSA")} • {(sessionDifficulty || problem?.difficulty || "Medium")}
              {timeLeftSec != null ? ` • Time left: ${fmtClock(timeLeftSec)}` : ""}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => runSamples()}
              disabled={runningSamples || submittingAll || allLocked || !samples.length}
              className="h-9 px-4 rounded-xl border border-[var(--border)] bg-[var(--bg)] hover:bg-[var(--card)] text-sm font-semibold disabled:opacity-60 inline-flex items-center gap-2"
            >
              {runningSamples ? <Spinner /> : <Play size={16} />}
              <span>Run</span>
            </button>

            <button
              onClick={() => submitAll()}
              disabled={submittingAll || allLocked}
              className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-60 inline-flex items-center gap-2"
            >
              {submittingAll ? <Spinner /> : <Send size={16} />}
              <span>{submittingAll ? "Submitting" : "Submit"}</span>
            </button>

            <button
              onClick={() => setEditorTheme((t) => (t === "dark" ? "light" : "dark"))}
              className="h-9 px-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] hover:bg-[var(--card)] text-sm inline-flex items-center"
              title="Editor theme"
            >
              {editorTheme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            <select
              value={lang}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="h-9 px-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-sm"
            >
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="c">C</option>
              <option value="cpp">C++</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Left: Problem */}
        <div
          style={{ width: `${leftPct}%` }}
          className="rounded-2xl bg-[var(--bg)] border border-[var(--border)] overflow-hidden flex flex-col min-h-0 min-w-[280px] max-w-[70%]"
        >
          <div className="px-4 py-2 border-b border-[var(--border)] text-xs text-[var(--muted)] flex items-center justify-between">
            <div>Description</div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded-lg border border-[var(--border)] text-[11px]">{sessionDifficulty || problem?.difficulty || "Medium"}</span>
              <span className="px-2 py-1 rounded-lg border border-[var(--border)] text-[11px]">{problem?.topic || "DSA"}</span>
            </div>
          </div>

          {/* Make the problem description independently scrollable so the panel fits the screen */}
          <div className="p-4 flex-1 overflow-auto">
            <div className="text-sm text-[var(--text)] whitespace-pre-wrap">{problem?.statement || "-"}</div>

            {/* ✅ Input format (if provided by backend) */}
            {(problem?.input_format || problem?.inputFormat || problem?.input || problem?.io?.input) ? (
              <div className="mt-4">
                <div className="text-xs text-[var(--muted)]">Input Format</div>
                <pre className="mt-1 text-sm text-[var(--text)] whitespace-pre-wrap">{problem?.input_format || problem?.inputFormat || problem?.input || problem?.io?.input}</pre>
              </div>
            ) : null}


            {problem?.constraints?.length ? (
              <div className="mt-4">
                <div className="text-xs text-[var(--muted)]">Constraints</div>
                <ul className="mt-1 list-disc pl-5 text-sm text-[var(--text)]">
                  {problem.constraints.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {samples.length ? (
              <div className="mt-4 space-y-2">
                <div className="text-xs text-[var(--muted)]">Samples</div>
                {samples.map((s, i) => (
                  <div key={i} className="rounded-xl border border-[var(--border)] p-3">
                    <div className="text-[11px] text-[var(--muted)]">Input</div>
                    <pre className="text-sm text-[var(--text)] whitespace-pre-wrap">{s.input}</pre>
                    <div className="text-[11px] text-[var(--muted)] mt-2">Output</div>
                    <pre className="text-sm text-[var(--text)] whitespace-pre-wrap">{s.output}</pre>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* splitter */}
        <div onMouseDown={startDragX} className="mx-3 w-2 cursor-col-resize flex items-center justify-center" title="Drag to resize">
          <div className="h-16 w-1 rounded-full bg-emerald-500/50" />
        </div>

        {/* Right */}
        <div ref={rightColRef} className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
          {/* Editor */}
          <div
            style={{ height: resultsCollapsed ? "100%" : `${topPct}%` }}
            className="rounded-2xl bg-[var(--bg)] border border-[var(--border)] overflow-hidden flex flex-col min-h-0 relative"
          >
            <div className="px-4 py-2 border-b border-[var(--border)] text-xs text-[var(--muted)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>Code</span>
                {runningSamples ? <span className="text-[11px]">• Running</span> : null}
                {submittingAll ? <span className="text-[11px]">• Submitting</span> : null}
                {wallMs != null ? <span className="text-[11px]">• {wallMs} ms</span> : null}
              </div>
              <div className="text-[11px] text-[var(--muted)]">{allLocked ? "Locked" : "Editable"}</div>
            </div>

            <Editor
              language={lang === "cpp" ? "cpp" : lang}
              value={code}
              onChange={(v) => {
                const nv = v ?? "";
                onChange({ code: nv });
                try {
                  if (pid) localStorage.setItem(codeKey, nv);
                } catch {}
              }}
              theme={editorTheme === "dark" ? "vs-dark" : "vs"}
              options={{
                readOnly: allLocked,
                minimap: { enabled: false },
                fontSize: 14,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                insertSpaces: true,
              }}
            />
          </div>

          {/* splitter */}
          <div
            onMouseDown={startDragY}
            className="my-3 h-2 cursor-row-resize flex items-center justify-center"
            title={resultsCollapsed ? "Drag up to show results" : "Drag to resize"}
            onDoubleClick={() => {
              // quick toggle like LeetCode
              setResultsCollapsed((v) => {
                const nv = !v;
                if (!nv) setTopPct(62);
                else setTopPct(100);
                return nv;
              });
            }}
          >
            <div className="w-20 h-1 rounded-full bg-emerald-500/50" />
          </div>

          {/* Results */}
          <div
            className={
              "flex-1 min-h-0 rounded-2xl bg-[var(--bg)] border border-[var(--border)] overflow-hidden flex flex-col " +
              (resultsCollapsed ? "hidden" : "")
            }
          >
            <div className="px-4 py-2 border-b border-[var(--border)] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("result")}
                  className={`px-3 py-1.5 rounded-xl text-sm border border-[var(--border)] ${activeTab === "result" ? "bg-[var(--card)]" : "bg-transparent"}`}
                >
                  Test Result
                </button>
                <button
                  onClick={() => setActiveTab("meta")}
                  className={`px-3 py-1.5 rounded-xl text-sm border border-[var(--border)] ${activeTab === "meta" ? "bg-[var(--card)]" : "bg-transparent"}`}
                >
                  Analysis
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowHidden((v) => !v)}
                  className="h-8 px-3 rounded-xl border border-[var(--border)] text-xs bg-[var(--bg)] hover:bg-[var(--card)] inline-flex items-center gap-2"
                >
                  {showHidden ? <EyeOff size={16} /> : <Eye size={16} />}
                  {showHidden ? "Hide hidden" : "Show hidden"}
                </button>
                <div className="text-xs text-[var(--muted)] hidden md:block">Run → samples only • Submit → samples + hidden</div>
              </div>
            </div>

            <div className="p-4 flex-1 min-h-0 overflow-auto">
              {activeTab === "meta" ? (
                                <div className="space-y-3">
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
                    <div className="text-sm font-semibold text-[var(--text)]">Code Analysis</div>
                    <div className="mt-2 grid gap-3 md:grid-cols-3">
                      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3">
                        <div className="text-xs font-semibold text-[var(--muted)] mb-1">Wall runtime</div>
                        <div className="text-sm text-[var(--text)]">{wallMs != null ? `${wallMs} ms` : "—"}</div>
                      </div>
                      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3">
                        <div className="text-xs font-semibold text-[var(--muted)] mb-1">Time complexity</div>
                        <div className="text-sm text-[var(--text)]">{analysisSrc?.timeComplexity || "—"}</div>
                      </div>
                      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3">
                        <div className="text-xs font-semibold text-[var(--muted)] mb-1">Space complexity</div>
                        <div className="text-sm text-[var(--text)]">{analysisSrc?.spaceComplexity || "—"}</div>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-[var(--muted)]">
                      Tip: Run checks samples only. Submit validates samples + hidden.
                    </div>
                  </div>

                  {analysisSrc?.status ? (
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
                      <div className="text-sm font-semibold text-[var(--text)]">Result</div>
                      <div className="mt-1 text-sm text-[var(--text)]">
                        Status: <span className="font-semibold">{submitResult.status}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-[var(--muted)]">Run or Submit to get complexity + insights.</div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {!runResult && !submitResult ? (
                    <div className="text-sm text-[var(--muted)]">
                      No results yet. Click <b>Run</b> for samples or <b>Submit</b> for hidden.
                    </div>
                  ) : (analysisSrc?.error || runResult?.error) ? (
                    <div className="rounded-2xl border border-red-300/30 bg-red-500/10 p-4 text-sm text-red-200 whitespace-pre-wrap">
                      {(analysisSrc?.error || runResult?.error || "Error").toString()}
                    </div>
                  ) : (
                    <>
                      {/* ✅ summary fixed (no more 0/0 if backend didn't send arrays) */}
                      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-sm font-semibold text-[var(--text)]">{submitResult ? "Submission Result" : "Run Result"}</div>

                          {activeSummary?.passedAll ? (
                            <div className="text-sm text-emerald-600 font-semibold">Passed all testcases ✓</div>
                          ) : (
                            <div className="text-sm text-[var(--text)]">
                              Passed:{" "}
                              <span className="font-semibold">
                                {activeSummary?.passed ?? (analysisSrc?.passed_all ? "All" : 0)}
                              </span>
                              {" / "}
                              <span className="font-semibold">
                                {activeSummary?.total ?? (analysisSrc?.passed_all ? "All" : 0)}
                              </span>

                              {submitResult ? (
                                <span className="text-[var(--muted)]">
                                  {" "}
                                  • Hidden:{" "}
                                  {activeSummary?.hiddenPassed ?? (analysisSrc?.hidden_passed ?? 0)}/
                                  {activeSummary?.hidden ?? (analysisSrc?.hidden_total ?? 0)}
                                  {" "}
                                  (failed {activeSummary?.hiddenFailed ?? (analysisSrc?.hidden_failed ?? 0)})
                                </span>
                              ) : null}
                            </div>
                          )}
                        </div>

                        {/* If we have no testcase arrays, show a note */}
                        {submitResult && normalizeCases(submitResult).length === 0 ? (
                          <div className="mt-2 text-xs text-[var(--muted)]">
                            Note: backend didn’t return per-testcase details, so only summary is shown (score is computed server-side).
                          </div>
                        ) : null}
                      </div>

                      {/* details list only when cases exist */}
                      {orderedCases.length ? (
                        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                          {orderedCases.map((c, i) => {
                            const isOpen = openCaseId === c.id && (!c.hidden || showHidden);
                            return (
                              <React.Fragment key={`${c.id}-${i}`}>
                                {i === 0 && sampleCasesToShow.length ? (
                                  <div className="text-xs font-semibold text-[var(--muted)] px-1 pt-1">Sample testcases</div>
                                ) : null}
                                {i === sampleCasesToShow.length && hiddenCasesToShow.length ? (
                                  <div className="text-xs font-semibold text-[var(--muted)] px-1 pt-4">Hidden testcases</div>
                                ) : null}
                                <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    {c.passed ? (
                                      <CheckCircle2 className="text-emerald-500" size={18} />
                                    ) : (
                                      <XCircle className="text-red-500" size={18} />
                                    )}
                                    <div className="text-sm font-semibold text-[var(--text)]">
                                      Testcase {i + 1}{" "}
                                      {c.hidden ? (
                                        <span className="text-[11px] text-[var(--muted)]">(Hidden)</span>
                                      ) : null}
                                    </div>
                                  </div>

                                  {/* Eye icon: Sample -> viewable, Hidden -> locked */}
                                  {!c.hidden ? (
                                    <button
                                      type="button"
                                      onClick={() => setOpenCaseId((prev) => (prev === c.id ? null : c.id))}
                                      className="h-8 w-8 rounded-xl border border-[var(--border)] bg-[var(--bg)] hover:bg-[var(--card)] inline-flex items-center justify-center"
                                      title={isOpen ? "Hide testcase details" : "View testcase details"}
                                    >
                                      {isOpen ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (!showHidden) return;
                                        setOpenCaseId((prev) => (prev === c.id ? null : c.id));
                                      }}
                                      disabled={!showHidden}
                                      className={`h-8 w-8 rounded-xl border border-[var(--border)] bg-[var(--bg)] inline-flex items-center justify-center ${showHidden ? "hover:bg-[var(--card)]" : "opacity-60 cursor-not-allowed"}`}
                                      title={showHidden ? (isOpen ? "Hide testcase details" : "View testcase details") : "Hidden testcase inputs are locked"}
                                    >
                                      {isOpen ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                  )}
                                </div>

                                {/* Expanded details (sample always, hidden only when Show hidden is enabled) */}
                                {isOpen ? (
                                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                                    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3">
                                      <div className="text-xs font-semibold text-[var(--muted)] mb-1">Input</div>
                                      <pre className="text-xs whitespace-pre-wrap text-[var(--text)]">{c.stdin || "(empty)"}</pre>
                                    </div>
                                    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3">
                                      <div className="text-xs font-semibold text-[var(--muted)] mb-1">Expected</div>
                                      <pre className="text-xs whitespace-pre-wrap text-[var(--text)]">{c.expected || "(empty)"}</pre>
                                    </div>
                                    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3">
                                      <div className="text-xs font-semibold text-[var(--muted)] mb-1">Your Output</div>
                                      <pre className="text-xs whitespace-pre-wrap text-[var(--text)]">
                                        {(c.stdout || c.stderr) ? `${c.stdout || ""}${c.stderr ? `
${c.stderr}` : ""}` : "(empty)"}
                                      </pre>
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                              </React.Fragment>
                            );
                          })}
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

export default SessionRunner;
