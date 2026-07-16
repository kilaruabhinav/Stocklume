import { buildApiUrl } from "../apiConfig";
import { authenticatedRequest } from "../authenticatedRequest";

const WATCHLIST_URL = buildApiUrl("/watchlist");

export async function getWatchlist() {
  const data = await authenticatedRequest(WATCHLIST_URL, {
    method: "GET"
  });
  return data.watchlist || [];
}

export async function addToWatchlist(symbol) {
  return authenticatedRequest(WATCHLIST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ symbol })
  });
}

export async function deleteFromWatchlist(symbol) {
  return authenticatedRequest(WATCHLIST_URL, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ symbol })
  });
}
