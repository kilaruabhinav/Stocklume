const FINNHUB_API_KEY = import.meta.env.VITE_FINNHUB_API_KEY;

function normalizeProfile(data, fallbackTicker) {
  if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
    return null;
  }

  return {
    country: data.country || "N/A",
    currency: data.currency || "N/A",
    exchange: data.exchange || "N/A",
    finnhubIndustry: data.finnhubIndustry || "N/A",
    ipo: data.ipo || "N/A",
    logo: data.logo || "",
    marketCapitalization: Number(data.marketCapitalization),
    name: data.name || fallbackTicker,
    phone: data.phone || "N/A",
    shareOutstanding: Number(data.shareOutstanding),
    ticker: data.ticker || fallbackTicker,
    weburl: data.weburl || ""
  };
}

export async function getCompanyProfile(ticker) {
  if (!FINNHUB_API_KEY) {
    throw new Error("Finnhub API key is missing.");
  }

  const normalizedTicker = ticker.trim().toUpperCase();
  const params = new URLSearchParams({
    symbol: normalizedTicker,
    token: FINNHUB_API_KEY
  });

  const response = await fetch(
    `https://finnhub.io/api/v1/stock/profile2?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error(`Company profile request failed with status ${response.status}`);
  }

  return normalizeProfile(await response.json(), normalizedTicker);
}
