import { buildApiUrl } from "../apiConfig";
import { authenticatedRequest } from "../authenticatedRequest";

export async function getSimulationAccount() {
  return authenticatedRequest(buildApiUrl("/simulation/account"), {
    method: "GET"
  });
}

export async function getSimulationHoldings() {
  return authenticatedRequest(buildApiUrl("/simulation/holdings"), {
    method: "GET"
  });
}

export async function getSimulationTrades() {
  return authenticatedRequest(buildApiUrl("/simulation/trades"), {
    method: "GET"
  });
}

export async function buySimulationStock({ symbol, quantity }) {
  return authenticatedRequest(buildApiUrl("/simulation/buy"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      symbol,
      quantity
    })
  });
}

export async function sellSimulationStock({ symbol, quantity }) {
  return authenticatedRequest(buildApiUrl("/simulation/sell"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      symbol,
      quantity
    })
  });
}

export async function resetSimulation() {
  return authenticatedRequest(buildApiUrl("/simulation/reset"), {
    method: "POST"
  });
}
