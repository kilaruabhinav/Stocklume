export function formatMissing(value) {
  return value === null || value === undefined || value === "" ? "N/A" : value;
}

export function formatNumber(value, digits = 2) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "N/A";
  }

  return number.toLocaleString("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: number % 1 === 0 ? 0 : Math.min(digits, 2)
  });
}

export function formatCompactNumber(value, { prefix = "", multiplier = 1, suffix = "" } = {}) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "N/A";
  }

  return `${prefix}${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    notation: "compact"
  }).format(number * multiplier)}${suffix}`;
}

export function formatFinancialAmount(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "N/A";
  }

  const absNumber = Math.abs(number);
  const sign = number < 0 ? "-" : "";

  if (absNumber >= 1_000_000_000_000) {
    return `${sign}${(absNumber / 1_000_000_000_000).toFixed(2)}T`;
  }

  if (absNumber >= 1_000_000_000) {
    return `${sign}${(absNumber / 1_000_000_000).toFixed(2)}B`;
  }

  if (absNumber >= 1_000_000) {
    return `${sign}${(absNumber / 1_000_000).toFixed(2)}M`;
  }

  return `${sign}${formatNumber(absNumber)}`;
}

export function formatCurrency(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "N/A";
  }

  return `$${number.toLocaleString("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  })}`;
}

export function formatSigned(value, suffix = "") {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "N/A";
  }

  return `${number >= 0 ? "+" : ""}${formatNumber(number)}${suffix}`;
}

export function formatPercent(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "N/A";
  }

  const percent = Math.abs(number) <= 1 ? number * 100 : number;
  return `${formatNumber(percent)}%`;
}

export function getMetricValue(analysis, financialDetails, analysisKey, fmpKey) {
  return analysis?.[analysisKey] ?? financialDetails?.keyMetrics?.[fmpKey];
}

export function getCompanyDisplayData({ stock, profile, financialDetails }) {
  const fmpProfile = financialDetails?.profile;

  return {
    fmpProfile,
    displayName: profile?.name || fmpProfile?.companyName || stock?.comp_name || stock?.ticker,
    website: profile?.weburl || fmpProfile?.website,
    logo: profile?.logo || fmpProfile?.image || "",
    industry: profile?.finnhubIndustry || fmpProfile?.industry
  };
}

export function buildDetailRows({ stock, profile, analysis, financialDetails }) {
  const fmpProfile = financialDetails?.profile;

  return [
    {
      title: "Company Profile",
      rows: [
        ["Company Name", profile?.name || fmpProfile?.companyName || stock?.comp_name || stock?.ticker],
        ["Ticker", profile?.ticker || fmpProfile?.symbol || stock?.ticker],
        ["Industry", profile?.finnhubIndustry || fmpProfile?.industry],
        ["Sector", fmpProfile?.sector],
        ["CEO", fmpProfile?.ceo],
        ["Exchange", profile?.exchange || fmpProfile?.exchangeFullName || fmpProfile?.exchange],
        ["Country", profile?.country || fmpProfile?.country],
        ["Currency", profile?.currency || fmpProfile?.currency],
        ["IPO Date", profile?.ipo || fmpProfile?.ipoDate],
        ["Phone", profile?.phone || fmpProfile?.phone],
        ["Address", [fmpProfile?.address, fmpProfile?.city, fmpProfile?.state].filter(Boolean).join(", ")]
      ]
    },
    {
      title: "Market Snapshot",
      rows: [
        ["Current Price", formatCurrency(stock?.price)],
        ["Session Move", formatSigned(stock?.change)],
        ["Session Return", formatSigned(stock?.percentagechange, "%")],
        ["Market Capitalization", formatCompactNumber(profile?.marketCapitalization ?? analysis?.marketCap, { prefix: "$", multiplier: 1000000 })],
        ["Shares Outstanding", formatCompactNumber(profile?.shareOutstanding, { multiplier: 1000000 })],
        ["Beta", formatNumber(analysis?.beta ?? fmpProfile?.beta)],
        ["Price Range", fmpProfile?.range]
      ]
    },
    {
      title: "Valuation",
      rows: [
        ["P/E Ratio", formatNumber(getMetricValue(analysis, financialDetails, "peRatio", "peRatio"))],
        ["EPS", formatNumber(analysis?.eps ?? fmpProfile?.eps)],
        ["Book Value Per Share", formatCurrency(getMetricValue(analysis, financialDetails, "bookValuePerShare", "bookValuePerShare"))],
        ["Revenue Per Share", formatCurrency(getMetricValue(analysis, financialDetails, "revenuePerShare", "revenuePerShare"))],
        ["Cash Flow Per Share", formatCurrency(getMetricValue(analysis, financialDetails, "cashFlowPerShare", "operatingCashFlowPerShare"))],
        ["Dividend Yield", formatPercent(getMetricValue(analysis, financialDetails, "dividendYield", "dividendYield"))],
        ["52 Week High", formatCurrency(analysis?.week52High)],
        ["52 Week Low", formatCurrency(analysis?.week52Low)],
        ["52 Week Price Return", formatSigned(analysis?.week52PriceReturn, "%")]
      ]
    },
    {
      title: "Profitability and Growth",
      rows: [
        ["Revenue Growth TTM YoY", formatSigned(analysis?.revenueGrowthTtm, "%")],
        ["EPS Growth TTM YoY", formatSigned(analysis?.epsGrowthTtm, "%")],
        ["Gross Margin", formatPercent(getMetricValue(analysis, financialDetails, "grossMargin", "grossProfitMargin"))],
        ["Operating Margin", formatPercent(getMetricValue(analysis, financialDetails, "operatingMargin", "operatingProfitMargin"))],
        ["Net Profit Margin", formatPercent(getMetricValue(analysis, financialDetails, "netProfitMargin", "netProfitMargin"))],
        ["Return on Assets", formatPercent(getMetricValue(analysis, financialDetails, "returnOnAssets", "returnOnTangibleAssets"))],
        ["Return on Equity", formatPercent(getMetricValue(analysis, financialDetails, "returnOnEquity", "roe"))]
      ]
    },
    {
      title: "Balance Sheet Strength",
      rows: [
        ["Current Ratio", formatNumber(analysis?.currentRatio)],
        ["Quick Ratio", formatNumber(analysis?.quickRatio)],
        ["Debt to Equity", formatNumber(analysis?.debtToEquity)]
      ]
    }
  ];
}

export function buildIncomeStatementRows(statements) {
  const rows = [
    ["Total Revenue", "totalRevenue", "amount"],
    ["Cost of Revenue", "costOfRevenue", "amount"],
    ["Gross Profit", "grossProfit", "amount"],
    ["Operating Expense", "operatingExpense", "amount"],
    ["Operating Income", "operatingIncome", "amount"],
    ["Pretax Income", "pretaxIncome", "amount"],
    ["Tax Provision", "taxProvision", "amount"],
    ["Net Income", "netIncome", "amount"],
    ["Basic EPS", "basicEps", "number"],
    ["Diluted EPS", "dilutedEps", "number"],
    ["Basic Average Shares", "basicAverageShares", "shares"],
    ["Diluted Average Shares", "dilutedAverageShares", "shares"],
    ["Interest Income", "interestIncome", "amount"],
    ["Interest Expense", "interestExpense", "amount"],
    ["EBIT", "ebit", "amount"],
    ["EBITDA", "ebitda", "amount"],
    ["Reconciled Depreciation", "depreciation", "amount"]
  ];

  return rows.filter(([, key]) =>
    statements.some((statement) => statement?.[key] !== null && statement?.[key] !== undefined)
  );
}

export function formatStatementValue(value, type) {
  if (type === "number") {
    return formatNumber(value);
  }

  if (type === "shares") {
    return formatCompactNumber(value);
  }

  return formatFinancialAmount(value);
}
