import { Link } from "react-router-dom";
import { formatCurrency } from "../../../Portfolio/utils/portfolioFormatters";
import "./SimulationSummary.css";

function SimulationSummary({ loading, error, summary }) {
  const profitLossTone =
    summary.totalProfitLoss > 0
      ? "positive"
      : summary.totalProfitLoss < 0
        ? "negative"
        : "neutral";
  const rows = [
    ["Cash", formatCurrency(summary.cashBalance)],
    ["Equity", formatCurrency(summary.estimatedEquity)],
    ["P/L", formatCurrency(summary.totalProfitLoss), profitLossTone],
    ["Invested", formatCurrency(summary.totalInvested)],
    ["Holdings", summary.holdingsCount],
    ["Trades", summary.tradesCount]
  ];

  return (
    <section className="profile-dashboard-card">
      <header className="profile-dashboard-card__header">
        <h2>Simulation Summary</h2>
      </header>

      {loading && <p className="profile-card-message">Loading simulation...</p>}
      {error && !loading && <p className="profile-card-message">{error}</p>}

      {!loading && !error && (
        <>
          <div className="profile-stat-grid">
            {rows.map(([label, value]) => (
              <div className="profile-stat" key={label}>
                <span>{label}</span>
                <strong className={label === "P/L" ? `profile-value--${profitLossTone}` : ""}>
                  {value}
                </strong>
              </div>
            ))}
          </div>

          <div className="profile-card-actions">
            <Link className="profile-action-link profile-action-link--primary" to="/portfolio">
              View Portfolio
            </Link>
            <Link className="profile-action-link" to="/dashboard">
              Start Trading
            </Link>
          </div>
        </>
      )}
    </section>
  );
}

export default SimulationSummary;
