import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const THEME_KEY = "zenith_theme_v1";
const ThemeContext = createContext(null);

function applyThemeClass(theme) {
  const root = document.documentElement;
  if (!root) return;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === "dark" || saved === "light") return saved;
    } catch {}
    // default: light (ChatGPT-like)
    return "light";
  });

  useEffect(() => {
    applyThemeClass(theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {}
  }, [theme]);

  const value = useMemo(() => {
    const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
    return { theme, setTheme, toggleTheme };
  }, [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
