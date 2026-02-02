import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

// A lightweight SVG JSON-tree mindmap viewer (no extra deps)
// Tree schema: { name: string, children?: [...] }

const NODE_W = 180;
const NODE_H = 52;
const DX = 240; // horizontal spacing
const DY = 90;  // vertical spacing
const PAD = 40;

const wrapLines = (text, maxLen = 18, maxLines = 2) => {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  if (!words.length) return ["Untitled"];
  const lines = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length <= maxLen) cur = next;
    else {
      if (cur) lines.push(cur);
      cur = w;
    }
    if (lines.length >= maxLines) break;
  }
  if (lines.length < maxLines && cur) lines.push(cur);
  if (lines.length > maxLines) return lines.slice(0, maxLines);
  return lines;
};

function assignLayout(root, collapsed) {
  let leafY = 0;
  const nodes = [];
  const links = [];
  let maxDepth = 0;

  const nodeId = (path) => path.join("/");

  const walk = (node, depth, path, parentId = null) => {
    const id = nodeId(path);
    const children = Array.isArray(node?.children) ? node.children : [];
    const isCollapsed = collapsed.has(id);
    const hasVisibleChildren = children.length > 0 && !isCollapsed;

    maxDepth = Math.max(maxDepth, depth);

    let y;
    if (!hasVisibleChildren) {
      y = leafY;
      leafY += 1;
    } else {
      const childYs = [];
      children.forEach((ch, i) => {
        const cy = walk(ch, depth + 1, [...path, String(i)], id);
        childYs.push(cy);
      });
      y = childYs.reduce((a, b) => a + b, 0) / Math.max(1, childYs.length);
    }

    nodes.push({
      id,
      name: node?.name || "Untitled",
      depth,
      y,
      parentId,
      hasChildren: children.length > 0,
      collapsed: isCollapsed,
    });

    if (parentId) links.push({ from: parentId, to: id });
    return y;
  };

  walk(root, 0, ["0"], null);

  // Convert logical coords -> svg coords
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const positioned = nodes.map((n) => {
    const x = PAD + n.depth * DX;
    const y = PAD + n.y * DY;
    return { ...n, x, y };
  });
  const positionedById = new Map(positioned.map((n) => [n.id, n]));
  const plinks = links
    .map((l) => {
      const a = positionedById.get(l.from);
      const b = positionedById.get(l.to);
      if (!a || !b) return null;
      return { a, b };
    })
    .filter(Boolean);

  const height = PAD * 2 + Math.max(1, leafY - 1) * DY + NODE_H;
  const width = PAD * 2 + maxDepth * DX + NODE_W;
  return { nodes: positioned, links: plinks, width, height, byId: positionedById };
}

function collectCollapsibleIds(root) {
  const out = new Set();
  const walk = (node, path) => {
    const id = path.join("/");
    const children = Array.isArray(node?.children) ? node.children : [];
    if (children.length) out.add(id);
    children.forEach((ch, i) => walk(ch, [...path, String(i)]));
  };
  walk(root, ["0"]);
  return out;
}

export default function MindmapViewer({ tree, title = "Mindmap" }) {
  const svgRef = useRef(null);
  const [collapsed, setCollapsed] = useState(() => new Set());
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef({ on: false, x: 0, y: 0, px: 0, py: 0 });

  // Reset view when tree changes
  useEffect(() => {
    // Start collapsed (root only). Users can expand branch-by-branch.
    // Collapsed set stores nodes whose CHILDREN are hidden.
    setCollapsed(tree ? collectCollapsibleIds(tree) : new Set());
    setScale(1);
    setPan({ x: 0, y: 0 });
  }, [tree]);

  const layout = useMemo(() => {
    if (!tree) return null;
    return assignLayout(tree, collapsed);
  }, [tree, collapsed]);

  const toggleNode = (id) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onMouseDown = (e) => {
    dragRef.current = { on: true, x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
  };
  const onMouseMove = (e) => {
    if (!dragRef.current.on) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    setPan({ x: dragRef.current.px + dx, y: dragRef.current.py + dy });
  };
  const onMouseUp = () => {
    dragRef.current.on = false;
  };

  // Trackpad / mouse-wheel support:
  // - pinch / ctrl-wheel -> zoom
  // - normal wheel -> pan
  const onWheel = (e) => {
    e.preventDefault();
    const isZoomGesture = e.ctrlKey || e.metaKey;
    if (isZoomGesture) {
      // deltaY: +ve zoom-out, -ve zoom-in
      const delta = (-e.deltaY / 500) * 0.6;
      zoomBy(delta);
      return;
    }
    // Pan with two-finger scroll
    setPan((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
  };

  const zoomBy = (delta) => {
    setScale((s) => {
      const next = Math.max(0.4, Math.min(2.2, Number((s + delta).toFixed(2))));
      return next;
    });
  };

  const resetView = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  const downloadSvgFull = async () => {
  if (!tree) return;

  // ✅ full layout: ignore collapsed state
  const fullLayout = assignLayout(tree, new Set());

  // Build an SVG string with full nodes/links
  const esc = (s) =>
    String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");

  const svgParts = [];
  svgParts.push(
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${fullLayout.width}" height="${fullLayout.height}" viewBox="0 0 ${fullLayout.width} ${fullLayout.height}">`,
    `<defs>
      <filter id="mm_shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.25" />
      </filter>
    </defs>`,
    // background like your card
    `<rect x="0" y="0" width="${fullLayout.width}" height="${fullLayout.height}" fill="#0b1220" />`
  );

  // LINKS
  for (let i = 0; i < fullLayout.links.length; i++) {
    const l = fullLayout.links[i];
    const ax = l.a.x + NODE_W;
    const ay = l.a.y + NODE_H / 2;
    const bx = l.b.x;
    const by = l.b.y + NODE_H / 2;
    const mx = (ax + bx) / 2;

    svgParts.push(
      `<path d="M ${ax} ${ay} C ${mx} ${ay}, ${mx} ${by}, ${bx} ${by}"
        fill="none" stroke="rgba(148,163,184,0.55)" stroke-width="2" />`
    );
  }

  // NODES
  for (let i = 0; i < fullLayout.nodes.length; i++) {
    const n = fullLayout.nodes[i];
    const cx = n.x;
    const cy = n.y;
    const lines = wrapLines(n.name);

    svgParts.push(
      `<g transform="translate(${cx}, ${cy})">`,
      `<rect width="${NODE_W}" height="${NODE_H}" rx="14" ry="14"
        fill="rgba(15,23,42,0.55)" stroke="rgba(148,163,184,0.35)" stroke-width="1.5"
        filter="url(#mm_shadow)" />`
    );

    // text
    const yBase = NODE_H / 2 - (lines.length === 2 ? 7 : 0);
    svgParts.push(
      `<text x="${NODE_W / 2}" y="${yBase}"
        text-anchor="middle" dominant-baseline="middle"
        fill="rgba(226,232,240,0.95)" font-size="12"
        font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto">`
    );

    for (let k = 0; k < lines.length; k++) {
      const dy = k === 0 ? 0 : 14;
      svgParts.push(
        `<tspan x="${NODE_W / 2}" dy="${dy}">${esc(lines[k])}</tspan>`
      );
    }

    svgParts.push(`</text>`, `</g>`);
  }

  svgParts.push(`</svg>`);

  const svgString = svgParts.join("\n");
  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${(title || "mindmap").replace(/[^a-z0-9\-_]+/gi, "_")}_FULL.svg`;
  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
};


  if (!tree || !layout) {
    return (
      <div className="p-6 text-[var(--muted)]">No mindmap yet. Generate to preview.</div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold">{title}</div>
          <span className="text-xs text-[var(--muted)]">(drag to pan • click nodes to expand/collapse)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => zoomBy(-0.15)}
            className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:brightness-95 text-sm"
          >
            −
          </button>
          <button
            onClick={() => zoomBy(0.15)}
            className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:brightness-95 text-sm"
          >
            +
          </button>
          <button
            onClick={resetView}
            className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:brightness-95 text-sm"
          >
            Reset
          </button>
          <button
            onClick={downloadSvgFull}
            className="px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-2)] text-sm"
          >
            Download
          </button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden"
      >
        <div className="w-full h-[560px] relative select-none">
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            viewBox={`0 0 ${layout.width} ${layout.height}`}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onWheel={onWheel}
            style={{ cursor: dragRef.current.on ? "grabbing" : "grab" }}
          >
            <defs>
              <filter id="mm_shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.25" />
              </filter>
            </defs>

            <g transform={`translate(${pan.x}, ${pan.y}) scale(${scale})`} style={{ transition: "transform 160ms ease" }}>
              {/* Links */}
              {layout.links.map((l, idx) => {
                const ax = l.a.x + NODE_W;
                const ay = l.a.y + NODE_H / 2;
                const bx = l.b.x;
                const by = l.b.y + NODE_H / 2;
                const mx = (ax + bx) / 2;
                return (
                  <path
                    key={idx}
                    d={`M ${ax} ${ay} C ${mx} ${ay}, ${mx} ${by}, ${bx} ${by}`}
                    fill="none"
                    stroke="rgba(148,163,184,0.55)"
                    strokeWidth="2"
                  />
                );
              })}

              {/* Nodes */}
              {layout.nodes.map((n) => {
                const lines = wrapLines(n.name);
                const cx = n.x;
                const cy = n.y;
                return (
                  <g
                    key={n.id}
                    transform={`translate(${cx}, ${cy})`}
                    onClick={() => (n.hasChildren ? toggleNode(n.id) : null)}
                    style={{ cursor: n.hasChildren ? "pointer" : "default" }}
                  >
                    <rect
                      width={NODE_W}
                      height={NODE_H}
                      rx="14"
                      ry="14"
                      fill="rgba(15,23,42,0.55)"
                      stroke="rgba(148,163,184,0.35)"
                      strokeWidth="1.5"
                      filter="url(#mm_shadow)"
                    />
                    <text
                      x={NODE_W / 2}
                      y={NODE_H / 2 - (lines.length === 2 ? 7 : 0)}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="rgba(226,232,240,0.95)"
                      fontSize="12"
                      fontFamily="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto"
                    >
                      {lines.map((ln, i) => (
                        <tspan key={i} x={NODE_W / 2} dy={i === 0 ? 0 : 14}>
                          {ln}
                        </tspan>
                      ))}
                    </text>

                    {n.hasChildren ? (
                      <g transform={`translate(${NODE_W - 20}, ${NODE_H / 2})`}>
                        <path
                          d={n.collapsed ? "M -4 -3 L 4 0 L -4 3 Z" : "M -3 -4 L 0 4 L 3 -4 Z"}
                          fill="rgba(226,232,240,0.9)"
                        />
                      </g>
                    ) : null}
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
      </motion.div>
    </div>
  );
}
