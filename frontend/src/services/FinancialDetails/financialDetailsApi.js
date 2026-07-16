import { getOrSetCachedData } from "../cache/apiCache";

const FMP_API_KEY = import.meta.env.VITE_FMP_API_KEY;
const ALPHA_VANTAGE_API_KEY = import.meta.env.VITE_VINTAGEALPHA_API_KEY;

const FMP_BASE_URL = "https://financialmodelingprep.com/stable";
const ALPHA_VANTAGE_BASE_URL = "https://www.alphavantage.co/query";
const FINANCIAL_DETAILS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function getFiniteNumber(value) {
  if (value === null || value === undefined || value === "" || value === "None") {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function sumNumbers(values) {
  const validValues = values
    .map(getFiniteNumber)
    .filter((value) => value !== null);

  if (validValues.length === 0) {
    return null;
  }

  return validValues.reduce((total, value) => total + value, 0);
}

async function requestJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const data = await response.json();

  if (data?.Note || data?.Information || data?.["Error Message"]) {
    throw new Error(data.Note || data.Information || data["Error Message"]);
  }

  return data;
}

function buildFmpUrl(path, params) {
  const searchParams = new URLSearchParams({
    ...params,
    apikey: FMP_API_KEY
  });

  return `${FMP_BASE_URL}/${path}?${searchParams.toString()}`;
}

function buildAlphaUrl(params) {
  const searchParams = new URLSearchParams({
    ...params,
    apikey: ALPHA_VANTAGE_API_KEY
  });

  return `${ALPHA_VANTAGE_BASE_URL}?${searchParams.toString()}`;
}

function normalizeFmpIncomeStatement(report) {
  return {
    date: report?.date || report?.calendarYear || "",
    totalRevenue: getFiniteNumber(report?.revenue),
    costOfRevenue: getFiniteNumber(report?.costOfRevenue),
    grossProfit: getFiniteNumber(report?.grossProfit),
    operatingExpense: getFiniteNumber(report?.operatingExpenses),
    operatingIncome: getFiniteNumber(report?.operatingIncome),
    pretaxIncome: getFiniteNumber(report?.incomeBeforeTax),
    taxProvision: getFiniteNumber(report?.incomeTaxExpense),
    netIncome: getFiniteNumber(report?.netIncome),
    basicEps: getFiniteNumber(report?.eps),
    dilutedEps: getFiniteNumber(report?.epsdiluted),
    basicAverageShares: getFiniteNumber(report?.weightedAverageShsOut),
    dilutedAverageShares: getFiniteNumber(report?.weightedAverageShsOutDil),
    ebit: getFiniteNumber(report?.ebit),
    ebitda: getFiniteNumber(report?.ebitda),
    depreciation: getFiniteNumber(report?.depreciationAndAmortization),
    interestIncome: getFiniteNumber(report?.interestIncome),
    interestExpense: getFiniteNumber(report?.interestExpense)
  };
}

function normalizeAlphaIncomeStatement(report) {
  return {
    date: report?.fiscalDateEnding || "",
    totalRevenue: getFiniteNumber(report?.totalRevenue),
    costOfRevenue: getFiniteNumber(report?.costOfRevenue),
    grossProfit: getFiniteNumber(report?.grossProfit),
    operatingExpense: getFiniteNumber(report?.operatingExpenses),
    operatingIncome: getFiniteNumber(report?.operatingIncome),
    pretaxIncome: getFiniteNumber(report?.incomeBeforeTax),
    taxProvision: getFiniteNumber(report?.incomeTaxExpense),
    netIncome: getFiniteNumber(report?.netIncome),
    ebit: getFiniteNumber(report?.ebit),
    ebitda: getFiniteNumber(report?.ebitda),
    depreciation: getFiniteNumber(report?.depreciation),
    interestIncome: getFiniteNumber(report?.interestIncome),
    interestExpense: getFiniteNumber(report?.interestExpense)
  };
}

function calculateTtmIncomeStatement(quarterlyReports) {
  if (!Array.isArray(quarterlyReports) || quarterlyReports.length < 4) {
    return null;
  }

  const latestFour = quarterlyReports.slice(0, 4).map(normalizeAlphaIncomeStatement);
  const latestDate = latestFour[0]?.date;

  return {
    date: "TTM",
    sourceDate: latestDate,
    totalRevenue: sumNumbers(latestFour.map((report) => report.totalRevenue)),
    costOfRevenue: sumNumbers(latestFour.map((report) => report.costOfRevenue)),
    grossProfit: sumNumbers(latestFour.map((report) => report.grossProfit)),
    operatingExpense: sumNumbers(latestFour.map((report) => report.operatingExpense)),
    operatingIncome: sumNumbers(latestFour.map((report) => report.operatingIncome)),
    pretaxIncome: sumNumbers(latestFour.map((report) => report.pretaxIncome)),
    taxProvision: sumNumbers(latestFour.map((report) => report.taxProvision)),
    netIncome: sumNumbers(latestFour.map((report) => report.netIncome)),
    ebit: sumNumbers(latestFour.map((report) => report.ebit)),
    ebitda: sumNumbers(latestFour.map((report) => report.ebitda)),
    depreciation: sumNumbers(latestFour.map((report) => report.depreciation)),
    interestIncome: sumNumbers(latestFour.map((report) => report.interestIncome)),
    interestExpense: sumNumbers(latestFour.map((report) => report.interestExpense))
  };
}

function mergeStatements(primaryReports, fallbackReports) {
  const reportsByDate = new Map();

  fallbackReports.forEach((report) => {
    if (report.date) {
      reportsByDate.set(report.date, report);
    }
  });

  primaryReports.forEach((report) => {
    if (report.date) {
      reportsByDate.set(report.date, {
        ...reportsByDate.get(report.date),
        ...report
      });
    }
  });

  return Array.from(reportsByDate.values())
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 4)
    .reverse();
}

function hasFinancialDetails(data) {
  return Boolean(
    data?.profile ||
    data?.keyMetrics ||
    data?.ttmIncomeStatement ||
    data?.incomeStatements?.length
  );
}

async function getFmpFinancials(ticker) {
  if (!FMP_API_KEY) {
    return { profile: null, keyMetrics: null, incomeStatements: [] };
  }

  const normalizedTicker = ticker.trim().toUpperCase();
  const [profileResult, keyMetricsResult, incomeResult] = await Promise.allSettled([
    requestJson(buildFmpUrl("profile", { symbol: normalizedTicker })),
    requestJson(buildFmpUrl("key-metrics", { symbol: normalizedTicker, limit: "1" })),
    requestJson(buildFmpUrl("income-statement", { symbol: normalizedTicker, period: "annual", limit: "4" }))
  ]);

  return {
    profile: profileResult.status === "fulfilled" && Array.isArray(profileResult.value)
      ? profileResult.value[0] || null
      : null,
    keyMetrics: keyMetricsResult.status === "fulfilled" && Array.isArray(keyMetricsResult.value)
      ? keyMetricsResult.value[0] || null
      : null,
    incomeStatements: incomeResult.status === "fulfilled" && Array.isArray(incomeResult.value)
      ? incomeResult.value.map(normalizeFmpIncomeStatement)
      : []
  };
}

async function getAlphaVantageFinancials(ticker) {
  if (!ALPHA_VANTAGE_API_KEY) {
    return { incomeStatements: [], ttmIncomeStatement: null };
  }

  const data = await requestJson(buildAlphaUrl({
    function: "INCOME_STATEMENT",
    symbol: ticker.trim().toUpperCase()
  }));

  const annualReports = Array.isArray(data?.annualReports)
    ? data.annualReports.map(normalizeAlphaIncomeStatement)
    : [];

  return {
    incomeStatements: annualReports,
    ttmIncomeStatement: calculateTtmIncomeStatement(data?.quarterlyReports)
  };
}

export async function getFinancialDetails(ticker) {
  const normalizedTicker = ticker.trim().toUpperCase();
  const cacheKey = `financialDetails:${normalizedTicker}`;

  return getOrSetCachedData(
    cacheKey,
    async () => {
      const [fmpResult, alphaResult] = await Promise.allSettled([
        getFmpFinancials(normalizedTicker),
        getAlphaVantageFinancials(normalizedTicker)
      ]);

      const fmp = fmpResult.status === "fulfilled"
        ? fmpResult.value
        : { profile: null, keyMetrics: null, incomeStatements: [] };
      const alpha = alphaResult.status === "fulfilled"
        ? alphaResult.value
        : { incomeStatements: [], ttmIncomeStatement: null };

      return {
        profile: fmp.profile,
        keyMetrics: fmp.keyMetrics,
        incomeStatements: mergeStatements(fmp.incomeStatements, alpha.incomeStatements),
        ttmIncomeStatement: alpha.ttmIncomeStatement
      };
    },
    FINANCIAL_DETAILS_CACHE_TTL_MS,
    {
      // Financial statements and metrics are slow-moving; cache only non-empty successful results.
      shouldCache: hasFinancialDetails
    }
  );
}
