import { useEffect, useState } from "react";

const STORAGE_KEY = "stockpulse-theme";
const THEMES = new Set(["light", "dark"]);

function getInitialTheme() {
  if (typeof window === "undefined") {
    return "light";
  }

  const savedTheme = localStorage.getItem(STORAGE_KEY);
  return THEMES.has(savedTheme) ? savedTheme : "light";
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

export function useTheme() {
  const [theme, setThemeState] = useState(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = (nextTheme) => {
    if (THEMES.has(nextTheme)) {
      localStorage.setItem(STORAGE_KEY, nextTheme);
      setThemeState(nextTheme);
    }
  };

  const toggleTheme = () => {
    setThemeState((currentTheme) => {
      const nextTheme = currentTheme === "dark" ? "light" : "dark";
      localStorage.setItem(STORAGE_KEY, nextTheme);
      return nextTheme;
    });
  };

  return {
    theme,
    setTheme,
    toggleTheme
  };
}
