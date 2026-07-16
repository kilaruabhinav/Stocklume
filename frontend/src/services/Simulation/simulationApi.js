import { buildApiUrl } from "../apiConfig";

function getAuthHeaders() {
  const token = localStorage.getItem("access_token");

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

export async function buySimulationStock({ symbol, quantity, price }) {
  const response = await fetch(buildApiUrl("/simulation/buy"), {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      symbol,
      quantity,
      price
    })
  });

  return handleApiResponse(response);
}

export async function sellSimulationStock({ symbol, quantity, price }) {
  const response = await fetch(buildApiUrl("/simulation/sell"), {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      symbol,
      quantity,
      price
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
