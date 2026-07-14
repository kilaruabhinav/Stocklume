const API_KEY = import.meta.env.VITE_FINNHUB_API_KEY;
const COMPANY_SUFFIXES = new Set([
  "inc",
  "incorporated",
  "corp",
  "corporation",
  "co",
  "company",
  "ltd",
  "limited",
  "plc",
  "class",
  "common",
  "stock",
  "ordinary",
  "shares",
  "adr",
  "ads",
  "sa",
  "ag",
  "nv",
  "lp",
  "llc"
]);

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getCompanyTerms(companyName) {
  const words = normalizeText(companyName)
    .split(" ")
    .filter(
      (word) =>
        word.length > 1 &&
        !COMPANY_SUFFIXES.has(word) &&
        !/^\d+$/.test(word)
    );

  const companyPhrase = words.join(" ");

  return {
    companyPhrase,
    companyWords: [...new Set(words.filter((word) => word.length >= 3))]
  };
}

function includesStandaloneTicker(text, ticker) {
  if (!ticker) return false;

  const tickerPattern = new RegExp(
    `(^|[^a-z0-9])${ticker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").toLowerCase()}([^a-z0-9]|$)`,
    "i"
  );

  return tickerPattern.test(text);
}

function isRelevantArticle(article, ticker, companyName) {
  const searchableText = normalizeText([
    article?.headline,
    article?.summary,
    article?.source,
    article?.url
  ].join(" "));

  if (!searchableText) return false;
  if (includesStandaloneTicker(searchableText, ticker)) return true;

  const { companyPhrase, companyWords } = getCompanyTerms(companyName);

  if (companyPhrase && searchableText.includes(companyPhrase)) {
    return true;
  }

  if (companyWords.length === 1) {
    return searchableText.includes(companyWords[0]);
  }

  const matches = companyWords.filter((word) =>
    searchableText.includes(word)
  );

  return matches.length >= 2;
}

export async function getNews(ticker, companyName = "") {
  try {
    const normalizedTicker = ticker.trim().toUpperCase();
    const today = new Date();

    const from = new Date();
    from.setDate(today.getDate() - 7);

    const formatDate = (date) =>
      date.toISOString().split("T")[0];

    const response = await fetch(
      `https://finnhub.io/api/v1/company-news?symbol=${normalizedTicker}&from=${formatDate(
        from
      )}&to=${formatDate(today)}&token=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`News request failed with status ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      return [];
    }

    return data
      .filter((article) =>
        isRelevantArticle(article, normalizedTicker, companyName)
      )
      .slice(0, 10)
      .map((article) => ({
        headline: article.headline,
        content: article.summary,
        source: article.source,
        url: article.url,
        image: article.image,
        date: article.datetime
      }));
  } catch (error) {
    console.error(error);
    return [];
  }
}
