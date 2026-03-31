// Shared API fetch helper with fallback base URLs.
// Uses VITE_API_BASES (comma-separated). Falls back to relative fetch if not provided.

const API_BASES = (import.meta?.env?.VITE_API_BASES || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export async function fetchWithFallback(path, options = {}) {
  const cleanPath = String(path || "").startsWith("/") ? String(path) : `/${path}`;

  // 1) If no bases configured, just use relative path.
  if (!API_BASES.length) {
    return fetch(cleanPath, { credentials: "include", ...options });
  }

  let lastErr = null;

  // 2) Try each base.
  for (const base of API_BASES) {
    const url = `${base.replace(/\/$/, "")}${cleanPath}`;
    try {
      const res = await fetch(url, { credentials: "include", ...options });
      // If server is down, fetch may throw; if it responds, return it even if non-2xx.
      return res;
    } catch (e) {
      lastErr = e;
    }
  }

  // 3) Final fallback: relative.
  try {
    return await fetch(cleanPath, { credentials: "include", ...options });
  } catch (e) {
    lastErr = e;
  }

  throw lastErr || new Error("Network error");
}
