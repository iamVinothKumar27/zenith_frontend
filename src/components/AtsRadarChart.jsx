import React, { useMemo } from "react";

// Lightweight SVG radar chart (no external deps)
// data: [{ axis: string, value: number(0-100) }]
export default function AtsRadarChart({ data = [], size = 320 }) {
  const cfg = useMemo(() => {
    const pts = (data || []).filter(Boolean);
    const n = pts.length;
    const r = size / 2 - 22;
    const cx = size / 2;
    const cy = size / 2;

    const angle = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;
    const toXY = (i, v01) => {
      const a = angle(i);
      return [cx + Math.cos(a) * r * v01, cy + Math.sin(a) * r * v01];
    };

    const poly = pts
      .map((p, i) => {
        const v01 = Math.max(0, Math.min(1, (Number(p.value) || 0) / 100));
        const [x, y] = toXY(i, v01);
        return `${x},${y}`;
      })
      .join(" ");

    const axes = pts.map((p, i) => {
      const [x2, y2] = toXY(i, 1);
      const [xl, yl] = toXY(i, 1.12);
      return { axis: p.axis, x2, y2, xl, yl };
    });

    const rings = [0.25, 0.5, 0.75, 1].map((v) => {
      const ring = pts
        .map((_, i) => {
          const [x, y] = toXY(i, v);
          return `${x},${y}`;
        })
        .join(" ");
      return { v, ring };
    });

    return { n, r, cx, cy, poly, axes, rings };
  }, [data, size]);

  const pts = (data || []).filter(Boolean);
  if (pts.length < 3) return null;

  return (
    <div className="w-full overflow-hidden">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
        {/* rings */}
        {cfg.rings.map((rk) => (
          <polygon key={rk.v} points={rk.ring} fill="none" stroke="currentColor" opacity={0.15} />
        ))}

        {/* axes */}
        {cfg.axes.map((a, i) => (
          <g key={i}>
            <line x1={cfg.cx} y1={cfg.cy} x2={a.x2} y2={a.y2} stroke="currentColor" opacity={0.18} />
            <text
              x={a.xl}
              y={a.yl}
              fontSize="11"
              fill="currentColor"
              opacity={0.9}
              textAnchor={a.xl < cfg.cx - 10 ? "end" : a.xl > cfg.cx + 10 ? "start" : "middle"}
              dominantBaseline="middle"
            >
              {a.axis}
            </text>
          </g>
        ))}

        {/* polygon */}
        <polygon points={cfg.poly} fill="currentColor" opacity={0.18} />
        <polygon points={cfg.poly} fill="none" stroke="currentColor" opacity={0.55} />

        {/* points */}
        {pts.map((p, i) => {
          const v01 = Math.max(0, Math.min(1, (Number(p.value) || 0) / 100));
          const a = (Math.PI * 2 * i) / cfg.n - Math.PI / 2;
          const x = cfg.cx + Math.cos(a) * cfg.r * v01;
          const y = cfg.cy + Math.sin(a) * cfg.r * v01;
          return <circle key={i} cx={x} cy={y} r={3} fill="currentColor" opacity={0.75} />;
        })}
      </svg>
      <div className="mt-2 text-center text-xs text-[var(--muted)]">Skills vs JD (radar)</div>
    </div>
  );
}
