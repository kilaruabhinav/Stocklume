export function calculateInvestedCost(holding) {
  const quantity = Number(holding?.quantity);
  const averagePrice = Number(holding?.average_price);

  if (!Number.isFinite(quantity) || !Number.isFinite(averagePrice)) {
    return 0;
  }

  return quantity * averagePrice;
}

export function calculateHoldingMetrics(holding) {
  const quantity = Number(holding?.quantity);
  const currentPrice = Number(holding?.currentPrice);
  const investedAmount = calculateInvestedCost(holding);
  const hasCurrentPrice = Number.isFinite(currentPrice) && currentPrice > 0;
  const hasQuantity = Number.isFinite(quantity);

  if (!hasCurrentPrice || !hasQuantity) {
    return {
      investedAmount,
      marketValue: null,
      profitLoss: null,
      profitLossPercent: null
    };
  }

  const marketValue = quantity * currentPrice;
  const profitLoss = marketValue - investedAmount;
  const profitLossPercent =
    investedAmount > 0 ? (profitLoss / investedAmount) * 100 : 0;

  return {
    investedAmount,
    marketValue,
    profitLoss,
    profitLossPercent
  };
}

export function calculatePortfolioTotals(enrichedHoldings, account) {
  const cashBalance = Number(account?.cash_balance);
  const startingBalance = Number(account?.starting_balance);
  const totalInvested = enrichedHoldings.reduce(
    (total, holding) => total + calculateHoldingMetrics(holding).investedAmount,
    0
  );
  const holdingsValue = enrichedHoldings.reduce((total, holding) => {
    const marketValue = calculateHoldingMetrics(holding).marketValue;
    return Number.isFinite(marketValue) ? total + marketValue : total;
  }, 0);
  const safeCashBalance = Number.isFinite(cashBalance) ? cashBalance : 0;
  const safeStartingBalance = Number.isFinite(startingBalance) ? startingBalance : 0;
  const totalEquity = safeCashBalance + holdingsValue;
  const totalProfitLoss = totalEquity - safeStartingBalance;
  const totalProfitLossPercent =
    safeStartingBalance > 0 ? (totalProfitLoss / safeStartingBalance) * 100 : 0;

  return {
    cashBalance: safeCashBalance,
    startingBalance: safeStartingBalance,
    totalInvested,
    holdingsValue,
    totalEquity,
    totalProfitLoss,
    totalProfitLossPercent
  };
}

function getHoldingsWithMetrics(enrichedHoldings) {
  return enrichedHoldings
    .map((holding) => ({
      ...holding,
      metrics: calculateHoldingMetrics(holding)
    }))
    .filter((holding) => Number.isFinite(holding.metrics.marketValue));
}

export function getBestPerformer(enrichedHoldings) {
  const holdings = getHoldingsWithMetrics(enrichedHoldings);
  if (holdings.length === 0) return null;

  return holdings.reduce((best, holding) =>
    holding.metrics.profitLossPercent > best.metrics.profitLossPercent
      ? holding
      : best
  );
}

export function getWorstPerformer(enrichedHoldings) {
  const holdings = getHoldingsWithMetrics(enrichedHoldings);
  if (holdings.length === 0) return null;

  return holdings.reduce((worst, holding) =>
    holding.metrics.profitLossPercent < worst.metrics.profitLossPercent
      ? holding
      : worst
  );
}

export function getLargestHolding(enrichedHoldings) {
  const holdings = getHoldingsWithMetrics(enrichedHoldings);
  if (holdings.length === 0) return null;

  return holdings.reduce((largest, holding) =>
    holding.metrics.marketValue > largest.metrics.marketValue
      ? holding
      : largest
  );
}

export function calculateCashWeight(portfolioTotals) {
  return portfolioTotals.totalEquity > 0
    ? (portfolioTotals.cashBalance / portfolioTotals.totalEquity) * 100
    : 0;
}

export function calculatePerformanceBreakdown(enrichedHoldings, portfolioTotals) {
  const bestPerformer = getBestPerformer(enrichedHoldings);
  const worstPerformer = getWorstPerformer(enrichedHoldings);
  const largestHolding = getLargestHolding(enrichedHoldings);

  if (!bestPerformer || !worstPerformer || !largestHolding) {
    return null;
  }

  return {
    bestPerformer,
    worstPerformer,
    largestHolding,
    cashWeight: calculateCashWeight(portfolioTotals)
  };
}
