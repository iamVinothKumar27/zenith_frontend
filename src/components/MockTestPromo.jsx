import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, Puzzle, Code2, Flame, Database } from "lucide-react";
import { motion } from "framer-motion";

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
  throw lastErr || new Error("Network error");
}

const ICON_COLORS = [
  { bg: "bg-indigo-50 dark:bg-indigo-900/20", icon: "text-indigo-600" },
  { bg: "bg-violet-50 dark:bg-violet-900/20", icon: "text-violet-600" },
  { bg: "bg-sky-50 dark:bg-sky-900/20", icon: "text-sky-600" },
  { bg: "bg-emerald-50 dark:bg-emerald-900/20", icon: "text-emerald-600" },
  { bg: "bg-rose-50 dark:bg-rose-900/20", icon: "text-rose-600" },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: "easeOut" } },
};

export function PromoGridSection({ id, title, subtitle, cards, onCardClick }) {
  const [selected, setSelected] = useState(null);

  return (
    <section id={id} className="bg-[var(--bg)] py-20">
      <div className="container">
        {/* Header */}
        <div className="mb-12">
          <div className="section-eyebrow mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
            Practice & Assessment
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="section-title mb-2">{title}</h2>
              <p className="text-[var(--muted)] text-base max-w-xl">{subtitle}</p>
            </div>
          </div>
        </div>

        {/* Cards */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
        >
          {cards.map((c, i) => {
            const Icon = c.icon;
            const colors = ICON_COLORS[i % ICON_COLORS.length];
            const isActive = c.key === selected;

            return (
              <motion.div
                key={c.key}
                variants={item}
                onClick={() => {
                  setSelected(c.key);
                  onCardClick?.(c);
                }}
                className={[
                  "group cursor-pointer bg-[var(--card)] rounded-2xl border p-5 flex flex-col gap-4",
                  "transition-all duration-300 hover:-translate-y-1",
                  isActive
                    ? "border-[var(--accent)] shadow-[0_0_0_3px_rgba(99,102,241,0.15)]"
                    : "border-[var(--border)] hover:border-[var(--accent-border)] hover:shadow-[0_8px_24px_rgba(79,70,229,0.10)]",
                ].join(" ")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelected(c.key);
                    onCardClick?.(c);
                  }
                }}
              >
                {/* Icon */}
                <div className={`w-12 h-12 rounded-2xl ${colors.bg} grid place-items-center shrink-0`}>
                  <Icon className={`w-6 h-6 ${colors.icon}`} />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="font-semibold text-[var(--text)] text-sm mb-1.5 group-hover:text-[var(--accent)] transition-colors">
                    {c.label}
                  </h3>
                  <p className="text-xs text-[var(--muted)] leading-relaxed">{c.desc}</p>
                </div>

                {/* CTA */}
                <button
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:shadow-md hover:brightness-110"
                  style={{ background: "var(--grad)" }}
                  onClick={(e) => { e.stopPropagation(); setSelected(c.key); onCardClick?.(c); }}
                >
                  Start Now
                </button>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

export default function MockTestPromo() {
  const navigate = useNavigate();

  const cards = useMemo(
    () => [
      { key: "general", label: "General Aptitude", desc: "Quant · Logical · Verbal screening", icon: Brain },
      { key: "tech", label: "Tech Aptitude", desc: "DSA · OOP · OS · CN · DBMS", icon: Puzzle },
      { key: "coding", label: "Coding", desc: "DSA problems with hidden testcases", icon: Code2 },
      { key: "sql", label: "SQL", desc: "Schema-based SQL screening with datasets", icon: Database },
      { key: "all", label: "All-in-One", desc: "General + Tech + Coding + SQL full screen", icon: Flame },
    ],
    []
  );

  return (
    <PromoGridSection
      id="mock-tests"
      title="Mock Tests"
      subtitle="Practice like real screening — Aptitude + Tech + Coding with hidden testcases."
      cards={cards}
      onCardClick={(c) => navigate(`/start-mock-test?mode=${encodeURIComponent(c.key)}`)}
    />
  );
}
