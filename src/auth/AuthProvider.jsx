import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { auth } from "../firebase.js";
import { onAuthStateChanged } from "firebase/auth";

// ✅ Multi-backend support (comma-separated). Example:
// VITE_API_BASES=https://server.zenithlearning.site,https://zenithserver.vinothkumarts.in
const API_BASES = (import.meta.env.VITE_API_BASES || import.meta.env.VITE_API_BASE || "http://127.0.0.1:5000")
  .split(",")
  .map(s => s.trim().replace(/\/$/, ""))
  .filter(Boolean);

async function fetchWithFallback(path, options) {
  let lastErr = null;
  const p = path.startsWith("/") ? path : `/${path}`;
  for (const base of API_BASES) {
    try {
      const res = await fetch(`${base}${p}`, options);
      // Retry only on 5xx; for 2xx-4xx return the response as-is
      if (res.status < 500) return res;
      lastErr = new Error(`HTTP ${res.status}`);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("All backends failed");
}


const AuthContext = createContext(null);

async function syncFirebaseUserToMongo(user) {
  if (!user) return null;
  const idToken = await user.getIdToken();
  const payload = {
    uid: user.uid,
    email: user.email,
    name: user.displayName || "",
    photoURL: user.photoURL || "",
    providerId: user.providerData?.[0]?.providerId || "firebase",
  };

  const res = await fetchWithFallback(`/auth/firebase`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(payload),
  });

  // If backend isn't running yet, don't crash the UI
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    console.warn("Backend /auth/firebase failed:", j?.error || res.statusText);
    return null;
  }
  return await res.json();
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);          // Firebase user
  const [profile, setProfile] = useState(null);    // Mongo profile
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async (overrideToken) => {
    const t = overrideToken || token;
    if (!t) return null;
    try {
      const res = await fetchWithFallback(`/profile/me`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!res.ok) return null;
      const j = await res.json();
      if (j?.user) setProfile(j.user);
      return j;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setLoading(true);
      try {
        setUser(u);
        if (!u) {
          setToken(null);
          setProfile(null);
          setLoading(false);
          return;
        }
        const idToken = await u.getIdToken();
        setToken(idToken);
        const mongoProfile = await syncFirebaseUserToMongo(u);
        if (mongoProfile?.user) setProfile(mongoProfile.user);
        // Optional: fetch enriched profile fields if available
        await refreshProfile(idToken);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      token,
      loading,
      apiBase: API_BASES?.[0] || "",
      setProfile,
      refreshProfile,
    }),
    [user, profile, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
