import { useMemo, useState } from "react";
import {
  formatCurrency,
  formatDate,
  formatQuantity
} from "../utils/portfolioFormatters";
import PortfolioEmptyState from "./PortfolioEmptyState";
import "./RecentTrades.css";

const TYPE_FILTERS = [
  ["all", "All trades"],
  ["BUY", "Buys only"],
  ["SELL", "Sells only"]
];

const SORT_OPTIONS = [
  ["newest", "Newest first"],
  ["oldest", "Oldest first"],
  ["valueHigh", "Highest value"],
  ["valueLow", "Lowest value"],
  ["quantityHigh", "Highest quantity"],
  ["quantityLow", "Lowest quantity"],
  ["symbolAsc", "Symbol A-Z"],
  ["symbolDesc", "Symbol Z-A"]
];

function getTradeDate(trade) {
  const timestamp = new Date(trade?.created_at || trade?.date || 0).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function getNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function filterTrades(trades, typeFilter) {
  if (typeFilter === "all") {
    return trades;
  }

  return trades.filter((trade) => trade.trade_type === typeFilter);
}

function sortTrades(trades, tradeSort) {
  return [...trades].sort((firstTrade, secondTrade) => {
    const firstValue = getNumber(firstTrade.total_value);
    const secondValue = getNumber(secondTrade.total_value);
    const firstQuantity = getNumber(firstTrade.quantity);
    const secondQuantity = getNumber(secondTrade.quantity);
    const firstSymbol = String(firstTrade.symbol || "");
    const secondSymbol = String(secondTrade.symbol || "");

    switch (tradeSort) {
      case "oldest":
        return getTradeDate(firstTrade) - getTradeDate(secondTrade);
      case "valueHigh":
        return secondValue - firstValue;
      case "valueLow":
        return firstValue - secondValue;
      case "quantityHigh":
        return secondQuantity - firstQuantity;
      case "quantityLow":
        return firstQuantity - secondQuantity;
      case "symbolAsc":
        return firstSymbol.localeCompare(secondSymbol);
      case "symbolDesc":
        return secondSymbol.localeCompare(firstSymbol);
      case "newest":
      default:
        return getTradeDate(secondTrade) - getTradeDate(firstTrade);
    }
  });
}

function RecentTrades({ trades }) {
  const [tradeTypeFilter, setTradeTypeFilter] = useState("all");
  const [tradeSort, setTradeSort] = useState("newest");
  const filteredSortedTrades = useMemo(
    () => sortTrades(filterTrades(trades, tradeTypeFilter), tradeSort),
    [trades, tradeTypeFilter, tradeSort]
  );
  const hasTrades = trades.length > 0;
  const hasVisibleTrades = filteredSortedTrades.length > 0;

  return (
    <section className="portfolio-section portfolio-section--secondary">
      <header className="portfolio-section__header recent-trades__header">
        <div className="recent-trades__title-group">
          <h2>Recent Trades</h2>
          {hasTrades && (
            <span className="recent-trades__count">
              Showing {filteredSortedTrades.length} of {trades.length} trades
            </span>
          )}
        </div>

        {hasTrades && (
          <div className="recent-trades__controls">
            <select
              className="recent-trades__select"
              value={tradeTypeFilter}
              onChange={(event) => setTradeTypeFilter(event.target.value)}
              aria-label="Filter trades by type"
            >
              {TYPE_FILTERS.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <select
              className="recent-trades__select"
              value={tradeSort}
              onChange={(event) => setTradeSort(event.target.value)}
              aria-label="Sort trades"
            >
              {SORT_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        )}
      </header>

      {!hasTrades ? (
        <PortfolioEmptyState>No trades yet.</PortfolioEmptyState>
      ) : !hasVisibleTrades ? (
        <PortfolioEmptyState>No trades match this filter.</PortfolioEmptyState>
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
                {filteredSortedTrades.map((trade) => (
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
