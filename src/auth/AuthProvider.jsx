import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { auth } from "../firebase.js";
import { onAuthStateChanged } from "firebase/auth";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5000";

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

  const res = await fetch(`${API_BASE}/auth/firebase`, {
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
      apiBase: API_BASE,
    }),
    [user, profile, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
