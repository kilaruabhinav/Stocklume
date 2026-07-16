import { buildApiUrl } from "../apiConfig";
import { getAccessToken, logoutUser } from "../Auth/authStorage";

function getAuthHeaders() {
  const token = getAccessToken();

  if (!token) {
    throw new Error("You must be logged in");
  }

  return {
    Authorization: `Bearer ${token}`
  };
}

async function handleApiResponse(response) {
  let data;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      logoutUser();
    }

    throw new Error(data?.detail || data?.message || "Request failed");
  }

  return data;
}

export async function getSimulationAccount() {
  const response = await fetch(buildApiUrl("/simulation/account"), {
    method: "GET",
    headers: getAuthHeaders()
  });

  return handleApiResponse(response);
}

export async function getSimulationHoldings() {
  const response = await fetch(buildApiUrl("/simulation/holdings"), {
    method: "GET",
    headers: getAuthHeaders()
  });

  return handleApiResponse(response);
}

export async function getSimulationTrades() {
  const response = await fetch(buildApiUrl("/simulation/trades"), {
    method: "GET",
    headers: getAuthHeaders()
  });

  return handleApiResponse(response);
}

export async function buySimulationStock({ symbol, quantity }) {
  const response = await fetch(buildApiUrl("/simulation/buy"), {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      symbol,
      quantity
    })
  });

  return handleApiResponse(response);
}

export async function sellSimulationStock({ symbol, quantity }) {
  const response = await fetch(buildApiUrl("/simulation/sell"), {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      symbol,
      quantity
    })
  });

  return handleApiResponse(response);
}

export async function resetSimulation() {
  const response = await fetch(buildApiUrl("/simulation/reset"), {
    method: "POST",
    headers: getAuthHeaders()
  });

  return handleApiResponse(response);
}
