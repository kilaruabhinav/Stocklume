import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getSimulationAccount,
  getSimulationHoldings,
  getSimulationTrades
} from "../../services/Simulation/simulationApi";
import { updateStock } from "../../services/GetStats/updatestockapi";
import { calculatePortfolioTotals } from "../utils/portfolioCalculations";

function getAuthMessage(error) {
  const message = error.message || "Could not load portfolio.";

  return message.includes("logged in") ||
    message.includes("Invalid or expired token") ||
    message.includes("session")
    ? "Please log in to view your portfolio."
    : message;
}

export function usePortfolioData() {
  const [account, setAccount] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [enrichedHoldings, setEnrichedHoldings] = useState([]);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pricesLoading, setPricesLoading] = useState(false);
  const [pricesError, setPricesError] = useState("");
  const [error, setError] = useState("");

  const enrichHoldingsWithPrices = useCallback(async (nextHoldings) => {
    if (!nextHoldings || nextHoldings.length === 0) {
      setEnrichedHoldings([]);
      setPricesLoading(false);
      setPricesError("");
      return;
    }

    setPricesLoading(true);
    setPricesError("");

    const enriched = await Promise.all(
      nextHoldings.map(async (holding) => {
        try {
          const latest = await updateStock(holding.symbol);
          const currentPrice = Number(latest?.price);

          if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
            return {
              ...holding,
              currentPrice: null,
              priceError: true
            };
          }

          return {
            ...holding,
            currentPrice,
            priceError: false
          };
        } catch {
          return {
            ...holding,
            currentPrice: null,
            priceError: true
          };
        }
      })
    );

    setEnrichedHoldings(enriched);
    setPricesError(
      enriched.some((holding) => holding.priceError)
        ? "Some current prices could not be loaded. Those rows show N/A."
        : ""
    );
    setPricesLoading(false);
  }, []);

  const refreshPortfolio = useCallback(async ({ showLoading = true } = {}) => {
    if (showLoading) {
      setLoading(true);
    }
    setError("");

    try {
      const [accountData, holdingsData, tradesData] = await Promise.all([
        getSimulationAccount(),
        getSimulationHoldings(),
        getSimulationTrades()
      ]);

      const nextHoldings = holdingsData?.holdings || [];
      setAccount(accountData?.account || null);
      setHoldings(nextHoldings);
      setEnrichedHoldings(nextHoldings);
      setTrades(tradesData?.trades || []);

      if (showLoading) {
        setLoading(false);
      }

      await enrichHoldingsWithPrices(nextHoldings);
    } catch (portfolioError) {
      setPricesLoading(false);
      setError(getAuthMessage(portfolioError));
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [enrichHoldingsWithPrices]);

  useEffect(() => {
    queueMicrotask(() => {
      refreshPortfolio();
    });
  }, [refreshPortfolio]);

  const totals = useMemo(
    () => calculatePortfolioTotals(enrichedHoldings, account),
    [account, enrichedHoldings]
  );

  return {
    account,
    holdings,
    enrichedHoldings,
    trades,
    totals,
    loading,
    error,
    pricesLoading,
    pricesError,
    refreshPortfolio
  };
}
