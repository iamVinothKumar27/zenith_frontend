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

// Do not generate predefined avatars.
// Use uploaded app photo first, then Gmail / Firebase photoURL.
export function userAvatarUrl({ photoURL = "", photoLocalURL = "" } = {}) {
  return pickFirstUrl(photoLocalURL, photoURL);
}
