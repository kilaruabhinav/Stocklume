import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { addAuthChangeListener, getAccessToken, logoutUser } from "../../../services/Auth/authStorage";
import { getSimulationAccount, getSimulationHoldings } from "../../../services/Simulation/simulationApi";
import { formatCurrency, formatPercent } from "../../../Portfolio/utils/portfolioFormatters";
import "./SimulationSnapshot.css";

function calculateInvestedCost(holding) {
  const quantity = Number(holding?.quantity);
  const averagePrice = Number(holding?.average_price);

  if (!Number.isFinite(quantity) || !Number.isFinite(averagePrice)) {
    return 0;
  }

  return quantity * averagePrice;
}

function getProfitLossTone(value) {
  const number = Number(value);

  if (!Number.isFinite(number) || number === 0) {
    return "neutral";
  }

  return number > 0 ? "positive" : "negative";
}

function isAuthError(error) {
  const message = error?.message || "";

  return (
    message.includes("logged in") ||
    message.includes("Invalid or expired token") ||
    message.includes("session")
  );
}

function SimulationSnapshot() {
  const [account, setAccount] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [status, setStatus] = useState(() => getAccessToken() ? "loading" : "logged-out");

  useEffect(() => {
    let isActive = true;

    async function loadSnapshot() {
      const token = getAccessToken();

      if (!token) {
        setStatus("logged-out");
        setAccount(null);
        setHoldings([]);
        return;
      }

      setStatus("loading");

      try {
        const [accountData, holdingsData] = await Promise.all([
          getSimulationAccount(), getSimulationHoldings()
        ]);

        if (!isActive) {
          return;
        }

        setAccount(accountData?.account || null);
        setHoldings(holdingsData?.holdings || []);
        setStatus("ready");
      } catch (error) {
        if (!isActive) {
          return;
        }

        if (isAuthError(error)) {
          logoutUser();
          setAccount(null);
          setHoldings([]);
          setStatus("logged-out");
          return;
        }

        setStatus("error");
      }
    }

    const queueSnapshotLoad = () => {
      queueMicrotask(loadSnapshot);
    };

    queueSnapshotLoad();
    const removeAuthListener = addAuthChangeListener(queueSnapshotLoad);

    return () => {
      isActive = false;
      removeAuthListener();
    };
  }, []);

  const snapshot = useMemo(() => {
    const cashBalance = Number(account?.cash_balance);
    const startingBalance = Number(account?.starting_balance);
    const safeCashBalance = Number.isFinite(cashBalance) ? cashBalance : 0;
    const safeStartingBalance = Number.isFinite(startingBalance) ? startingBalance : 0;
    const totalInvested = holdings.reduce(
      (total, holding) => total + calculateInvestedCost(holding),
      0
    );
    const totalEquity = safeCashBalance + totalInvested;
    const totalProfitLoss = totalEquity - safeStartingBalance;
    const totalProfitLossPercent =
      safeStartingBalance > 0 ? (totalProfitLoss / safeStartingBalance) * 100 : 0;

    return {
      cashBalance: safeCashBalance,
      holdingsCount: holdings.length,
      totalEquity,
      totalProfitLoss,
      totalProfitLossPercent
    };
  }, [account, holdings]);

  const profitLossTone = getProfitLossTone(snapshot.totalProfitLoss);
  const hasHoldings = snapshot.holdingsCount > 0;
  const snapshotRows = [
    { label: "Total Equity", value: formatCurrency(snapshot.totalEquity) },
    {
      label: "Total P/L",
      value: formatCurrency(snapshot.totalProfitLoss),
      detail: `(${formatPercent(snapshot.totalProfitLossPercent)})`,
      tone: profitLossTone
    },
    { label: "Virtual Cash", value: formatCurrency(snapshot.cashBalance) },
    { label: "Holdings", value: snapshot.holdingsCount }
  ];

  return (
    <section className="simulation-snapshot" aria-label="Simulation snapshot">
      <div className="simulation-snapshot__header">
        <div>
          <h2>Simulation Snapshot</h2>
          <p>Practice with virtual money using live market prices.</p>
        </div>
      </div>

      {status === "loading" && (
        <p className="simulation-snapshot__message">Loading simulation...</p>
      )}

      {status === "logged-out" && (
        <>
          <p className="simulation-snapshot__message">Log in to track a virtual portfolio.</p>
          <div className="simulation-snapshot__actions">
            <Link className="simulation-snapshot__button" to="/login">
              Log in to Start
            </Link>
          </div>
        </>
      )}

      {status === "error" && (
        <p className="simulation-snapshot__message">Simulation snapshot unavailable.</p>
      )}

      {status === "ready" && (
        <>
          <div className="simulation-snapshot__stats">
            {snapshotRows.map((row) => (
              <div className="simulation-snapshot__row" key={row.label}>
                <span className="simulation-snapshot__label">{row.label}</span>
                <strong
                  className={`simulation-snapshot__value${
                    row.tone ? ` simulation-snapshot__value--${row.tone}` : ""
                  }`}
                >
                  {row.value}
                  {row.detail && <small>{row.detail}</small>}
                </strong>
              </div>
            ))}
          </div>

          <div className="simulation-snapshot__actions">
            <Link
              className="simulation-snapshot__button"
              to={hasHoldings ? "/portfolio" : "/dashboard"}
            >
              {hasHoldings ? "View Portfolio" : "Start Trading"}
            </Link>
          </div>
        </>
      )}
    </section>
  );
}

export default SimulationSnapshot;
