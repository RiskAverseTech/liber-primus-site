"use client";
import { useEffect, useState } from "react";

const KEY = "lp-theme";
type Theme = "light" | "dark";

function systemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Light or dark, kept in localStorage only (no cookie); defaults to the system setting. */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);
  useEffect(() => {
    const stored = document.documentElement.dataset.theme as Theme | undefined;
    setTheme(stored ?? systemTheme());
  }, []);
  const flip = () => {
    const next: Theme = (theme ?? systemTheme()) === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem(KEY, next); } catch {}
    setTheme(next);
  };
  return (
    <button type="button" className="theme-btn" onClick={flip} aria-label="Switch between light and dark">
      {theme === null ? "Theme" : theme === "dark" ? "Light" : "Dark"}
    </button>
  );
}

/** Inline, runs before paint so the stored choice applies without a flash. */
export const themeInitScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(KEY)});if(t==="light"||t==="dark"){document.documentElement.dataset.theme=t}}catch(e){}})();`;
