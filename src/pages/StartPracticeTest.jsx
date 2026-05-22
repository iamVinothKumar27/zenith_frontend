import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Brain, Code2, Database, Layers, Shuffle, ArrowLeft,
  ChevronRight, Loader2, AlertCircle, Settings2, Hash, BookOpen,
} from "lucide-react";
import { useAuth } from "../auth/AuthProvider.jsx";

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

function clampInt(v, min, max) {
  const n = Math.floor(Number(v || 0));
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

const TOPICS = {
  general: ["All Topics","Percentages","Profit & Loss","Time & Work","Time, Speed & Distance","Simple & Compound Interest","Ratio & Proportion","Averages","Number System","Permutation & Combination","Probability","Pipes & Cisterns","Clocks & Calendars","Logical Reasoning","Verbal Ability"],
  tech: ["All Topics","OOP","DBMS","Operating Systems","Computer Networks","System Design Basics","SDLC / Agile","SQL","DSA Basics"],
  dsa: ["All Topics","Arrays","Strings","Hashing","Two Pointers / Sliding Window","Stacks & Queues","Linked List","Recursion","Binary Search","Trees","Heaps","Graphs","Greedy","Dynamic Programming","Bit Manipulation"],
  sql: ["All Topics","Basic Select","Filtering / WHERE","ORDER BY","Aggregates","GROUP BY","HAVING","INNER JOIN","LEFT JOIN","Multiple Joins","Subqueries","CTEs","Window Functions","Date Functions","Case When"],
};

const SECTIONS = [
  { key: "general", label: "General Aptitude", icon: Brain, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-900/20", activeBorder: "border-indigo-500" },
  { key: "tech", label: "Tech Aptitude", icon: Layers, color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-900/20", activeBorder: "border-violet-500" },
  { key: "dsa", label: "DSA / Coding", icon: Code2, color: "text-sky-500", bg: "bg-sky-50 dark:bg-sky-900/20", activeBorder: "border-sky-500" },
  { key: "sql", label: "SQL", icon: Database, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20", activeBorder: "border-emerald-500" },
  { key: "mixed", label: "Mixed Practice", icon: Shuffle, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-900/20", activeBorder: "border-rose-500" },
];

export default function StartPracticeTest() {
  const { user } = useAuth();
  const [sp] = useSearchParams();
  const navigate = useNavigate();

  const sectionParam = (sp.get("section") || "general").toLowerCase();
  const normalized = ["general", "tech", "dsa", "mixed", "sql"].includes(sectionParam) ? sectionParam : "general";

  const [section, setSection] = useState(normalized);
  const [title, setTitle] = useState("Practice Test");
  const [difficulty, setDifficulty] = useState("easy");
  const [topic, setTopic] = useState("All Topics");
  const [count, setCount] = useState(normalized === "mixed" ? 0 : 1);

  const [mixedGeneralTopic, setMixedGeneralTopic] = useState("All Topics");
  const [mixedTechTopic, setMixedTechTopic] = useState("All Topics");
  const [mixedDsaTopic, setMixedDsaTopic] = useState("All Topics");
  const [mixedSqlTopic, setMixedSqlTopic] = useState("All Topics");
  const [mixedGeneralCount, setMixedGeneralCount] = useState(1);
  const [mixedTechCount, setMixedTechCount] = useState(1);
  const [mixedDsaCount, setMixedDsaCount] = useState(1);
  const [mixedSqlCount, setMixedSqlCount] = useState(1);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    setSection(normalized);
    if (normalized === "mixed") {
      setMixedGeneralCount(1); setMixedTechCount(1); setMixedDsaCount(1); setMixedSqlCount(1);
    } else { setCount(1); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalized]);

  useEffect(() => {
    if (section !== "mixed" && !TOPICS[section]?.includes(topic)) setTopic("All Topics");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  const topics = useMemo(() => TOPICS[section] || ["All Topics"], [section]);
  const generalTopics = TOPICS.general;
  const techTopics = TOPICS.tech;
  const dsaTopics = TOPICS.dsa;
  const sqlTopics = TOPICS.sql;

  const sectionInfo = useMemo(() => SECTIONS.find((s) => s.key === section) || SECTIONS[0], [section]);

  async function createSession() {
    setErr("");
    setLoading(true);
    try {
      const token = user ? await user.getIdToken() : "";
      const n = section === "dsa" ? clampInt(count, 1, 20) : section === "sql" ? clampInt(count, 1, 20) : clampInt(count, 1, 40);
      const isMixed = section === "mixed";
      const payload = isMixed
        ? {
            title: title || "Practice Test",
            section: "mixed",
            difficulty,
            topics: {
              general: mixedGeneralTopic === "All Topics" ? "" : mixedGeneralTopic,
              tech: mixedTechTopic === "All Topics" ? "" : mixedTechTopic,
              coding: mixedDsaTopic === "All Topics" ? "" : mixedDsaTopic,
              sql: mixedSqlTopic === "All Topics" ? "" : mixedSqlTopic,
            },
            counts: {
              general: clampInt(mixedGeneralCount, 0, 40),
              tech: clampInt(mixedTechCount, 0, 40),
              coding: clampInt(mixedDsaCount, 0, 20),
              sql: clampInt(mixedSqlCount, 0, 20),
            },
          }
        : {
            title: title || "Practice Test",
            section,
            topic: topic === "All Topics" ? "" : topic,
            difficulty,
            count: n,
            sql: section === "sql",
          };

      const res = await fetchWithFallback("/practice/session/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        if (res.status === 503 && data?.code === "GEMINI_GENERATION_FAILED") {
          throw new Error((data?.error || "Generation failed") + " — click Create Session to regenerate.");
        }
        throw new Error(data?.error || "Could not create practice session");
      }
      const sid = data?.session?.session_id;
      if (!sid) throw new Error("Missing session id");
      navigate(`/practice-test/${sid}`);
    } catch (e) {
      setErr(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const Icon = sectionInfo.icon;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Link
            to="/#practice-tests"
            className="w-10 h-10 rounded-xl border border-[var(--border)] bg-[var(--card)] grid place-items-center text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text)]">Configure Practice Test</h1>
            <p className="text-sm text-[var(--muted)]">Choose a section, topic, and start practicing</p>
          </div>
        </motion.div>

        {/* Section selector */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-5 mb-5 shadow-sm"
        >
          <h3 className="text-sm font-semibold text-[var(--text)] mb-3">Select Section</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {SECTIONS.map((sec) => {
              const SIcon = sec.icon;
              const isActive = section === sec.key;
              return (
                <button
                  key={sec.key}
                  onClick={() => setSection(sec.key)}
                  className={`flex flex-col items-center gap-2 py-3 px-2 rounded-2xl border text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? `${sec.activeBorder} ${sec.bg} ${sec.color}`
                      : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--accent-border)]"
                  }`}
                >
                  <SIcon className="w-5 h-5" />
                  <span className="text-center leading-tight">{sec.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Configuration form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6"
        >
          {/* Test name */}
          <div>
            <label className="ui-label mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              Practice Name
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="ui-input"
              placeholder="e.g., Arrays - Easy Drill"
            />
          </div>

          {/* Difficulty */}
          <div>
            <label className="ui-label mb-2 flex items-center gap-1.5">
              <Settings2 className="w-3.5 h-3.5" />
              Difficulty
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { val: "easy", label: "Easy", color: "text-emerald-600", border: "border-emerald-300 dark:border-emerald-700", activeBg: "bg-emerald-50 dark:bg-emerald-900/30" },
                { val: "medium", label: "Medium", color: "text-yellow-600", border: "border-yellow-300 dark:border-yellow-700", activeBg: "bg-yellow-50 dark:bg-yellow-900/30" },
                { val: "hard", label: "Hard", color: "text-red-600", border: "border-red-300 dark:border-red-700", activeBg: "bg-red-50 dark:bg-red-900/30" },
                { val: "mixed", label: "Mixed", color: "text-indigo-600", border: "border-indigo-300 dark:border-indigo-700", activeBg: "bg-indigo-50 dark:bg-indigo-900/30" },
              ].map((d) => (
                <button
                  key={d.val}
                  type="button"
                  onClick={() => setDifficulty(d.val)}
                  className={`py-2.5 rounded-xl border text-sm font-semibold transition-all duration-200 ${
                    difficulty === d.val
                      ? `${d.border} ${d.activeBg} ${d.color}`
                      : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--accent-border)]"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mixed section config */}
          {section === "mixed" && (
            <div className="space-y-4">
              <label className="ui-label flex items-center gap-1.5">
                <Shuffle className="w-3.5 h-3.5" />
                Mixed Section Configuration
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "General Aptitude", topics: generalTopics, topic: mixedGeneralTopic, setTopic: setMixedGeneralTopic, count: mixedGeneralCount, setCount: setMixedGeneralCount, max: 40 },
                  { label: "Tech Aptitude", topics: techTopics, topic: mixedTechTopic, setTopic: setMixedTechTopic, count: mixedTechCount, setCount: setMixedTechCount, max: 40 },
                  { label: "DSA / Coding", topics: dsaTopics, topic: mixedDsaTopic, setTopic: setMixedDsaTopic, count: mixedDsaCount, setCount: setMixedDsaCount, max: 20 },
                  { label: "SQL", topics: sqlTopics, topic: mixedSqlTopic, setTopic: setMixedSqlTopic, count: mixedSqlCount, setCount: setMixedSqlCount, max: 20 },
                ].map((f) => (
                  <div key={f.label} className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border)]">
                    <div className="text-xs font-semibold text-[var(--muted)] mb-2">{f.label}</div>
                    <select
                      value={f.topic}
                      onChange={(e) => f.setTopic(e.target.value)}
                      className="ui-input mb-2 text-sm"
                    >
                      {f.topics.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <input
                      type="number"
                      min={0}
                      max={f.max}
                      value={f.count}
                      onChange={(e) => f.setCount(e.target.value)}
                      className="ui-input text-sm"
                      placeholder="Questions"
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-[var(--muted)]">Keep "All Topics" to randomize within each section.</p>
            </div>
          )}

          {/* Single section config */}
          {section !== "mixed" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="ui-label mb-1.5 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5" />
                  {section === "dsa" || section === "sql" ? "Problems" : "Questions"}
                </label>
                <input
                  type="number"
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                  min={section === "dsa" || section === "sql" ? 1 : 5}
                  max={section === "dsa" || section === "sql" ? 10 : 40}
                  className="ui-input"
                />
              </div>
              <div>
                <label className="ui-label mb-1.5 block">Topic</label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="ui-input"
                >
                  {topics.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Error */}
          {err && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {err}
            </motion.div>
          )}

          {/* Submit */}
          <button
            onClick={createSession}
            disabled={loading}
            className="w-full primary-btn py-3.5 text-base gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating session…
              </>
            ) : (
              <>
                Start Practice
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-xs text-[var(--muted)] text-center">
            Your practice session will open in the Testing Panel.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
