import { useState } from "react";
import SimulationBuyModal from "../SimulationBuyModal/SimulationBuyModal";
import "./SelectedStockSummary.css";

function formatPrice(value) {
  const number = Number(value);
  return Number.isFinite(number) ? `$${number.toFixed(2)}` : "N/A";
}

function formatChange(change, percentChange) {
  const changeNumber = Number(change);
  const percentNumber = Number(percentChange);

  if (!Number.isFinite(changeNumber) || !Number.isFinite(percentNumber)) {
    return "N/A";
  }

  const sign = changeNumber >= 0 ? "+" : "";
  return `${sign}${changeNumber.toFixed(2)} (${sign}${percentNumber.toFixed(2)}%)`;
}

function SelectedStockSummary({
  stock,
  timeframe,
  onDetailsClick,
  onSimulationBuySuccess,
  detailsLoading = false
}) {
  const [buyModalOpen, setBuyModalOpen] = useState(false);

  if (!stock) return null;

  const changeNumber = Number(stock.change);
  const tone =
    !Number.isFinite(changeNumber)
      ? "neutral"
      : changeNumber < 0
        ? "negative"
        : "positive";

  return (
    <section className="selected-stock-summary" aria-label="Selected stock summary">
      <div className="selected-stock-summary__identity">
        <span className="selected-stock-summary__ticker">{stock.ticker}</span>
        <span className="selected-stock-summary__name">
          {stock.comp_name || stock.ticker}
        </span>
        {onDetailsClick && (
          <button
            type="button"
            className={`selected-stock-summary__details-btn ${detailsLoading ? "selected-stock-summary__details-btn--loading" : ""}`}
            onClick={onDetailsClick}
            disabled={detailsLoading}
            aria-busy={detailsLoading}
          >
            {detailsLoading ? (
              <>
                <span className="selected-stock-summary__details-spinner" aria-hidden="true" />
                Loading
              </>
            ) : (
              "Details"
            )}
          </button>
        )}
        <button
          type="button"
          className="selected-stock-summary__buy-btn"
          onClick={() => setBuyModalOpen(true)}
        >
          Buy with virtual money
        </button>
      </div>

      <div className="selected-stock-summary__metrics">
        <div className="selected-stock-summary__metric">
          <span className="selected-stock-summary__label">Price</span>
          <strong className="selected-stock-summary__value">
            {formatPrice(stock.price)}
          </strong>
        </div>
        <div className="selected-stock-summary__metric">
          <span className="selected-stock-summary__label">Move</span>
          <strong className={`selected-stock-summary__value selected-stock-summary__value--${tone}`}>
            {formatChange(stock.change, stock.percentagechange)}
          </strong>
        </div>
        <div className="selected-stock-summary__metric">
          <span className="selected-stock-summary__label">Window</span>
          <strong className="selected-stock-summary__value">{timeframe}</strong>
        </div>
      </div>
      {buyModalOpen && (
        <SimulationBuyModal
          stock={stock}
          isOpen={buyModalOpen}
          onClose={() => setBuyModalOpen(false)}
          onSuccess={onSimulationBuySuccess}
        />
      )}
    </section>
  );
}

export default SelectedStockSummary;
