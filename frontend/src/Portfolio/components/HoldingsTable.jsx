import { calculateHoldingMetrics } from "../utils/portfolioCalculations";
import {
  formatCurrency,
  formatPercent,
  formatQuantity,
  getProfitLossClass
} from "../utils/portfolioFormatters";
import PortfolioEmptyState from "./PortfolioEmptyState";
import "./HoldingsTable.css";

function formatMaybeCurrency(value) {
  const formatted = formatCurrency(value);

  if (formatted === "N/A") {
    return <span className="portfolio-muted-value">N/A</span>;
  }

  return formatted;
}

function HoldingsTable({ holdings, pricesLoading, onSellClick }) {
  if (holdings.length === 0) {
    return (
      <section className="portfolio-section">
        <header className="portfolio-section__header">
          <h2>Holdings</h2>
        </header>
        <PortfolioEmptyState>
          No holdings yet. Buy a stock from the Dashboard to start your virtual portfolio.
        </PortfolioEmptyState>
      </section>
    );
  }

  return (
    <section className="portfolio-section">
      <header className="portfolio-section__header">
        <h2>Holdings</h2>
      </header>
      <div className="portfolio-table-wrap">
        <table className="portfolio-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Quantity</th>
              <th>Average Price</th>
              <th>Current Price</th>
              <th>Market Value</th>
              <th>P/L</th>
              <th>Sell</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((holding) => {
              const metrics = calculateHoldingMetrics(holding);

              return (
                <tr key={holding.id || holding.symbol}>
                  <td>{holding.symbol}</td>
                  <td>{formatQuantity(holding.quantity)}</td>
                  <td>{formatCurrency(holding.average_price)}</td>
                  <td>
                    {pricesLoading
                      ? <span className="portfolio-muted-value">Loading...</span>
                      : formatMaybeCurrency(holding.currentPrice)}
                  </td>
                  <td>
                    {pricesLoading
                      ? <span className="portfolio-muted-value">Loading...</span>
                      : formatMaybeCurrency(metrics.marketValue)}
                  </td>
                  <td>
                    {pricesLoading || !Number.isFinite(metrics.profitLoss) ? (
                      <span className="portfolio-muted-value">
                        {pricesLoading ? "Loading..." : "N/A"}
                      </span>
                    ) : (
                      <span className={`portfolio-profit-loss-chip ${getProfitLossClass(metrics.profitLoss)}`}>
                        <span>{formatCurrency(metrics.profitLoss)}</span>
                        <small>{formatPercent(metrics.profitLossPercent)}</small>
                      </span>
                    )}
                  </td>
                  <td>
                    <button
                      className="portfolio-sell-button"
                      type="button"
                      onClick={() => onSellClick(holding)}
                    >
                      Sell
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default HoldingsTable;
