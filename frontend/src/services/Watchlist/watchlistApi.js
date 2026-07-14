import { buildApiUrl } from "../apiConfig";

const WATCHLIST_URL = buildApiUrl("/watchlist");

function getToken() {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("No access token found. Please log in again.");
  }

  return token;
}

async function parseResponse(response) {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Watchlist request failed.");
  }

  return data;
}

export async function getWatchlist() {
  const response = await fetch(WATCHLIST_URL, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getToken()}`
    }
  });

  const data = await parseResponse(response);
  return data.watchlist || [];
}

export async function addToWatchlist(symbol) {
  const response = await fetch(WATCHLIST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`
    },
    body: JSON.stringify({ symbol })
  });

  return parseResponse(response);
}

export async function deleteFromWatchlist(symbol) {
  const response = await fetch(WATCHLIST_URL, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`
    },
    body: JSON.stringify({ symbol })
  });

  return parseResponse(response);
}
