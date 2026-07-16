import { Link } from "react-router-dom";
import "./WatchlistSummary.css";

function WatchlistSummary({ loading, error, items }) {
  const symbols = items.slice(0, 5).map((item) => item.symbol);

  return (
    <section className="profile-dashboard-card">
      <header className="profile-dashboard-card__header">
        <h2>Watchlist Summary</h2>
        {!loading && !error && <span>{items.length} symbols</span>}
      </header>

      {loading && <p className="profile-card-message">Loading watchlist...</p>}
      {error && !loading && <p className="profile-card-message">{error}</p>}

      {!loading && !error && (
        <>
          {symbols.length > 0 ? (
            <div className="watchlist-summary-symbols">
              {symbols.map((symbol) => <span key={symbol}>{symbol}</span>)}
            </div>
          ) : (
            <p className="profile-card-message">No watchlist symbols yet.</p>
          )}
          <div className="profile-card-actions">
            <Link className="profile-action-link profile-action-link--primary" to="/dashboard">
              Open Dashboard
            </Link>
          </div>
        </>
      )}
    </section>
  );
}

export default WatchlistSummary;
