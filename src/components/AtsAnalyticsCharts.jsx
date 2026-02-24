import React, { useMemo } from "react";

function Donut({ pct = 0, size = 140, stroke = 14 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, Number(pct) || 0));
  const dash = (p / 100) * c;
  const gap = c - dash;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${gap}`}
        />
      </g>
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fill="var(--text)"
        fontSize="22"
        fontWeight="700"
      >
        {Math.round(p)}%
      </text>
      <text
        x="50%"
        y="66%"
        dominantBaseline="middle"
        textAnchor="middle"
        fill="var(--muted)"
        fontSize="11"
      >
        match
      </text>
    </svg>
  );
}

function BarRow({ label, pct, meta }) {
  const p = Math.max(0, Math.min(100, Number(pct) || 0));
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold text-[var(--text)] truncate">{label}</div>
        <div className="text-[10px] text-[var(--muted)] whitespace-nowrap">{meta}</div>
      </div>
      <div className="h-2 rounded-full bg-[var(--bg)] border border-[var(--border)] overflow-hidden">
        <div className="h-full" style={{ width: `${p}%`, background: "var(--accent)" }} />
      </div>
    </div>
  );
}

export default function AtsAnalyticsCharts({ analytics }) {
  const a = analytics || {};

  const donutPct = useMemo(() => {
    if (typeof a.match_pct === "number") return a.match_pct;
    const m = Number(a.matched_count || 0);
    const n = Number(a.missing_count || 0);
    const d = Math.max(1, m + n);
    return (m / d) * 100;
  }, [a.match_pct, a.matched_count, a.missing_count]);

  const cats = (a.category_breakdown || []).slice(0, 10);
  const topMissing = (a.top_missing_weighted || []).slice(0, 8);

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="text-sm font-semibold text-[var(--text)]">ATS match overview</div>
        <div className="mt-3 flex items-center gap-4 flex-wrap">
          <Donut pct={donutPct} size={150} />
          <div className="space-y-2">
            <div className="text-sm text-[var(--text)]">
              <b>{a.matched_count ?? 0}</b> matched • <b>{a.missing_count ?? 0}</b> missing
            </div>
            <div className="text-xs text-[var(--muted)]">
              This view is computed from your detected skills vs the JD skill list.
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="text-sm font-semibold text-[var(--text)]">Category coverage</div>
        <div className="mt-3 space-y-3">
          {cats.length === 0 && <div className="text-sm text-[var(--muted)]">No categorized JD skills found.</div>}
          {cats.map((c) => (
            <BarRow
              key={c.category}
              label={c.category}
              pct={c.match_pct}
              meta={`${c.matched_count}/${c.jd_count}`}
            />
          ))}
        </div>
      </div>

      <div className="md:col-span-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="text-sm font-semibold text-[var(--text)]">Missing skills impact (JD frequency)</div>
        <div className="mt-3 grid md:grid-cols-2 gap-3">
          {topMissing.length === 0 && <div className="text-sm text-[var(--muted)]">No missing skills detected.</div>}
          {topMissing.map((x) => (
            <div key={x.skill} className="px-3 py-3 rounded-2xl bg-[var(--bg)] border border-[var(--border)]">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-[var(--text)] truncate">{x.skill}</div>
                <div className="text-xs text-[var(--muted)]">weight {x.weight}</div>
              </div>
              <div className="mt-2 h-2 rounded-full bg-[var(--card)] border border-[var(--border)] overflow-hidden">
                <div
                  className="h-full"
                  style={{
                    width: `${Math.min(100, (Number(x.weight) || 1) * 12)}%`,
                    background: "var(--accent)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
