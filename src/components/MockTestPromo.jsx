import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, Puzzle, Code2, Flame } from "lucide-react";
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

export default function MockTestPromo() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);

  const cards = useMemo(
    () => [
      {
        key: "general",
        label: "General Aptitude",
        desc: "Quant • Logical • Verbal (screening)",
        icon: Brain,
        defaultPattern: { general: 15, tech: 0, coding: 0 },
      },
      {
        key: "tech",
        label: "Tech Aptitude",
        desc: "DSA • OOP • OS • CN • DBMS",
        icon: Puzzle,
        defaultPattern: { general: 0, tech: 15, coding: 0 },
      },
      {
        key: "coding",
        label: "Coding",
        desc: "DSA problems with hidden testcases",
        icon: Code2,
        defaultPattern: { general: 0, tech: 0, coding: 1 },
      },
      {
        key: "all",
        label: "All-in-One",
        desc: "General + Tech + Coding (full screening)",
        icon: Flame,
        defaultPattern: { general: 10, tech: 10, coding: 1 },
      },
    ],
    []
  );

  function goToCreate(modeKey) {
    const mode = modeKey || selected;
    navigate(`/start-mock-test?mode=${encodeURIComponent(mode)}`);
  }

  return (
    <section id="mock-tests" className="bg-[var(--bg)] text-[var(--text)]">
      <div className="container pb-14 pt-16">
        {/* same heading style as Services */}
        <h1 className="text-4xl font-bold text-left pb-2 text-[var(--text)]">
          Mock Tests
        </h1>
        <div className="text-sm text-[var(--muted)] pb-10">
          Practice like real screening — Aptitude + Tech + Coding with hidden
          testcases.
        </div>

        {/* same grid + card style as Services */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-8">
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
                  goToCreate(c.key);
                }}
                className={[
                  "cursor-pointer bg-[var(--card)] border border-[var(--border)] rounded-2xl",
                  "flex flex-col gap-3 items-center justify-center p-4 py-7",
                  "hover:scale-110 duration-300 hover:shadow-2xl",
                  isActive ? "ring-2 ring-[var(--accent)]/40" : "",
                ].join(" ")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelected(c.key);
                    goToCreate(c.key);
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
