import { getYahooQuote } from "../GetYahoo/yahooapi";

const API_KEY = import.meta.env.VITE_FINNHUB_API_KEY;

function getFiniteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function hasUsableQuote(quote) {
  return (
    quote &&
    quote.price !== null &&
    !(quote.price === 0 && quote.change === null && quote.percentageChange === null)
  );
}

function getFinnhubSymbolCandidates(ticker) {
  const normalizedTicker = ticker.trim().toUpperCase();
  const candidates = [normalizedTicker];

  if (normalizedTicker.endsWith(".NS")) {
    candidates.push(`NSE:${normalizedTicker.replace(".NS", "")}`);
  }

  return [...new Set(candidates)];
}

export async function updateStock(ticker) {
  try {
    const normalizedTicker = ticker.trim().toUpperCase();

    if (normalizedTicker.endsWith(".NS") || normalizedTicker.startsWith("NSE:")) {
      const yahooQuote = await getYahooQuote(ticker);

      if (yahooQuote) {
        return {
          price: yahooQuote.price,
          change: yahooQuote.change,
          percentageChange: yahooQuote.percentChange
        };
      }
    }

    for (const symbol of getFinnhubSymbolCandidates(ticker)) {
      const response = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${API_KEY}`
      );

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      const quote = {
        price: getFiniteNumber(data.c),
        change: getFiniteNumber(data.d),
        percentageChange: getFiniteNumber(data.dp)
      };

      if (hasUsableQuote(quote)) {
        return quote;
      }
    }

    const yahooQuote = await getYahooQuote(ticker);

    if (!yahooQuote) {
      return null;
    }

    return {
      price: yahooQuote.price,
      change: yahooQuote.change,
      percentageChange: yahooQuote.percentChange
    };
  } catch (error) {
    console.error(`Failed to update ${ticker}:`, error);
    return null;
  }
}
