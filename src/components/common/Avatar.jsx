import React, { useMemo, useState, useEffect } from "react";

/**
 * Simple Gmail-like avatar:
 * - If imageUrl exists and loads => show image
 * - Else show first letter(s) with deterministic background color
 */
function getInitials(name = "", email = "") {
  const base = String(name || "").trim() || (String(email || "").split("@")[0] || "").trim();
  if (!base) return "U";
  const parts = base.split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  const a = parts[0]?.[0] || "U";
  const b = parts.length > 1 ? (parts[parts.length - 1]?.[0] || "") : "";
  return (a + b).toUpperCase();
}

function hashToHue(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % 360;
}

export default function Avatar({ name = "", email = "", imageUrl = "", size = 28, className = "" }) {
  const [imgOk, setImgOk] = useState(Boolean(String(imageUrl || "").trim()));

  useEffect(() => {
    setImgOk(Boolean(String(imageUrl || "").trim()));
  }, [imageUrl]);

  const seed = useMemo(() => (String(email).trim().toLowerCase() || String(name).trim().toLowerCase() || "user"), [email, name]);
  const initials = useMemo(() => getInitials(name, email), [name, email]);

  const hue = useMemo(() => hashToHue(seed), [seed]);
  const bg = useMemo(() => `hsl(${hue} 55% 45%)`, [hue]);

  const boxStyle = { width: size, height: size };

  if (imageUrl && imgOk) {
    return (
      <img
        src={imageUrl}
        alt={name || email || "avatar"}
        className={`rounded-full object-cover shrink-0 ${className}`}
        style={boxStyle}
        onError={() => setImgOk(false)}
      />
    );
  }

  return (
    <div
      className={`rounded-full text-white font-bold grid place-items-center shrink-0 ${className}`}
      style={{ ...boxStyle, background: bg, fontSize: Math.max(10, Math.floor(size * 0.42)) }}
      aria-label={name || email || "avatar"}
      title={name || email || ""}
    >
      {initials}
    </div>
  );
}
