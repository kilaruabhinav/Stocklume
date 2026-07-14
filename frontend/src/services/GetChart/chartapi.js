import { getYahooChartData } from "../GetYahoo/yahooapi";

const API_KEY = import.meta.env.VITE_TWELVEDATA_API_KEY;

const RANGE_BY_OUTPUT_SIZE = {
  30: "1M",
  90: "3M",
  180: "6M",
  365: "1Y"
};

const MAX_CHART_STALENESS_DAYS = 5;
const ONE_DAY = 24 * 60 * 60 * 1000;

function formatDate(datetime) {
  const datePart = datetime.split(" ")[0];
  const [year, month, day] = datePart.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });
}

function getTimestamp(datetime) {
  const datePart = datetime.split(" ")[0];
  const [year, month, day] = datePart.split("-").map(Number);

  return new Date(year, month - 1, day).getTime();
}

function getLocalDayStart(timestamp) {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function isStaleChart(prices) {
  if (!Array.isArray(prices) || prices.length === 0) {
    return false;
  }

  const latestTimestamp = Math.max(
    ...prices.map((point) => Number(point.timestamp)).filter(Number.isFinite)
  );

  if (!Number.isFinite(latestTimestamp)) {
    return false;
  }

  const ageInDays = Math.floor(
    (getLocalDayStart(Date.now()) - getLocalDayStart(latestTimestamp)) / ONE_DAY
  );

  return ageInDays > MAX_CHART_STALENESS_DAYS;
}

export async function getChartData(ticker, outputSize = 30) {
  try {
    const normalizedTicker = ticker.trim().toUpperCase();

    const range = RANGE_BY_OUTPUT_SIZE[outputSize];

    if (!range) {
      console.error(
        "Invalid output size. Use 30, 90, 180, or 365."
      );
      return [];
    }

    if (normalizedTicker.endsWith(".NS") || normalizedTicker.startsWith("NSE:")) {
      return getYahooChartData(normalizedTicker, outputSize);
    }

    const response = await fetch(
      `https://api.twelvedata.com/time_series?symbol=${normalizedTicker}&interval=1day&outputsize=${outputSize}&apikey=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data.values)) {
      console.error("Twelve Data error:", data);
      return getYahooChartData(normalizedTicker, outputSize);
    }

    // Twelve Data normally returns newest data first.
    // Copy before reverse so the original response is not mutated.
    const prices = [...data.values]
      .reverse()
      .map((point) => ({
        timestamp: getTimestamp(point.datetime),
        date: formatDate(point.datetime),
        price: Number(point.close)
      }));

    if (prices.length === 0) {
      return [];
    }

    if (isStaleChart(prices)) {
      console.warn(
        `Twelve Data returned stale chart data for ${normalizedTicker}; trying Yahoo fallback.`
      );

      const yahooData = await getYahooChartData(normalizedTicker, outputSize);

      if (yahooData?.[0]?.prices?.length) {
        return yahooData;
      }
    }

    const startDate = data.values[data.values.length - 1].datetime.split(" ")[0];
    const endDate = data.values[0].datetime.split(" ")[0];
    
    return [
      {
        ticker: normalizedTicker,
        interval: "1day",
        range,
        fetchedAt: Date.now(),
        startDate,
        endDate,
        prices
      }
    ];
  } catch (error) {
    console.error(`Failed to fetch chart data for ${ticker}:`, error);
    return getYahooChartData(ticker, outputSize);
  }
}
