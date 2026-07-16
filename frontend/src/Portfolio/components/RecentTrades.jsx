import {
  formatCurrency,
  formatDate,
  formatQuantity
} from "../utils/portfolioFormatters";
import PortfolioEmptyState from "./PortfolioEmptyState";
import "./RecentTrades.css";

function RecentTrades({ trades }) {
  return (
    <section className="portfolio-section portfolio-section--secondary">
      <header className="portfolio-section__header">
        <h2>Recent Trades</h2>
      </header>

      {trades.length === 0 ? (
        <PortfolioEmptyState>No trades yet.</PortfolioEmptyState>
      ) : (
        <div className="portfolio-trades-scroll">
          <div className="portfolio-table-wrap">
            <table className="portfolio-table portfolio-table--trades">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Symbol</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total Value</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade) => (
                  <tr key={trade.id}>
                    <td>
                      <span className={`portfolio-trade-type portfolio-trade-type--${String(trade.trade_type).toLowerCase()}`}>
                        {trade.trade_type}
                      </span>
                    </td>
                    <td>{trade.symbol}</td>
                    <td>{formatQuantity(trade.quantity)}</td>
                    <td>{formatCurrency(trade.price)}</td>
                    <td>{formatCurrency(trade.total_value)}</td>
                    <td>{formatDate(trade.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

export default RecentTrades;
