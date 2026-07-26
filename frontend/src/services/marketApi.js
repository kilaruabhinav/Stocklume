import { buildApiUrl } from "./apiConfig";
import { getAccessToken } from "./Auth/authStorage";


export function buildMarketApiUrl(path, params = {}) {
  const url = new URL(buildApiUrl(`/market${path}`));

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

export function marketRequest(url, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = getAccessToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(url, { ...options, headers });
}
