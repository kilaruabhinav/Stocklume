import { getYahooQuote } from "../GetYahoo/yahooapi";

const API_KEY = import.meta.env.VITE_FINNHUB_API_KEY;

function getFiniteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function hasUsableQuote(stock) {
  return (
    stock &&
    stock.price !== null &&
    !(stock.price === 0 && stock.change === null && stock.percentChange === null)
  );
}

function getFinnhubSymbolCandidates(ticker, finnhubSymbol = "") {
  const normalizedTicker = ticker.trim().toUpperCase();
  const candidates = [finnhubSymbol, normalizedTicker];

  if (normalizedTicker.endsWith(".NS")) {
    candidates.push(`NSE:${normalizedTicker.replace(".NS", "")}`);
  }

  return [...new Set(candidates.filter(Boolean))];
}

function shouldPreferYahoo(ticker) {
  const normalizedTicker = ticker.trim().toUpperCase();
  return normalizedTicker.endsWith(".NS") || normalizedTicker.startsWith("NSE:");
}

export async function getStock(ticker, companyNameFallback = "", finnhubSymbol = "") {
  try {
    if (shouldPreferYahoo(ticker)) {
      const yahooStock = await getYahooQuote(ticker);

      if (hasUsableQuote(yahooStock)) {
        return {
          ...yahooStock,
          companyName: companyNameFallback || yahooStock.companyName
        };
      }
    }

    for (const symbol of getFinnhubSymbolCandidates(ticker, finnhubSymbol)) {
      const quoteResponse = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${API_KEY}`
      );

      if (!quoteResponse.ok) {
        continue;
      }

      const quoteData = await quoteResponse.json();

      const profileResponse = await fetch(
        `https://finnhub.io/api/v1/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${API_KEY}`
      );

      const profileData = profileResponse.ok
        ? await profileResponse.json()
        : {};
      const companyName = profileData.name || companyNameFallback || ticker;
      const stock = {
        ticker,
        companyName,
        price: getFiniteNumber(quoteData.c),
        change: getFiniteNumber(quoteData.d),
        percentChange: getFiniteNumber(quoteData.dp)
      };

      if (hasUsableQuote(stock)) {
        return stock;
      }
    }

    const fallbackStock = await getYahooQuote(ticker);

    if (fallbackStock) {
      return {
        ...fallbackStock,
        companyName: companyNameFallback || fallbackStock.companyName
      };
    }

    if (companyNameFallback) {
      return {
        ticker,
        companyName: companyNameFallback,
        price: null,
        change: null,
        percentChange: null
      };
    }

    return null;
  }
  catch(error) {
    console.error(error);

    if (companyNameFallback) {
      return {
        ticker,
        companyName: companyNameFallback,
        price: null,
        change: null,
        percentChange: null
      };
    }

    return null;
  }
}
