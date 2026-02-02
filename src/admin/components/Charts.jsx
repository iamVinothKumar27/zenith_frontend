import React from "react";

// Lightweight SVG charts (no external libs)

export function Donut({ percent = 0, size = 72, stroke = 10 }) {
  const p = Math.max(0, Math.min(100, Number(percent) || 0));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (p / 100) * c;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Percent ${Math.round(p)}%`}>
      <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--border)" strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="#22c55e"
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={`${dash} ${c - dash}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fontSize="14" fill="var(--text)">
        {Math.round(p)}%
      </text>
    </svg>
  );
}

export function BarChart({ data = [], height = 170 }) {
  // data: [{ label, value }]
  const max = Math.max(1, ...data.map((d) => Number(d.value) || 0));
  const w = Math.max(320, data.length * 92);
  const pad = 28;
  const innerH = height - pad * 2;

  return (
    <div className="w-full overflow-x-auto">
      <svg width={w} height={height} viewBox={`0 0 ${w} ${height}`} role="img" aria-label="Bar chart">
        <line x1={pad} y1={height - pad} x2={w - pad} y2={height - pad} stroke="var(--border)" strokeWidth="2" />
        {data.map((d, i) => {
          const v = Number(d.value) || 0;
          const bh = (v / max) * innerH;
          const bw = 46;
          const gap = 44;
          const x = pad + i * (bw + gap);
          const y = height - pad - bh;
          return (
            <g key={d.label || i}>
              <rect x={x} y={y} width={bw} height={bh} rx="10" fill="var(--accent)" opacity="0.9" />
              <text x={x + bw / 2} y={y - 8} fontSize="12" textAnchor="middle" fill="var(--text)">
                {Math.round(v)}
              </text>
              <text x={x + bw / 2} y={height - 10} fontSize="12" textAnchor="middle" fill="var(--muted)">
                {(d.label || "").slice(0, 12)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function SimplePie({ slices = [], size = 170 }) {
  // slices: [{ label, value, color }]
  const total = slices.reduce((a, s) => a + (Number(s.value) || 0), 0) || 1;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;

  let acc = 0;
  const paths = slices.map((s, idx) => {
    const val = Number(s.value) || 0;
    const start = (acc / total) * Math.PI * 2;
    acc += val;
    const end = (acc / total) * Math.PI * 2;
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    const large = end - start > Math.PI ? 1 : 0;
    const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
    return <path key={idx} d={d} fill={s.color || "#60a5fa"} opacity="0.95" />;
  });

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Pie chart">
        {paths}
        {/* Theme-aware center cut-out so value remains readable in dark mode */}
        <circle
          cx={cx}
          cy={cy}
          r={r * 0.55}
          fill="var(--card)"
          stroke="var(--border)"
          strokeWidth="1"
        />
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fontSize="14" fill="var(--text)" fontWeight="700">
          {Math.round(total)}
        </text>
      </svg>
      <div className="flex flex-col gap-2 text-sm">
        {slices.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: s.color || "#60a5fa" }} />
            <span className="text-[var(--muted)]">{s.label}</span>
            <span className="ml-auto text-[var(--muted)]">{Math.round(Number(s.value) || 0)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
