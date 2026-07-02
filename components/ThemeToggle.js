"use client";
import { useEffect, useState } from "react";

const THEME_KEY = "rtr.theme";

const ICON_SUN = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4.3" />
    <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5 5l1.4 1.4M17.6 17.6L19 19M19 5l-1.4 1.4M6.4 17.6L5 19" />
  </svg>
);
const ICON_MOON = (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.5 14.8A8.2 8.2 0 1 1 9.2 3.5a6.6 6.6 0 0 0 11.3 11.3z" />
  </svg>
);

function systemIsLight() {
  return typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia("(prefers-color-scheme: light)").matches
    : false;
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(null); // null until mounted, to avoid SSR/client mismatch

  useEffect(() => {
    const stored = (() => {
      try {
        return localStorage.getItem(THEME_KEY);
      } catch {
        return null;
      }
    })();
    setTheme(stored || (systemIsLight() ? "light" : "dark"));

    if (!window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => {
      let overridden = false;
      try {
        overridden = !!localStorage.getItem(THEME_KEY);
      } catch {}
      if (!overridden) setTheme(mq.matches ? "light" : "dark");
    };
    mq.addEventListener ? mq.addEventListener("change", onChange) : mq.addListener(onChange);
    return () => {
      mq.removeEventListener ? mq.removeEventListener("change", onChange) : mq.removeListener(onChange);
    };
  }, []);

  useEffect(() => {
    if (!theme) return;
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {}
    setTheme(next);
  }

  const dark = theme !== "light"; // default render (before mount) matches the anti-flash script's assumption
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      title={dark ? "Light theme" : "Dark theme"}
    >
      {dark ? ICON_SUN : ICON_MOON}
    </button>
  );
}
