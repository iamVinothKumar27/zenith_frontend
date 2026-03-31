import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider.jsx";

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

function clampInt(v, min, max) {
  const n = Math.floor(Number(v || 0));
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

const TOPICS = {
  general: [
    "All Topics",
    "Percentages",
    "Profit & Loss",
    "Time & Work",
    "Time, Speed & Distance",
    "Simple & Compound Interest",
    "Ratio & Proportion",
    "Averages",
    "Number System",
    "Permutation & Combination",
    "Probability",
    "Pipes & Cisterns",
    "Clocks & Calendars",
    "Logical Reasoning",
    "Verbal Ability",
  ],
  tech: [
    "All Topics",
    "OOP",
    "DBMS",
    "Operating Systems",
    "Computer Networks",
    "System Design Basics",
    "SDLC / Agile",
    "SQL",
    "DSA Basics",
  ],
  dsa: [
    "All Topics",
    "Arrays",
    "Strings",
    "Hashing",
    "Two Pointers / Sliding Window",
    "Stacks & Queues",
    "Linked List",
    "Recursion",
    "Binary Search",
    "Trees",
    "Heaps",
    "Graphs",
    "Greedy",
    "Dynamic Programming",
    "Bit Manipulation",
  ],
  sql: [
    "All Topics",
    "Basic Select",
    "Filtering / WHERE",
    "ORDER BY",
    "Aggregates",
    "GROUP BY",
    "HAVING",
    "INNER JOIN",
    "LEFT JOIN",
    "Multiple Joins",
    "Subqueries",
    "CTEs",
    "Window Functions",
    "Date Functions",
    "Case When",
  ],
};

export default function StartPracticeTest() {
  const { user } = useAuth();
  const [sp] = useSearchParams();
  const navigate = useNavigate();

  const sectionParam = (sp.get("section") || "general").toLowerCase();
  const normalized = ["general", "tech", "dsa", "mixed", "sql"].includes(sectionParam) ? sectionParam : "general";

  // Mixed means: generate General + Tech + DSA together (topic selectors for each).
  const [section, setSection] = useState(normalized);

  const [title, setTitle] = useState("Practice Test");
  const [difficulty, setDifficulty] = useState("easy");
  const [topic, setTopic] = useState("All Topics");
  const [count, setCount] = useState(normalized === "mixed" ? 0 : 1);

  // Mixed topics + counts
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
    // set sensible default counts
    if (normalized === "mixed") {
      setMixedGeneralCount(1);
      setMixedTechCount(1);
      setMixedDsaCount(1);
      setMixedSqlCount(1);
    } else {
      setCount(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalized]);

  const topics = useMemo(() => TOPICS[section] || ["All Topics"], [section]);

  const generalTopics = useMemo(() => TOPICS.general, []);
  const techTopics = useMemo(() => TOPICS.tech, []);
  const dsaTopics = useMemo(() => TOPICS.dsa, []);
  const sqlTopics = useMemo(() => TOPICS.sql, []);

  useEffect(() => {
    // Reset topic if it's not in list
    if (section !== "mixed" && !topics.includes(topic)) setTopic("All Topics");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  const sectionLabel = useMemo(() => {
    if (section === "mixed") return "Mixed Practice (General + Tech + DSA + SQL)";
    if (section === "general") return "General Aptitude";
    if (section === "tech") return "Tech Aptitude";
    if (section === "sql") return "SQL Practice";
    return "DSA (Coding)";
  }, [section]);

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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        if (res.status === 503 && data?.code === "GEMINI_GENERATION_FAILED") {
          throw new Error((data?.error || "Gemini generation failed") + " — click Create Session to regenerate.");
        }
        throw new Error(data?.error || "Could not create practice session");
      }
      const sid = data?.session?.session_id;
      if (!sid) throw new Error("Missing session id");
      // ✅ Open in the Testing Panel
      navigate(`/practice-test/${sid}`);
    } catch (e) {
      setErr(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-4 py-10 min-h-[calc(100vh-96px)] flex items-center justify-center bg-[var(--bg)] text-[var(--text)]">
      <div className="w-full max-w-xl rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-sm overflow-hidden">
        <div className="px-6 py-6 border-b border-[var(--border)] text-center">
          <div className="text-2xl font-extrabold text-[var(--text)]">Start Practice</div>
          <div className="mt-1 text-sm text-[var(--muted)]">
            Selected: <span className="font-semibold text-[var(--text)]">{sectionLabel}</span>
          </div>
          <div className="mt-4 flex justify-center">
            <Link
              to="/"
              className="px-4 py-2 rounded-2xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm hover:opacity-90"
            >
              Back
            </Link>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {normalized === "mixed" ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
                <div className="text-sm font-semibold text-[var(--text)]">Mixed topics</div>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                  <div>
                    <div className="text-xs text-[var(--muted)]">General</div>
                    <select
                      value={mixedGeneralTopic}
                      onChange={(e) => setMixedGeneralTopic(e.target.value)}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)]"
                    >
                      {generalTopics.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={5}
                      max={40}
                      value={mixedGeneralCount}
                      onChange={(e) => setMixedGeneralCount(e.target.value)}
                      className="mt-2 w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)]"
                      placeholder="Questions"
                    />
                  </div>

                  <div>
                    <div className="text-xs text-[var(--muted)]">Tech</div>
                    <select
                      value={mixedTechTopic}
                      onChange={(e) => setMixedTechTopic(e.target.value)}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)]"
                    >
                      {techTopics.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={5}
                      max={40}
                      value={mixedTechCount}
                      onChange={(e) => setMixedTechCount(e.target.value)}
                      className="mt-2 w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)]"
                      placeholder="Questions"
                    />
                  </div>

                  <div>
                    <div className="text-xs text-[var(--muted)]">DSA (Coding)</div>
                    <select
                      value={mixedDsaTopic}
                      onChange={(e) => setMixedDsaTopic(e.target.value)}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)]"
                    >
                      {dsaTopics.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={mixedDsaCount}
                      onChange={(e) => setMixedDsaCount(e.target.value)}
                      className="mt-2 w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)]"
                      placeholder={section === "sql" ? "SQL Problems" : "Problems"}
                    />
                  </div>

                  <div>
                    <div className="text-xs text-[var(--muted)]">SQL</div>
                    <select
                      value={mixedSqlTopic}
                      onChange={(e) => setMixedSqlTopic(e.target.value)}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)]"
                    >
                      {sqlTopics.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={mixedSqlCount}
                      onChange={(e) => setMixedSqlCount(e.target.value)}
                      className="mt-2 w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)]"
                      placeholder="SQL Problems"
                    />
                  </div>
                </div>

                <div className="mt-2 text-xs text-[var(--muted)]">
                  Tip: Keep “All Topics” to randomize inside that section.
                </div>
              </div>
            </div>
          ) : null}

          <div>
            <div className="text-sm font-semibold text-[var(--text)]">Practice name</div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2 w-full px-4 py-3 rounded-2xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
              placeholder="e.g., Arrays - Easy Drill"
            />
          </div>

          <div className={`grid grid-cols-1 ${normalized === "mixed" ? "" : "sm:grid-cols-2"} gap-4`}>
            <div>
              <div className="text-sm font-semibold text-[var(--text)]">Difficulty</div>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="mt-2 w-full px-4 py-3 rounded-2xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>

            {normalized !== "mixed" ? (
              <div>
                <div className="text-sm font-semibold text-[var(--text)]">
                  {section === "dsa" || section === "sql" ? "Problems" : "Questions"}
                </div>
                <input
                  type="number"
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                  min={section === "dsa" || section === "sql" ? 1 : 5}
                  max={section === "dsa" || section === "sql" ? 10 : 40}
                  className="mt-2 w-full px-4 py-3 rounded-2xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                />
              </div>
            ) : null}
          </div>

          {normalized !== "mixed" ? (
            <div>
              <div className="text-sm font-semibold text-[var(--text)]">Topic</div>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="mt-2 w-full px-4 py-3 rounded-2xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
              >
                {topics.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <div className="mt-2 text-xs text-[var(--muted)]">
                Tip: choose a topic to drill, or keep “All Topics” for a mixed set inside this area.
              </div>
            </div>
          ) : null}

          {err ? (
            <div className="rounded-2xl border border-red-300 bg-red-50 text-red-700 px-4 py-3 text-sm">
              {err}
            </div>
          ) : null}

          <button
            onClick={createSession}
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-[var(--accent)] text-white font-semibold hover:brightness-110 disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create Session"}
          </button>

          <div className="text-xs text-[var(--muted)] text-center">
            Your practice session will open in the same Testing Panel UI.
          </div>
        </div>
      </div>
    </div>
  );
}
