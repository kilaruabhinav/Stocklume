import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "stockpulse-theme";
const THEMES = new Set(["light", "dark"]);

function getSystemTheme() {
  if (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }

  return "light";
}

function getInitialTheme() {
  if (typeof window === "undefined") {
    return "light";
  }

  const savedTheme = localStorage.getItem(STORAGE_KEY);
  return THEMES.has(savedTheme) ? savedTheme : getSystemTheme();
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

export function useTheme() {
  const [theme, setThemeState] = useState(getInitialTheme);
  const hasSavedTheme = useRef(
    typeof window !== "undefined" && THEMES.has(localStorage.getItem(STORAGE_KEY))
  );

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (hasSavedTheme.current) {
      return undefined;
    }

    const mediaQuery = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mediaQuery) {
      return undefined;
    }

    const handleChange = (event) => {
      if (!hasSavedTheme.current) {
        setThemeState(event.matches ? "dark" : "light");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const setTheme = (nextTheme) => {
    if (THEMES.has(nextTheme)) {
      hasSavedTheme.current = true;
      localStorage.setItem(STORAGE_KEY, nextTheme);
      setThemeState(nextTheme);
    }
  };

  const toggleTheme = () => {
    setThemeState((currentTheme) => {
      const nextTheme = currentTheme === "dark" ? "light" : "dark";
      hasSavedTheme.current = true;
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
