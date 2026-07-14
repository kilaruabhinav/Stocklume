const API_KEY = import.meta.env.VITE_FINNHUB_API_KEY;

export async function getAnalysis(ticker) {
  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/stock/metric?symbol=${ticker}&metric=all&token=${API_KEY}`
    );

    const data = await response.json();
    const metric = data?.metric;

    if (!metric) {
      return null;
    }

    return {
      marketCap: metric.marketCapitalization,
      peRatio: metric.peTTM,
      eps: metric.epsTTM,
      week52High: metric["52WeekHigh"],
      week52Low: metric["52WeekLow"],
      week52PriceReturn: metric["52WeekPriceReturnDaily"],
      beta: metric.beta,
      dividendYield: metric.dividendYieldIndicatedAnnual,
      revenueGrowthTtm: metric.revenueGrowthTTMYoy,
      epsGrowthTtm: metric.epsGrowthTTMYoy,
      grossMargin: metric.grossMarginAnnual,
      operatingMargin: metric.operatingMarginAnnual,
      netProfitMargin: metric.netProfitMarginAnnual,
      returnOnAssets: metric.roaRfy,
      returnOnEquity: metric.roeRfy,
      currentRatio: metric.currentRatioAnnual,
      quickRatio: metric.quickRatioAnnual,
      debtToEquity: metric.totalDebtToEquityAnnual,
      bookValuePerShare: metric.bookValuePerShareAnnual,
      revenuePerShare: metric.revenuePerShareAnnual,
      cashFlowPerShare: metric.cashFlowPerShareAnnual
    };
  } catch (error) {
    console.error(error);
    return null;
  }
}
