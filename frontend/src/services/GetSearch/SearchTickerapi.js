import { buildMarketApiUrl, marketRequest } from "../marketApi";

export async function searchTickers(query) {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return [];
  }

  try {
    const response = await marketRequest(
      buildMarketApiUrl("/finnhub/search", { q: trimmedQuery })
    );

    if (!response.ok) {
      throw new Error(`Search request failed with status ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data.result)) {
      return [];
    }

    return data.result
      .filter((item) => item?.symbol && item?.description)
      .slice(0, 8)
      .map((item) => ({
        symbol: item.symbol,
        finnhubSymbol: item.symbol,
        displaySymbol: item.displaySymbol || item.symbol,
        description: item.description,
        type: item.type || "Asset"
      }));
  } catch (error) {
    console.error("Ticker search failed:", error);
    return [];
  }
}
