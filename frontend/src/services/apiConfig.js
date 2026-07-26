const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

if (!configuredApiBaseUrl) {
  throw new Error("VITE_API_BASE_URL is missing.");
}

const parsedApiBaseUrl = new URL(configuredApiBaseUrl);

if (!["http:", "https:"].includes(parsedApiBaseUrl.protocol)) {
  throw new Error("VITE_API_BASE_URL must use HTTP or HTTPS.");
}

export const API_BASE_URL = configuredApiBaseUrl.replace(/\/+$/, "");

export function buildApiUrl(path) {
  const normalizedPath = String(path || "").replace(/^\/+/, "");
  return `${API_BASE_URL}/${normalizedPath}`;
}
