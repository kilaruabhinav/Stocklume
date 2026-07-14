function formatPercent(value) {
  if (!Number.isFinite(value)) return "N/A";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function formatAbsolutePercent(value) {
  if (!Number.isFinite(value)) return "N/A";
  return `${Math.abs(value).toFixed(2)}%`;
}

function formatCurrency(value) {
  if (!Number.isFinite(value)) return "N/A";
  return `$${value.toFixed(2)}`;
}

function formatDate(timestamp) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) return "N/A";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });
}

function getTone(value, positiveThreshold = 0, negativeThreshold = 0) {
  if (value > positiveThreshold) return "positive";
  if (value < negativeThreshold) return "negative";
  return "neutral";
}

function getTimestamp(value) {
  if (value === null || value === undefined) return NaN;

  const numericTimestamp = Number(value);
  if (Number.isFinite(numericTimestamp)) return numericTimestamp;

  return new Date(value).getTime();
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function standardDeviation(values) {
  if (values.length < 2) return 0;

  const mean = average(values);
  const variance = average(values.map((value) => (value - mean) ** 2));
  return Math.sqrt(variance);
}

function calculateLinearSlope(values) {
  if (values.length < 2) return 0;

  const lastIndex = values.length - 1;
  const averageX = lastIndex / 2;
  const averageY = average(values);

  let numerator = 0;
  let denominator = 0;

  values.forEach((value, index) => {
    numerator += (index - averageX) * (value - averageY);
    denominator += (index - averageX) ** 2;
  });

  return denominator === 0 ? 0 : numerator / denominator;
}

function getSortedPrices(chartData) {
  if (!Array.isArray(chartData)) return [];

  return chartData
    .map((point) => ({
      price: Number(point?.price),
      timestamp: getTimestamp(point?.timestamp)
    }))
    .filter(
      (point) =>
        Number.isFinite(point.price) &&
        Number.isFinite(point.timestamp)
    )
    .sort((a, b) => a.timestamp - b.timestamp);
}

function classifyMomentum(returnPercent, trendGapPercent, slopePercent) {
  if (returnPercent >= 3 && trendGapPercent >= 1 && slopePercent > 0) return "uptrend";
  if (returnPercent <= -3 && trendGapPercent <= -1 && slopePercent < 0) return "downtrend";
  if (Math.abs(returnPercent) <= 1.5 && Math.abs(trendGapPercent) <= 1) return "range-bound";
  return returnPercent > 0 ? "improving" : "soft";
}

function getRangeZone(rangePosition) {
  if (rangePosition >= 80) return "near resistance";
  if (rangePosition >= 62) return "upper range";
  if (rangePosition <= 20) return "near support";
  if (rangePosition <= 38) return "lower range";
  return "middle range";
}

function getActionForTrend(momentum, trendGapPercent) {
  if (momentum === "uptrend") return "Favor pullbacks over chasing extended candles.";
  if (momentum === "downtrend") return "Wait for a base or reclaim of the recent average.";
  if (Math.abs(trendGapPercent) <= 1) return "Wait for a cleaner break away from the average.";
  return "Confirm with volume/news before acting.";
}

function getActionForRange(rangePosition) {
  if (rangePosition >= 80) return "Watch for rejection or breakout confirmation.";
  if (rangePosition <= 20) return "Watch for support hold or breakdown.";
  return "Range is balanced; compare against stronger setups.";
}

export function buildInsights(chartData, timeframe, selectedstock) {
  const points = getSortedPrices(chartData);

  if (points.length < 2) {
    return [
      {
        label: "Signal",
        value: selectedstock?.ticker || "N/A",
        tone: "neutral",
        meta: "Need more data",
        message: "Select a ticker with enough chart history.",
        action: "Load a longer timeframe or another symbol.",
        details: ["Minimum: 2 closes"]
      }
    ];
  }

  const prices = points.map((point) => point.price);
  const first = prices[0];
  const last = prices[prices.length - 1];
  const high = Math.max(...prices);
  const low = Math.min(...prices);
  const range = high - low;
  const returnPercent = first ? ((last - first) / first) * 100 : 0;
  const rangePercent = low ? (range / low) * 100 : 0;
  const rangePosition = range ? ((last - low) / range) * 100 : 50;
  const drawdownPercent = high ? ((last - high) / high) * 100 : 0;
  const reboundPercent = low ? ((last - low) / low) * 100 : 0;
  const highPoint = points.find((point) => point.price === high);
  const lowPoint = points.find((point) => point.price === low);
  const dailyMoves = points.slice(1).map((point, index) => {
    const previousPrice = points[index].price;
    return previousPrice ? ((point.price - previousPrice) / previousPrice) * 100 : 0;
  });
  const upDayCount = dailyMoves.filter((move) => move > 0).length;
  const upDayRate = dailyMoves.length ? (upDayCount / dailyMoves.length) * 100 : 0;
  const averageMove = average(dailyMoves);
  const typicalMove = average(dailyMoves.map((move) => Math.abs(move)));
  const bestMove = Math.max(...dailyMoves);
  const worstMove = Math.min(...dailyMoves);
  const volatility = standardDeviation(dailyMoves);
  const trendWindow = prices.slice(-Math.min(20, prices.length));
  const trendAverage = average(trendWindow);
  const trendGapPercent = trendAverage ? ((last - trendAverage) / trendAverage) * 100 : 0;
  const slopePercent = trendAverage
    ? (calculateLinearSlope(trendWindow) / trendAverage) * 100
    : 0;
  const momentum = classifyMomentum(returnPercent, trendGapPercent, slopePercent);
  const rangeZone = getRangeZone(rangePosition);
  const rangeTone =
    rangePosition >= 72 ? "positive" : rangePosition <= 28 ? "negative" : "neutral";
  const participationTone =
    upDayRate >= 58 ? "positive" : upDayRate <= 42 ? "negative" : "neutral";
  const riskTone =
    volatility >= 2.5 || rangePercent >= 18
      ? "negative"
      : volatility <= 1.1 && rangePercent <= 8
        ? "positive"
        : "neutral";

  return [
    {
      label: "Trend",
      value: formatPercent(returnPercent),
      tone: getTone(returnPercent, 1, -1),
      meta: momentum,
      message: `${formatCurrency(last)} is ${formatPercent(trendGapPercent)} vs the recent average.`,
      action: getActionForTrend(momentum, trendGapPercent),
      details: [
        `Slope ${formatPercent(slopePercent)}/day`,
        `Avg ${formatCurrency(trendAverage)}`,
        `${points.length} closes`
      ]
    },
    {
      label: "Range",
      value: `${rangePosition.toFixed(0)}%`,
      tone: rangeTone,
      meta: `${timeframe} ${rangeZone}`,
      message: `${formatAbsolutePercent(drawdownPercent)} below high; ${formatPercent(reboundPercent)} from low.`,
      action: getActionForRange(rangePosition),
      details: [
        `Low ${formatCurrency(low)} ${formatDate(lowPoint?.timestamp)}`,
        `High ${formatCurrency(high)} ${formatDate(highPoint?.timestamp)}`,
        `Spread ${formatCurrency(range)}`
      ]
    },
    {
      label: "Participation",
      value: `${upDayRate.toFixed(0)}%`,
      tone: participationTone,
      meta: `${upDayCount}/${dailyMoves.length} higher closes`,
      message:
        participationTone === "positive"
          ? "Buying days outnumber selling days in this window."
          : participationTone === "negative"
            ? "Selling days outnumber buying days in this window."
            : "Mixed tape; no clear session bias.",
      action:
        participationTone === "positive"
          ? "Strength is more reliable if trend and range agree."
          : participationTone === "negative"
            ? "Treat bounces carefully until participation improves."
            : "Wait for participation to lean one way.",
      details: [
        `Avg ${formatPercent(averageMove)}`,
        `Typical ${formatPercent(typicalMove)}`,
        `Best ${formatPercent(bestMove)} / worst ${formatPercent(worstMove)}`
      ]
    },
    {
      label: "Risk",
      value: formatPercent(volatility),
      tone: riskTone,
      meta: "daily volatility",
      message:
        riskTone === "negative"
          ? "Swings are wide relative to this chart window."
          : riskTone === "positive"
            ? "Moves are controlled enough for a cleaner read."
            : "Normal movement for this window.",
      action:
        riskTone === "negative"
          ? "Use wider stops or wait for tighter structure."
          : riskTone === "positive"
            ? "Trend signals need less volatility adjustment."
            : "Size normally; avoid assuming compression.",
      details: [
        `Range ${formatPercent(rangePercent)}`,
        `Std dev ${formatPercent(volatility)}`,
        `Typical ${formatPercent(typicalMove)}`
      ]
    }
  ];
}
