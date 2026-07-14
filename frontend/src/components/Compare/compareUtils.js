export const TIMEFRAME_OPTIONS = [
  { label: "1M", outputSize: 30 },
  { label: "3M", outputSize: 90 },
  { label: "6M", outputSize: 180 },
  { label: "1Y", outputSize: 365 }
];

export const COMPARE_COLORS = {
  first: "accent",
  second: "warning"
};

export function formatCurrency(value) {
  const number = Number(value);
  return Number.isFinite(number) ? `$${number.toFixed(2)}` : "N/A";
}

export function formatPercent(value) {
  const number = Number(value);
  return Number.isFinite(number)
    ? `${number >= 0 ? "+" : ""}${number.toFixed(2)}%`
    : "N/A";
}

export function formatNumber(value, suffix = "") {
  const number = Number(value);
  return Number.isFinite(number) ? `${number.toFixed(2)}${suffix}` : "N/A";
}

function average(values) {
  if (!values.length) return null;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function standardDeviation(values) {
  if (values.length < 2) return null;

  const mean = average(values);
  const variance = average(values.map((value) => (value - mean) ** 2));
  return Math.sqrt(variance);
}

function getDateKey(timestamp) {
  return new Date(timestamp).toISOString().split("T")[0];
}

export function normalizeSeries(prices) {
  if (!Array.isArray(prices) || prices.length < 2) {
    return [];
  }

  const sortedPrices = prices
    .map((point) => ({
      ...point,
      timestamp: Number(point.timestamp),
      price: Number(point.price)
    }))
    .filter(
      (point) =>
        Number.isFinite(point.timestamp) &&
        Number.isFinite(point.price)
    )
    .sort((a, b) => a.timestamp - b.timestamp);

  const firstPrice = sortedPrices[0]?.price;

  if (!Number.isFinite(firstPrice) || firstPrice === 0) {
    return [];
  }

  return sortedPrices.map((point) => ({
    dateKey: getDateKey(point.timestamp),
    date: point.date || new Date(point.timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    }),
    price: point.price,
    returnPercent: ((point.price - firstPrice) / firstPrice) * 100
  }));
}

export function buildComparisonSeries(firstPrices, secondPrices) {
  const firstSeries = normalizeSeries(firstPrices);
  const secondSeries = normalizeSeries(secondPrices);
  const firstByDate = new Map(firstSeries.map((point) => [point.dateKey, point]));
  const secondByDate = new Map(secondSeries.map((point) => [point.dateKey, point]));

  return [...firstByDate.keys()]
    .filter((dateKey) => secondByDate.has(dateKey))
    .map((dateKey) => {
      const firstPoint = firstByDate.get(dateKey);
      const secondPoint = secondByDate.get(dateKey);

      return {
        date: firstPoint.date,
        firstReturn: firstPoint.returnPercent,
        secondReturn: secondPoint.returnPercent,
        firstPrice: firstPoint.price,
        secondPrice: secondPoint.price
      };
    });
}

export function buildSummary(stock, prices) {
  const normalized = normalizeSeries(prices);
  const lastPoint = normalized[normalized.length - 1];
  const returns = normalized.map((point) => point.returnPercent);

  return {
    ticker: stock?.ticker || "",
    companyName: stock?.companyName || stock?.ticker || "",
    price: stock?.price,
    returnPercent: lastPoint?.returnPercent,
    bestReturn: returns.length ? Math.max(...returns) : null,
    worstReturn: returns.length ? Math.min(...returns) : null
  };
}

export function buildAdvancedStats(stock, prices) {
  const normalized = normalizeSeries(prices);

  if (normalized.length < 2) {
    return {
      ticker: stock?.ticker || "",
      rows: []
    };
  }

  const returns = normalized.map((point) => point.returnPercent);
  const pricesOnly = normalized.map((point) => point.price);
  const dailyMoves = normalized.slice(1).map((point, index) => {
    const previousPrice = normalized[index].price;
    return previousPrice ? ((point.price - previousPrice) / previousPrice) * 100 : 0;
  });
  const high = Math.max(...pricesOnly);
  const low = Math.min(...pricesOnly);
  const last = pricesOnly[pricesOnly.length - 1];
  const range = high - low;
  const rangePosition = range ? ((last - low) / range) * 100 : 50;
  let peak = returns[0];
  let maxDrawdown = 0;

  returns.forEach((value) => {
    peak = Math.max(peak, value);
    maxDrawdown = Math.min(maxDrawdown, value - peak);
  });

  const positiveDays = dailyMoves.filter((move) => move > 0).length;
  const winRate = dailyMoves.length ? (positiveDays / dailyMoves.length) * 100 : null;
  const avgDailyMove = average(dailyMoves);
  const typicalMove = average(dailyMoves.map((move) => Math.abs(move)));
  const volatility = standardDeviation(dailyMoves);

  return {
    ticker: stock?.ticker || "",
    metrics: {
      volatility,
      avgDailyMove,
      typicalMove,
      winRate,
      maxDrawdown,
      rangePosition,
      rangePercent: low ? (range / low) * 100 : null,
      returnPercent: returns[returns.length - 1]
    },
    rows: [
      {
        label: "Volatility",
        value: formatPercent(volatility),
        detail: "Std dev of daily returns"
      },
      {
        label: "Avg day",
        value: formatPercent(avgDailyMove),
        detail: "Mean daily return"
      },
      {
        label: "Typical swing",
        value: formatPercent(typicalMove),
        detail: "Average absolute move"
      },
      {
        label: "Win rate",
        value: Number.isFinite(winRate) ? `${winRate.toFixed(0)}%` : "N/A",
        detail: `${positiveDays}/${dailyMoves.length} higher closes`
      },
      {
        label: "Max drawdown",
        value: formatPercent(maxDrawdown),
        detail: "Worst pullback from peak return"
      },
      {
        label: "Range position",
        value: Number.isFinite(rangePosition) ? `${rangePosition.toFixed(0)}%` : "N/A",
        detail: `${formatCurrency(low)} low / ${formatCurrency(high)} high`
      }
    ]
  };
}

export function buildRelativeStats(firstSummary, secondSummary, firstStats, secondStats) {
  const firstReturn = Number(firstSummary?.returnPercent);
  const secondReturn = Number(secondSummary?.returnPercent);
  const spread =
    Number.isFinite(firstReturn) && Number.isFinite(secondReturn)
      ? firstReturn - secondReturn
      : null;
  const leader =
    Number.isFinite(spread) && spread !== 0
      ? spread > 0
        ? firstSummary.ticker
        : secondSummary.ticker
      : "Even";
  const firstVolatility = Number(firstStats?.metrics?.volatility);
  const secondVolatility = Number(secondStats?.metrics?.volatility);
  const firstWinRate = Number(firstStats?.metrics?.winRate);
  const secondWinRate = Number(secondStats?.metrics?.winRate);
  const firstRangePercent = Number(firstStats?.metrics?.rangePercent);
  const secondRangePercent = Number(secondStats?.metrics?.rangePercent);
  const firstReturnRisk =
    Number.isFinite(firstReturn) && Number.isFinite(firstVolatility) && firstVolatility !== 0
      ? firstReturn / firstVolatility
      : null;
  const secondReturnRisk =
    Number.isFinite(secondReturn) && Number.isFinite(secondVolatility) && secondVolatility !== 0
      ? secondReturn / secondVolatility
      : null;

  return [
    {
      label: "Return spread",
      value: formatPercent(spread),
      detail: leader === "Even" ? "Both assets are tied" : `${leader} leads`
    },
    {
      label: "Lower volatility",
      value:
        Number.isFinite(firstVolatility) && Number.isFinite(secondVolatility)
          ? firstVolatility <= secondVolatility
            ? firstStats.ticker
            : secondStats.ticker
          : "N/A",
      detail:
        Number.isFinite(firstVolatility) && Number.isFinite(secondVolatility)
          ? `${formatPercent(firstVolatility)} vs ${formatPercent(secondVolatility)}`
          : "Needs chart history"
    },
    {
      label: "Return / risk",
      value:
        Number.isFinite(firstReturnRisk) && Number.isFinite(secondReturnRisk)
          ? firstReturnRisk >= secondReturnRisk
            ? firstStats.ticker
            : secondStats.ticker
          : "N/A",
      detail:
        Number.isFinite(firstReturnRisk) && Number.isFinite(secondReturnRisk)
          ? `${formatNumber(firstReturnRisk, "x")} vs ${formatNumber(secondReturnRisk, "x")}`
          : "Needs return and volatility"
    },
    {
      label: "Higher win rate",
      value:
        Number.isFinite(firstWinRate) && Number.isFinite(secondWinRate)
          ? firstWinRate >= secondWinRate
            ? firstStats.ticker
            : secondStats.ticker
          : "N/A",
      detail:
        Number.isFinite(firstWinRate) && Number.isFinite(secondWinRate)
          ? `${firstWinRate.toFixed(0)}% vs ${secondWinRate.toFixed(0)}%`
          : "Needs daily moves"
    },
    {
      label: "Wider range",
      value:
        Number.isFinite(firstRangePercent) && Number.isFinite(secondRangePercent)
          ? firstRangePercent >= secondRangePercent
            ? firstStats.ticker
            : secondStats.ticker
          : "N/A",
      detail:
        Number.isFinite(firstRangePercent) && Number.isFinite(secondRangePercent)
          ? `${formatPercent(firstRangePercent)} vs ${formatPercent(secondRangePercent)}`
          : "Needs range data"
    }
  ];
}

export function buildCompareInsights(firstSummary, secondSummary, firstStats, secondStats) {
  const firstTicker = firstSummary?.ticker || firstStats?.ticker || "First";
  const secondTicker = secondSummary?.ticker || secondStats?.ticker || "Second";
  const firstReturn = Number(firstSummary?.returnPercent);
  const secondReturn = Number(secondSummary?.returnPercent);
  const firstVolatility = Number(firstStats?.metrics?.volatility);
  const secondVolatility = Number(secondStats?.metrics?.volatility);
  const firstWinRate = Number(firstStats?.metrics?.winRate);
  const secondWinRate = Number(secondStats?.metrics?.winRate);
  const firstDrawdown = Number(firstStats?.metrics?.maxDrawdown);
  const secondDrawdown = Number(secondStats?.metrics?.maxDrawdown);
  const firstRangePosition = Number(firstStats?.metrics?.rangePosition);
  const secondRangePosition = Number(secondStats?.metrics?.rangePosition);
  const firstRiskAdjusted =
    Number.isFinite(firstReturn) && Number.isFinite(firstVolatility) && firstVolatility !== 0
      ? firstReturn / firstVolatility
      : null;
  const secondRiskAdjusted =
    Number.isFinite(secondReturn) && Number.isFinite(secondVolatility) && secondVolatility !== 0
      ? secondReturn / secondVolatility
      : null;
  const insights = [];

  if (Number.isFinite(firstReturn) && Number.isFinite(secondReturn)) {
    const spread = firstReturn - secondReturn;
    const leader = spread >= 0 ? firstTicker : secondTicker;
    insights.push({
      label: "Performance edge",
      value: leader,
      detail: `${formatPercent(Math.abs(spread))} return gap`
    });
  }

  if (Number.isFinite(firstRiskAdjusted) && Number.isFinite(secondRiskAdjusted)) {
    const leader = firstRiskAdjusted >= secondRiskAdjusted ? firstTicker : secondTicker;
    insights.push({
      label: "Cleaner reward/risk",
      value: leader,
      detail: `${formatNumber(firstRiskAdjusted, "x")} vs ${formatNumber(secondRiskAdjusted, "x")}`
    });
  }

  if (Number.isFinite(firstWinRate) && Number.isFinite(secondWinRate)) {
    const leader = firstWinRate >= secondWinRate ? firstTicker : secondTicker;
    insights.push({
      label: "Consistency",
      value: leader,
      detail: `${firstWinRate.toFixed(0)}% vs ${secondWinRate.toFixed(0)}% higher closes`
    });
  }

  if (Number.isFinite(firstDrawdown) && Number.isFinite(secondDrawdown)) {
    const leader = firstDrawdown >= secondDrawdown ? firstTicker : secondTicker;
    insights.push({
      label: "Drawdown control",
      value: leader,
      detail: `${formatPercent(firstDrawdown)} vs ${formatPercent(secondDrawdown)} max pullback`
    });
  }

  if (Number.isFinite(firstRangePosition) && Number.isFinite(secondRangePosition)) {
    const leader = firstRangePosition >= secondRangePosition ? firstTicker : secondTicker;
    insights.push({
      label: "Range leadership",
      value: leader,
      detail: `${firstRangePosition.toFixed(0)}% vs ${secondRangePosition.toFixed(0)}% of range`
    });
  }

  return insights.slice(0, 4);
}
