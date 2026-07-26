import { getOrSetCachedData } from "../cache/apiCache";
import { buildMarketApiUrl, marketRequest } from "../marketApi";
const COMPANY_PROFILE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

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
  const normalizedTicker = ticker.trim().toUpperCase();
  const cacheKey = `companyProfile:${normalizedTicker}`;

  return getOrSetCachedData(
    cacheKey,
    async () => {
      const response = await marketRequest(
        buildMarketApiUrl("/finnhub/profile", { symbol: normalizedTicker })
      );

      if (!response.ok) {
        throw new Error(`Company profile request failed with status ${response.status}`);
      }

      return normalizeProfile(await response.json(), normalizedTicker);
    },
    COMPANY_PROFILE_CACHE_TTL_MS,
    {
      // Profile data changes slowly; caching successful results prevents repeated quota-heavy modal calls.
      shouldCache: (profile) => Boolean(profile)
    }
  );
}
