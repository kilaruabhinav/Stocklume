import { useEffect, useState } from "react";

const TOKEN_NAMES = [
  "--color-accent",
  "--color-warning",
  "--color-success",
  "--color-danger",
  "--color-surface",
  "--color-chart-grid",
  "--color-chart-axis",
  "--color-border-strong",
  "--color-row-hover",
  "--color-text-muted"
];

function readThemeTokens() {
  if (typeof window === "undefined") {
    return {};
  }

  const styles = window.getComputedStyle(document.documentElement);

  return TOKEN_NAMES.reduce((tokens, tokenName) => {
    tokens[tokenName] = styles.getPropertyValue(tokenName).trim();
    return tokens;
  }, {});
}

export function useThemeTokens() {
  const [tokens, setTokens] = useState(readThemeTokens);

  useEffect(() => {
    const updateTokens = () => setTokens(readThemeTokens());
    const observer = new MutationObserver(updateTokens);

    updateTokens();
    observer.observe(document.documentElement, {
      attributeFilter: ["data-theme"],
      attributes: true
    });

    return () => observer.disconnect();
  }, []);

  return {
    accent: tokens["--color-accent"] || "#2563eb",
    warning: tokens["--color-warning"] || "#d97706",
    success: tokens["--color-success"] || "#059669",
    danger: tokens["--color-danger"] || "#dc2626",
    surface: tokens["--color-surface"] || "#ffffff",
    chartGrid: tokens["--color-chart-grid"] || "#e2e8f0",
    chartAxis: tokens["--color-chart-axis"] || "#94a3b8",
    borderStrong: tokens["--color-border-strong"] || "#cbd5e1",
    rowHover: tokens["--color-row-hover"] || "#f8fafc",
    textMuted: tokens["--color-text-muted"] || "#64748b"
  };
}
