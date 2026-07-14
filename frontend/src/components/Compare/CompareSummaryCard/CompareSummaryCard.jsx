import { formatCurrency, formatPercent } from "../compareUtils";
import "./CompareSummaryCard.css";

function CompareSummaryCard({ summary, accentColor }) {
  return (
    <div className="compare-summary-card" style={{ borderTopColor: accentColor }}>
      <div>
        <p className="compare-summary-card__ticker">{summary.ticker || "Ticker"}</p>
        <h3 className="compare-summary-card__name">
          {summary.companyName || "Select an asset"}
        </h3>
      </div>
      <div className="compare-summary-card__metrics">
        <div>
          <span>Price</span>
          <strong>{formatCurrency(summary.price)}</strong>
        </div>
        <div>
          <span>Return</span>
          <strong className={summary.returnPercent >= 0 ? "positive" : "negative"}>
            {formatPercent(summary.returnPercent)}
          </strong>
        </div>
        <div>
          <span>Best</span>
          <strong>{formatPercent(summary.bestReturn)}</strong>
        </div>
        <div>
          <span>Worst</span>
          <strong>{formatPercent(summary.worstReturn)}</strong>
        </div>
      </div>
    </div>
  );
}

export default CompareSummaryCard;
