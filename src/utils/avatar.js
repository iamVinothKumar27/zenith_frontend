// Deterministic fallback avatars (no broken image icon when a user has not uploaded a photo).
// We use Dicebear so we don't need md5 hashing (Gravatar).

export function normalizeEmail(email = "") {
  return String(email || "").trim().toLowerCase();
}

export function pickFirstUrl(...candidates) {
  for (const c of candidates) {
    const s = (c == null ? "" : String(c)).trim();
    if (s) return s;
  }
  return "";
}

export function fallbackAvatarUrl({ email = "", name = "" } = {}) {
  const seed = normalizeEmail(email) || String(name || "").trim() || "user";
  // SVG is crisp and loads fast.
  return `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(seed)}`;
}

export function userAvatarUrl({ email = "", name = "", photoURL = "", photoLocalURL = "" } = {}) {
  return pickFirstUrl(photoLocalURL, photoURL) || fallbackAvatarUrl({ email, name });
}
