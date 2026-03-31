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

const SlideLeft = (delay) => ({
  initial: { opacity: 0, x: 50 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, delay, ease: "easeInOut" },
  },
});

/**
 * Reusable promo grid used by both Mock Tests and Practice Tests,
 * so both sections stay pixel-identical and theme-consistent.
 */
export function PromoGridSection({
  id,
  title,
  subtitle,
  cards,
  onCardClick,
}) {
  const [selected, setSelected] = useState(null);

  return (
    <section id={id} className="bg-[var(--bg)] text-[var(--text)]">
      <div className="container pb-14 pt-16">
        <h1 className="text-4xl font-bold text-left pb-2 text-[var(--text)]">
          {title}
        </h1>
        <div className="text-sm text-[var(--muted)] pb-10">{subtitle}</div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8">
          {cards.map((c, i) => {
            const Icon = c.icon;
            const isActive = c.key === selected;

            return (
              <motion.div
                key={c.key}
                variants={SlideLeft(i * 0.1)}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                onClick={() => {
                  setSelected(c.key);
                  onCardClick?.(c);
                }}
                className={[
                  "cursor-pointer bg-[var(--card)] border border-[var(--border)] rounded-2xl",
                  "flex flex-col gap-3 items-center justify-center p-4 py-7 min-h-[240px]",
                  "hover:scale-110 duration-300 hover:shadow-2xl",
                  isActive ? "ring-2 ring-[var(--accent)]/40" : "",
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
                <div className="text-4xl mb-1 text-[var(--text)]">
                  <Icon size={40} className="text-[var(--text)]" />
                </div>

                <h2 className="text-lg font-semibold text-center px-3">
                  {c.label}
                </h2>

                <p className="text-sm text-[var(--muted)] text-center leading-relaxed px-2">
                  {c.desc}
                </p>

                <div className="bg-[var(--accent)] text-white px-4 py-2 rounded-lg hover:bg-[var(--accent-2)] transition">
                  Start
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function MockTestPromo() {
  const navigate = useNavigate();

  const cards = useMemo(
    () => [
      {
        key: "general",
        label: "General Aptitude",
        desc: "Quant • Logical • Verbal (screening)",
        icon: Brain,
      },
      {
        key: "tech",
        label: "Tech Aptitude",
        desc: "DSA • OOP • OS • CN • DBMS",
        icon: Puzzle,
      },
      {
        key: "coding",
        label: "Coding",
        desc: "DSA problems with hidden testcases",
        icon: Code2,
      },
      {
        key: "sql",
        label: "SQL",
        desc: "Schema-based SQL screening with hidden datasets",
        icon: Database,
      },
      {
        key: "all",
        label: "All-in-One",
        desc: "General + Tech + Coding + SQL (full screening)",
        icon: Flame,
      },
    ],
    []
  );

  return (
    <PromoGridSection
      id="mock-tests"
      title="Mock Tests"
      subtitle="Practice like real screening — Aptitude + Tech + Coding with hidden testcases."
      cards={cards}
      onCardClick={(c) =>
        navigate(`/start-mock-test?mode=${encodeURIComponent(c.key)}`)
      }
    />
  );
}