import { useCallback, useEffect, useMemo, useState } from "react";
import { getStoredUser, logoutUser, storeUser } from "../../services/Auth/authStorage";
import { getProfile } from "../../services/profileApi";
import {
  getSimulationAccount,
  getSimulationHoldings,
  getSimulationTrades
} from "../../services/Simulation/simulationApi";
import { getWatchlist } from "../../services/Watchlist/watchlistApi";
import { calculateInvestedCost } from "../../Portfolio/utils/portfolioCalculations";

function buildSimulationSummary(account, holdings, trades) {
  const cashBalance = Number(account?.cash_balance);
  const startingBalance = Number(account?.starting_balance);
  const safeCashBalance = Number.isFinite(cashBalance) ? cashBalance : 0;
  const safeStartingBalance = Number.isFinite(startingBalance) ? startingBalance : 0;
  const totalInvested = holdings.reduce(
    (total, holding) => total + calculateInvestedCost(holding),
    0
  );
  const estimatedEquity = safeCashBalance + totalInvested;
  const totalProfitLoss = estimatedEquity - safeStartingBalance;

  return {
    cashBalance: safeCashBalance,
    startingBalance: safeStartingBalance,
    totalInvested,
    estimatedEquity,
    totalProfitLoss,
    holdingsCount: holdings.length,
    tradesCount: trades.length
  };
}

export function useProfileDashboard() {
  const [user, setUser] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [simulationState, setSimulationState] = useState({
    account: null,
    holdings: [],
    trades: [],
    loading: true,
    error: ""
  });
  const [watchlistState, setWatchlistState] = useState({
    items: [],
    loading: true,
    error: ""
  });

  const loadProfile = useCallback(async () => {
    setProfileLoading(true);
    setProfileError("");

    try {
      const profileData = await getProfile();
      const backendUser = profileData?.user;

      if (!backendUser) {
        throw new Error("Profile response was missing user details.");
      }

      const cachedUser = getStoredUser();
      const verifiedUser = {
        ...cachedUser,
        ...backendUser,
        loggedInAt: cachedUser?.loggedInAt || new Date().toISOString()
      };

      storeUser(verifiedUser);
      setUser(verifiedUser);
    } catch (error) {
      logoutUser();
      setProfileError(error.message || "Session expired. Please log in again.");
      throw error;
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const loadSimulation = useCallback(async () => {
    setSimulationState((current) => ({ ...current, loading: true, error: "" }));

    try {
      const [accountData, holdingsData, tradesData] = await Promise.all([
        getSimulationAccount(),
        getSimulationHoldings(),
        getSimulationTrades()
      ]);

      setSimulationState({
        account: accountData?.account || null,
        holdings: holdingsData?.holdings || [],
        trades: tradesData?.trades || [],
        loading: false,
        error: ""
      });
    } catch (error) {
      setSimulationState((current) => ({
        ...current,
        loading: false,
        error: error.message || "Simulation summary unavailable."
      }));
    }
  }, []);

  const loadWatchlist = useCallback(async () => {
    setWatchlistState((current) => ({ ...current, loading: true, error: "" }));

    try {
      const items = await getWatchlist();
      setWatchlistState({ items, loading: false, error: "" });
    } catch (error) {
      setWatchlistState((current) => ({
        ...current,
        loading: false,
        error: error.message || "Watchlist summary unavailable."
      }));
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    queueMicrotask(async () => {
      try {
        await loadProfile();

        if (isActive) {
          loadSimulation();
          loadWatchlist();
        }
      } catch {
        if (isActive) {
          setSimulationState((current) => ({ ...current, loading: false }));
          setWatchlistState((current) => ({ ...current, loading: false }));
        }
      }
    });

    return () => {
      isActive = false;
    };
  }, [loadProfile, loadSimulation, loadWatchlist]);

  const simulationSummary = useMemo(
    () => buildSimulationSummary(
      simulationState.account,
      simulationState.holdings,
      simulationState.trades
    ),
    [simulationState.account, simulationState.holdings, simulationState.trades]
  );

  return {
    user,
    profileLoading,
    profileError,
    simulationState,
    simulationSummary,
    watchlistState
  };
}
