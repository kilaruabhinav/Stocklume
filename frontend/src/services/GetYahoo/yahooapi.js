const RANGE_BY_OUTPUT_SIZE = {
  30: "1mo",
  90: "3mo",
  180: "6mo",
  365: "1y"
};

function formatDate(timestamp) {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });
}

function normalizeYahooSymbol(symbol) {
  const normalizedSymbol = symbol.trim().toUpperCase();

  if (normalizedSymbol.startsWith("NSE:")) {
    return `${normalizedSymbol.replace("NSE:", "")}.NS`;
  }

  if (normalizedSymbol.startsWith("BSE:")) {
    return `${normalizedSymbol.replace("BSE:", "")}.BO`;
  }

  return normalizedSymbol;
}

function getYahooUrl(symbol, range = "1mo") {
  const encodedSymbol = encodeURIComponent(normalizeYahooSymbol(symbol));
  return `/api/yahoo-chart/${encodedSymbol}?range=${range}&interval=1d`;
}

function getFiniteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function parseYahooResult(data) {
  const result = data?.chart?.result?.[0];

  if (!result) {
    return null;
  }

  const quote = result.indicators?.quote?.[0];
  const timestamps = result.timestamp;
  const closes = quote?.close;

  if (!Array.isArray(timestamps) || !Array.isArray(closes)) {
    return {
      meta: result.meta,
      prices: []
    };
  }

  const prices = timestamps
    .map((timestamp, index) => ({
      timestamp: timestamp * 1000,
      date: formatDate(timestamp),
      price: getFiniteNumber(closes[index])
    }))
    .filter((point) => Number.isFinite(point.price));

  return {
    meta: result.meta,
    prices
  };
}

export async function getYahooChartData(ticker, outputSize = 30) {
  const range = RANGE_BY_OUTPUT_SIZE[outputSize] || "1mo";

  try {
    const response = await fetch(getYahooUrl(ticker, range));

    if (!response.ok) {
      throw new Error(`Yahoo chart request failed with status ${response.status}`);
    }

    const parsedData = parseYahooResult(await response.json());

    if (!parsedData?.prices?.length) {
      return [];
    }

    const firstPoint = parsedData.prices[0];
    const lastPoint = parsedData.prices[parsedData.prices.length - 1];

    return [
      {
        ticker: parsedData.meta?.symbol || ticker,
        interval: "1day",
        range,
        fetchedAt: Date.now(),
        startDate: new Date(firstPoint.timestamp).toISOString().split("T")[0],
        endDate: new Date(lastPoint.timestamp).toISOString().split("T")[0],
        prices: parsedData.prices
      }
    ];
  } catch (error) {
    console.error(`Yahoo chart fallback failed for ${ticker}:`, error);
    return [];
  }
}

export async function getYahooQuote(ticker) {
  try {
    const response = await fetch(getYahooUrl(ticker, "5d"));

    if (!response.ok) {
      throw new Error(`Yahoo quote request failed with status ${response.status}`);
    }

    const parsedData = parseYahooResult(await response.json());
    const meta = parsedData?.meta;

    if (!meta) {
      return null;
    }

    const currentPrice = getFiniteNumber(meta.regularMarketPrice);
    const previousClose = getFiniteNumber(meta.chartPreviousClose);
    const change =
      currentPrice !== null && previousClose !== null
        ? currentPrice - previousClose
        : null;
    const percentChange =
      change !== null && previousClose
        ? (change / previousClose) * 100
        : null;

    return {
      ticker: meta.symbol || ticker,
      companyName: meta.longName || meta.shortName || ticker,
      price: currentPrice,
      change,
      percentChange
    };
  } catch (error) {
    console.error(`Yahoo quote fallback failed for ${ticker}:`, error);
    return null;
  }
}
