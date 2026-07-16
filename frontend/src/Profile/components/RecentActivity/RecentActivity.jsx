import {
  formatCurrency,
  formatDate,
  formatQuantity
} from "../../../Portfolio/utils/portfolioFormatters";
import "./RecentActivity.css";

function RecentActivity({ loading, error, trades }) {
  const recentTrades = trades.slice(0, 5);

  return (
    <section className="profile-dashboard-card profile-dashboard-card--wide">
      <header className="profile-dashboard-card__header">
        <h2>Recent Activity</h2>
      </header>

      {loading && <p className="profile-card-message">Loading activity...</p>}
      {error && !loading && <p className="profile-card-message">{error}</p>}

      {!loading && !error && (
        recentTrades.length > 0 ? (
          <div className="recent-activity-table-wrap">
            <table className="recent-activity-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Symbol</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentTrades.map((trade) => (
                  <tr key={trade.id}>
                    <td>
                      <span className={`recent-activity-type recent-activity-type--${String(trade.trade_type).toLowerCase()}`}>
                        {trade.trade_type}
                      </span>
                    </td>
                    <td>{trade.symbol}</td>
                    <td>{formatQuantity(trade.quantity)}</td>
                    <td>{formatCurrency(trade.price)}</td>
                    <td>{formatDate(trade.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="profile-card-message">No simulation trades yet.</p>
        )
      )}
    </section>
  );
}

export default RecentActivity;
